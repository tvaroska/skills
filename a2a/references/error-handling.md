# Error Handling

Comprehensive guide for handling errors in A2A agents and clients.

## Error Types

### A2AError

Protocol-level errors specific to A2A operations.

```python
from a2a.types import A2AError

error = A2AError(
    code="validation_error",
    message="Invalid input format",
    data={"expected": "json", "received": "text"}
)
```

**Common error codes:**
- `validation_error` - Input validation failed
- `processing_error` - Error during processing
- `resource_not_found` - Requested resource doesn't exist
- `rate_limit_exceeded` - Too many requests
- `internal_error` - Unexpected internal error
- `timeout` - Operation timed out
- `authentication_failed` - Auth credentials invalid
- `permission_denied` - Insufficient permissions

### JSONRPCError

JSON-RPC protocol errors.

```python
from a2a.types import JSONRPCError

error = JSONRPCError(
    code=-32600,  # Invalid Request
    message="Invalid JSON-RPC request format"
)
```

**Standard JSON-RPC error codes:**
- `-32700` - Parse error
- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error

## Server-Side Error Handling

### Basic Error Handling in Executor

```python
from a2a.server.agent_execution import AgentExecutor
from a2a.types import A2AError, Task, Message, Part

class SafeExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            # Attempt to process
            result = await self.process(context.message)

            # Send success response
            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=result)]
            ))

            await event_queue.put(Task(
                id=context.task_id,
                status="completed"
            ))

        except ValueError as e:
            # Handle validation errors
            await event_queue.put(A2AError(
                code="validation_error",
                message=f"Validation failed: {str(e)}"
            ))

            await event_queue.put(Task(
                id=context.task_id,
                status="failed"
            ))

        except TimeoutError as e:
            # Handle timeouts
            await event_queue.put(A2AError(
                code="timeout",
                message="Operation timed out",
                data={"timeout_seconds": 30}
            ))

            await event_queue.put(Task(
                id=context.task_id,
                status="failed"
            ))

        except Exception as e:
            # Handle unexpected errors
            logging.error(f"Unexpected error in task {context.task_id}: {e}")

            await event_queue.put(A2AError(
                code="internal_error",
                message="An unexpected error occurred"
            ))

            await event_queue.put(Task(
                id=context.task_id,
                status="failed"
            ))
```

### Specific Exception Handling

```python
import httpx
from sqlalchemy.exc import SQLAlchemyError

class RobustExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            result = await self.process(context.message)
            await self.send_success_response(result, context, event_queue)

        except httpx.HTTPError as e:
            # External API errors
            await event_queue.put(A2AError(
                code="external_api_error",
                message=f"External service error: {e}",
                data={"service": "external_api", "status": getattr(e, 'status_code', None)}
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

        except SQLAlchemyError as e:
            # Database errors
            await event_queue.put(A2AError(
                code="database_error",
                message="Database operation failed",
                data={"details": str(e)[:200]}  # Truncate for safety
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

        except ValueError as e:
            # Validation errors
            await event_queue.put(A2AError(
                code="validation_error",
                message=str(e)
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

        except Exception as e:
            # Catch-all for unexpected errors
            logging.exception("Unexpected error")
            await event_queue.put(A2AError(
                code="internal_error",
                message="An unexpected error occurred"
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))
```

### Input Validation

```python
from pydantic import BaseModel, ValidationError

class QueryRequest(BaseModel):
    query: str
    limit: int = 10
    offset: int = 0

class ValidatingExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            # Extract and validate input
            user_text = context.message.parts[0].text
            user_data = json.loads(user_text)

            # Validate using Pydantic
            request = QueryRequest(**user_data)

            # Process valid request
            result = await self.process_query(request)

            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=json.dumps(result))]
            ))

            await event_queue.put(Task(id=context.task_id, status="completed"))

        except json.JSONDecodeError as e:
            await event_queue.put(A2AError(
                code="validation_error",
                message="Invalid JSON format",
                data={"error": str(e)}
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

        except ValidationError as e:
            await event_queue.put(A2AError(
                code="validation_error",
                message="Request validation failed",
                data={"errors": e.errors()}
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

        except Exception as e:
            logging.exception("Unexpected error during validation")
            await event_queue.put(A2AError(
                code="internal_error",
                message="Failed to process request"
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))
```

## Client-Side Error Handling

### Handling Response Errors

```python
import httpx
from a2a.client import A2AClient
from a2a.types import A2AError, SendMessageRequest, MessageSendParams
from uuid import uuid4

async def send_with_error_handling(client: A2AClient, text: str):
    try:
        request = SendMessageRequest(
            params=MessageSendParams(
                message={
                    "role": "user",
                    "parts": [{"type": "text", "text": text}],
                    "messageId": uuid4().hex
                }
            )
        )

        response = await client.send_message(request)

        # Check for A2A errors in response
        if hasattr(response, 'error') and response.error:
            print(f"Agent returned error: {response.error}")
            return None

        return response

    except httpx.HTTPStatusError as e:
        print(f"HTTP error: {e.response.status_code}")
        return None

    except httpx.TimeoutException:
        print("Request timed out")
        return None

    except httpx.NetworkError:
        print("Network error occurred")
        return None

    except Exception as e:
        print(f"Unexpected error: {e}")
        return None
```

### Retry Logic with Exponential Backoff

```python
import asyncio
from typing import Optional

async def send_with_retry(
    client: A2AClient,
    text: str,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0
) -> Optional[dict]:
    """Send message with exponential backoff retry."""

    for attempt in range(max_retries):
        try:
            request = SendMessageRequest(
                params=MessageSendParams(
                    message={
                        "role": "user",
                        "parts": [{"type": "text", "text": text}],
                        "messageId": uuid4().hex
                    }
                )
            )

            response = await client.send_message(request)
            return response

        except (httpx.TimeoutException, httpx.NetworkError) as e:
            if attempt == max_retries - 1:
                # Last attempt failed
                raise

            # Calculate backoff delay
            delay = min(base_delay * (2 ** attempt), max_delay)

            print(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
            await asyncio.sleep(delay)

        except httpx.HTTPStatusError as e:
            # Don't retry on client errors (4xx)
            if 400 <= e.response.status_code < 500:
                raise

            # Retry on server errors (5xx)
            if attempt == max_retries - 1:
                raise

            delay = min(base_delay * (2 ** attempt), max_delay)
            print(f"Server error {e.response.status_code}. Retrying in {delay}s...")
            await asyncio.sleep(delay)

        except Exception as e:
            # Don't retry on unexpected errors
            raise

    return None
```

### Circuit Breaker Pattern

```python
from datetime import datetime, timedelta
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if recovered

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 60,
        success_threshold: int = 2
    ):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.success_threshold = success_threshold

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None

    def call(self, func):
        async def wrapper(*args, **kwargs):
            if self.state == CircuitState.OPEN:
                # Check if timeout has passed
                if datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout):
                    self.state = CircuitState.HALF_OPEN
                    self.success_count = 0
                else:
                    raise Exception("Circuit breaker is OPEN")

            try:
                result = await func(*args, **kwargs)

                # Success
                if self.state == CircuitState.HALF_OPEN:
                    self.success_count += 1
                    if self.success_count >= self.success_threshold:
                        self.state = CircuitState.CLOSED
                        self.failure_count = 0

                return result

            except Exception as e:
                self.failure_count += 1
                self.last_failure_time = datetime.now()

                if self.failure_count >= self.failure_threshold:
                    self.state = CircuitState.OPEN

                raise

        return wrapper

# Usage
breaker = CircuitBreaker(failure_threshold=3, timeout=60)

@breaker.call
async def call_agent(client: A2AClient, text: str):
    request = SendMessageRequest(
        params=MessageSendParams(
            message={
                "role": "user",
                "parts": [{"type": "text", "text": text}],
                "messageId": uuid4().hex
            }
        )
    )
    return await client.send_message(request)
```

## Logging and Monitoring

### Comprehensive Logging

```python
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)

class LoggingExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id
        start_time = datetime.now()

        logging.info(f"Task {task_id} started")
        logging.debug(f"Task {task_id} message: {context.message}")

        try:
            result = await self.process(context.message)

            duration = (datetime.now() - start_time).total_seconds()
            logging.info(f"Task {task_id} completed successfully in {duration}s")

            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=result)]
            ))
            await event_queue.put(Task(id=task_id, status="completed"))

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            logging.error(f"Task {task_id} failed after {duration}s: {e}", exc_info=True)

            await event_queue.put(A2AError(
                code="internal_error",
                message=str(e)
            ))
            await event_queue.put(Task(id=task_id, status="failed"))
```

### Error Metrics

```python
from collections import defaultdict
from datetime import datetime, timedelta

class MetricsExecutor(AgentExecutor):
    def __init__(self):
        self.error_counts = defaultdict(int)
        self.last_reset = datetime.now()

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            result = await self.process(context.message)
            await self.send_success_response(result, context, event_queue)

        except Exception as e:
            # Track error
            error_type = type(e).__name__
            self.error_counts[error_type] += 1

            # Log metrics every hour
            if datetime.now() - self.last_reset > timedelta(hours=1):
                self.log_metrics()
                self.reset_metrics()

            # Handle error
            await self.send_error_response(e, context, event_queue)

    def log_metrics(self):
        logging.info("Error metrics (last hour):")
        for error_type, count in self.error_counts.items():
            logging.info(f"  {error_type}: {count}")

    def reset_metrics(self):
        self.error_counts.clear()
        self.last_reset = datetime.now()
```

## Best Practices

1. **Always handle exceptions** - Never let exceptions crash the agent
2. **Use specific error codes** - Help clients understand what went wrong
3. **Log errors comprehensively** - Include context for debugging
4. **Validate input early** - Catch bad input before processing
5. **Provide helpful error messages** - Guide users to fix issues
6. **Implement retries carefully** - Use exponential backoff, limit attempts
7. **Monitor error rates** - Track and alert on error patterns
8. **Test error paths** - Ensure error handling works correctly
9. **Don't expose sensitive data** - Sanitize error messages
10. **Use circuit breakers** - Prevent cascading failures
11. **Set appropriate timeouts** - Don't wait forever for responses
12. **Clean up on errors** - Release resources even when failing

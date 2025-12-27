# Client Usage Patterns

Advanced patterns for A2A client implementation.

## Client Initialization

### From Agent Card URL

```python
import httpx
from a2a.client import A2AClient

async with httpx.AsyncClient() as httpx_client:
    client = await A2AClient.get_client_from_agent_card_url(
        httpx_client,
        "http://localhost:9999"
    )
    # Use client...
```

### From Agent Card Object

```python
from a2a.types import AgentCard

agent_card = AgentCard(
    name="My Agent",
    url="http://localhost:9999",
    capabilities={"streaming": True, "multiTurn": True}
)

async with httpx.AsyncClient() as httpx_client:
    client = A2AClient(httpx_client, agent_card)
```

## Sending Messages

### Non-Streaming Messages

```python
from uuid import uuid4
from a2a.types import MessageSendParams, SendMessageRequest

async def send_simple_message(client: A2AClient, text: str):
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
```

### Streaming Messages

```python
from a2a.types import SendStreamingMessageRequest

async def send_streaming_message(client: A2AClient, text: str):
    request = SendStreamingMessageRequest(
        id=str(uuid4()),
        params=MessageSendParams(
            message={
                "role": "user",
                "parts": [{"type": "text", "text": text}],
                "messageId": uuid4().hex
            }
        )
    )

    full_response = ""
    async for chunk in client.send_message_streaming(request):
        if hasattr(chunk, 'result') and chunk.result:
            for message in chunk.result.get('messages', []):
                for part in message.get('parts', []):
                    if part.get('type') == 'text':
                        full_response += part.get('text', '')
                        print(part.get('text', ''), end='', flush=True)

    return full_response
```

## Task Operations

### Get Task Status

```python
async def get_task_status(client: A2AClient, task_id: str):
    task = await client.get_task(task_id)
    return task.status
```

### Cancel Task

```python
async def cancel_task(client: A2AClient, task_id: str):
    result = await client.cancel_task(task_id)
    return result
```

### Poll Task Until Complete

```python
import asyncio

async def wait_for_task_completion(
    client: A2AClient,
    task_id: str,
    poll_interval: float = 1.0,
    timeout: float = 60.0
):
    start_time = asyncio.get_event_loop().time()

    while True:
        task = await client.get_task(task_id)

        if task.status in ["completed", "failed", "cancelled"]:
            return task

        if asyncio.get_event_loop().time() - start_time > timeout:
            raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")

        await asyncio.sleep(poll_interval)
```

## Error Handling

### Basic Error Handling

```python
from a2a.types import A2AError, JSONRPCError

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
        return response

    except A2AError as e:
        print(f"A2A Protocol Error: {e.code} - {e.message}")
        raise

    except JSONRPCError as e:
        print(f"JSON-RPC Error: {e.code} - {e.message}")
        raise

    except httpx.HTTPError as e:
        print(f"HTTP Error: {e}")
        raise

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise
```

### Retry Logic

```python
import asyncio
from typing import Optional

async def send_with_retry(
    client: A2AClient,
    text: str,
    max_retries: int = 3,
    backoff_factor: float = 2.0
):
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
            return await client.send_message(request)

        except (httpx.TimeoutException, httpx.NetworkError) as e:
            if attempt == max_retries - 1:
                raise

            wait_time = backoff_factor ** attempt
            print(f"Attempt {attempt + 1} failed. Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)

        except Exception as e:
            # Don't retry on other errors
            raise
```

## Timeouts and Limits

### Setting Request Timeouts

```python
import httpx

# Create client with custom timeout
async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as httpx_client:
    client = await A2AClient.get_client_from_agent_card_url(
        httpx_client,
        "http://localhost:9999"
    )

    # Requests will timeout after 30 seconds
    response = await client.send_message(request)
```

### Per-Request Timeouts

```python
async with httpx.AsyncClient() as httpx_client:
    # Override timeout for specific request
    httpx_client.timeout = httpx.Timeout(60.0)

    client = await A2AClient.get_client_from_agent_card_url(
        httpx_client,
        "http://localhost:9999"
    )
    response = await client.send_message(request)
```

## Multi-Agent Coordination

### Query Multiple Agents

```python
async def query_multiple_agents(agent_urls: list[str], question: str):
    async with httpx.AsyncClient() as httpx_client:
        # Create clients for all agents
        clients = await asyncio.gather(*[
            A2AClient.get_client_from_agent_card_url(httpx_client, url)
            for url in agent_urls
        ])

        # Send question to all agents in parallel
        request = SendMessageRequest(
            params=MessageSendParams(
                message={
                    "role": "user",
                    "parts": [{"type": "text", "text": question}],
                    "messageId": uuid4().hex
                }
            )
        )

        responses = await asyncio.gather(*[
            client.send_message(request)
            for client in clients
        ])

        return responses
```

### Agent Chain

```python
async def agent_chain(agent_urls: list[str], initial_input: str):
    """Pass output from one agent as input to the next."""
    current_input = initial_input

    async with httpx.AsyncClient() as httpx_client:
        for url in agent_urls:
            client = await A2AClient.get_client_from_agent_card_url(
                httpx_client,
                url
            )

            request = SendMessageRequest(
                params=MessageSendParams(
                    message={
                        "role": "user",
                        "parts": [{"type": "text", "text": current_input}],
                        "messageId": uuid4().hex
                    }
                )
            )

            response = await client.send_message(request)

            # Extract response text for next agent
            current_input = extract_text_from_response(response)

        return current_input
```

## Capability Discovery

### Check Agent Capabilities

```python
async def check_agent_capabilities(agent_url: str):
    async with httpx.AsyncClient() as httpx_client:
        # Fetch agent card
        response = await httpx_client.get(f"{agent_url}/.well-known/agent.json")
        agent_card = response.json()

        capabilities = agent_card.get("capabilities", {})

        return {
            "name": agent_card.get("name"),
            "description": agent_card.get("description"),
            "supports_streaming": capabilities.get("streaming", False),
            "supports_multi_turn": capabilities.get("multiTurn", False),
            "custom_capabilities": {
                k: v for k, v in capabilities.items()
                if k not in ["streaming", "multiTurn"]
            }
        }
```

### Dynamic Client Selection

```python
async def select_agent_by_capability(
    agent_urls: list[str],
    required_capability: str
):
    """Select first agent that supports a specific capability."""
    async with httpx.AsyncClient() as httpx_client:
        for url in agent_urls:
            try:
                response = await httpx_client.get(f"{url}/.well-known/agent.json")
                agent_card = response.json()

                if agent_card.get("capabilities", {}).get(required_capability):
                    return await A2AClient.get_client_from_agent_card_url(
                        httpx_client,
                        url
                    )
            except Exception:
                continue

    raise ValueError(f"No agent found with capability: {required_capability}")
```

## Connection Management

### Persistent Client

```python
class PersistentA2AClient:
    def __init__(self, agent_url: str):
        self.agent_url = agent_url
        self.httpx_client = None
        self.a2a_client = None

    async def __aenter__(self):
        self.httpx_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=10)
        )
        self.a2a_client = await A2AClient.get_client_from_agent_card_url(
            self.httpx_client,
            self.agent_url
        )
        return self.a2a_client

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.httpx_client.aclose()

# Usage
async with PersistentA2AClient("http://localhost:9999") as client:
    response1 = await client.send_message(request1)
    response2 = await client.send_message(request2)
```

## Testing Helpers

### Mock Client for Testing

```python
class MockA2AClient:
    """Mock client for testing without real agent."""

    async def send_message(self, request):
        # Return mock response
        return {
            "result": {
                "messages": [
                    {
                        "role": "agent",
                        "parts": [{"type": "text", "text": "Mock response"}]
                    }
                ],
                "task": {"id": "mock-task-id", "status": "completed"}
            }
        }

    async def get_task(self, task_id: str):
        return {"id": task_id, "status": "completed"}

# Use in tests
client = MockA2AClient()
response = await client.send_message(request)
```

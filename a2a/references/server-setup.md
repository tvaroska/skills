# Server Setup and Configuration

Advanced server configuration for A2A agents.

## Basic Server Configuration

```python
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor

server = A2AServer(
    agent_executor=MyExecutor(),
    agent_name="My Agent",
    agent_description="Description of what the agent does",
    port=9999,
    host="0.0.0.0"  # Listen on all interfaces
)

await server.start()
```

## Custom Request Handlers

For advanced control over request processing, implement a custom request handler:

```python
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import TaskStore
from a2a.server.queue_manager import QueueManager

class CustomRequestHandler(DefaultRequestHandler):
    def __init__(
        self,
        agent_executor: AgentExecutor,
        task_store: TaskStore,
        queue_manager: QueueManager
    ):
        super().__init__(agent_executor, task_store, queue_manager)

    async def on_get_task(self, task_id: str):
        # Custom task retrieval logic
        task = await super().on_get_task(task_id)
        # Add custom processing
        return task

    async def on_cancel_task(self, task_id: str):
        # Custom cancellation logic
        result = await super().on_cancel_task(task_id)
        # Log or notify
        return result
```

## Task Persistence

### In-Memory TaskStore (Default)

```python
from a2a.server.tasks.in_memory_task_store import InMemoryTaskStore

task_store = InMemoryTaskStore()

server = A2AServer(
    agent_executor=MyExecutor(),
    task_store=task_store,
    # ... other params
)
```

**Note:** In-memory storage is lost when the server restarts.

### SQL TaskStore

For persistent storage across restarts:

```python
from a2a.server.tasks.sql_task_store import SQLTaskStore

# SQLite
task_store = SQLTaskStore(db_url="sqlite:///tasks.db")

# PostgreSQL
task_store = SQLTaskStore(
    db_url="postgresql://user:password@localhost/dbname"
)

# MySQL
task_store = SQLTaskStore(
    db_url="mysql://user:password@localhost/dbname"
)

server = A2AServer(
    agent_executor=MyExecutor(),
    task_store=task_store,
    # ... other params
)
```

**Install SQL dependencies:**

```bash
pip install "a2a-sdk[sql]"
```

## Push Notifications

Enable push notifications for long-running tasks:

```python
from a2a.server.push_notifier import PushNotifier

class MyPushNotifier(PushNotifier):
    async def notify(self, task_id: str, event: dict):
        # Send webhook, email, or push notification
        print(f"Task {task_id} updated: {event}")

server = A2AServer(
    agent_executor=MyExecutor(),
    push_notifier=MyPushNotifier(),
    # ... other params
)
```

## Server Lifecycle Management

### Starting and Stopping

```python
import asyncio

async def run_server():
    server = A2AServer(
        agent_executor=MyExecutor(),
        agent_name="My Agent",
        port=9999
    )

    try:
        await server.start()
    except KeyboardInterrupt:
        print("Shutting down...")
        await server.stop()

asyncio.run(run_server())
```

### Running with uvicorn

For production deployments:

```python
# server.py
from a2a.server import A2AServer

app = A2AServer(
    agent_executor=MyExecutor(),
    agent_name="Production Agent",
    port=8000
).app  # Get the ASGI app

# Run with:
# uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

## Environment Configuration

```python
import os

server = A2AServer(
    agent_executor=MyExecutor(),
    agent_name=os.getenv("AGENT_NAME", "Default Agent"),
    agent_description=os.getenv("AGENT_DESCRIPTION", "Default description"),
    port=int(os.getenv("PORT", "9999")),
    agent_capabilities={
        "streaming": os.getenv("ENABLE_STREAMING", "true").lower() == "true",
        "multiTurn": os.getenv("ENABLE_MULTITURN", "true").lower() == "true"
    }
)
```

## HTTPS and Security

### Running Behind a Reverse Proxy

Use nginx or similar for HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name agent.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:9999;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /.well-known/agent.json {
        proxy_pass http://localhost:9999/.well-known/agent.json;
    }
}
```

### Authentication

Implement custom authentication in request handler:

```python
class AuthenticatedRequestHandler(DefaultRequestHandler):
    async def validate_request(self, request):
        # Check API key, JWT, etc.
        api_key = request.headers.get("Authorization")
        if not self.is_valid_api_key(api_key):
            raise UnauthorizedError("Invalid API key")

    def is_valid_api_key(self, api_key: str) -> bool:
        # Validate against database or environment
        return api_key == os.getenv("VALID_API_KEY")
```

## Monitoring and Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class LoggingExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        logging.info(f"Processing task {context.task_id}")
        logging.debug(f"Message: {context.message}")

        try:
            # Process
            result = await self.process(context.message)
            logging.info(f"Task {context.task_id} completed successfully")
        except Exception as e:
            logging.error(f"Task {context.task_id} failed: {e}")
            raise
```

## Deployment Patterns

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "server.py"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  agent:
    build: .
    ports:
      - "9999:9999"
    environment:
      - AGENT_NAME=My Agent
      - PORT=9999
    volumes:
      - ./data:/app/data
```

### Cloud Run / Cloud Functions

```python
# For serverless deployment
from a2a.server import A2AServer

def create_app():
    return A2AServer(
        agent_executor=MyExecutor(),
        agent_name="Serverless Agent",
        port=int(os.getenv("PORT", "8080"))
    ).app

app = create_app()
```

## Performance Tuning

### Connection Pooling

```python
import httpx

class OptimizedExecutor(AgentExecutor):
    def __init__(self):
        self.http_client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=100),
            timeout=httpx.Timeout(30.0)
        )

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        # Use self.http_client for external requests
        pass

    async def cleanup(self):
        await self.http_client.aclose()
```

### Concurrent Task Processing

```python
import asyncio

class ConcurrentExecutor(AgentExecutor):
    def __init__(self, max_concurrent=10):
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        async with self.semaphore:
            # Process with concurrency limit
            await self.process_task(context, event_queue)
```

## Health Checks

```python
from a2a.server import A2AServer

class HealthCheckServer(A2AServer):
    async def health_check(self):
        return {
            "status": "healthy",
            "agent_name": self.agent_name,
            "uptime": self.get_uptime()
        }

# Access at http://localhost:9999/health
```

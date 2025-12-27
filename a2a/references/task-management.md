# Task Management

Detailed guide for managing tasks in the A2A Protocol.

## Task Lifecycle

Tasks progress through defined states:

```
submitted → working → [input-required] → completed
                   ↓
                 failed
                   ↓
               cancelled
```

### Task States

- **submitted**: Task has been received but not yet started
- **working**: Agent is actively processing the task
- **input-required**: Agent needs additional information from the user
- **completed**: Task finished successfully
- **failed**: Task encountered an error and could not complete
- **cancelled**: Task was cancelled by the user or system

## Task Object Structure

```python
from a2a.types import Task

task = Task(
    id="unique-task-id",
    status="working",
    createdAt="2025-01-15T10:30:00Z",
    updatedAt="2025-01-15T10:30:05Z",
    metadata={
        "user_id": "user-123",
        "priority": "high"
    }
)
```

## TaskStore Implementations

### In-Memory TaskStore

Fast, non-persistent storage suitable for development and short-lived tasks.

```python
from a2a.server.tasks.in_memory_task_store import InMemoryTaskStore

task_store = InMemoryTaskStore()

# Tasks are stored in memory
await task_store.create_task(task)
retrieved_task = await task_store.get_task(task.id)
await task_store.update_task(task)
await task_store.delete_task(task.id)
```

**Pros:**
- Fast read/write
- No dependencies
- Simple to use

**Cons:**
- Data lost on server restart
- Not suitable for production
- No persistence

### SQL TaskStore

Persistent storage using SQLAlchemy, supporting multiple databases.

```python
from a2a.server.tasks.sql_task_store import SQLTaskStore

# SQLite (file-based)
task_store = SQLTaskStore(db_url="sqlite:///tasks.db")

# PostgreSQL
task_store = SQLTaskStore(
    db_url="postgresql://user:pass@localhost:5432/a2a_tasks"
)

# MySQL
task_store = SQLTaskStore(
    db_url="mysql+pymysql://user:pass@localhost:3306/a2a_tasks"
)

server = A2AServer(
    agent_executor=MyExecutor(),
    task_store=task_store,
    # ... other params
)
```

**Install dependencies:**

```bash
# SQLite (included in Python)
pip install "a2a-sdk[sql]"

# PostgreSQL
pip install "a2a-sdk[sql]" psycopg2-binary

# MySQL
pip install "a2a-sdk[sql]" pymysql
```

**Pros:**
- Persistent across restarts
- Queryable
- Production-ready
- Supports transactions

**Cons:**
- Requires database setup
- Slightly slower than in-memory
- Additional dependency

## Custom TaskStore

Implement your own TaskStore for custom storage backends:

```python
from a2a.server.tasks import TaskStore
from a2a.types import Task
from typing import Optional

class RedisTaskStore(TaskStore):
    """Example TaskStore using Redis."""

    def __init__(self, redis_url: str):
        import redis.asyncio as redis
        self.redis = redis.from_url(redis_url)

    async def create_task(self, task: Task) -> Task:
        task_data = task.model_dump_json()
        await self.redis.set(f"task:{task.id}", task_data)
        await self.redis.zadd("tasks_by_date", {task.id: task.createdAt})
        return task

    async def get_task(self, task_id: str) -> Optional[Task]:
        task_data = await self.redis.get(f"task:{task_id}")
        if task_data:
            return Task.model_validate_json(task_data)
        return None

    async def update_task(self, task: Task) -> Task:
        task_data = task.model_dump_json()
        await self.redis.set(f"task:{task.id}", task_data)
        return task

    async def delete_task(self, task_id: str) -> bool:
        result = await self.redis.delete(f"task:{task_id}")
        await self.redis.zrem("tasks_by_date", task_id)
        return result > 0

    async def list_tasks(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> list[Task]:
        task_ids = await self.redis.zrange(
            "tasks_by_date",
            offset,
            offset + limit - 1
        )
        tasks = []
        for task_id in task_ids:
            task = await self.get_task(task_id.decode())
            if task:
                tasks.append(task)
        return tasks
```

## Task Status Updates

### Updating Task Status

```python
from a2a.types import TaskStatusUpdateEvent

class MyExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        # Initial status update
        await event_queue.put(TaskStatusUpdateEvent(
            taskId=context.task_id,
            status="working",
            statusText="Starting analysis..."
        ))

        # Progress update
        await asyncio.sleep(2)
        await event_queue.put(TaskStatusUpdateEvent(
            taskId=context.task_id,
            status="working",
            statusText="Processing data (50% complete)..."
        ))

        # Complete
        result = await self.process()
        await event_queue.put(Message(
            role="agent",
            parts=[Part(type="text", text=result)]
        ))

        await event_queue.put(Task(
            id=context.task_id,
            status="completed"
        ))
```

### Requesting User Input

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Determine we need more info
    user_input = context.message.parts[0].text

    if not self.has_required_info(user_input):
        await event_queue.put(TaskStatusUpdateEvent(
            taskId=context.task_id,
            status="input-required",
            statusText="I need additional information. What is the target date?"
        ))
        return  # Wait for user to provide more info

    # Continue processing
    await self.process_with_complete_info(context, event_queue)
```

## Task Metadata

Store custom data with tasks:

```python
from a2a.types import Task

task = Task(
    id=task_id,
    status="working",
    metadata={
        "user_id": "user-123",
        "session_id": "session-abc",
        "priority": "high",
        "estimated_duration": 30,  # seconds
        "tags": ["data-analysis", "urgent"]
    }
)
```

Access metadata in executor:

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    task = await self.task_store.get_task(context.task_id)
    priority = task.metadata.get("priority", "normal")

    if priority == "high":
        # Handle high priority tasks differently
        pass
```

## Task Artifacts

Send files or structured data as task outputs:

```python
from a2a.types import TaskArtifactUpdateEvent

async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Generate report
    report_data = await self.generate_report()

    # Send artifact
    await event_queue.put(TaskArtifactUpdateEvent(
        taskId=context.task_id,
        artifact={
            "type": "document",
            "format": "pdf",
            "name": "analysis_report.pdf",
            "url": "https://storage.example.com/reports/123.pdf",
            "size": 1024567,  # bytes
            "metadata": {
                "pages": 42,
                "created_at": "2025-01-15T10:30:00Z"
            }
        }
    ))

    # Complete task
    await event_queue.put(Task(
        id=context.task_id,
        status="completed"
    ))
```

### Multiple Artifacts

```python
# Send multiple artifacts for a single task
artifacts = [
    {
        "type": "image",
        "name": "chart1.png",
        "url": "https://example.com/chart1.png"
    },
    {
        "type": "image",
        "name": "chart2.png",
        "url": "https://example.com/chart2.png"
    },
    {
        "type": "data",
        "name": "results.json",
        "data": {"score": 95, "confidence": 0.87}
    }
]

for artifact in artifacts:
    await event_queue.put(TaskArtifactUpdateEvent(
        taskId=context.task_id,
        artifact=artifact
    ))
```

## Task Cancellation

### Handling Cancellation

```python
class CancellableExecutor(AgentExecutor):
    def __init__(self):
        self.active_tasks = {}

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        # Store cancellation event
        cancel_event = asyncio.Event()
        self.active_tasks[task_id] = cancel_event

        try:
            # Long-running work with cancellation checks
            for i in range(100):
                if cancel_event.is_set():
                    await event_queue.put(Task(
                        id=task_id,
                        status="cancelled"
                    ))
                    return

                await asyncio.sleep(0.1)
                # Do work...

            # Complete normally
            await event_queue.put(Task(id=task_id, status="completed"))

        finally:
            # Cleanup
            self.active_tasks.pop(task_id, None)

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        # Signal cancellation
        if task_id in self.active_tasks:
            self.active_tasks[task_id].set()
        else:
            # Task already completed or not found
            await event_queue.put(Task(
                id=task_id,
                status="cancelled"
            ))
```

## Task Queuing

Implement a task queue for rate limiting:

```python
import asyncio
from collections import deque

class QueuedExecutor(AgentExecutor):
    def __init__(self, max_concurrent: int = 5):
        self.queue = deque()
        self.active = 0
        self.max_concurrent = max_concurrent
        self.lock = asyncio.Lock()

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        async with self.lock:
            while self.active >= self.max_concurrent:
                await asyncio.sleep(0.1)

            self.active += 1

        try:
            # Process task
            await self.do_work(context, event_queue)
        finally:
            async with self.lock:
                self.active -= 1
```

## Task Expiration

Auto-expire old tasks:

```python
import asyncio
from datetime import datetime, timedelta

class ExpiringTaskStore:
    def __init__(self, task_store: TaskStore, expiry_hours: int = 24):
        self.task_store = task_store
        self.expiry_hours = expiry_hours
        self.cleanup_task = None

    async def start_cleanup(self):
        """Start background cleanup task."""
        self.cleanup_task = asyncio.create_task(self.cleanup_loop())

    async def cleanup_loop(self):
        while True:
            await asyncio.sleep(3600)  # Run hourly
            await self.cleanup_expired_tasks()

    async def cleanup_expired_tasks(self):
        cutoff = datetime.now() - timedelta(hours=self.expiry_hours)

        tasks = await self.task_store.list_tasks(limit=1000)
        for task in tasks:
            if task.updatedAt < cutoff and task.status in ["completed", "failed", "cancelled"]:
                await self.task_store.delete_task(task.id)
```

## Best Practices

1. **Always update task status** - Keep clients informed of progress
2. **Use metadata** - Store context needed for task processing
3. **Handle cancellation** - Check for cancellation in long-running tasks
4. **Persist important tasks** - Use SQL TaskStore for production
5. **Clean up old tasks** - Implement expiration for completed tasks
6. **Provide status text** - Give users meaningful updates
7. **Use artifacts** - Send structured outputs and files
8. **Implement retries** - Handle transient failures gracefully

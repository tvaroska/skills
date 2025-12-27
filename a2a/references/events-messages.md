# Events and Messages

Comprehensive guide to the event and message system in A2A Protocol.

## Event Types

The A2A SDK uses several event types for communication:

### 1. Message

Represents a single communication unit between client and agent.

```python
from a2a.types import Message, Part

message = Message(
    role="agent",  # or "user"
    parts=[
        Part(type="text", text="Hello! How can I help you?")
    ],
    messageId="unique-message-id"
)

# Send via event queue
await event_queue.put(message)
```

### 2. Task

Represents task state and metadata.

```python
from a2a.types import Task

task = Task(
    id="task-123",
    status="completed",  # submitted, working, input-required, completed, failed, cancelled
    createdAt="2025-01-15T10:30:00Z",
    updatedAt="2025-01-15T10:35:00Z"
)

await event_queue.put(task)
```

### 3. TaskStatusUpdateEvent

Provides intermediate updates during task processing.

```python
from a2a.types import TaskStatusUpdateEvent

status_update = TaskStatusUpdateEvent(
    taskId="task-123",
    status="working",
    statusText="Processing your request... 50% complete"
)

await event_queue.put(status_update)
```

### 4. TaskArtifactUpdateEvent

Sends final results, files, or structured data.

```python
from a2a.types import TaskArtifactUpdateEvent

artifact = TaskArtifactUpdateEvent(
    taskId="task-123",
    artifact={
        "type": "file",
        "name": "report.pdf",
        "url": "https://example.com/report.pdf",
        "size": 1024567,
        "mimeType": "application/pdf"
    }
)

await event_queue.put(artifact)
```

### 5. A2AError

Protocol-level errors.

```python
from a2a.types import A2AError

error = A2AError(
    code="processing_error",
    message="Failed to process input: invalid format",
    data={"expected": "json", "received": "xml"}
)

await event_queue.put(error)
```

### 6. JSONRPCError

JSON-RPC protocol errors.

```python
from a2a.types import JSONRPCError

rpc_error = JSONRPCError(
    code=-32600,  # Invalid Request
    message="Invalid JSON-RPC request",
    data={"details": "Missing required field: params"}
)

await event_queue.put(rpc_error)
```

## Message Structure

### Message Parts

Messages consist of one or more parts:

#### Text Part

```python
Part(type="text", text="This is a text message")
```

#### Data Part

```python
Part(
    type="data",
    data={
        "score": 95,
        "confidence": 0.87,
        "categories": ["technology", "science"]
    }
)
```

#### Image Part

```python
Part(
    type="image",
    image={
        "url": "https://example.com/image.png",
        "alt": "Chart showing results"
    }
)
```

#### File Part

```python
Part(
    type="file",
    file={
        "url": "https://example.com/document.pdf",
        "name": "document.pdf",
        "mimeType": "application/pdf",
        "size": 2048000
    }
)
```

### Multi-Part Messages

Send messages with multiple parts:

```python
message = Message(
    role="agent",
    parts=[
        Part(type="text", text="Here are the results of your analysis:"),
        Part(type="data", data={
            "total_records": 1000,
            "average_score": 87.5,
            "top_category": "technology"
        }),
        Part(type="text", text="I've also generated a detailed report."),
        Part(type="file", file={
            "url": "https://example.com/analysis.pdf",
            "name": "analysis_report.pdf"
        })
    ]
)

await event_queue.put(message)
```

## Message Patterns

### Simple Text Response

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    user_text = context.message.parts[0].text

    response = Message(
        role="agent",
        parts=[Part(type="text", text=f"You said: {user_text}")]
    )

    await event_queue.put(response)
    await event_queue.put(Task(id=context.task_id, status="completed"))
```

### Streaming Text Response

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Send text in chunks
    chunks = ["Hello", " there!", " How", " can", " I", " help?"]

    for chunk in chunks:
        message = Message(
            role="agent",
            parts=[Part(type="text", text=chunk)]
        )
        await event_queue.put(message)
        await asyncio.sleep(0.1)  # Simulate streaming delay

    await event_queue.put(Task(id=context.task_id, status="completed"))
```

### Structured Data Response

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Analyze and return structured results
    results = await self.analyze(context.message)

    response = Message(
        role="agent",
        parts=[
            Part(type="text", text="Analysis complete!"),
            Part(type="data", data=results)
        ]
    )

    await event_queue.put(response)
    await event_queue.put(Task(id=context.task_id, status="completed"))
```

### Rich Media Response

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Generate chart and return with explanation
    chart_url = await self.generate_chart(context.message)

    response = Message(
        role="agent",
        parts=[
            Part(type="text", text="I've created a visualization of the data:"),
            Part(type="image", image={
                "url": chart_url,
                "alt": "Bar chart showing sales by region"
            }),
            Part(type="text", text="The chart shows that the West region has the highest sales.")
        ]
    )

    await event_queue.put(response)
    await event_queue.put(Task(id=context.task_id, status="completed"))
```

## Event Queue Patterns

### EventQueue Usage

The EventQueue is the primary mechanism for sending events to clients:

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Put events on the queue
    await event_queue.put(status_update)
    await event_queue.put(message)
    await event_queue.put(task)
```

### Progress Updates

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    total_steps = 5

    for i in range(total_steps):
        # Send progress update
        await event_queue.put(TaskStatusUpdateEvent(
            taskId=context.task_id,
            status="working",
            statusText=f"Processing step {i+1}/{total_steps}..."
        ))

        # Do work
        await self.process_step(i)

    # Send final result
    await event_queue.put(Message(
        role="agent",
        parts=[Part(type="text", text="All steps completed!")]
    ))

    await event_queue.put(Task(id=context.task_id, status="completed"))
```

### Error Handling

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    try:
        result = await self.process(context.message)

        await event_queue.put(Message(
            role="agent",
            parts=[Part(type="text", text=result)]
        ))

        await event_queue.put(Task(id=context.task_id, status="completed"))

    except ValueError as e:
        # Send error to client
        await event_queue.put(A2AError(
            code="validation_error",
            message=str(e)
        ))

        await event_queue.put(Task(id=context.task_id, status="failed"))

    except Exception as e:
        # Send generic error
        await event_queue.put(A2AError(
            code="internal_error",
            message="An unexpected error occurred"
        ))

        await event_queue.put(Task(id=context.task_id, status="failed"))
```

## Request Context

The RequestContext provides information about the incoming request:

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Access task ID
    task_id = context.task_id

    # Access incoming message
    user_message = context.message

    # Get message text
    user_text = context.message.parts[0].text

    # Access message role
    role = context.message.role  # "user"

    # Get message ID
    message_id = context.message.messageId

    # Access additional context (if available)
    # This may include conversation history, user metadata, etc.
```

## Advanced Patterns

### Conditional Responses

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    user_text = context.message.parts[0].text.lower()

    if "help" in user_text:
        response_text = "Here's how I can help you..."
    elif "status" in user_text:
        response_text = "Current status: All systems operational"
    else:
        response_text = await self.generate_response(user_text)

    await event_queue.put(Message(
        role="agent",
        parts=[Part(type="text", text=response_text)]
    ))

    await event_queue.put(Task(id=context.task_id, status="completed"))
```

### Multi-Stage Processing

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    # Stage 1: Validation
    await event_queue.put(TaskStatusUpdateEvent(
        taskId=context.task_id,
        status="working",
        statusText="Validating input..."
    ))

    validation_result = await self.validate(context.message)

    if not validation_result.valid:
        await event_queue.put(Message(
            role="agent",
            parts=[Part(type="text", text=f"Validation failed: {validation_result.error}")]
        ))
        await event_queue.put(Task(id=context.task_id, status="failed"))
        return

    # Stage 2: Processing
    await event_queue.put(TaskStatusUpdateEvent(
        taskId=context.task_id,
        status="working",
        statusText="Processing request..."
    ))

    result = await self.process(context.message)

    # Stage 3: Formatting
    await event_queue.put(TaskStatusUpdateEvent(
        taskId=context.task_id,
        status="working",
        statusText="Formatting results..."
    ))

    formatted_result = await self.format_result(result)

    # Send final response
    await event_queue.put(Message(
        role="agent",
        parts=[Part(type="text", text=formatted_result)]
    ))

    await event_queue.put(Task(id=context.task_id, status="completed"))
```

### Interactive Workflows

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    user_text = context.message.parts[0].text

    # Check if we have all required info
    if not self.has_required_parameters(user_text):
        # Request missing info
        await event_queue.put(TaskStatusUpdateEvent(
            taskId=context.task_id,
            status="input-required",
            statusText="I need more information. What is the target date?"
        ))
        return

    # Continue with processing
    result = await self.process_with_all_info(user_text)

    await event_queue.put(Message(
        role="agent",
        parts=[Part(type="text", text=result)]
    ))

    await event_queue.put(Task(id=context.task_id, status="completed"))
```

## Best Practices

1. **Always send task completion** - Every `execute()` should end with a Task event
2. **Use appropriate part types** - Text for messages, data for structured info
3. **Provide status updates** - Keep users informed during long operations
4. **Handle all exceptions** - Catch errors and send appropriate error events
5. **Use descriptive status text** - Help users understand what's happening
6. **Send artifacts for files** - Use TaskArtifactUpdateEvent for file outputs
7. **Validate inputs early** - Check message format before processing
8. **Keep messages focused** - Use multiple parts for different content types

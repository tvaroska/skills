---
name: a2a
description: "Build agent-to-agent (A2A) communication systems using Google's A2A Protocol Python SDK. Use when working with multi-agent systems, agent orchestration, or implementing agent communication patterns including: (1) Creating A2A-compliant server agents, (2) Building A2A clients to communicate with agents, (3) Sending messages and handling responses, (4) Managing tasks and task lifecycles, (5) Implementing streaming responses, (6) Creating agent cards and capabilities, (7) Multi-turn conversations between agents."
---

# A2A Protocol

## Overview

The A2A (Agent-to-Agent) Protocol enables standardized communication between autonomous AI agents. This skill provides comprehensive guidance for working with Google's official `a2a-sdk` Python library to build interoperable multi-agent systems.

The protocol defines how agents discover each other, describe capabilities, exchange tasks and messages, and report results through a predictable lifecycle.

## Setup

Install the A2A SDK:

```bash
pip install a2a-sdk
```

For SQL-based task persistence:

```bash
pip install "a2a-sdk[sql]"
```

For HTTP server support:

```bash
pip install "a2a-sdk[http-server]"
```

**Requirements:** Python >= 3.10

## Quick Start: Echo Server

Create a simple A2A agent that echoes messages back:

```python
import asyncio
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


class EchoExecutor(AgentExecutor):
    """Agent that echoes back received messages."""

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        # Get the user's message
        user_message = context.message.parts[0].text

        # Create response message
        response = Message(
            role="agent",
            parts=[Part(type="text", text=f"Echo: {user_message}")]
        )

        # Send response
        await event_queue.put(response)

        # Mark task as completed
        task = Task(
            id=context.task_id,
            status="completed"
        )
        await event_queue.put(task)

    async def cancel(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        # Handle cancellation
        task = Task(
            id=context.task_id,
            status="cancelled"
        )
        await event_queue.put(task)


# Create and run server
async def main():
    server = A2AServer(
        agent_executor=EchoExecutor(),
        agent_name="Echo Agent",
        agent_description="A simple agent that echoes messages",
        port=9999
    )
    await server.start()

asyncio.run(main())
```

The agent will be available at `http://localhost:9999` with its Agent Card at `http://localhost:9999/.well-known/agent.json`.

## Core Use Cases

### 1. Creating A2A Server Agents

Build agents that can receive and process requests from clients.

**Basic Agent Structure:**

```python
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


class MyAgentExecutor(AgentExecutor):
    """Custom agent logic."""

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        # Access incoming message
        user_text = context.message.parts[0].text

        # Process request (call LLM, run logic, etc.)
        result = await self.process(user_text)

        # Send response message
        response = Message(
            role="agent",
            parts=[Part(type="text", text=result)]
        )
        await event_queue.put(response)

        # Complete task
        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        task = Task(id=context.task_id, status="cancelled")
        await event_queue.put(task)

    async def process(self, text: str) -> str:
        # Your agent logic here
        return f"Processed: {text}"
```

**With SQL Persistence:**

```python
from a2a.server import A2AServer
from a2a.server.tasks.sql_task_store import SQLTaskStore

# Create task store with database
task_store = SQLTaskStore(db_url="sqlite:///tasks.db")

server = A2AServer(
    agent_executor=MyAgentExecutor(),
    agent_name="My Agent",
    agent_description="Agent with persistent task storage",
    task_store=task_store,
    port=9999
)
```

See [server-setup.md](references/server-setup.md) for advanced server configuration including custom request handlers, push notifications, and deployment options.

### 2. Building A2A Clients

Create clients that communicate with A2A agents.

**Basic Client Usage:**

```python
import httpx
from uuid import uuid4
from a2a.client import A2AClient
from a2a.types import MessageSendParams, SendMessageRequest


async def send_message_to_agent():
    # Initialize client from agent URL
    async with httpx.AsyncClient() as httpx_client:
        client = await A2AClient.get_client_from_agent_card_url(
            httpx_client,
            "http://localhost:9999"
        )

        # Create message request
        request = SendMessageRequest(
            params=MessageSendParams(
                message={
                    "role": "user",
                    "parts": [{"type": "text", "text": "Hello, agent!"}],
                    "messageId": uuid4().hex
                }
            )
        )

        # Send message and get response
        response = await client.send_message(request)
        print(response.model_dump(mode="json", exclude_none=True))
```

**Streaming Responses:**

```python
from a2a.types import SendStreamingMessageRequest

async def stream_message():
    async with httpx.AsyncClient() as httpx_client:
        client = await A2AClient.get_client_from_agent_card_url(
            httpx_client,
            "http://localhost:9999"
        )

        request = SendStreamingMessageRequest(
            id=str(uuid4()),
            params=MessageSendParams(
                message={
                    "role": "user",
                    "parts": [{"type": "text", "text": "Stream this response"}],
                    "messageId": uuid4().hex
                }
            )
        )

        # Iterate through streaming response
        async for chunk in client.send_message_streaming(request):
            print(chunk.model_dump(mode="json", exclude_none=True))
```

See [client-usage.md](references/client-usage.md) for client patterns, error handling, and advanced features.

### 3. Task Management

Tasks represent work units with defined lifecycles.

**Task Lifecycle States:**
- `submitted` - Task received
- `working` - Agent processing
- `input-required` - Waiting for user input
- `completed` - Successfully finished
- `failed` - Error occurred
- `cancelled` - User cancelled

**Updating Task Status:**

```python
from a2a.types import Task, TaskStatusUpdateEvent

class MyExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        # Send status update
        status_update = TaskStatusUpdateEvent(
            taskId=context.task_id,
            status="working",
            statusText="Processing your request..."
        )
        await event_queue.put(status_update)

        # Do work...
        result = await self.long_running_task()

        # Send result
        response = Message(
            role="agent",
            parts=[Part(type="text", text=result)]
        )
        await event_queue.put(response)

        # Complete task
        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)
```

**Requesting User Input:**

```python
# Request additional input during task
status_update = TaskStatusUpdateEvent(
    taskId=context.task_id,
    status="input-required",
    statusText="Need more information. What color do you prefer?"
)
await event_queue.put(status_update)
```

See [task-management.md](references/task-management.md) for TaskStore implementations, persistence patterns, and task lifecycle details.

### 4. Agent Cards and Capabilities

Agent Cards are JSON documents that describe an agent's capabilities, accessible at `/.well-known/agent.json`.

**Basic Agent Card (auto-generated by A2AServer):**

```json
{
  "name": "My Agent",
  "description": "Agent that processes text",
  "url": "http://localhost:9999",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "multiTurn": true
  }
}
```

**Custom Capabilities:**

```python
from a2a.server import A2AServer

server = A2AServer(
    agent_executor=MyExecutor(),
    agent_name="Currency Converter",
    agent_description="Converts between currencies using live rates",
    agent_capabilities={
        "streaming": True,
        "multiTurn": True,
        "supportedCurrencies": ["USD", "EUR", "GBP", "INR", "JPY"]
    },
    port=9999
)
```

Clients can fetch the agent card to discover capabilities before sending requests.

See [agent-cards.md](references/agent-cards.md) for detailed capability specifications and discovery patterns.

### 5. Events and Messages

The SDK uses events for agent-to-client communication.

**Event Types:**

- **Message**: Single communication unit between client and agent
- **Task**: Task state and metadata
- **TaskStatusUpdateEvent**: Intermediate task updates
- **TaskArtifactUpdateEvent**: Final results/artifacts
- **A2AError**: Protocol-level errors
- **JSONRPCError**: RPC-level errors

**Sending Multiple Message Parts:**

```python
response = Message(
    role="agent",
    parts=[
        Part(type="text", text="Here's your analysis:"),
        Part(type="text", text="Result: The data shows..."),
        Part(type="data", data={"score": 95, "confidence": 0.87})
    ]
)
await event_queue.put(response)
```

**Sending Artifacts:**

```python
from a2a.types import TaskArtifactUpdateEvent

artifact = TaskArtifactUpdateEvent(
    taskId=context.task_id,
    artifact={
        "type": "file",
        "name": "report.pdf",
        "url": "https://example.com/report.pdf"
    }
)
await event_queue.put(artifact)
```

See [events-messages.md](references/events-messages.md) for complete event types, message structure, and communication patterns.

### 6. Multi-Turn Conversations

Handle conversations with context across multiple turns.

**Maintaining Conversation History:**

```python
class ConversationalExecutor(AgentExecutor):
    def __init__(self):
        self.conversations = {}  # task_id -> message history

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        # Initialize or retrieve conversation history
        if task_id not in self.conversations:
            self.conversations[task_id] = []

        # Add user message to history
        self.conversations[task_id].append(context.message)

        # Generate response using full history
        response_text = await self.generate_with_context(
            self.conversations[task_id]
        )

        # Send response
        response = Message(
            role="agent",
            parts=[Part(type="text", text=response_text)]
        )
        self.conversations[task_id].append(response)
        await event_queue.put(response)

        # Complete task (or keep "working" for more turns)
        task = Task(id=task_id, status="completed")
        await event_queue.put(task)

    async def generate_with_context(self, history: list) -> str:
        # Use LLM with conversation history
        return "Response based on conversation context"
```

**Note:** Full conversation history is sent with each request. Consider managing context length for long conversations.

See [multi-turn.md](references/multi-turn.md) for advanced conversation patterns, context management, and state handling.

## Related Skills

### Building Agents with ADK

For building A2A-compliant agents using a high-level framework:
- **[google-adk](../google-adk/SKILL.md)** - Agent Development Kit with tools, multi-agent support, and evaluation
- See [ADK Integration](references/adk-integration.md) for how to wrap ADK agents with A2A protocol

**Use A2A + ADK when:** You want to build capable agents with tools AND expose them via standardized A2A protocol

### Deploying A2A Servers

To deploy your A2A servers to production:
- **[vertex-agent-engine](../vertex-agent-engine/SKILL.md)** - Deploy agents to managed infrastructure with monitoring and auto-scaling
- Can deploy ADK agents that expose A2A endpoints for distributed agent communication

### Direct Model APIs

For integrating language models into your A2A agents:
- **[vertex-ai](../vertex-ai/SKILL.md)** - Low-level Vertex AI SDK for Gemini and Claude models with function calling, streaming, and multimodal support

See [LLM Integration Guide](references/llm-integration.md) for detailed examples of integrating Gemini, Claude, and other models into your A2A agents.

## Reference Documentation

For advanced topics, see the reference documentation:

- **[server-setup.md](references/server-setup.md)** - Server configuration, custom handlers, deployment
- **[client-usage.md](references/client-usage.md)** - Client patterns, error handling, timeouts
- **[task-management.md](references/task-management.md)** - Task lifecycle, persistence, TaskStore
- **[agent-cards.md](references/agent-cards.md)** - Capability specification, discovery patterns
- **[events-messages.md](references/events-messages.md)** - Event types, message structure
- **[multi-turn.md](references/multi-turn.md)** - Conversation management, context handling
- **[error-handling.md](references/error-handling.md)** - Error patterns, retry logic, debugging
- **[llm-integration.md](references/llm-integration.md)** - Integrating Gemini, Claude, and other LLMs

## Common Patterns

### Agent Discovery

```python
# Fetch agent card to discover capabilities
async with httpx.AsyncClient() as client:
    response = await client.get("http://localhost:9999/.well-known/agent.json")
    agent_card = response.json()
    print(f"Agent: {agent_card['name']}")
    print(f"Capabilities: {agent_card['capabilities']}")
```

### Error Handling

```python
from a2a.types import A2AError

class SafeExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            result = await self.process(context.message)
            await event_queue.put(result)
            await event_queue.put(Task(id=context.task_id, status="completed"))
        except Exception as e:
            error = A2AError(
                code="processing_error",
                message=str(e)
            )
            await event_queue.put(error)
            await event_queue.put(Task(id=context.task_id, status="failed"))
```

### Testing Agents

```python
# Test client for development
async def test_agent():
    async with httpx.AsyncClient() as httpx_client:
        client = await A2AClient.get_client_from_agent_card_url(
            httpx_client,
            "http://localhost:9999"
        )

        test_cases = [
            "Hello, agent!",
            "What can you do?",
            "Process this: [complex input]"
        ]

        for test_input in test_cases:
            request = SendMessageRequest(
                params=MessageSendParams(
                    message={
                        "role": "user",
                        "parts": [{"type": "text", "text": test_input}],
                        "messageId": uuid4().hex
                    }
                )
            )
            response = await client.send_message(request)
            print(f"Input: {test_input}")
            print(f"Response: {response}")
```

## Additional Resources

- **Official Documentation**: https://a2a-protocol.org/latest/sdk/python/api/
- **GitHub Repository**: https://github.com/a2aproject/a2a-python
- **Sample Code**: https://github.com/a2aproject/a2a-samples
- **PyPI Package**: https://pypi.org/project/a2a-sdk/

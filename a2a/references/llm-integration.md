# Integrating LLMs with A2A Agents

Integrate language models into your A2A agent executors to create intelligent agents that can process natural language requests.

## Overview

A2A agents can use any LLM to power their intelligence. This guide shows how to integrate popular models like Gemini and Claude into your agent executors.

## Basic Pattern

The general pattern for integrating an LLM:

1. Initialize the LLM client in your executor's `__init__`
2. In `execute()`, extract the user message from the A2A request
3. Call the LLM with the user message
4. Send the LLM's response back via the event queue
5. Mark the task as completed

## Example with Gemini

Basic integration using Google's Gemini model:

```python
from google import genai
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


class GeminiExecutor(AgentExecutor):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        user_text = context.message.parts[0].text

        # Call Gemini
        response = await self.client.aio.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=user_text
        )

        # Send response
        message = Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        )
        await event_queue.put(message)

        # Complete task
        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        task = Task(id=context.task_id, status="cancelled")
        await event_queue.put(task)
```

## Streaming Responses

For real-time streaming responses from the LLM:

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    user_text = context.message.parts[0].text

    # Stream from Gemini
    async for chunk in await self.client.aio.models.generate_content_stream(
        model="gemini-2.0-flash-exp",
        contents=user_text
    ):
        if chunk.text:
            message = Message(
                role="agent",
                parts=[Part(type="text", text=chunk.text)]
            )
            await event_queue.put(message)

    # Complete task
    task = Task(id=context.task_id, status="completed")
    await event_queue.put(task)
```

## Example with Claude

Using Anthropic's Claude models via Vertex AI:

```python
from anthropic import AnthropicVertex
from a2a.server.agent_execution import AgentExecutor


class ClaudeExecutor(AgentExecutor):
    def __init__(self, project_id: str, region: str = "global"):
        self.client = AnthropicVertex(
            project_id=project_id,
            region=region
        )

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        user_text = context.message.parts[0].text

        # Call Claude
        message_response = self.client.messages.create(
            model="claude-sonnet-4-5@20250929",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": user_text
            }]
        )

        # Send response
        response = Message(
            role="agent",
            parts=[Part(type="text", text=message_response.content[0].text)]
        )
        await event_queue.put(response)

        # Complete task
        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)
```

## Advanced: Multi-Turn Conversations

Maintain conversation history across multiple turns:

```python
class ConversationalGeminiExecutor(AgentExecutor):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.conversations = {}  # task_id -> message history

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id
        user_text = context.message.parts[0].text

        # Initialize or retrieve conversation history
        if task_id not in self.conversations:
            self.conversations[task_id] = []

        # Add user message to history
        self.conversations[task_id].append({
            "role": "user",
            "parts": [{"text": user_text}]
        })

        # Generate response with full conversation context
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=self.conversations[task_id]
        )

        # Add assistant response to history
        self.conversations[task_id].append({
            "role": "model",
            "parts": [{"text": response.text}]
        })

        # Send response
        message = Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        )
        await event_queue.put(message)

        # Complete task
        task = Task(id=task_id, status="completed")
        await event_queue.put(task)
```

## Error Handling

Always handle LLM API errors gracefully:

```python
from google.api_core import exceptions
from a2a.types import A2AError


async def execute(self, context: RequestContext, event_queue: EventQueue):
    try:
        user_text = context.message.parts[0].text

        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_text
        )

        message = Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        )
        await event_queue.put(message)
        await event_queue.put(Task(id=context.task_id, status="completed"))

    except exceptions.ResourceExhausted as e:
        error = A2AError(
            code="quota_exceeded",
            message="LLM quota exceeded. Please try again later."
        )
        await event_queue.put(error)
        await event_queue.put(Task(id=context.task_id, status="failed"))

    except exceptions.InvalidArgument as e:
        error = A2AError(
            code="invalid_request",
            message=f"Invalid request to LLM: {e}"
        )
        await event_queue.put(error)
        await event_queue.put(Task(id=context.task_id, status="failed"))

    except Exception as e:
        error = A2AError(
            code="llm_error",
            message=f"LLM error: {e}"
        )
        await event_queue.put(error)
        await event_queue.put(Task(id=context.task_id, status="failed"))
```

## System Instructions and Configuration

Configure LLM behavior with system instructions:

```python
class ConfiguredGeminiExecutor(AgentExecutor):
    def __init__(self, api_key: str, system_instruction: str):
        self.client = genai.Client(api_key=api_key)
        self.system_instruction = system_instruction

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        user_text = context.message.parts[0].text

        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_text,
            config={
                "system_instruction": self.system_instruction,
                "temperature": 0.7,
                "max_output_tokens": 2048,
            }
        )

        message = Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        )
        await event_queue.put(message)

        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)
```

## Structured Output

Generate structured JSON responses:

```python
from pydantic import BaseModel


class TaskAnalysis(BaseModel):
    priority: str
    category: str
    estimated_time: int
    summary: str


class StructuredGeminiExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        user_text = context.message.parts[0].text

        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_text,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": TaskAnalysis.model_json_schema()
            }
        )

        # Parse structured response
        analysis = TaskAnalysis.model_validate_json(response.text)

        # Send back as structured data
        message = Message(
            role="agent",
            parts=[
                Part(type="text", text=f"Analysis: {analysis.summary}"),
                Part(type="data", data=analysis.model_dump())
            ]
        )
        await event_queue.put(message)

        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)
```

## Best Practices

1. **Always use async methods** - Use `client.aio.*` for async operations to avoid blocking
2. **Handle errors gracefully** - Catch API errors and return meaningful A2A errors
3. **Set appropriate timeouts** - Configure reasonable timeouts for LLM calls
4. **Manage context length** - Be mindful of token limits in multi-turn conversations
5. **Use streaming for long responses** - Stream responses for better user experience
6. **Configure safety settings** - Set appropriate safety settings for production
7. **Monitor usage** - Track API usage and costs

## Related Documentation

- **[vertex-ai skill](../../vertex-ai/SKILL.md)** - Complete guide to using Vertex AI models
- **[multi-turn.md](multi-turn.md)** - Managing conversation state in A2A
- **[error-handling.md](error-handling.md)** - Comprehensive error handling patterns
- **[server-setup.md](server-setup.md)** - Configuring A2A servers

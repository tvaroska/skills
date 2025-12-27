# Multi-Turn Conversations

Guide for implementing multi-turn conversations and maintaining context across exchanges.

## Overview

Multi-turn conversations allow agents to maintain context across multiple message exchanges within a single task. This enables:

- Clarification questions
- Progressive refinement of responses
- Context-aware follow-ups
- Interactive workflows

## Basic Multi-Turn Pattern

### Conversation State Management

```python
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task

class ConversationalExecutor(AgentExecutor):
    def __init__(self):
        # Store conversation history by task_id
        self.conversations = {}

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        # Initialize or retrieve conversation history
        if task_id not in self.conversations:
            self.conversations[task_id] = []

        # Add user message to history
        self.conversations[task_id].append(context.message)

        # Generate response using conversation context
        response_text = await self.generate_response(
            self.conversations[task_id]
        )

        # Create and send response
        response = Message(
            role="agent",
            parts=[Part(type="text", text=response_text)]
        )
        self.conversations[task_id].append(response)
        await event_queue.put(response)

        # Keep task in "working" state to allow more turns
        # Or complete if conversation should end
        if self.should_continue_conversation(response_text):
            task = Task(id=task_id, status="working")
        else:
            task = Task(id=task_id, status="completed")
            # Clean up conversation history
            self.conversations.pop(task_id, None)

        await event_queue.put(task)

    async def generate_response(self, history: list) -> str:
        # Use LLM or logic to generate response based on full history
        # This is where you'd integrate with an LLM
        return "Response based on conversation context"

    def should_continue_conversation(self, response: str) -> bool:
        # Determine if conversation should continue
        # Could check for questions, commands, etc.
        return "?" in response or "follow-up" in response.lower()

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        # Clean up conversation history
        self.conversations.pop(context.task_id, None)

        task = Task(id=context.task_id, status="cancelled")
        await event_queue.put(task)
```

## Context Management

### Limiting Context Window

```python
class WindowedConversationExecutor(AgentExecutor):
    def __init__(self, max_history: int = 10):
        self.conversations = {}
        self.max_history = max_history

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        if task_id not in self.conversations:
            self.conversations[task_id] = []

        # Add new message
        self.conversations[task_id].append(context.message)

        # Trim history to keep only recent messages
        if len(self.conversations[task_id]) > self.max_history:
            # Keep first message (often contains important context)
            # Plus most recent messages
            self.conversations[task_id] = (
                [self.conversations[task_id][0]] +
                self.conversations[task_id][-(self.max_history - 1):]
            )

        # Generate response
        response = await self.generate_response(
            self.conversations[task_id]
        )

        # Continue conversation...
```

### Summarizing Long Conversations

```python
class SummarizingExecutor(AgentExecutor):
    def __init__(self):
        self.conversations = {}
        self.summaries = {}

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        if task_id not in self.conversations:
            self.conversations[task_id] = []

        self.conversations[task_id].append(context.message)

        # Summarize if conversation is getting long
        if len(self.conversations[task_id]) > 20:
            summary = await self.summarize_conversation(
                self.conversations[task_id]
            )
            self.summaries[task_id] = summary

            # Keep only recent messages + summary
            self.conversations[task_id] = self.conversations[task_id][-5:]

        # Generate response using summary + recent messages
        context_for_llm = []

        if task_id in self.summaries:
            context_for_llm.append(Message(
                role="system",
                parts=[Part(type="text", text=f"Summary: {self.summaries[task_id]}")]
            ))

        context_for_llm.extend(self.conversations[task_id])

        response = await self.generate_response(context_for_llm)

        # Continue conversation...
```

## Clarification Patterns

### Asking Follow-Up Questions

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    task_id = context.task_id
    user_text = context.message.parts[0].text

    # Check if we have required information
    if not self.has_required_info(task_id, user_text):
        # Ask clarifying question
        question = self.get_next_question(task_id, user_text)

        response = Message(
            role="agent",
            parts=[Part(type="text", text=question)]
        )
        await event_queue.put(response)

        # Keep task in working state for answer
        await event_queue.put(Task(id=task_id, status="working"))
        return

    # Have all info, proceed with main task
    result = await self.process_complete_request(task_id)

    await event_queue.put(Message(
        role="agent",
        parts=[Part(type="text", text=result)]
    ))

    await event_queue.put(Task(id=task_id, status="completed"))
```

### Progressive Information Gathering

```python
class ProgressiveInfoExecutor(AgentExecutor):
    def __init__(self):
        self.conversations = {}
        self.collected_info = {}

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id
        user_text = context.message.parts[0].text

        # Initialize info collection
        if task_id not in self.collected_info:
            self.collected_info[task_id] = {
                "destination": None,
                "dates": None,
                "budget": None
            }

        # Update collected info based on latest message
        self.update_collected_info(task_id, user_text)

        # Check what's still missing
        missing = [
            k for k, v in self.collected_info[task_id].items()
            if v is None
        ]

        if missing:
            # Ask for next missing piece
            question = self.get_question_for(missing[0])

            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=question)]
            ))

            await event_queue.put(Task(id=task_id, status="working"))
        else:
            # Have all info, generate final response
            result = await self.generate_final_response(
                self.collected_info[task_id]
            )

            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=result)]
            ))

            await event_queue.put(Task(id=task_id, status="completed"))

            # Clean up
            self.collected_info.pop(task_id, None)
```

## Integration with LLMs

### Using Conversation History with LLM

```python
from google import genai

class LLMConversationalExecutor(AgentExecutor):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.conversations = {}

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        if task_id not in self.conversations:
            self.conversations[task_id] = []

        # Add user message to history
        self.conversations[task_id].append(context.message)

        # Convert A2A messages to LLM format
        llm_messages = self.convert_to_llm_format(
            self.conversations[task_id]
        )

        # Call LLM with full conversation history
        response = await self.client.aio.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=llm_messages
        )

        # Create A2A response
        agent_message = Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        )

        self.conversations[task_id].append(agent_message)
        await event_queue.put(agent_message)

        # Determine if conversation should continue
        if self.is_conversation_complete(response.text):
            await event_queue.put(Task(id=task_id, status="completed"))
            self.conversations.pop(task_id, None)
        else:
            await event_queue.put(Task(id=task_id, status="working"))

    def convert_to_llm_format(self, a2a_messages: list) -> list:
        """Convert A2A messages to LLM format."""
        llm_messages = []
        for msg in a2a_messages:
            text = " ".join(
                part.text for part in msg.parts
                if hasattr(part, 'text')
            )
            llm_messages.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [{"text": text}]
            })
        return llm_messages

    def is_conversation_complete(self, response: str) -> bool:
        # Check if LLM indicated completion
        completion_phrases = [
            "is there anything else",
            "let me know if you need",
            "hope this helps"
        ]
        return any(phrase in response.lower() for phrase in completion_phrases)
```

### Streaming Multi-Turn Conversations

```python
async def execute(self, context: RequestContext, event_queue: EventQueue):
    task_id = context.task_id

    # Add to history
    if task_id not in self.conversations:
        self.conversations[task_id] = []
    self.conversations[task_id].append(context.message)

    # Stream response from LLM
    llm_messages = self.convert_to_llm_format(
        self.conversations[task_id]
    )

    full_response = ""
    async for chunk in await self.client.aio.models.generate_content_stream(
        model="gemini-2.0-flash-exp",
        contents=llm_messages
    ):
        if chunk.text:
            full_response += chunk.text

            # Send chunk to client
            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=chunk.text)]
            ))

    # Add complete response to history
    agent_message = Message(
        role="agent",
        parts=[Part(type="text", text=full_response)]
    )
    self.conversations[task_id].append(agent_message)

    # Complete or continue
    if self.is_conversation_complete(full_response):
        await event_queue.put(Task(id=task_id, status="completed"))
        self.conversations.pop(task_id, None)
    else:
        await event_queue.put(Task(id=task_id, status="working"))
```

## State Persistence

### Persisting Conversation State

```python
import json
from pathlib import Path

class PersistentConversationExecutor(AgentExecutor):
    def __init__(self, state_dir: str = "./conversation_state"):
        self.state_dir = Path(state_dir)
        self.state_dir.mkdir(exist_ok=True)

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id

        # Load conversation history
        history = self.load_conversation(task_id)
        history.append(self.message_to_dict(context.message))

        # Generate response
        response_text = await self.generate_response(history)

        response = Message(
            role="agent",
            parts=[Part(type="text", text=response_text)]
        )
        history.append(self.message_to_dict(response))

        # Save updated history
        self.save_conversation(task_id, history)

        await event_queue.put(response)
        await event_queue.put(Task(id=task_id, status="working"))

    def load_conversation(self, task_id: str) -> list:
        file_path = self.state_dir / f"{task_id}.json"
        if file_path.exists():
            with open(file_path) as f:
                return json.load(f)
        return []

    def save_conversation(self, task_id: str, history: list):
        file_path = self.state_dir / f"{task_id}.json"
        with open(file_path, "w") as f:
            json.dump(history, f)

    def message_to_dict(self, message: Message) -> dict:
        return {
            "role": message.role,
            "parts": [
                {"type": part.type, "text": getattr(part, "text", "")}
                for part in message.parts
            ]
        }
```

## Best Practices

1. **Manage context size** - Limit history to prevent token overflow
2. **Summarize long conversations** - Use summaries for extended interactions
3. **Clean up on completion** - Remove conversation state when tasks complete
4. **Handle cancellation** - Clean up state when tasks are cancelled
5. **Track conversation state** - Know when to ask for more info vs. respond
6. **Use task status** - Keep tasks in "working" state during multi-turn
7. **Persist important conversations** - Save state for long-running interactions
8. **Provide context to LLMs** - Include relevant history in each request
9. **Detect completion** - Know when the conversation goal is achieved
10. **Test edge cases** - Handle very long conversations, interrupted sessions

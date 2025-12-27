# Advanced ADK Features

## Callbacks

Callbacks enable observability, customization, and control over agent behavior.

### Callback Types

```python
from google.adk.callbacks import CallbackHandler

class CustomCallback(CallbackHandler):
    """Custom callback handler."""

    def on_agent_start(self, agent_name: str, input_data: dict):
        """Called when agent execution starts."""
        print(f"Agent {agent_name} started with: {input_data}")

    def on_agent_end(self, agent_name: str, output: dict):
        """Called when agent execution completes."""
        print(f"Agent {agent_name} completed: {output}")

    def on_tool_start(self, tool_name: str, inputs: dict):
        """Called before tool execution."""
        print(f"Tool {tool_name} starting with: {inputs}")

    def on_tool_end(self, tool_name: str, output: str):
        """Called after tool execution."""
        print(f"Tool {tool_name} returned: {output}")

    def on_llm_start(self, prompt: str):
        """Called before LLM inference."""
        print(f"LLM prompt: {prompt}")

    def on_llm_end(self, response: str):
        """Called after LLM inference."""
        print(f"LLM response: {response}")

    def on_error(self, error: Exception):
        """Called when errors occur."""
        print(f"Error: {error}")

# Use callback
agent = LlmAgent(
    name="monitored_agent",
    model="gemini-2.5-flash",
    callbacks=[CustomCallback()]
)
```

### Observability Integration

```python
# Arize AX integration
from google.adk.observability import ArizeCallback

arize_callback = ArizeCallback(
    api_key="your-api-key",
    space_id="your-space-id"
)

agent = LlmAgent(
    name="observed_agent",
    model="gemini-2.5-flash",
    callbacks=[arize_callback]
)

# Phoenix integration
from google.adk.observability import PhoenixCallback

phoenix_callback = PhoenixCallback(
    endpoint="http://localhost:6006"
)
```

## Sessions, State, and Memory

### Sessions

Track individual conversations with unique session IDs.

```python
from google.adk.sessions import Session

# Create session
session = Session(session_id="user-123")

# Run agent with session
response = agent.run(
    input="Hello, agent!",
    session=session
)

# Conversation history maintained across turns
response2 = agent.run(
    input="What did I just say?",
    session=session  # Agent remembers previous context
)
```

### State

Session-scoped scratchpad for temporary data.

```python
from google.adk.sessions import State

# Initialize state
state = State(session_id="user-123")

# Store data
state.set("user_preference", "dark_mode")
state.set("cart_items", ["item1", "item2"])

# Retrieve data
preference = state.get("user_preference")
cart = state.get("cart_items", default=[])

# Use in agent
agent.run(
    input="Check my cart",
    session=session,
    state=state
)
```

### Memory

Long-term knowledge storage across sessions.

```python
from google.adk.sessions import MemoryService

# Initialize memory service
memory = MemoryService(
    project_id="my-project",
    location="us-central1"
)

# Store facts
memory.store(
    user_id="user-123",
    fact="User prefers concise responses",
    metadata={"category": "communication_style"}
)

# Retrieve relevant memories
memories = memory.retrieve(
    user_id="user-123",
    query="How should I communicate?",
    limit=5
)

# Use in agent
agent.run(
    input="Help me with something",
    memory=memory,
    user_id="user-123"
)
```

## Context

Manage conversation context and pass data between agents.

```python
from google.adk.context import Context

# Create context
ctx = Context(
    session_id="user-123",
    user_data={"name": "Alice", "role": "developer"}
)

# Add to context
ctx.set("search_results", results)
ctx.append("conversation_history", message)

# Retrieve from context
user_name = ctx.get("user_data.name")
history = ctx.get("conversation_history", [])

# Context flows through agent hierarchy
coordinator.run(input="Process this", context=ctx)
```

## Streaming

Stream responses in real-time for better UX.

### Basic Streaming

```python
from google.adk.runtime import RunConfig

# Enable streaming
config = RunConfig(streaming=True)

# Stream responses
for chunk in agent.stream(input="Tell me a story", config=config):
    print(chunk, end="", flush=True)
```

### Async Streaming

```python
import asyncio

async def stream_async():
    async for chunk in agent.astream(input="Tell me a story"):
        print(chunk, end="", flush=True)

asyncio.run(stream_async())
```

### Bidirectional Streaming (WebSocket)

```python
from google.adk.streaming import WebSocketHandler

async def handle_websocket(websocket):
    handler = WebSocketHandler(agent)
    await handler.handle(websocket)

# With FastAPI
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await handle_websocket(websocket)
```

### Server-Sent Events (SSE)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/chat/stream")
async def chat_stream(message: str):
    async def generate():
        async for chunk in agent.astream(input=message):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Streaming Configuration

```python
from google.adk.streaming import StreamConfig

stream_config = StreamConfig(
    enable_partial_responses=True,  # Stream partial tool outputs
    buffer_size=1024,               # Buffer size for chunks
    enable_tool_streaming=False     # Disable for non-streaming tools
)

agent.stream(input="Query", stream_config=stream_config)
```

**Important notes:**
- Streaming NOT supported with function calling (must complete tool use first)
- Streaming NOT supported with structured outputs (JSON schemas)
- Use async streaming for better performance with multiple concurrent requests

## Events

React to agent events for custom logic.

```python
from google.adk.events import EventHandler

class CustomEventHandler(EventHandler):
    def on_message(self, event):
        """Handle message events."""
        print(f"Message: {event.content}")

    def on_tool_call(self, event):
        """Handle tool call events."""
        print(f"Calling tool: {event.tool_name}")

    def on_state_change(self, event):
        """Handle state change events."""
        print(f"State updated: {event.key} = {event.value}")

agent = LlmAgent(
    name="event_driven_agent",
    model="gemini-2.5-flash",
    event_handlers=[CustomEventHandler()]
)
```

## Runtime Configuration

Advanced runtime settings for production deployments.

```python
from google.adk.runtime import RunConfig

config = RunConfig(
    max_turns=10,              # Maximum conversation turns
    timeout=30,                # Timeout per turn (seconds)
    streaming=True,            # Enable streaming
    enable_observability=True, # Enable built-in observability
    retry_config={             # Retry configuration
        "max_retries": 3,
        "backoff_factor": 2
    },
    safety_settings={          # Safety settings
        "harassment": "BLOCK_MEDIUM_AND_ABOVE",
        "hate_speech": "BLOCK_MEDIUM_AND_ABOVE",
        "sexually_explicit": "BLOCK_MEDIUM_AND_ABOVE",
        "dangerous_content": "BLOCK_MEDIUM_AND_ABOVE"
    },
    generation_config={        # Generation parameters
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "max_output_tokens": 2048
    }
)

# Apply to agent
response = agent.run(input="Query", config=config)
```

## Evaluation

Test and evaluate agent performance.

### Creating Evaluation Sets

```json
// eval_set.evalset.json
{
  "test_cases": [
    {
      "input": "What's the weather in Paris?",
      "expected_tools": ["get_weather"],
      "expected_output_contains": ["Paris", "temperature"]
    },
    {
      "input": "Calculate 15% tip on $80",
      "expected_output_contains": ["$12"]
    }
  ]
}
```

### Running Evaluations

```bash
# Using ADK CLI
adk eval my_agent/ eval_set.evalset.json

# With custom metrics
adk eval my_agent/ eval_set.evalset.json \
    --metrics accuracy,latency,tool_usage
```

### Programmatic Evaluation

```python
from google.adk.evaluation import Evaluator, Metric

class CustomMetric(Metric):
    def evaluate(self, output: str, expected: str) -> float:
        """Custom evaluation logic."""
        return 1.0 if expected.lower() in output.lower() else 0.0

evaluator = Evaluator(
    agent=agent,
    metrics=[CustomMetric(), "accuracy", "latency"]
)

results = evaluator.run(eval_set_path="eval_set.evalset.json")
print(results.summary())
```

## Artifacts

Store and retrieve agent outputs and intermediate results.

```python
from google.adk.artifacts import ArtifactStore

# Initialize artifact store
store = ArtifactStore(
    project_id="my-project",
    bucket_name="my-artifacts"
)

# Store artifact
artifact_id = store.save(
    data={"result": "agent output"},
    metadata={"agent": "assistant", "version": "1.0"}
)

# Retrieve artifact
artifact = store.load(artifact_id)

# Use with agent
agent.run(
    input="Generate report",
    artifact_store=store
)
```

## Safety & Security

Configure safety settings for production.

```python
from google.adk.safety import SafetySettings

safety = SafetySettings(
    harassment="BLOCK_MEDIUM_AND_ABOVE",
    hate_speech="BLOCK_MEDIUM_AND_ABOVE",
    sexually_explicit="BLOCK_MEDIUM_AND_ABOVE",
    dangerous_content="BLOCK_MEDIUM_AND_ABOVE",
    # Custom content filters
    custom_filters=[
        {"pattern": r"\b\d{3}-\d{2}-\d{4}\b", "block": True}  # SSN pattern
    ]
)

agent = LlmAgent(
    name="safe_agent",
    model="gemini-2.5-flash",
    safety_settings=safety
)
```

## Documentation References

- Callbacks: https://github.com/google/adk-docs/blob/main/docs/callbacks/index.md
- Sessions: https://github.com/google/adk-docs/blob/main/docs/sessions/session.md
- State: https://github.com/google/adk-docs/blob/main/docs/sessions/state.md
- Memory: https://github.com/google/adk-docs/blob/main/docs/sessions/memory.md
- Context: https://github.com/google/adk-docs/blob/main/docs/context/index.md
- Streaming: https://github.com/google/adk-docs/blob/main/docs/streaming/index.md
- Events: https://github.com/google/adk-docs/blob/main/docs/events/index.md
- Runtime: https://github.com/google/adk-docs/blob/main/docs/runtime/index.md
- Evaluation: https://github.com/google/adk-docs/blob/main/docs/evaluate/index.md
- Safety: https://github.com/google/adk-docs/blob/main/docs/safety/index.md
- Observability: https://github.com/google/adk-docs/blob/main/docs/observability/phoenix.md

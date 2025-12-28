# ADK Integration

Integrate Google's Agent Development Kit (ADK) with the A2A Protocol to build capable agents that can communicate via standardized agent-to-agent interfaces.

## Why Combine ADK and A2A?

**ADK provides:**
- High-level agent building blocks
- Rich tool ecosystem (Google Search, code execution, OpenAPI, MCP)
- Multi-agent coordination within applications
- Evaluation and testing frameworks

**A2A provides:**
- Standardized communication protocol
- Agent discovery via Agent Cards
- Service-to-service agent interaction
- Language and framework agnostic

**Together:** Build powerful agents with ADK and expose them via A2A for distributed multi-agent systems.

## Basic Pattern: ADK Agent with A2A Server

Wrap an ADK agent in an A2A server to expose it via the protocol:

```python
import asyncio
from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


class ADKExecutor(AgentExecutor):
    """Wraps an ADK agent to expose via A2A protocol."""

    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        """Execute ADK agent and send response via A2A."""
        # Extract user message from A2A request
        user_text = context.message.parts[0].text

        # Run ADK agent (use async method)
        response = await self.agent.arun(input=user_text)

        # Send response via A2A protocol
        message = Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        )
        await event_queue.put(message)

        # Complete task
        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)

    async def cancel(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        """Handle cancellation."""
        task = Task(id=context.task_id, status="cancelled")
        await event_queue.put(task)


# Create ADK agent with tools
search_agent = LlmAgent(
    name="search_agent",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant. Use Google Search to answer questions accurately.",
    description="Assistant with web search capabilities",
    tools=[google_search]
)

# Create A2A server with ADK executor
async def main():
    server = A2AServer(
        agent_executor=ADKExecutor(search_agent),
        agent_name="Search Assistant",
        agent_description="ADK-powered agent with Google Search exposed via A2A protocol",
        port=9999
    )
    await server.start()

asyncio.run(main())
```

## Streaming Responses

Stream ADK agent responses through the A2A protocol:

```python
from google.adk.runtime import RunConfig


class StreamingADKExecutor(AgentExecutor):
    """ADK agent executor with streaming support."""

    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        user_text = context.message.parts[0].text

        # Stream from ADK agent
        config = RunConfig(streaming=True)

        async for chunk in self.agent.stream(input=user_text, config=config):
            # Send each chunk via A2A
            message = Message(
                role="agent",
                parts=[Part(type="text", text=chunk)]
            )
            await event_queue.put(message)

        # Complete task after streaming finishes
        task = Task(id=context.task_id, status="completed")
        await event_queue.put(task)

    async def cancel(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        task = Task(id=context.task_id, status="cancelled")
        await event_queue.put(task)
```

## Multi-Tool ADK Agent via A2A

Expose an ADK agent with multiple tools via A2A:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, code_execution, tool


@tool
def get_weather(location: str) -> str:
    """Get current weather for a location.

    Args:
        location: City name

    Returns:
        Weather information
    """
    # Mock implementation
    return f"Weather in {location}: Sunny, 72°F"


@tool
def calculator(operation: str, a: float, b: float) -> float:
    """Perform basic math operations.

    Args:
        operation: One of 'add', 'subtract', 'multiply', 'divide'
        a: First number
        b: Second number

    Returns:
        Result of the operation
    """
    if operation == "add":
        return a + b
    elif operation == "subtract":
        return a - b
    elif operation == "multiply":
        return a * b
    elif operation == "divide":
        return a / b if b != 0 else 0


# Create ADK agent with multiple tools
multi_tool_agent = LlmAgent(
    name="assistant",
    model="gemini-2.5-flash",
    instruction="""You are a versatile assistant with access to:
    - Google Search for web information
    - Code execution for running Python
    - Weather information
    - Calculator for math

    Use tools appropriately to answer user questions.""",
    tools=[google_search, code_execution, get_weather, calculator]
)

# Expose via A2A
server = A2AServer(
    agent_executor=ADKExecutor(multi_tool_agent),
    agent_name="Multi-Tool Assistant",
    agent_description="Versatile ADK agent with search, code, weather, and math capabilities",
    agent_capabilities={
        "streaming": True,
        "multiTurn": True,
        "tools": ["google_search", "code_execution", "weather", "calculator"]
    },
    port=9999
)
```

## Multi-Turn Conversations

Handle conversational state with ADK sessions:

```python
from google.adk.sessions import Session
from a2a.server.agent_execution import AgentExecutor


class ConversationalADKExecutor(AgentExecutor):
    """ADK executor that maintains conversation history."""

    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent
        self.sessions = {}  # task_id -> ADK Session

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        task_id = context.task_id
        user_text = context.message.parts[0].text

        # Get or create session for this task
        if task_id not in self.sessions:
            self.sessions[task_id] = Session(session_id=task_id)

        session = self.sessions[task_id]

        # Run agent with session context
        response = await self.agent.arun(
            input=user_text,
            session=session
        )

        # Send response
        message = Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        )
        await event_queue.put(message)

        # Complete task
        task = Task(id=task_id, status="completed")
        await event_queue.put(task)

    async def cancel(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        # Clean up session
        if context.task_id in self.sessions:
            del self.sessions[context.task_id]

        task = Task(id=context.task_id, status="cancelled")
        await event_queue.put(task)
```

## Multi-Agent System: ADK Sub-Agents via A2A

Expose a hierarchical ADK multi-agent system via A2A:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search


# Define specialized sub-agents
research_agent = LlmAgent(
    name="researcher",
    model="gemini-2.5-flash",
    instruction="Research topics using Google Search and provide comprehensive information.",
    description="Handles research tasks",
    tools=[google_search]
)

writer_agent = LlmAgent(
    name="writer",
    model="gemini-2.5-pro",
    instruction="Write high-quality content based on provided information.",
    description="Handles writing tasks"
)

# Create coordinator agent with sub-agents
coordinator = LlmAgent(
    name="coordinator",
    model="gemini-2.5-flash",
    instruction="""You coordinate between research and writing tasks.
    - Use the researcher for finding information
    - Use the writer for creating content
    - Combine their outputs to provide complete responses""",
    description="Coordinates research and writing sub-agents",
    sub_agents=[research_agent, writer_agent]
)

# Expose coordinator via A2A
# The A2A clients don't need to know about the sub-agents
server = A2AServer(
    agent_executor=ADKExecutor(coordinator),
    agent_name="Research & Writing Assistant",
    agent_description="Multi-agent system that researches and writes content",
    port=9999
)
```

## Error Handling

Robust error handling when combining ADK and A2A:

```python
from a2a.types import A2AError


class RobustADKExecutor(AgentExecutor):
    """ADK executor with comprehensive error handling."""

    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        try:
            user_text = context.message.parts[0].text

            # Run ADK agent with timeout
            response = await asyncio.wait_for(
                self.agent.arun(input=user_text),
                timeout=60.0  # 60 second timeout
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

        except asyncio.TimeoutError:
            # Handle timeout
            error = A2AError(
                code="timeout_error",
                message="Agent execution timed out after 60 seconds"
            )
            await event_queue.put(error)

            task = Task(id=context.task_id, status="failed")
            await event_queue.put(task)

        except Exception as e:
            # Handle other errors
            error = A2AError(
                code="execution_error",
                message=f"Agent execution failed: {str(e)}"
            )
            await event_queue.put(error)

            task = Task(id=context.task_id, status="failed")
            await event_queue.put(task)

    async def cancel(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ):
        task = Task(id=context.task_id, status="cancelled")
        await event_queue.put(task)
```

## Testing Your A2A-Enabled ADK Agent

Test the agent using an A2A client:

```python
import httpx
from uuid import uuid4
from a2a.client import A2AClient
from a2a.types import MessageSendParams, SendMessageRequest


async def test_adk_a2a_agent():
    """Test ADK agent exposed via A2A."""
    async with httpx.AsyncClient() as httpx_client:
        # Connect to A2A server
        client = await A2AClient.get_client_from_agent_card_url(
            httpx_client,
            "http://localhost:9999"
        )

        # Fetch agent card
        response = await httpx_client.get("http://localhost:9999/.well-known/agent.json")
        agent_card = response.json()
        print(f"Agent: {agent_card['name']}")
        print(f"Description: {agent_card['description']}")

        # Send test requests
        test_queries = [
            "What is the weather in Paris?",
            "Search for recent news about AI",
            "Calculate 15 * 24"
        ]

        for query in test_queries:
            request = SendMessageRequest(
                params=MessageSendParams(
                    message={
                        "role": "user",
                        "parts": [{"type": "text", "text": query}],
                        "messageId": uuid4().hex
                    }
                )
            )

            response = await client.send_message(request)
            print(f"\nQuery: {query}")
            print(f"Response: {response.model_dump(mode='json', exclude_none=True)}")


# Run test
asyncio.run(test_adk_a2a_agent())
```

## Deployment to Vertex AI Agent Engine

Deploy your ADK+A2A agent to production:

```python
from google.cloud import aiplatform
from google import genai

# Create ADK agent
agent = LlmAgent(
    name="production_agent",
    model="gemini-2.5-flash",
    instruction="Production agent with A2A support",
    tools=[google_search]
)

# Deploy to Vertex AI Agent Engine
aiplatform.init(project="your-project-id", location="us-central1")
client = genai.Client(vertexai=True)

remote_agent = client.agent_engines.create(
    agent,
    config={
        "requirements": [
            "google-adk",
            "a2a-sdk[http-server]",
            "google-cloud-aiplatform[agent_engines]"
        ],
    },
)

print(f"Agent deployed: {remote_agent.resource_name}")

# The deployed agent can be wrapped with A2A server in the deployment
# See vertex-agent-engine skill for deployment details
```

## Best Practices

1. **Session Management**: Use ADK sessions for multi-turn conversations mapped to A2A task IDs
2. **Error Handling**: Always wrap ADK calls in try/except and send A2A errors appropriately
3. **Streaming**: Use ADK streaming for better user experience with long responses
4. **Tool Selection**: Choose appropriate ADK tools based on your agent's capabilities
5. **Agent Cards**: Populate A2A agent capabilities based on ADK agent's tools
6. **Testing**: Test locally with both ADK's dev UI and A2A clients before deployment
7. **Timeouts**: Set reasonable timeouts for tool calls and overall execution
8. **Logging**: Log both ADK and A2A events for debugging

## Common Patterns

### Pattern 1: Simple Tool Agent
ADK agent with 1-2 tools exposed via A2A for external consumption

### Pattern 2: Research Assistant
ADK agent with search + code execution + custom tools via A2A

### Pattern 3: Multi-Agent Router
ADK coordinator with sub-agents, all hidden behind single A2A endpoint

### Pattern 4: Conversational Agent
ADK session-based agent maintaining context through A2A task lifecycle

### Pattern 5: Distributed System
Multiple ADK agents, each exposed via A2A, communicating via A2A protocol

## See Also

- **[google-adk](../../google-adk/SKILL.md)** - ADK documentation and agent building patterns
- **[vertex-agent-engine](../../vertex-agent-engine/SKILL.md)** - Deploy to production
- **[server-setup.md](server-setup.md)** - Advanced A2A server configuration
- **[multi-turn.md](multi-turn.md)** - Conversation management patterns

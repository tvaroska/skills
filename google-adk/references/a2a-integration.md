# A2A Protocol Integration

Expose Google ADK agents via the A2A (Agent-to-Agent) Protocol for standardized agent communication and discovery.

## Why Use A2A with ADK?

**ADK excels at:**
- Building intelligent agents with tools
- Multi-agent coordination within applications
- Testing and evaluation

**A2A enables:**
- Standardized agent-to-agent communication
- Agent discovery via Agent Cards
- Cross-platform, language-agnostic integration
- Service-to-service agent interaction

**Combine them to:** Build powerful ADK agents and expose them as A2A-compliant services for distributed systems.

## Quick Start: ADK Agent as A2A Server

```python
import asyncio
from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


class ADKAgentExecutor(AgentExecutor):
    """Wraps ADK agent to expose via A2A protocol."""

    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        # Get user message from A2A request
        user_message = context.message.parts[0].text

        # Run ADK agent
        response = await self.agent.arun(input=user_message)

        # Send response back via A2A
        await event_queue.put(Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        ))

        # Mark task complete
        await event_queue.put(Task(id=context.task_id, status="completed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        await event_queue.put(Task(id=context.task_id, status="cancelled"))


# Create ADK agent
agent = LlmAgent(
    name="search_assistant",
    model="gemini-2.5-flash",
    instruction="Answer questions using Google Search.",
    tools=[google_search]
)

# Expose via A2A
async def main():
    server = A2AServer(
        agent_executor=ADKAgentExecutor(agent),
        agent_name="Search Assistant",
        agent_description="ADK agent with Google Search",
        port=9999
    )
    await server.start()

asyncio.run(main())
```

Access at: `http://localhost:9999`
Agent Card: `http://localhost:9999/.well-known/agent.json`

## When to Use A2A vs ADK Sub-Agents

### Use ADK Sub-Agents When:
- All agents are part of the same application
- Agents share memory and context
- You want automatic coordination by ADK
- Deployment is as a single unit

```python
# ADK sub-agents pattern
coordinator = LlmAgent(
    name="coordinator",
    model="gemini-2.5-flash",
    instruction="Coordinate tasks",
    sub_agents=[agent1, agent2, agent3]  # All in same app
)
```

### Use A2A Protocol When:
- Agents are separate services
- Need cross-platform communication
- Agents should be independently deployable
- Want standardized discovery and communication

```python
# A2A pattern - each agent is a separate service
# Service 1: Calendar agent on port 9001
# Service 2: Email agent on port 9002
# Service 3: Task agent on port 9003
# All discover and communicate via A2A protocol
```

### Hybrid Pattern:
Use ADK sub-agents internally, expose coordinator via A2A:

```python
# Multi-agent system exposed via single A2A endpoint
coordinator = LlmAgent(
    name="coordinator",
    sub_agents=[research_agent, writer_agent, analyzer_agent]
)

# Expose coordinator via A2A
server = A2AServer(
    agent_executor=ADKAgentExecutor(coordinator),
    agent_name="Research Team",
    agent_description="Multi-agent research system"
)
```

## Streaming Responses

Enable streaming for better UX with long-running ADK agents:

```python
from google.adk.runtime import RunConfig


class StreamingADKExecutor(AgentExecutor):
    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        user_message = context.message.parts[0].text

        # Stream ADK agent responses
        config = RunConfig(streaming=True)
        async for chunk in self.agent.stream(input=user_message, config=config):
            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=chunk)]
            ))

        await event_queue.put(Task(id=context.task_id, status="completed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        await event_queue.put(Task(id=context.task_id, status="cancelled"))
```

## Tool-Rich Agents via A2A

Expose ADK agents with multiple tools:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, code_execution, tool


@tool
def analyze_sentiment(text: str) -> str:
    """Analyze sentiment of text.

    Args:
        text: Text to analyze

    Returns:
        Sentiment analysis (positive, negative, neutral)
    """
    # Implementation
    return "positive"


@tool
def translate_text(text: str, target_language: str) -> str:
    """Translate text to target language.

    Args:
        text: Text to translate
        target_language: Target language code (e.g., 'es', 'fr')

    Returns:
        Translated text
    """
    # Implementation
    return f"Translated to {target_language}: {text}"


# Create agent with multiple tools
agent = LlmAgent(
    name="language_assistant",
    model="gemini-2.5-flash",
    instruction="""You help with language tasks:
    - Search the web for information
    - Run code for analysis
    - Analyze sentiment
    - Translate text

    Use tools appropriately based on the user's request.""",
    tools=[google_search, code_execution, analyze_sentiment, translate_text]
)

# Expose with tool information in Agent Card
server = A2AServer(
    agent_executor=ADKAgentExecutor(agent),
    agent_name="Language Assistant",
    agent_description="Multi-tool language assistant with search, code, sentiment, and translation",
    agent_capabilities={
        "streaming": True,
        "multiTurn": True,
        "supportedLanguages": ["en", "es", "fr", "de", "ja", "zh"],
        "tools": ["google_search", "code_execution", "sentiment_analysis", "translation"]
    },
    port=9999
)
```

## Conversational Agents with Sessions

Maintain conversation history using ADK sessions:

```python
from google.adk.sessions import Session


class ConversationalExecutor(AgentExecutor):
    """ADK executor that maintains conversation state."""

    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent
        self.sessions = {}  # Map A2A task_id to ADK Session

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        task_id = context.task_id
        user_message = context.message.parts[0].text

        # Create or retrieve ADK session for this A2A task
        if task_id not in self.sessions:
            self.sessions[task_id] = Session(session_id=task_id)

        # Run agent with session
        response = await self.agent.arun(
            input=user_message,
            session=self.sessions[task_id]
        )

        # Send response
        await event_queue.put(Message(
            role="agent",
            parts=[Part(type="text", text=response.text)]
        ))

        await event_queue.put(Task(id=task_id, status="completed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        # Clean up session on cancel
        if context.task_id in self.sessions:
            del self.sessions[context.task_id]

        await event_queue.put(Task(id=context.task_id, status="cancelled"))


# Create conversational agent
chatbot = LlmAgent(
    name="chatbot",
    model="gemini-2.5-flash",
    instruction="You are a friendly conversational assistant. Remember context from previous messages."
)

# Expose with conversation support
server = A2AServer(
    agent_executor=ConversationalExecutor(chatbot),
    agent_name="Conversational Assistant",
    agent_description="Chatbot that maintains conversation history",
    agent_capabilities={"multiTurn": True, "streaming": True},
    port=9999
)
```

## Structured Output via A2A

Return structured data from ADK agents:

```python
from pydantic import BaseModel
from a2a.types import Part


class AnalysisResult(BaseModel):
    """Structured analysis result."""
    summary: str
    sentiment: str
    key_points: list[str]
    confidence: float


class StructuredExecutor(AgentExecutor):
    """ADK executor that returns structured output."""

    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        user_message = context.message.parts[0].text

        # Run ADK agent with structured output
        response = await self.agent.arun(input=user_message)

        # Parse response to structured format (if using response_model)
        # Or format the text response as JSON
        result = {
            "summary": response.text,
            "type": "analysis",
            "timestamp": "2024-01-01T00:00:00Z"
        }

        # Send as data part
        await event_queue.put(Message(
            role="agent",
            parts=[
                Part(type="text", text=response.text),
                Part(type="data", data=result)
            ]
        ))

        await event_queue.put(Task(id=context.task_id, status="completed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        await event_queue.put(Task(id=context.task_id, status="cancelled"))


# Create agent with structured output
analyzer = LlmAgent(
    name="analyzer",
    model="gemini-2.5-flash",
    instruction="Analyze text and provide structured insights.",
    response_model=AnalysisResult  # Optional: enforce structure
)

server = A2AServer(
    agent_executor=StructuredExecutor(analyzer),
    agent_name="Text Analyzer",
    agent_description="Returns structured analysis with sentiment and key points"
)
```

## Multi-Agent Ecosystem

Create a distributed multi-agent system where ADK agents communicate via A2A:

```python
# Agent 1: Research Agent (Port 9001)
research_agent = LlmAgent(
    name="researcher",
    model="gemini-2.5-flash",
    instruction="Research topics using Google Search.",
    tools=[google_search]
)

server1 = A2AServer(
    agent_executor=ADKAgentExecutor(research_agent),
    agent_name="Research Agent",
    agent_description="Researches topics",
    port=9001
)

# Agent 2: Writing Agent (Port 9002)
writer_agent = LlmAgent(
    name="writer",
    model="gemini-2.5-pro",
    instruction="Write high-quality content.",
    description="Writes content"
)

server2 = A2AServer(
    agent_executor=ADKAgentExecutor(writer_agent),
    agent_name="Writing Agent",
    agent_description="Writes content",
    port=9002
)

# Agent 3: Coordinator (Port 9003)
# This agent can discover and call other A2A agents
class CoordinatorExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        user_message = context.message.parts[0].text

        # Call research agent via A2A
        async with httpx.AsyncClient() as client:
            research_client = await A2AClient.get_client_from_agent_card_url(
                client, "http://localhost:9001"
            )
            research_response = await research_client.send_message(...)

            # Call writing agent via A2A with research results
            writer_client = await A2AClient.get_client_from_agent_card_url(
                client, "http://localhost:9002"
            )
            final_response = await writer_client.send_message(...)

        # Send final response
        await event_queue.put(Message(
            role="agent",
            parts=[Part(type="text", text=final_response.text)]
        ))
        await event_queue.put(Task(id=context.task_id, status="completed"))
```

## Error Handling

Handle ADK errors and communicate via A2A protocol:

```python
from a2a.types import A2AError
from google.api_core import exceptions


class RobustExecutor(AgentExecutor):
    def __init__(self, adk_agent: LlmAgent):
        self.agent = adk_agent

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            user_message = context.message.parts[0].text

            # Run with timeout
            response = await asyncio.wait_for(
                self.agent.arun(input=user_message),
                timeout=60.0
            )

            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=response.text)]
            ))
            await event_queue.put(Task(id=context.task_id, status="completed"))

        except asyncio.TimeoutError:
            await event_queue.put(A2AError(
                code="timeout",
                message="Agent execution timed out"
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

        except exceptions.ResourceExhausted:
            await event_queue.put(A2AError(
                code="quota_exceeded",
                message="API quota exceeded"
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

        except Exception as e:
            await event_queue.put(A2AError(
                code="execution_error",
                message=f"Agent failed: {str(e)}"
            ))
            await event_queue.put(Task(id=context.task_id, status="failed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        await event_queue.put(Task(id=context.task_id, status="cancelled"))
```

## Deployment

Deploy ADK+A2A agents to production:

### Local Development

```bash
# Install dependencies
pip install google-adk a2a-sdk[http-server]

# Run A2A server
python my_agent.py
```

### Cloud Run Deployment

```python
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "agent_server.py"]
```

```bash
# Deploy to Cloud Run
gcloud run deploy adk-a2a-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Vertex AI Agent Engine

```python
from google.cloud import aiplatform
from google import genai

# Create ADK agent
agent = LlmAgent(
    name="production_agent",
    model="gemini-2.5-flash",
    instruction="Production ADK agent",
    tools=[google_search]
)

# Deploy to Agent Engine
aiplatform.init(project="your-project", location="us-central1")
client = genai.Client(vertexai=True)

remote_agent = client.agent_engines.create(
    agent,
    config={"requirements": ["google-adk", "a2a-sdk"]}
)

# Can be wrapped with A2A server for external communication
```

## Testing A2A-Enabled ADK Agents

```python
import httpx
from uuid import uuid4
from a2a.client import A2AClient
from a2a.types import SendMessageRequest, MessageSendParams


async def test_agent():
    async with httpx.AsyncClient() as client:
        # Connect to A2A server
        a2a_client = await A2AClient.get_client_from_agent_card_url(
            client, "http://localhost:9999"
        )

        # Test query
        request = SendMessageRequest(
            params=MessageSendParams(
                message={
                    "role": "user",
                    "parts": [{"type": "text", "text": "Search for latest AI news"}],
                    "messageId": uuid4().hex
                }
            )
        )

        response = await a2a_client.send_message(request)
        print(response.model_dump(mode="json"))

asyncio.run(test_agent())
```

## Best Practices

1. **Session Mapping**: Map A2A task IDs to ADK sessions for conversation continuity
2. **Tool Transparency**: Document ADK tools in A2A agent capabilities
3. **Error Propagation**: Convert ADK exceptions to appropriate A2A errors
4. **Streaming**: Enable streaming for long-running ADK operations
5. **Timeouts**: Set reasonable timeouts for tool execution
6. **Testing**: Test with both ADK dev UI and A2A clients
7. **Documentation**: Keep Agent Card in sync with actual capabilities
8. **Monitoring**: Log both ADK events and A2A protocol events

## Architecture Patterns

### Pattern 1: Single ADK Agent via A2A
Simple exposure of one ADK agent as an A2A service

### Pattern 2: ADK Multi-Agent Behind A2A
ADK coordinator with sub-agents, single A2A endpoint

### Pattern 3: Distributed ADK Agents
Multiple ADK agents, each with A2A endpoint, communicating via A2A

### Pattern 4: Hybrid System
Some agents use ADK sub-agents (internal), some use A2A (cross-service)

## See Also

- **[a2a](../../a2a/SKILL.md)** - A2A Protocol documentation
- **[agents.md](agents.md)** - ADK agent patterns and multi-agent systems
- **[deployment.md](deployment.md)** - Deployment strategies for ADK agents
- **[vertex-agent-engine](../../vertex-agent-engine/SKILL.md)** - Deploy to managed infrastructure

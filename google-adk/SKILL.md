---
name: google-adk
description: "Build, evaluate, and deploy AI agents using Google's Agent Development Kit (ADK). Use when working with: (1) Building AI agents with Python, (2) Creating multi-agent systems or workflows, (3) Integrating tools (Google Search, OpenAPI, MCP, custom functions), (4) Deploying agents to Cloud Run, Vertex AI, or GKE, (5) Evaluating agent performance, (6) Implementing agentic workflows with callbacks, streaming, or sessions."
---

# Google Agent Development Kit (ADK)

Open-source, code-first Python framework for building, evaluating, and deploying AI agents.

## Key Features

- **Code-first development**: Define agents, tools, and orchestration in Python
- **Rich tool ecosystem**: Google Search, OpenAPI, MCP, custom functions, Google Cloud tools
- **Multi-agent systems**: Compose specialized agents into hierarchies
- **Model-agnostic**: Optimized for Gemini, compatible with other models
- **Deploy anywhere**: Cloud Run, Vertex AI Agent Engine, GKE

## Installation

**Stable release (recommended):**

```bash
pip install google-adk
```

**Development version:**

```bash
pip install git+https://github.com/google/adk-python.git@main
```

## Quick Start

### Single Agent

```python
from google.adk.agents import Agent
from google.adk.tools import google_search

agent = Agent(
    name="search_assistant",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant. Answer questions using Google Search.",
    description="An assistant that can search the web.",
    tools=[google_search]
)

# Run the agent
response = agent.run(input="What's the weather today?")
print(response.text)
```

### Multi-Agent System

```python
from google.adk.agents import LlmAgent

# Define specialized agents
greeter = LlmAgent(
    name="greeter",
    model="gemini-2.5-flash",
    instruction="Greet users warmly.",
    description="Handles greetings"
)

task_executor = LlmAgent(
    name="task_executor",
    model="gemini-2.5-flash",
    instruction="Execute tasks efficiently.",
    description="Executes tasks"
)

# Create coordinator with sub-agents
coordinator = LlmAgent(
    name="coordinator",
    model="gemini-2.5-flash",
    instruction="Coordinate greetings and tasks.",
    description="Routes to specialized agents",
    sub_agents=[greeter, task_executor]
)

# ADK automatically delegates to appropriate sub-agent
response = coordinator.run(input="Hello! Can you help me?")
```

## Core Use Cases

### Text Generation

```python
agent = LlmAgent(
    name="writer",
    model="gemini-2.5-flash",
    instruction="You are a creative writer."
)

response = agent.run(input="Write a haiku about Python")
```

### Custom Function Tools

```python
from google.adk.tools import tool

@tool
def get_weather(location: str) -> str:
    """Get weather for a location.

    Args:
        location: City name

    Returns:
        Weather information
    """
    # Implementation
    return f"Weather in {location}: Sunny, 22°C"

agent = LlmAgent(
    name="weather_assistant",
    model="gemini-2.5-flash",
    instruction="Help users with weather information.",
    tools=[get_weather]
)

response = agent.run(input="What's the weather in Paris?")
```

### OpenAPI Integration

```python
from google.adk.tools import openapi_tool

weather_api = openapi_tool(
    spec_url="https://api.example.com/openapi.json",
    operations=["getCurrentWeather"]
)

agent = LlmAgent(
    name="api_assistant",
    model="gemini-2.5-flash",
    tools=[weather_api]
)
```

### Structured Output

```python
from pydantic import BaseModel

class WeatherReport(BaseModel):
    location: str
    temperature: float
    condition: str

agent = LlmAgent(
    name="structured_agent",
    model="gemini-2.5-flash",
    response_model=WeatherReport
)

response = agent.run(input="What's the weather?")
# response.parsed is a WeatherReport instance
```

### Streaming Responses

```python
from google.adk.runtime import RunConfig

config = RunConfig(streaming=True)

for chunk in agent.stream(input="Tell me a story", config=config):
    print(chunk, end="", flush=True)
```

## Model Selection

**gemini-2.5-flash**: Fast, cost-effective for most tasks
**gemini-2.5-pro**: More capable for complex reasoning
**gemini-3-pro-preview**: Latest preview (requires `location='global'`)

```python
agent = LlmAgent(
    name="advanced_agent",
    model="gemini-2.5-pro",  # or gemini-3-pro-preview
    instruction="Handle complex reasoning tasks."
)
```

## Related Skills

### Multi-Agent Communication

For agent-to-agent communication across distributed services:
- **[a2a](../a2a/SKILL.md)** - A2A Protocol for standardized agent discovery and communication between independent services
- See [A2A Integration](references/a2a-integration.md) for how to expose ADK agents via A2A protocol

**Use ADK sub_agents when:** Multiple agents in a single application with shared context
**Use A2A protocol when:** Agents are separate services that need to discover and communicate with each other

### Direct Model API Access

This framework abstracts model calls for convenience. For direct, low-level API access:
- **[vertex-ai](../vertex-ai/SKILL.md)** - Low-level Vertex AI SDK for Gemini and Claude models with fine-grained control

**Use ADK when:** Building complete agents with tools, evaluation, and orchestration
**Use vertex-ai SDK when:** Need custom logic, learning fundamentals, or fine-grained control

### Production Deployment

To deploy ADK agents to managed infrastructure:
- **[vertex-agent-engine](../vertex-agent-engine/SKILL.md)** - Deploy agents to Vertex AI with sessions, memory, monitoring, and auto-scaling

See [Deployment](references/deployment.md) for deployment patterns including Cloud Run, Vertex AI Agent Engine, and GKE.

## Development UI

Test and debug agents locally:

```bash
adk ui my_agent/
```

Opens development interface at http://localhost:8080

## Evaluation

Create evaluation sets and test agents:

```bash
adk eval my_agent/ eval_set.evalset.json
```

## Advanced Topics

For detailed information on advanced features, see the reference documentation:

### Agent Patterns
See [references/agents.md](references/agents.md) for:
- LLM agents, custom agents, workflow agents
- Multi-agent system design patterns
- Sequential, parallel, and loop workflows
- Agent properties and configuration

### Tools Integration
See [references/tools.md](references/tools.md) for:
- Built-in tools (Google Search, code execution)
- Function tools with decorators
- OpenAPI and MCP integration
- Google Cloud tools (BigQuery, Cloud Storage, Vertex AI Search)
- Third-party tools (LangChain, LlamaIndex)
- Tool authentication and configuration

### Deployment
See [references/deployment.md](references/deployment.md) for:
- Cloud Run deployment (serverless, auto-scaling)
- Vertex AI Agent Engine (managed infrastructure)
- GKE deployment (Kubernetes)
- Configuration, security, monitoring
- API endpoints and authentication

### Advanced Features
See [references/advanced.md](references/advanced.md) for:
- Callbacks for observability and control
- Sessions, state, and memory management
- Context passing between agents
- Streaming (WebSocket, SSE, async)
- Events and runtime configuration
- Safety and security settings
- Artifacts and evaluation

## Common Patterns

### Agent with Multiple Tools

```python
from google.adk.tools import google_search, code_execution

agent = LlmAgent(
    name="multi_tool_agent",
    model="gemini-2.5-pro",
    instruction="Research and analyze with code.",
    tools=[google_search, code_execution]
)
```

### Persistent Sessions

```python
from google.adk.sessions import Session

session = Session(session_id="user-123")

# First turn
response1 = agent.run(input="My name is Alice", session=session)

# Second turn - agent remembers
response2 = agent.run(input="What's my name?", session=session)
```

### Async Execution

```python
import asyncio

async def run_async():
    response = await agent.arun(input="Hello")
    return response

result = asyncio.run(run_async())
```

## Reference Documentation

For detailed information on advanced features:

- **[agents.md](references/agents.md)** - Agent patterns, multi-agent systems, workflows
- **[tools.md](references/tools.md)** - Built-in tools, custom tools, integrations
- **[deployment.md](references/deployment.md)** - Cloud Run, Vertex AI, GKE deployment
- **[advanced.md](references/advanced.md)** - Callbacks, sessions, streaming, events
- **[a2a-integration.md](references/a2a-integration.md)** - Exposing ADK agents via A2A protocol

## Additional Resources

- **Official Documentation**: https://github.com/google/adk-docs
- **Repository**: https://github.com/google/adk-python
- **API Reference**: https://github.com/google/adk-docs/blob/main/docs/api-reference/python/

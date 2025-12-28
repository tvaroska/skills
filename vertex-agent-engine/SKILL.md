---
name: vertex-agent-engine
description: "Deploy and manage AI agents on Vertex AI Agent Engine using the Agent Development Kit (ADK) and google-cloud-aiplatform SDK. Use when: (1) Building AI agents with function calling and tool use, (2) Deploying agents to managed production infrastructure, (3) Creating multi-agent systems, (4) Integrating agents with LangChain or LangGraph, (5) Working with production-ready agent templates, (6) Querying or managing deployed agents on Vertex AI."
---

# Vertex AI Agent Engine

## Overview

Vertex AI Agent Engine is a managed service for deploying, managing, and scaling AI agents in production. It provides:

- **Managed deployment** - Deploy agents without managing infrastructure
- **Framework support** - Works with ADK, LangChain, and LangGraph
- **Production features** - Monitoring, versioning, secure execution
- **Agent Development Kit** - Code-first framework for building agents

### Agent Engine Services

Agent Engine includes managed services for production agents:

- **Sessions** - Maintain conversation history and state across interactions
- **Memory Bank** - Persistent, personalized memory across sessions (GA Dec 2024)
- **Code Execution** - Secure sandboxed environment for running agent-generated code
- **Example Store** - Store and retrieve few-shot examples for improved performance
- **Observability** - Built-in monitoring, logging, and tracing with Cloud Monitoring

See [references/agent-engine-services.md](references/agent-engine-services.md) for detailed coverage of each service.

## Setup

### Installation

Install the Vertex AI SDK with Agent Engine support:

```bash
# For ADK-based agents
pip install google-cloud-aiplatform[agent_engines,langchain]>=1.112

# For LangGraph agents
pip install google-cloud-aiplatform[agent_engines,langgraph]>=1.112
```

### Authentication

```python
from google import genai
from google.cloud import aiplatform

# Initialize Vertex AI
PROJECT_ID = "your-project-id"
LOCATION = "us-central1"

aiplatform.init(project=PROJECT_ID, location=LOCATION)

# Create client for deployment
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
```

## Quick Start

Create and deploy a simple agent with a tool:

```python
from google import genai
from google.cloud import aiplatform

# 1. Define a tool function
def get_weather(location: str) -> str:
    """Get current weather for a location."""
    return f"Weather in {location}: Sunny, 72°F"

# 2. Create the agent
agent = genai.Agent(
    model="gemini-2.0-flash-exp",
    tools=[get_weather],
    system_instruction="You are a helpful weather assistant."
)

# 3. Deploy to Agent Engine
aiplatform.init(project="your-project-id", location="us-central1")
client = genai.Client(vertexai=True)

remote_agent = client.agent_engines.create(
    agent,
    config={
        "requirements": ["google-cloud-aiplatform[agent_engines,langchain]"],
    },
)

print(f"Agent deployed: {remote_agent.resource_name}")

# 4. Query the deployed agent
response = remote_agent.query("What's the weather in San Francisco?")
print(response.text)
```

## Core Use Cases

### Creating Agents with ADK

The Agent Development Kit (ADK) provides a code-first approach to building agents:

```python
from google import genai

# Simple agent with multiple tools
def calculator(operation: str, a: float, b: float) -> float:
    """Perform basic math operations."""
    if operation == "add":
        return a + b
    elif operation == "multiply":
        return a * b
    return 0

def search_docs(query: str) -> str:
    """Search documentation."""
    return f"Results for: {query}"

agent = genai.Agent(
    model="gemini-2.0-flash-exp",
    tools=[calculator, search_docs],
    system_instruction="""You are a helpful assistant with access to:
    - Calculator for math operations
    - Documentation search

    Use tools to answer user questions accurately.""",
    config={
        "temperature": 0.7,
        "max_output_tokens": 1024,
    }
)

# Test locally
response = agent.query("What is 15 * 24?")
print(response.text)
```

### Deploying Agents

**Deploy from agent object (recommended):**

```python
from google.cloud import aiplatform

aiplatform.init(project="your-project-id", location="us-central1")
client = genai.Client(vertexai=True)

# Deploy with requirements
remote_agent = client.agent_engines.create(
    agent,
    config={
        "requirements": [
            "google-cloud-aiplatform[agent_engines,langchain]>=1.112",
            "requests",
        ],
    },
)
```

**Deploy from source files:**

```python
from google.cloud import aiplatform

# Deploy from a directory containing agent code
remote_agent = client.agent_engines.create_from_source(
    source_dir="./my_agent",
    entrypoint="main:agent",  # module:object
    config={
        "requirements_file": "requirements.txt",
        "runtime": "python311",
    },
)
```

**Configuration options:**

```python
config = {
    "requirements": ["package1", "package2"],  # Python dependencies
    "requirements_file": "requirements.txt",   # Or path to requirements.txt
    "runtime": "python311",                    # Python version
    "environment_variables": {                 # Environment variables
        "API_KEY": "your-key",
    },
    "machine_type": "n1-standard-4",          # Compute resources
    "service_account": "sa@project.iam.gserviceaccount.com",
}
```

### Querying Deployed Agents

**Synchronous queries:**

```python
# Simple query
response = remote_agent.query("What's 25 * 48?")
print(response.text)

# Query with session for multi-turn conversation
session = remote_agent.create_session()
response1 = session.query("What's the capital of France?")
response2 = session.query("What's the population?")  # Continues conversation
```

**Async streaming:**

```python
import asyncio

async def stream_query():
    async for chunk in remote_agent.query_stream("Tell me a story"):
        print(chunk.text, end="", flush=True)

asyncio.run(stream_query())
```

### Managing Deployed Agents

```python
from google.cloud import aiplatform

# List all deployed agents
agents = client.agent_engines.list()
for agent in agents:
    print(f"Agent: {agent.resource_name}")

# Get agent details
agent = client.agent_engines.get("projects/PROJECT_ID/locations/LOCATION/reasoning_engines/AGENT_ID")
print(f"Model: {agent.model}")
print(f"Created: {agent.create_time}")

# Update agent
updated_agent = client.agent_engines.update(
    agent.resource_name,
    config={"machine_type": "n1-standard-8"}
)

# Delete agent
client.agent_engines.delete(agent.resource_name)
```

## Model Selection

Choose models based on your requirements:

| Model | Speed | Cost | Capabilities | Use Case |
|-------|-------|------|--------------|----------|
| `gemini-2.0-flash-exp` | Fast | Low | Function calling, multimodal | Most agents |
| `gemini-2.5-flash` | Fast | Low | Function calling, structured output | Production agents |
| `gemini-2.5-pro` | Medium | Medium | Complex reasoning, long context | Advanced agents |
| `gemini-3-pro-preview` | Slower | Higher | State-of-the-art reasoning | Research, complex tasks |

**Location requirements:**
- Most models: any region (e.g., `us-central1`)
- `gemini-3-pro-preview`: requires `location='global'`

## Related Skills

### Building Agents Locally

Before deploying to Agent Engine, build and test agents locally:
- **[google-adk](../google-adk/SKILL.md)** - Agent Development Kit for creating agents with tools, multi-agent systems, and local testing

The ADK provides the `genai.Agent` class used in the Quick Start above, along with development UI, evaluation tools, and more.

### Agent Communication Protocol

To make your deployed agents discoverable and enable standardized communication:
- **[a2a](../a2a/SKILL.md)** - A2A Protocol for agent-to-agent communication
- See the A2A skill for how to expose Agent Engine deployments via A2A endpoints for distributed multi-agent systems

### Direct Model API Access

Agent Engine uses Vertex AI models under the hood. For direct API access:
- **[vertex-ai](../vertex-ai/SKILL.md)** - Low-level Vertex AI SDK for Gemini and Claude models

**Use Agent Engine when:** Deploying production agents with managed infrastructure, sessions, and monitoring
**Use vertex-ai SDK directly when:** Building custom applications with fine-grained model control

## Advanced Topics

### Framework Integration

See [references/frameworks.md](references/frameworks.md) for:
- LangChain agent integration
- LangGraph multi-agent workflows

### Agent Starter Pack

See [references/agent-starter-pack.md](references/agent-starter-pack.md) for:
- Production-ready templates
- CI/CD pipelines
- Monitoring and observability
- RAG agents
- Multi-agent orchestration

### Error Handling

```python
from google.api_core import exceptions

try:
    remote_agent = client.agent_engines.create(agent, config=config)
except exceptions.ResourceExhausted as e:
    print(f"Quota exceeded: {e}")
except exceptions.InvalidArgument as e:
    print(f"Invalid configuration: {e}")
except exceptions.FailedPrecondition as e:
    print(f"Deployment failed: {e}")
```

## Limitations

- **Deployment**: Only Python agents supported (Python 3.11+)
- **Size limits**: Agent code + dependencies must be < 500MB
- **Timeouts**: Default query timeout is 60 seconds
- **Concurrency**: Default limit of 10 concurrent queries per agent
- **Cold starts**: First query after deployment may take 30-60 seconds

## Reference Documentation

- **[agent-engine-services.md](references/agent-engine-services.md)** - Sessions, Memory Bank, Code Execution, Example Store
- **[frameworks.md](references/frameworks.md)** - LangChain and LangGraph integration
- **[agent-starter-pack.md](references/agent-starter-pack.md)** - Production templates and deployment
- **[examples.md](references/examples.md)** - Complete agent examples (RAG, multi-agent, etc.)

## Additional Resources

- **Vertex AI Agent Engine Documentation**: https://cloud.google.com/vertex-ai/docs/reasoning-engine
- **ADK Documentation**: https://github.com/google/adk-docs
- **Google Cloud Console**: https://console.cloud.google.com/vertex-ai

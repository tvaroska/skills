# Common Agent Patterns

This guide describes architectural patterns demonstrated across the agent-demo examples. Understanding these patterns helps you choose the right approach for your use case.

## Pattern 1: SDK → ADK Migration

**When to use**: Start simple, scale complexity as needed

Start with the Vertex AI SDK for direct API control, then migrate to ADK as your agent's complexity grows.

### Characteristics

- **Initial phase**: Direct model API calls with custom logic
- **Transition trigger**: Need for tool integration, conversation management, or multi-turn interactions
- **Migration path**: Wrap existing functions as ADK tools, replace manual orchestration with ADK framework

### Example Journey

**Phase 1: SDK** (basic-sdk-agent.md)
```python
# Direct API calls, manual error handling
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=message
)
```

**Phase 2: ADK** (adk-agent-with-tools.md)
```python
# Framework handles orchestration
agent = LlmAgent(
    name="assistant",
    model="gemini-2.5-flash",
    tools=[google_search, custom_tool]
)
response = agent.run(input=message)
```

### Benefits of Migration

- Reduced boilerplate (10 lines vs 50+)
- Built-in tool orchestration
- Automatic conversation history management
- Simplified error handling

### When NOT to Migrate

- You need fine-grained control over model interactions
- Your use case is extremely simple (single-turn Q&A)
- You're building a custom orchestration framework

## Pattern 2: Internal Multi-Agent

**When to use**: Complex tasks requiring specialized sub-capabilities

Multiple agents in a single application, with one coordinator delegating to specialists.

### Characteristics

- **Architecture**: Coordinator + Specialist agents
- **Communication**: In-process function calls
- **Shared resources**: Same memory, database, context
- **Deployment**: Single application instance

### Example Structure

```
Coordinator Agent
    ├── Research Agent (web search, fact-checking)
    ├── Analysis Agent (data processing, calculations)
    └── Writing Agent (content generation, formatting)
```

### Implementation (multi-agent-system.md)

```python
# Create specialists
researcher = LlmAgent(name="researcher", tools=[google_search])
analyst = LlmAgent(name="analyst", tools=[code_execution])
writer = LlmAgent(name="writer")

# Coordinator delegates to specialists
coordinator = LlmAgent(
    name="coordinator",
    tools=[researcher, analyst, writer]
)
```

### Best Practices

1. **Clear responsibilities**: Each agent has a well-defined domain
2. **Minimal overlap**: Avoid duplicate capabilities across agents
3. **Coordinator logic**: Simple routing based on request type
4. **Shared context**: Pass relevant information between agents

### Use Cases

- E-commerce support (orders, products, customer service)
- Content creation (research, writing, editing)
- Data analysis (collection, processing, visualization)

## Pattern 3: Distributed Multi-Agent

**When to use**: Independent services, multiple teams, or microservices architecture

Multiple independent agents in separate services, communicating via A2A protocol.

### Characteristics

- **Architecture**: Independent services with A2A endpoints
- **Communication**: Network calls (HTTP/gRPC)
- **Shared resources**: None (each service owns its data)
- **Deployment**: Multiple independent deployments

### Example Structure

```
Service 1: Calendar Agent (port 8001)
Service 2: Email Agent (port 8002)
Service 3: Task Agent (port 8003)
    ↓
Service 4: Personal Assistant (discovers and coordinates)
```

### Implementation (distributed-agents.md)

```python
# Each service exposes A2A endpoint
from a2a import A2AServer

# Service 1
calendar_agent = LlmAgent(name="calendar", tools=[...])
server1 = A2AServer(agent=calendar_agent, port=8001)

# Service 2
email_agent = LlmAgent(name="email", tools=[...])
server2 = A2AServer(agent=email_agent, port=8002)

# Coordinator discovers services
coordinator = A2AClient()
coordinator.discover_agents()
```

### Benefits

- **Independence**: Services can be developed/deployed separately
- **Scalability**: Scale individual services based on load
- **Fault isolation**: One service failure doesn't crash others
- **Technology diversity**: Different services can use different stacks

### Trade-offs

- **Complexity**: Network calls, service discovery, error handling
- **Latency**: Network overhead vs in-process calls
- **Consistency**: No shared state, eventual consistency challenges

### Use Cases

- Microservices platforms
- Multi-team development
- Third-party integrations
- High-scale production systems

## Pattern 4: Hybrid Architecture

**When to use**: Internal complexity with external interfaces

ADK multi-agent system (internal) exposed via A2A endpoints (external).

### Characteristics

- **Internal**: Multiple ADK agents coordinating
- **External**: A2A interface for other services
- **Best of both**: Internal efficiency + external interoperability

### Example Structure

```
A2A Endpoint (External Interface)
    ↓
Coordinator Agent
    ├── Agent A (internal)
    ├── Agent B (internal)
    └── Agent C (internal)
```

### Implementation (production-deployment.md)

```python
# Internal multi-agent system
coordinator = LlmAgent(
    name="coordinator",
    tools=[agent_a, agent_b, agent_c]
)

# Expose via A2A
server = A2AServer(agent=coordinator, port=8080)
```

### Benefits

- Internal agents share context efficiently
- External services interact via standard protocol
- Complexity hidden behind clean interface
- Easy to scale internal agents independently

### Use Cases

- SaaS platforms with internal complexity
- Enterprise integrations
- Production agent deployments

## Pattern 5: Tool Composition

**When to use**: Combining built-in and custom capabilities

Combining ADK's built-in tools (Google Search, code execution) with custom domain-specific functions.

### Characteristics

- **Built-in tools**: Provided by ADK (search, code execution)
- **Custom tools**: Your domain-specific functions
- **Composition**: Pass all tools to agent for intelligent selection

### Implementation (adk-agent-with-tools.md)

```python
from google.adk.tools import google_search, code_execution

# Define custom tool
def get_inventory(product_id: str) -> dict:
    """Check product inventory."""
    return {"product_id": product_id, "stock": 42}

# Combine tools
agent = LlmAgent(
    name="assistant",
    tools=[
        google_search,      # Built-in
        code_execution,     # Built-in
        get_inventory       # Custom
    ]
)
```

### Best Practices

1. **Clear tool descriptions**: Model selects based on descriptions
2. **Type hints**: Use Python type hints for parameters
3. **Error handling**: Tools should handle errors gracefully
4. **Idempotency**: Tools should be safe to retry

### Tool Selection Strategy

The model automatically selects tools based on:
- Tool name and description
- Parameter types and descriptions
- User query intent

### Use Cases

- Research with domain-specific data sources
- Analysis with custom calculations
- Workflow automation with internal APIs

## Choosing the Right Pattern

| Pattern | Use When | Avoid When |
|---------|----------|------------|
| SDK → ADK Migration | Starting simple, uncertain complexity | Clear requirements from start |
| Internal Multi-Agent | Specialized sub-tasks, shared context | Simple single-purpose agent |
| Distributed Multi-Agent | Independent services, scaling needs | Low latency critical |
| Hybrid Architecture | External interfaces + internal complexity | Simple single-agent use case |
| Tool Composition | Mix of built-in + custom capabilities | All custom tools (use SDK) |

## Pattern Combinations

You can combine patterns:

- **Distributed + Hybrid**: Multiple services, each with internal multi-agent
- **Internal + Tool Composition**: Multi-agent system with rich tooling
- **SDK → ADK → Distributed**: Natural evolution path as system grows

## Further Reading

- [Basic SDK Agent](basic-sdk-agent.md) - Pattern 1 starting point
- [ADK Agent with Tools](adk-agent-with-tools.md) - Patterns 1, 5
- [Multi-Agent System](multi-agent-system.md) - Pattern 2
- [Distributed Agents](distributed-agents.md) - Pattern 3
- [Production Deployment](production-deployment.md) - Pattern 4

# Agents in ADK

## Agent Types

### LLM Agent

The primary agent type for most use cases. Uses a language model to process requests and coordinate tool usage.

```python
from google.adk.agents import LlmAgent

agent = LlmAgent(
    name="assistant",
    model="gemini-2.5-flash",  # or gemini-2.5-pro, gemini-3-pro-preview
    instruction="You are a helpful assistant...",
    description="Brief description for coordination",
    tools=[...]  # Optional tools
)
```

**Common models:**
- `gemini-2.5-flash` - Fast, cost-effective for most tasks
- `gemini-2.5-pro` - More capable, better for complex reasoning
- `gemini-3-pro-preview` - Latest preview model (requires `location='global'`)

### Custom Agent (BaseAgent)

For implementing custom logic without LLM inference.

```python
from google.adk.agents import BaseAgent

class CustomAgent(BaseAgent):
    def __init__(self, name: str):
        super().__init__(name=name, description="...")

    def execute(self, input_data, context):
        # Custom logic here
        return result
```

### Agent (Legacy)

Simplified agent constructor:

```python
from google.adk.agents import Agent

agent = Agent(
    name="search_assistant",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant.",
    description="An assistant that can search the web.",
    tools=[google_search]
)
```

## Multi-Agent Systems

Create hierarchical agent systems by assigning sub-agents to a coordinator.

```python
from google.adk.agents import LlmAgent

# Define specialized agents
greeter = LlmAgent(
    name="greeter",
    model="gemini-2.5-flash",
    instruction="Greet users warmly and professionally.",
    description="Handles user greetings"
)

task_executor = LlmAgent(
    name="task_executor",
    model="gemini-2.5-flash",
    instruction="Execute tasks efficiently.",
    description="Executes specific tasks"
)

# Create coordinator with sub-agents
coordinator = LlmAgent(
    name="coordinator",
    model="gemini-2.5-flash",
    instruction="Coordinate between greeting and task execution.",
    description="Routes requests to specialized agents",
    sub_agents=[greeter, task_executor]  # Hierarchical structure
)
```

**How it works:**
- ADK engine and model guide agents to work together
- Coordinator delegates to appropriate sub-agents
- Each agent maintains its own context
- Full conversation history shared across hierarchy

## Workflow Agents

Specialized agents for structured workflows:

### Sequential Agent

Execute agents in a defined sequence.

```python
from google.adk.agents.workflow import SequentialAgent

workflow = SequentialAgent(
    name="sequential_workflow",
    agents=[agent1, agent2, agent3]
)
```

### Parallel Agent

Execute multiple agents concurrently.

```python
from google.adk.agents.workflow import ParallelAgent

workflow = ParallelAgent(
    name="parallel_workflow",
    agents=[agent1, agent2, agent3]
)
```

### Loop Agent

Execute agents in a loop with conditions.

```python
from google.adk.agents.workflow import LoopAgent

workflow = LoopAgent(
    name="loop_workflow",
    agent=worker_agent,
    max_iterations=10,
    condition=lambda ctx: ctx.should_continue
)
```

## Agent Properties

### Core Properties

- **name** (required): Unique identifier for the agent
- **model**: Gemini model to use (gemini-2.5-flash, gemini-2.5-pro, etc.)
- **instruction**: System prompt defining agent behavior
- **description**: Brief description for coordination in multi-agent systems
- **tools**: List of tools available to the agent
- **sub_agents**: Child agents for hierarchical systems

### Configuration

Agents can be configured with:
- Safety settings
- Generation parameters (temperature, top_p, etc.)
- Tool configurations
- Callbacks for observability

## Best Practices

1. **Agent granularity**: Create focused agents with clear responsibilities
2. **Descriptions**: Write clear descriptions for effective coordination
3. **Model selection**: Use flash for speed, pro for complex reasoning
4. **Tool scope**: Assign tools only to agents that need them
5. **Testing**: Test agents individually before composing into systems

## Documentation References

- Custom agents: https://github.com/google/adk-docs/blob/main/docs/agents/custom-agents.md
- LLM agents: https://github.com/google/adk-docs/blob/main/docs/agents/llm-agents.md
- Multi-agents: https://github.com/google/adk-docs/blob/main/docs/agents/multi-agents.md
- Workflow agents: https://github.com/google/adk-docs/blob/main/docs/agents/workflow-agents/index.md
- Models: https://github.com/google/adk-docs/blob/main/docs/agents/models.md

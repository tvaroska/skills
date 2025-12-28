# When to Use ADK vs Vertex AI SDK

Choosing between the Vertex AI SDK and the Agent Development Kit (ADK) depends on your use case, complexity, and requirements.

## Quick Decision Guide

```
Need AI capabilities?
├─ Simple model calls (1-5 API calls)?
│  └─ Use Vertex AI SDK
├─ Building an agent with tools?
│  ├─ Need fine-grained control?
│  │  └─ Use Vertex AI SDK with function calling
│  └─ Want framework convenience?
│     └─ Use ADK
├─ Multi-agent system?
│  ├─ Agents in same application?
│  │  └─ Use ADK with sub_agents
│  └─ Distributed agents across services?
│     └─ Use ADK + A2A Protocol
└─ Production deployment?
   └─ Use ADK + Vertex AI Agent Engine
```

## Use Vertex AI SDK When...

### 1. Learning the Fundamentals
Understanding how LLMs work at the API level.

```python
from google import genai

client = genai.Client(vertexai=True, location='global')

# Direct, transparent API calls
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Explain quantum computing'
)
```

**Why SDK:** See exactly what's happening with each API call.

### 2. Simple, One-Off Tasks
Quick scripts, prototypes, or simple automation.

```python
# Translate text
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Translate to Spanish: Hello, how are you?'
)

# Analyze an image
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'What is in this image?',
        types.Part.from_bytes(image_bytes, mime_type='image/jpeg')
    ]
)
```

**Why SDK:** Minimal overhead, straightforward code.

### 3. Custom Workflows
Unique orchestration logic not supported by frameworks.

```python
# Custom retry logic with exponential backoff
for attempt in range(3):
    try:
        response = client.models.generate_content(...)
        break
    except exceptions.ResourceExhausted:
        wait_time = 2 ** attempt
        time.sleep(wait_time)

# Custom prompt chaining with complex conditionals
initial_response = client.models.generate_content(...)
if "technical" in initial_response.text.lower():
    detailed_response = client.models.generate_content(
        contents=f"Explain in detail: {initial_response.text}"
    )
else:
    summary_response = client.models.generate_content(
        contents=f"Summarize: {initial_response.text}"
    )
```

**Why SDK:** Full control over execution flow.

### 4. Performance-Critical Applications
Need to optimize every API call and minimize abstraction overhead.

```python
# Batch processing with precise control
async def process_batch(items):
    tasks = [
        client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=item,
            config={'max_output_tokens': 100}  # Limit for cost
        )
        for item in items
    ]
    return await asyncio.gather(*tasks)
```

**Why SDK:** Direct control over concurrency and resource usage.

### 5. Integration with Existing Systems
Complex applications with established patterns.

```python
class ExistingService:
    def __init__(self):
        self.genai_client = genai.Client(vertexai=True)
        self.cache = RedisCache()
        self.metrics = MetricsCollector()

    async def process(self, input_data):
        # Check cache
        cached = await self.cache.get(input_data)
        if cached:
            return cached

        # Custom preprocessing
        processed = self.preprocess(input_data)

        # Vertex AI call
        response = await self.genai_client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=processed
        )

        # Custom postprocessing
        result = self.postprocess(response.text)

        # Update cache and metrics
        await self.cache.set(input_data, result)
        self.metrics.record('api_call', 1)

        return result
```

**Why SDK:** Fits into existing architecture without forcing new patterns.

## Use ADK When...

### 1. Building Complete Agents
Agents with tools, memory, and orchestration.

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, code_execution

agent = LlmAgent(
    name="research_assistant",
    model="gemini-2.5-flash",
    instruction="Research topics and provide analysis.",
    tools=[google_search, code_execution]
)

# ADK handles tool selection, execution, and result integration
response = agent.run(input="What are the latest trends in quantum computing?")
```

**Why ADK:** Built-in tool orchestration, no manual function calling loops.

### 2. Multi-Agent Systems
Coordinating multiple specialized agents.

```python
from google.adk.agents import LlmAgent

# Define specialists
researcher = LlmAgent(
    name="researcher",
    instruction="Research topics thoroughly.",
    tools=[google_search]
)

writer = LlmAgent(
    name="writer",
    instruction="Write engaging content."
)

fact_checker = LlmAgent(
    name="fact_checker",
    instruction="Verify facts and accuracy.",
    tools=[google_search]
)

# Coordinator orchestrates automatically
coordinator = LlmAgent(
    name="coordinator",
    instruction="Coordinate research, writing, and fact-checking.",
    sub_agents=[researcher, writer, fact_checker]
)

# ADK handles delegation and coordination
response = coordinator.run(input="Write an article about renewable energy")
```

**Why ADK:** Automatic agent coordination, no manual routing.

**Vertex AI SDK equivalent would require:**
- Manual routing logic between agents
- Conversation state management
- Tool execution loops for each agent
- Complex orchestration code (100+ lines)

### 3. Need for Testing & Evaluation
Systematic testing of agent behavior.

```python
from google.adk.agents import LlmAgent

agent = LlmAgent(
    name="customer_support",
    model="gemini-2.5-flash",
    instruction="Provide helpful customer support.",
    tools=[search_knowledge_base, create_ticket]
)

# Use ADK's development UI
# $ adk ui ./my_agent

# Use ADK's evaluation framework
# $ adk eval ./my_agent eval_set.json
```

**Why ADK:** Built-in development and evaluation tools.

**Vertex AI SDK:** Would need custom test framework.

### 4. Rapid Prototyping of Agent Systems
Quick experimentation with different tools and configurations.

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, tool

# Define custom tool in minutes
@tool
def get_inventory(product_id: str) -> dict:
    """Get product inventory."""
    return {"product_id": product_id, "stock": 42}

# Prototype agent quickly
agent = LlmAgent(
    name="sales_agent",
    model="gemini-2.5-flash",
    instruction="Help customers find products.",
    tools=[google_search, get_inventory]
)

# Test immediately
response = agent.run(input="Do you have product ABC123 in stock?")
```

**Why ADK:** Rapid iteration, minimal boilerplate.

### 5. Production Deployment Needs
Deploying to managed infrastructure.

```python
from google.adk.agents import LlmAgent
from google.cloud import aiplatform
from google import genai

# Build agent with ADK
agent = LlmAgent(
    name="production_agent",
    model="gemini-2.5-flash",
    instruction="Production customer service agent",
    tools=[search_knowledge_base, create_ticket]
)

# Deploy to Vertex AI Agent Engine with one call
aiplatform.init(project="your-project", location="us-central1")
client = genai.Client(vertexai=True)

remote_agent = client.agent_engines.create(
    agent,
    config={"requirements": ["google-adk"]}
)
```

**Why ADK:** Seamless path to production with managed infrastructure.

**Vertex AI SDK:** Would need custom deployment, scaling, monitoring.

## Comparison Table

| Aspect | Vertex AI SDK | ADK |
|--------|---------------|-----|
| **Abstraction Level** | Low-level API | High-level framework |
| **Learning Curve** | Moderate | Low |
| **Control** | Complete | High (but opinionated) |
| **Boilerplate** | More | Less |
| **Tool Integration** | Manual function calling | Automatic tool orchestration |
| **Multi-Agent** | Manual coordination | Built-in sub-agents |
| **Testing** | Custom framework needed | Built-in dev UI & eval |
| **Deployment** | DIY | Vertex AI Agent Engine |
| **Best For** | Custom logic, learning, integration | Complete agents, rapid development |
| **Code for Simple Agent** | 50-100 lines | 10-20 lines |
| **Code for Multi-Agent** | 200+ lines | 30-50 lines |

## Real-World Examples

### Example 1: Image Analysis

**Vertex AI SDK approach:**
```python
from google import genai

client = genai.Client(vertexai=True)

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Describe this image',
        types.Part.from_bytes(image_bytes, mime_type='image/jpeg')
    ]
)

print(response.text)
```

**Lines of code:** ~10
**Best choice:** Vertex AI SDK (simple, one-off task)

### Example 2: Research Assistant with Tools

**Vertex AI SDK approach:**
```python
from google import genai
from google.genai.types import GenerateContentConfig

client = genai.Client(vertexai=True)

def search_web(query: str) -> str:
    # Implementation
    pass

def analyze_data(data: str) -> dict:
    # Implementation
    pass

# Manual function calling loop
prompt = "Research quantum computing trends"
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt,
    config=GenerateContentConfig(tools=[search_web, analyze_data])
)

# Check for function calls
while response.candidates[0].content.parts[0].function_call:
    fc = response.candidates[0].content.parts[0].function_call

    # Execute function
    if fc.name == "search_web":
        result = search_web(**fc.args)
    elif fc.name == "analyze_data":
        result = analyze_data(**fc.args)

    # Continue conversation
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            prompt,
            response.candidates[0].content,
            types.Part.from_function_response(
                name=fc.name,
                response={"result": result}
            )
        ],
        config=GenerateContentConfig(tools=[search_web, analyze_data])
    )

print(response.text)
```

**ADK approach:**
```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, tool

@tool
def analyze_data(data: str) -> dict:
    """Analyze data."""
    pass

agent = LlmAgent(
    name="researcher",
    model="gemini-2.5-flash",
    instruction="Research topics using search and analysis.",
    tools=[google_search, analyze_data]
)

response = agent.run(input="Research quantum computing trends")
print(response.text)
```

**Lines of code:** SDK: ~50, ADK: ~15
**Best choice:** ADK (complex tool orchestration)

### Example 3: Customer Support Multi-Agent System

**Vertex AI SDK approach:**
```python
# Would require:
# 1. Manual routing between agents (30+ lines)
# 2. State management (20+ lines)
# 3. Tool calling loops for each agent (50+ lines)
# 4. Conversation history tracking (30+ lines)
# Total: 130+ lines of orchestration code
```

**ADK approach:**
```python
from google.adk.agents import LlmAgent
from google.adk.tools import tool

@tool
def search_kb(query: str) -> str:
    """Search knowledge base."""
    pass

@tool
def create_ticket(issue: str) -> str:
    """Create support ticket."""
    pass

# Define specialized agents
kb_agent = LlmAgent(
    name="kb_searcher",
    instruction="Search knowledge base for solutions.",
    tools=[search_kb]
)

ticket_agent = LlmAgent(
    name="ticket_creator",
    instruction="Create support tickets for escalation.",
    tools=[create_ticket]
)

# Coordinator automatically routes
coordinator = LlmAgent(
    name="support_coordinator",
    instruction="Help customers. Search KB first, escalate if needed.",
    sub_agents=[kb_agent, ticket_agent]
)

response = coordinator.run(input="My account is locked")
```

**Lines of code:** SDK: 130+, ADK: 35
**Best choice:** ADK (multi-agent coordination)

## Migration Path

### Starting with SDK, Moving to ADK

```python
# Phase 1: Start with SDK for learning
from google import genai
client = genai.Client(vertexai=True)
response = client.models.generate_content(...)

# Phase 2: Add function calling (still SDK)
response = client.models.generate_content(
    config=GenerateContentConfig(tools=[my_function])
)

# Phase 3: Migrate to ADK when complexity grows
from google.adk.agents import LlmAgent
agent = LlmAgent(
    model="gemini-2.5-flash",
    tools=[my_function]
)

# Phase 4: Add more agents and deploy
coordinator = LlmAgent(sub_agents=[agent1, agent2])
# Deploy to Agent Engine
```

## Conclusion

**Choose Vertex AI SDK for:**
- Learning and understanding
- Simple, focused tasks
- Custom, unique workflows
- Performance optimization
- Existing system integration

**Choose ADK for:**
- Building complete agents
- Multi-agent systems
- Tool orchestration
- Testing and evaluation
- Production deployment

**Hybrid approach:**
Use ADK for agent building, but understand the underlying Vertex AI SDK for customization and debugging.

## See Also

- **[google-adk](../../google-adk/SKILL.md)** - Agent Development Kit documentation
- **[vertex-agent-engine](../../vertex-agent-engine/SKILL.md)** - Deploy ADK agents
- **[function-calling.md](function-calling.md)** - Manual function calling with SDK

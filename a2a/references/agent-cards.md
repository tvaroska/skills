# Agent Cards and Capability Discovery

Agent Cards are JSON documents that describe an agent's identity, capabilities, and endpoints.

## Agent Card Structure

Basic agent card served at `/.well-known/agent.json`:

```json
{
  "name": "My Agent",
  "description": "A helpful agent that processes text",
  "url": "https://agent.example.com",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "multiTurn": true
  }
}
```

## Standard Fields

### Required Fields

- **name** (string): Human-readable agent name
- **url** (string): Base URL where the agent is accessible
- **description** (string): What the agent does

### Optional Fields

- **version** (string): Agent version (semantic versioning recommended)
- **capabilities** (object): Capabilities and features the agent supports
- **contact** (object): Support contact information
- **termsOfService** (string): URL to terms of service
- **privacyPolicy** (string): URL to privacy policy

## Standard Capabilities

### Core Capabilities

```json
{
  "capabilities": {
    "streaming": true,      // Supports streaming responses
    "multiTurn": true,      // Supports multi-turn conversations
    "cancellation": true,   // Supports task cancellation
    "artifacts": true       // Can send file/data artifacts
  }
}
```

### Setting Capabilities in A2AServer

```python
from a2a.server import A2AServer

server = A2AServer(
    agent_executor=MyExecutor(),
    agent_name="Advanced Agent",
    agent_description="Agent with multiple capabilities",
    agent_capabilities={
        "streaming": True,
        "multiTurn": True,
        "cancellation": True,
        "artifacts": True
    },
    port=9999
)
```

## Custom Capabilities

Extend the capabilities object with domain-specific features:

### Example: Currency Converter

```python
server = A2AServer(
    agent_executor=CurrencyExecutor(),
    agent_name="Currency Converter",
    agent_description="Real-time currency conversion",
    agent_capabilities={
        "streaming": True,
        "multiTurn": True,
        "supportedCurrencies": ["USD", "EUR", "GBP", "JPY", "INR"],
        "historicalData": True,
        "maxHistoricalDays": 365
    },
    port=9999
)
```

**Resulting agent card:**

```json
{
  "name": "Currency Converter",
  "description": "Real-time currency conversion",
  "url": "http://localhost:9999",
  "capabilities": {
    "streaming": true,
    "multiTurn": true,
    "supportedCurrencies": ["USD", "EUR", "GBP", "JPY", "INR"],
    "historicalData": true,
    "maxHistoricalDays": 365
  }
}
```

### Example: Data Analyzer

```python
server = A2AServer(
    agent_executor=AnalyzerExecutor(),
    agent_name="Data Analyzer",
    agent_description="Statistical analysis and visualization",
    agent_capabilities={
        "streaming": True,
        "artifacts": True,
        "supportedFormats": ["csv", "json", "parquet"],
        "maxFileSizeMB": 100,
        "analysisTypes": [
            "descriptive-statistics",
            "correlation-analysis",
            "time-series",
            "regression"
        ],
        "outputFormats": ["json", "pdf", "html"]
    },
    port=9999
)
```

## Capability Discovery

### Client-Side Discovery

```python
import httpx

async def discover_agent(agent_url: str):
    """Fetch and analyze agent capabilities."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{agent_url}/.well-known/agent.json")
        agent_card = response.json()

        return {
            "name": agent_card["name"],
            "description": agent_card["description"],
            "supports_streaming": agent_card.get("capabilities", {}).get("streaming", False),
            "supports_multi_turn": agent_card.get("capabilities", {}).get("multiTurn", False),
            "custom_capabilities": {
                k: v for k, v in agent_card.get("capabilities", {}).items()
                if k not in ["streaming", "multiTurn", "cancellation", "artifacts"]
            }
        }
```

### Capability-Based Routing

```python
async def select_agent_for_task(task_type: str, agent_urls: list[str]):
    """Select the most appropriate agent based on capabilities."""
    capability_map = {
        "currency_conversion": "supportedCurrencies",
        "data_analysis": "analysisTypes",
        "translation": "supportedLanguages"
    }

    required_capability = capability_map.get(task_type)
    if not required_capability:
        raise ValueError(f"Unknown task type: {task_type}")

    async with httpx.AsyncClient() as client:
        for url in agent_urls:
            try:
                response = await client.get(f"{url}/.well-known/agent.json")
                agent_card = response.json()

                if required_capability in agent_card.get("capabilities", {}):
                    return url, agent_card
            except Exception:
                continue

    raise ValueError(f"No agent found for task: {task_type}")
```

## Versioning

### Semantic Versioning

Use semantic versioning for agent versions:

```python
server = A2AServer(
    agent_executor=MyExecutor(),
    agent_name="My Agent",
    agent_version="2.1.0",  # MAJOR.MINOR.PATCH
    # ...
)
```

### Version Compatibility Check

```python
def is_compatible_version(required: str, actual: str) -> bool:
    """Check if agent version meets requirements."""
    req_major, req_minor, _ = map(int, required.split('.'))
    act_major, act_minor, _ = map(int, actual.split('.'))

    # Major version must match, minor version must be >= required
    return act_major == req_major and act_minor >= req_minor

# Usage
agent_card = await fetch_agent_card(agent_url)
if not is_compatible_version("2.0.0", agent_card["version"]):
    raise ValueError("Agent version incompatible")
```

## Extended Agent Card

Full example with all optional fields:

```python
server = A2AServer(
    agent_executor=MyExecutor(),
    agent_name="Enterprise Agent",
    agent_description="Production-ready agent for enterprise use",
    agent_version="1.2.3",
    agent_capabilities={
        "streaming": True,
        "multiTurn": True,
        "cancellation": True,
        "artifacts": True,
        "authentication": "oauth2",
        "rateLimit": {
            "requests": 1000,
            "period": "hour"
        },
        "maxMessageLength": 10000,
        "supportedContentTypes": ["text", "image", "pdf"]
    },
    agent_contact={
        "name": "Support Team",
        "email": "support@example.com",
        "url": "https://example.com/support"
    },
    agent_terms_of_service="https://example.com/terms",
    agent_privacy_policy="https://example.com/privacy",
    port=9999
)
```

**Note:** The A2AServer constructor may not support all these parameters. Consult the SDK documentation for the exact API.

## Dynamic Capabilities

Update capabilities based on runtime state:

```python
class DynamicCapabilitiesServer:
    def __init__(self):
        self.server = None
        self.current_load = 0

    async def update_capabilities(self):
        """Update agent card based on current state."""
        # Note: This is a conceptual example
        # The actual SDK may require server restart to update capabilities

        max_concurrent = 100 if self.current_load < 50 else 10

        self.server.agent_capabilities.update({
            "maxConcurrentRequests": max_concurrent,
            "currentLoad": self.current_load,
            "status": "available" if self.current_load < 90 else "busy"
        })
```

## Agent Registry

Implement a centralized agent registry:

```python
import asyncio
import httpx

class AgentRegistry:
    """Central registry of available agents."""

    def __init__(self):
        self.agents = {}

    async def register_agent(self, url: str):
        """Add agent to registry."""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{url}/.well-known/agent.json")
            agent_card = response.json()

            self.agents[agent_card["name"]] = {
                "url": url,
                "card": agent_card,
                "last_updated": asyncio.get_event_loop().time()
            }

    async def find_agents_by_capability(self, capability: str):
        """Find all agents with a specific capability."""
        return [
            agent for agent in self.agents.values()
            if capability in agent["card"].get("capabilities", {})
        ]

    async def get_agent_by_name(self, name: str):
        """Get agent by name."""
        return self.agents.get(name)

    async def refresh_all(self):
        """Refresh all agent cards."""
        urls = [agent["url"] for agent in self.agents.values()]
        await asyncio.gather(*[
            self.register_agent(url) for url in urls
        ])
```

## Best Practices

1. **Be specific in descriptions** - Clearly describe what the agent does
2. **Document custom capabilities** - Use descriptive names and provide documentation
3. **Use semantic versioning** - Version your agents consistently
4. **Keep capabilities up-to-date** - Reflect actual agent capabilities
5. **Provide contact information** - Help users get support
6. **Use standard capability names** - Follow conventions for common features
7. **Test capability discovery** - Ensure clients can parse your agent card
8. **Document breaking changes** - Increment major version for incompatible changes

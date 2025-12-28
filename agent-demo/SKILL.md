---
name: agent-demo
description: "Complete end-to-end examples demonstrating Google's AI agent ecosystem. Shows how to combine vertex-ai SDK, google-adk, vertex-agent-engine, and a2a protocol to build real-world agent systems. Use when: (1) Learning the full agent development workflow, (2) Understanding how technologies work together, (3) Building production multi-agent systems, (4) Need reference implementations for common patterns."
---

# Agent Demonstrations

Complete, runnable examples showing how to build AI agent systems using Google's AI ecosystem. Each example builds on previous ones, demonstrating the journey from simple API calls to production-grade distributed multi-agent systems.

## Quick Start

### Installation

Install the complete ecosystem:

```bash
pip install google-genai google-adk "google-cloud-aiplatform[agent_engines]>=1.112" "a2a-sdk[sql,http-server]"
```

For detailed installation options, see [Installation Guide](references/installation.md).

### Environment Setup

Set up your Google Cloud environment:

```bash
# Automated setup
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID

# Validate environment
python scripts/validate_environment.py

# Generate agent boilerplate
python scripts/generate_agent.py sdk --name MyAgent
```

For manual setup, see [Setup Guide](references/setup.md).

## Examples by Complexity

### Level 1: Foundation
**[Basic SDK Agent](references/basic-sdk-agent.md)** - Start here
- Simple text generation with Vertex AI SDK
- Image analysis
- Function calling basics
- **Skills used**: vertex-ai
- **Complexity**: Foundation

### Level 2: Single Agent Systems
**[ADK Agent with Tools](references/adk-agent-with-tools.md)**
- Build an agent with Google Search and custom tools
- Streaming responses
- Session management for conversations
- **Skills used**: vertex-ai, google-adk
- **Complexity**: Intermediate

### Level 3: Multi-Agent Systems
**[Multi-Agent System](references/multi-agent-system.md)**
- Hierarchical agent coordination with ADK
- Sub-agents for specialized tasks
- Shared context and memory
- **Skills used**: vertex-ai, google-adk
- **Complexity**: Advanced

### Level 4: Distributed Systems
**[Distributed Agents with A2A](references/distributed-agents.md)**
- Multiple independent agents communicating via A2A protocol
- Agent discovery and coordination
- Service-to-service agent interaction
- **Skills used**: vertex-ai, google-adk, a2a
- **Complexity**: Advanced

### Level 5: Production Deployment
**[Production Deployment](references/production-deployment.md)**
- Deploy agents to Vertex AI Agent Engine
- Monitoring and observability
- Scaling and performance optimization
- A2A endpoints for external communication
- **Skills used**: vertex-ai, google-adk, vertex-agent-engine, a2a
- **Complexity**: Production

## Learning Paths

Choose your learning path based on your goals:

### Path 1: Learning the Basics
Start with foundation and single-agent patterns:
1. Basic SDK Agent
2. ADK Agent with Tools

### Path 2: Building Multi-Agent Systems
Master internal multi-agent coordination:
1. Basic SDK Agent
2. ADK Agent with Tools
3. Multi-Agent System

### Path 3: Production-Ready Systems
Complete journey to production deployment:
1. Basic SDK Agent
2. ADK Agent with Tools
3. Multi-Agent System
4. Distributed Agents
5. Production Deployment

## Understanding the Stack

This skill demonstrates four complementary technologies working together:

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR APPLICATION                        │
│                    (Built with agent-demo)                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌─────────────────┐      ┌────────────────┐
│   vertex-ai   │      │   google-adk    │      │ vertex-agent-  │
│               │      │                 │      │    engine      │
│  Foundation   │◄─────│  Agent Builder  │─────►│   Deployment   │
│   (SDK)       │      │                 │      │                │
└───────────────┘      └─────────────────┘      └────────────────┘
                                │
                                │ exposes via
                                │
                                ▼
                       ┌─────────────────┐
                       │       a2a       │
                       │  Communication  │
                       │    Protocol     │
                       └─────────────────┘

LEARNING PATH:
1. Start with vertex-ai    → Learn model APIs and capabilities
2. Graduate to google-adk  → Build agents with tools and orchestration
3. Deploy with agent-engine → Production infrastructure and scaling
4. Connect with a2a        → Distributed multi-agent systems
```

**Technology roles:**

- **[vertex-ai](../vertex-ai/SKILL.md)**: Low-level SDK for direct model API access
- **[google-adk](../google-adk/SKILL.md)**: High-level framework for building agents with tools
- **[vertex-agent-engine](../vertex-agent-engine/SKILL.md)**: Managed deployment infrastructure
- **[a2a](../a2a/SKILL.md)**: Agent-to-agent communication protocol

## Common Patterns

The examples demonstrate five key architectural patterns:

1. **SDK → ADK Migration**: Start simple, scale complexity as needed
2. **Internal Multi-Agent**: Coordinated specialists in single application
3. **Distributed Multi-Agent**: Independent services via A2A protocol
4. **Hybrid Architecture**: Internal multi-agent + external A2A interface
5. **Tool Composition**: Built-in + custom tools working together

For detailed pattern explanations, see [Common Patterns](references/patterns.md).

## Real-World Use Cases

Examples demonstrate patterns applicable to:

- **Customer Service**: FAQ bots, triage, knowledge base search
- **Research & Analysis**: Web research, data analysis, report generation
- **Workflow Automation**: Email/calendar, task orchestration, document processing
- **Development Tools**: Code review, documentation, testing assistance

For detailed use case mappings, see [Use Cases Guide](references/use-cases.md).

## Example Structure

Each example follows a consistent structure:

1. **Overview**: What you'll build and why
2. **Architecture**: System design and component diagram
3. **Prerequisites**: Specific requirements
4. **Step-by-Step Guide**: Detailed implementation
5. **Testing**: How to run and validate
6. **Troubleshooting**: Common issues and solutions
7. **Next Steps**: How to extend

## Repository Structure

```
agent-demo/
├── SKILL.md                           # This file
├── scripts/
│   ├── setup_gcloud.sh               # Automated Google Cloud setup
│   ├── validate_environment.py       # Environment validation
│   └── generate_agent.py             # Agent template generator
└── references/
    ├── setup.md                      # Detailed setup guide
    ├── patterns.md                   # Architectural patterns
    ├── use-cases.md                  # Real-world applications
    ├── basic-sdk-agent.md            # Level 1: Foundation
    ├── adk-agent-with-tools.md       # Level 2: Single agent
    ├── multi-agent-system.md         # Level 3: Multi-agent
    ├── distributed-agents.md         # Level 4: Distributed
    └── production-deployment.md      # Level 5: Production
```

## Tips for Success

1. **Follow the order**: Examples build on each other
2. **Run the code**: Don't just read, execute and experiment
3. **Modify and extend**: Try variations to deepen understanding
4. **Check prerequisites**: Ensure your environment is set up correctly
5. **Read error messages**: They often contain helpful debugging info
6. **Use the development UI**: ADK's `adk ui` is great for testing
7. **Start simple**: Get basic version working before adding features

## Getting Help

If you encounter issues:

1. **Check the example's troubleshooting section**
2. **Review the related skill documentation**:
   - [vertex-ai](../vertex-ai/SKILL.md)
   - [google-adk](../google-adk/SKILL.md)
   - [vertex-agent-engine](../vertex-agent-engine/SKILL.md)
   - [a2a](../a2a/SKILL.md)
3. **Verify your Google Cloud setup**: Run `python scripts/validate_environment.py`
4. **Check API quotas and billing**
5. **Look for similar issues in GitHub repos**

## Additional Resources

- **Google AI for Developers**: https://ai.google.dev/
- **Vertex AI Documentation**: https://cloud.google.com/vertex-ai/docs
- **ADK GitHub**: https://github.com/google/adk-python
- **A2A Protocol**: https://a2a-protocol.org/

## What You'll Learn

After completing these examples, you'll understand:
- When to use SDK vs ADK vs Agent Engine
- How to build agents with tools
- Multi-agent coordination strategies
- Distributed system patterns
- Production deployment best practices

Ready to build your own agent systems!

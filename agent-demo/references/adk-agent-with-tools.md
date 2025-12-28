# ADK Agent with Tools

**Level**: Single Agent Systems (Level 2)
**Complexity**: Intermediate
**Skills**: [vertex-ai](../../vertex-ai/SKILL.md), [google-adk](../../google-adk/SKILL.md)

## Overview

Build a capable research assistant using the Agent Development Kit (ADK). You'll learn how to:
- Create agents with ADK's high-level framework
- Integrate built-in tools (Google Search, code execution)
- Add custom tools for specialized tasks
- Handle streaming responses for better UX
- Manage multi-turn conversations with sessions

**What you'll build**: A research assistant that can search the web, analyze data, and maintain conversation context.

## Architecture

```
User Input → ADK Agent → Gemini Model
                ↓
           Tool Selection
                ↓
     ┌──────────┴──────────┐
     ↓          ↓          ↓
Google Search  Code Exec  Custom Tools
     ↓          ↓          ↓
           Results
                ↓
           Response
```

**Components**:
- ADK LlmAgent with Gemini 2.5 Flash
- Google Search tool for web research
- Code execution for data analysis
- Custom tools for domain-specific tasks
- Session management for conversation history

## Prerequisites

Before starting, ensure your environment is set up. See the [Setup Guide](setup.md) for detailed instructions, or run:

```bash
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID
python scripts/validate_environment.py
```

For this example, you'll need:
```bash
pip install google-adk
export PROJECT_ID="your-project-id"
```

## Step 1: Simple ADK Agent

Create `research_agent.py`:

```python
from google.adk.agents import LlmAgent

# Create a simple agent
agent = LlmAgent(
    name="research_assistant",
    model="gemini-2.5-flash",
    instruction="""You are a helpful research assistant.
    Answer questions accurately and cite your sources when possible.
    Be concise but thorough.""",
    description="Research assistant for answering questions"
)

# Test it
if __name__ == "__main__":
    questions = [
        "What is quantum computing?",
        "Explain machine learning in simple terms",
        "What are the latest trends in AI?"
    ]

    for question in questions:
        print(f"\nQuestion: {question}")
        response = agent.run(input=question)
        print(f"Answer: {response.text}")
```

**Run it**:
```bash
python research_agent.py
```

**Benefits over SDK**:
- Less boilerplate (10 lines vs 50+)
- Automatic error handling
- Built-in conversation management

## Step 2: Add Google Search Tool

Enable web search for current information:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search

# Create agent with Google Search
agent = LlmAgent(
    name="web_researcher",
    model="gemini-2.5-flash",
    instruction="""You are a research assistant with access to Google Search.

    When answering questions:
    1. Use Google Search for current events, facts, and recent information
    2. Synthesize information from multiple sources
    3. Always cite your sources
    4. If search results are insufficient, say so""",
    description="Research assistant with web search",
    tools=[google_search]
)

# Test with current events
if __name__ == "__main__":
    queries = [
        "What are the latest developments in renewable energy?",
        "Who won the most recent Nobel Prize in Physics?",
        "What are the top tech companies by market cap in 2024?"
    ]

    for query in queries:
        print(f"\nQuery: {query}")
        print("=" * 60)
        response = agent.run(input=query)
        print(f"Answer: {response.text}\n")
```

**ADK automatically**:
- Decides when to use search
- Executes the search
- Integrates results into response
- No manual function calling loop needed!

## Step 3: Add Code Execution

Enable data analysis capabilities:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, code_execution

# Create agent with multiple tools
agent = LlmAgent(
    name="data_analyst",
    model="gemini-2.5-flash",
    instruction="""You are a research and data analysis assistant.

    You have access to:
    - Google Search: For finding information online
    - Code Execution: For analyzing data, calculations, visualizations

    Use code execution for:
    - Mathematical calculations
    - Data analysis and statistics
    - Creating charts and visualizations
    - Processing and transforming data

    Use Google Search for:
    - Current events and news
    - Factual information
    - Research and citations""",
    description="Research assistant with search and code execution",
    tools=[google_search, code_execution]
)

# Test with analysis tasks
if __name__ == "__main__":
    tasks = [
        "Calculate the compound interest on $10,000 invested at 5% annual rate for 10 years",
        "Search for current inflation rates in the US, then calculate the real return on a 7% investment",
        "Generate a list of prime numbers between 1 and 100"
    ]

    for task in tasks:
        print(f"\nTask: {task}")
        print("=" * 60)
        response = agent.run(input=task)
        print(f"Result: {response.text}\n")
```

## Step 4: Add Custom Tools

Create domain-specific tools:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, code_execution, tool
import json


@tool
def search_knowledge_base(query: str, category: str = "all") -> str:
    """Search internal knowledge base.

    Args:
        query: Search query
        category: Category filter (all, products, policies, technical)

    Returns:
        Search results from knowledge base
    """
    # Mock implementation - replace with real knowledge base
    kb = {
        "products": {
            "return policy": "30-day return window for most items. Electronics have 14-day window.",
            "shipping": "Free shipping on orders over $50. Standard shipping takes 3-5 business days.",
            "warranty": "1-year manufacturer warranty on all products."
        },
        "technical": {
            "api": "API documentation available at docs.example.com/api",
            "integration": "Integration guides available for popular platforms."
        }
    }

    results = []
    search_categories = [category] if category != "all" else kb.keys()

    for cat in search_categories:
        if cat in kb:
            for key, value in kb[cat].items():
                if query.lower() in key.lower() or query.lower() in value.lower():
                    results.append(f"[{cat}] {key}: {value}")

    return "\n".join(results) if results else f"No results found for '{query}' in category '{category}'"


@tool
def get_product_info(product_id: str) -> dict:
    """Get detailed product information.

    Args:
        product_id: Product identifier

    Returns:
        Product details including name, price, stock, description
    """
    # Mock product database
    products = {
        "PROD-001": {
            "name": "Smart Widget Pro",
            "price": 299.99,
            "stock": 42,
            "category": "Electronics",
            "description": "Advanced smart widget with AI capabilities"
        },
        "PROD-002": {
            "name": "Classic Gadget",
            "price": 49.99,
            "stock": 0,
            "category": "Accessories",
            "description": "Reliable classic gadget for everyday use"
        }
    }

    return products.get(product_id, {"error": f"Product {product_id} not found"})


@tool
def create_summary_report(data: str, format: str = "text") -> str:
    """Create a summary report from data.

    Args:
        data: Data to summarize
        format: Output format (text, json, markdown)

    Returns:
        Formatted summary report
    """
    summary = f"Summary Report\n{'=' * 40}\n\n"
    summary += f"Data analyzed: {len(data)} characters\n"
    summary += f"Format: {format}\n\n"
    summary += f"Content preview:\n{data[:200]}..."

    if format == "json":
        return json.dumps({
            "summary": summary,
            "length": len(data),
            "format": format
        })
    elif format == "markdown":
        return f"# Summary Report\n\n{summary}"
    else:
        return summary


# Create comprehensive agent
agent = LlmAgent(
    name="comprehensive_assistant",
    model="gemini-2.5-flash",
    instruction="""You are a comprehensive research and support assistant.

    Available tools:
    - google_search: For web research and current information
    - code_execution: For calculations and data analysis
    - search_knowledge_base: For internal documentation and policies
    - get_product_info: For product details and availability
    - create_summary_report: For generating formatted reports

    Strategy:
    1. Understand the user's request
    2. Choose the most appropriate tool(s)
    3. Use tools in sequence if needed
    4. Provide clear, actionable responses""",
    description="Full-featured assistant with multiple tools",
    tools=[
        google_search,
        code_execution,
        search_knowledge_base,
        get_product_info,
        create_summary_report
    ]
)

# Test comprehensive capabilities
if __name__ == "__main__":
    test_queries = [
        "What's your return policy?",
        "Is PROD-001 in stock and how much does it cost?",
        "Search the web for reviews of quantum computing, then summarize the findings",
        "Calculate the average of 45, 67, 89, 23, 91 and create a report"
    ]

    for query in test_queries:
        print(f"\nQuery: {query}")
        print("=" * 70)
        response = agent.run(input=query)
        print(f"Response: {response.text}\n")
```

## Step 5: Streaming Responses

Add streaming for better user experience:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from google.adk.runtime import RunConfig

agent = LlmAgent(
    name="streaming_assistant",
    model="gemini-2.5-flash",
    instruction="You are a helpful research assistant. Provide detailed, informative responses.",
    tools=[google_search]
)

# Streaming example
def chat_with_streaming(query: str):
    """Chat with streaming enabled."""
    print(f"\nQuery: {query}")
    print("Response: ", end="", flush=True)

    config = RunConfig(streaming=True)

    for chunk in agent.stream(input=query, config=config):
        print(chunk, end="", flush=True)

    print("\n")

# Test streaming
if __name__ == "__main__":
    chat_with_streaming("Explain how Large Language Models work")
    chat_with_streaming("Search for the latest news about space exploration")
```

## Step 6: Multi-Turn Conversations

Maintain context across multiple exchanges:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, code_execution
from google.adk.sessions import Session

agent = LlmAgent(
    name="conversational_assistant",
    model="gemini-2.5-flash",
    instruction="""You are a conversational research assistant.
    Remember context from previous messages and provide coherent multi-turn conversations.""",
    tools=[google_search, code_execution]
)

# Create session for conversation
session = Session(session_id="user-123")

# Multi-turn conversation
def conversation_demo():
    """Demonstrate multi-turn conversation."""

    # Turn 1
    print("\n" + "=" * 70)
    print("Turn 1:")
    response = agent.run(
        input="Search for information about quantum computing",
        session=session
    )
    print(f"User: Search for information about quantum computing")
    print(f"Agent: {response.text}")

    # Turn 2 - references previous context
    print("\n" + "=" * 70)
    print("Turn 2:")
    response = agent.run(
        input="What are the main companies working on it?",  # "it" refers to quantum computing
        session=session
    )
    print(f"User: What are the main companies working on it?")
    print(f"Agent: {response.text}")

    # Turn 3 - still maintaining context
    print("\n" + "=" * 70)
    print("Turn 3:")
    response = agent.run(
        input="Calculate how much a $1000 investment in the leading company might be worth after 5 years at 15% annual growth",
        session=session
    )
    print(f"User: Calculate investment returns...")
    print(f"Agent: {response.text}")

if __name__ == "__main__":
    conversation_demo()
```

## Step 7: Complete Research Assistant

Put everything together:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, code_execution, tool
from google.adk.sessions import Session
from google.adk.runtime import RunConfig
import sys


@tool
def save_note(title: str, content: str) -> str:
    """Save a research note.

    Args:
        title: Note title
        content: Note content

    Returns:
        Confirmation message
    """
    # Mock implementation - would save to database
    print(f"\n[Saved note: {title}]")
    return f"Note '{title}' saved successfully"


@tool
def search_saved_notes(query: str) -> str:
    """Search previously saved notes.

    Args:
        query: Search query

    Returns:
        Matching notes
    """
    # Mock implementation
    return f"Found 0 notes matching '{query}'"


class ResearchAssistant:
    """Interactive research assistant with full capabilities."""

    def __init__(self):
        self.agent = LlmAgent(
            name="research_assistant",
            model="gemini-2.5-flash",
            instruction="""You are an advanced research assistant.

            Capabilities:
            - google_search: Search the web for current information
            - code_execution: Analyze data, perform calculations, create visualizations
            - save_note: Save important findings for later reference
            - search_saved_notes: Retrieve previously saved notes

            Best practices:
            - For factual questions, search the web first
            - For calculations, use code execution
            - Save important findings automatically
            - Cite sources when using search results
            - Be concise but thorough""",
            tools=[google_search, code_execution, save_note, search_saved_notes]
        )
        self.session = None

    def start_session(self, session_id: str = "default"):
        """Start a new conversation session."""
        self.session = Session(session_id=session_id)
        print(f"Research Assistant (Session: {session_id})")
        print("=" * 70)
        print("I can help you with:")
        print("  - Web research and current information")
        print("  - Data analysis and calculations")
        print("  - Saving and retrieving research notes")
        print("\nType 'quit' to exit, 'stream' to toggle streaming mode")
        print("=" * 70)

    def chat(self, message: str, streaming: bool = False) -> str:
        """Process a message."""
        try:
            if streaming:
                config = RunConfig(streaming=True)
                response_text = ""
                for chunk in self.agent.stream(input=message, session=self.session, config=config):
                    print(chunk, end="", flush=True)
                    response_text += chunk
                print()  # New line after streaming
                return response_text
            else:
                response = self.agent.run(input=message, session=self.session)
                return response.text

        except Exception as e:
            return f"Error: {e}"


# Interactive CLI
def main():
    assistant = ResearchAssistant()
    assistant.start_session("user-session-001")

    streaming_mode = False

    while True:
        try:
            user_input = input("\nYou: ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['quit', 'exit']:
                print("\nAgent: Goodbye! Your session has been saved.")
                break

            if user_input.lower() == 'stream':
                streaming_mode = not streaming_mode
                print(f"\nStreaming mode: {'ON' if streaming_mode else 'OFF'}")
                continue

            print(f"Agent: ", end="" if streaming_mode else "\n")
            response = assistant.chat(user_input, streaming=streaming_mode)

            if not streaming_mode:
                print(response)

        except KeyboardInterrupt:
            print("\n\nAgent: Session interrupted. Goodbye!")
            break


if __name__ == "__main__":
    main()
```

## Testing

Run the interactive assistant:

```bash
python research_assistant.py
```

**Sample conversation**:
```
You: Search for the latest news about AI regulation

Agent: I'll search for that information...
[Uses Google Search]
Recent developments in AI regulation include...
[Provides detailed summary with sources]

You: What are the key points? Save them as a note.

Agent: Key points from AI regulation news:
1. EU AI Act implementation timeline
2. US executive order on AI safety
3. Industry self-regulation initiatives
[Saved note: AI Regulation Key Points]

You: Calculate the potential market size if AI regulation affects 30% of the $500B AI market

Agent: [Uses code execution]
If AI regulation affects 30% of a $500B market:
- Affected market: $150B
- Remaining unaffected: $350B
...

You: stream
Streaming mode: ON

You: Explain quantum computing in simple terms

Agent: Quantum computing is a revolutionary approach... [streams word by word for better UX]

You: quit
Agent: Goodbye! Your session has been saved.
```

## Troubleshooting

### Agent not using tools
- Check tool definitions have proper docstrings
- Verify instruction mentions tool availability
- Make sure tools are included in tools list

### Code execution failures
- Code execution has security restrictions
- Cannot access external networks
- Limited to Python standard library + common packages

### Session not maintaining context
- Ensure same Session object is used across calls
- Check that session_id is consistent
- Verify session is passed to agent.run()

### Streaming not working
- Ensure RunConfig(streaming=True) is set
- Use agent.stream() instead of agent.run()
- Flush print output with flush=True

## Key Takeaways

1. **Less boilerplate**: ADK reduces code by 70% compared to SDK
2. **Automatic orchestration**: No manual function calling loops
3. **Built-in tools**: Google Search and code execution work out of the box
4. **Custom tools**: Easy to add with @tool decorator
5. **Session management**: Conversation context handled automatically
6. **Streaming**: Better UX with incremental responses

## Next Steps

**Continue to**: [Multi-Agent System](multi-agent-system.md)

Learn how to:
- Create specialized sub-agents
- Coordinate multiple agents automatically
- Design agent hierarchies
- Share context across agents

**Extend this example**:
- Add more custom tools (database queries, API calls)
- Implement persistent session storage
- Create a web UI with Streamlit or Gradio
- Add voice input/output capabilities

## Related Documentation

- **[google-adk](../../google-adk/SKILL.md)** - Complete ADK documentation
- **[Tools](../../google-adk/references/tools.md)** - Detailed tools guide
- **[Agents](../../google-adk/references/agents.md)** - Agent patterns and configuration

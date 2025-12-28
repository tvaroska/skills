# Distributed Agents with A2A

**Level**: Distributed Systems (Level 4)
**Complexity**: Advanced
**Skills**: [vertex-ai](../../vertex-ai/SKILL.md), [google-adk](../../google-adk/SKILL.md), [a2a](../../a2a/SKILL.md)

## Overview

Build a distributed multi-agent system where independent agents communicate via the A2A (Agent-to-Agent) Protocol. You'll learn how to:
- Expose ADK agents via A2A protocol
- Implement agent discovery mechanisms
- Enable cross-service agent communication
- Build a coordinator that orchestrates distributed agents
- Design resilient distributed systems

**What you'll build**: A personal assistant ecosystem with independent calendar, email, and task services that discover and communicate with each other.

## Architecture

```
                    Personal Assistant
                    (Coordinator Agent)
                           ↓
                  A2A Protocol Discovery
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│Calendar Agent│   │ Email Agent  │   │ Task Agent   │
│  Port 9001   │   │  Port 9002   │   │  Port 9003   │
└──────────────┘   └──────────────┘   └──────────────┘
    A2A Server         A2A Server         A2A Server
        ↓                  ↓                  ↓
  Calendar DB         Email Service       Task Database
```

**Key Features**:
- Each agent is an independent service
- Agents expose A2A protocol endpoints
- Coordinator discovers agents dynamically
- Fault-tolerant communication
- Independently deployable and scalable

## Prerequisites

Before starting, ensure your environment is set up. See the [Setup Guide](setup.md) for detailed instructions, or run:

```bash
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID
python scripts/validate_environment.py
```

For this example, you'll need:
```bash
pip install google-adk a2a-sdk[http-server] httpx
```

## Step 1: Create Calendar Agent Service

Create `calendar_agent.py`:

```python
import asyncio
from datetime import datetime, timedelta
from google.adk.agents import LlmAgent
from google.adk.tools import tool
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


# Calendar tools
@tool
def get_events(date: str = "today") -> list:
    """Get calendar events.

    Args:
        date: Date to check (today, tomorrow, or YYYY-MM-DD)

    Returns:
        List of events
    """
    # Mock calendar data
    events = {
        "today": [
            {"time": "10:00 AM", "title": "Team Meeting", "duration": "1 hour"},
            {"time": "2:00 PM", "title": "Client Call", "duration": "30 min"}
        ],
        "tomorrow": [
            {"time": "9:00 AM", "title": "Project Review", "duration": "2 hours"}
        ]
    }
    return events.get(date, [])


@tool
def create_event(title: str, date: str, time: str, duration: str = "1 hour") -> str:
    """Create a calendar event.

    Args:
        title: Event title
        date: Event date (today, tomorrow, or YYYY-MM-DD)
        time: Event time (e.g., "2:00 PM")
        duration: Event duration (e.g., "1 hour")

    Returns:
        Confirmation message
    """
    return f"Created event '{title}' on {date} at {time} for {duration}"


@tool
def find_free_slots(date: str = "today") -> list:
    """Find available time slots.

    Args:
        date: Date to check

    Returns:
        List of free time slots
    """
    return [
        {"start": "11:00 AM", "end": "1:00 PM"},
        {"start": "3:00 PM", "end": "5:00 PM"}
    ]


# Create ADK calendar agent
calendar_adk_agent = LlmAgent(
    name="calendar_agent",
    model="gemini-2.5-flash",
    instruction="""You are a calendar management assistant.

    Capabilities:
    - View calendar events for any date
    - Create new calendar events
    - Find available time slots

    Be helpful and clear about scheduling.""",
    tools=[get_events, create_event, find_free_slots]
)


# Wrap ADK agent for A2A protocol
class CalendarAgentExecutor(AgentExecutor):
    """A2A executor for calendar agent."""

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            user_message = context.message.parts[0].text

            # Run ADK agent
            response = await calendar_adk_agent.arun(input=user_message)

            # Send response via A2A
            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=response.text)]
            ))

            # Complete task
            await event_queue.put(Task(id=context.task_id, status="completed"))

        except Exception as e:
            await event_queue.put(Task(id=context.task_id, status="failed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        await event_queue.put(Task(id=context.task_id, status="cancelled"))


# Start A2A server
async def main():
    server = A2AServer(
        agent_executor=CalendarAgentExecutor(),
        agent_name="Calendar Agent",
        agent_description="Manages calendar events and scheduling",
        agent_capabilities={
            "streaming": False,
            "multiTurn": True,
            "features": ["event_management", "scheduling", "availability_check"]
        },
        port=9001
    )

    print("Calendar Agent starting on port 9001...")
    print("Agent Card: http://localhost:9001/.well-known/agent.json")
    await server.start()


if __name__ == "__main__":
    asyncio.run(main())
```

## Step 2: Create Email Agent Service

Create `email_agent.py`:

```python
import asyncio
from google.adk.agents import LlmAgent
from google.adk.tools import tool
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


# Email tools
@tool
def get_unread_emails(count: int = 5) -> list:
    """Get recent unread emails.

    Args:
        count: Number of emails to retrieve

    Returns:
        List of unread emails
    """
    return [
        {"from": "john@example.com", "subject": "Project Update", "preview": "Here's the latest..."},
        {"from": "sarah@example.com", "subject": "Meeting Request", "preview": "Can we schedule..."},
        {"from": "team@example.com", "subject": "Weekly Newsletter", "preview": "This week's highlights..."}
    ][:count]


@tool
def send_email(to: str, subject: str, body: str) -> str:
    """Send an email.

    Args:
        to: Recipient email address
        subject: Email subject
        body: Email body

    Returns:
        Confirmation message
    """
    return f"Email sent to {to} with subject '{subject}'"


@tool
def search_emails(query: str, limit: int = 10) -> list:
    """Search emails.

    Args:
        query: Search query
        limit: Maximum results

    Returns:
        Matching emails
    """
    # Mock search results
    return [
        {"from": "john@example.com", "subject": f"RE: {query}", "date": "2024-01-10"}
    ]


# Create ADK email agent
email_adk_agent = LlmAgent(
    name="email_agent",
    model="gemini-2.5-flash",
    instruction="""You are an email management assistant.

    Capabilities:
    - Check unread emails
    - Send emails
    - Search email history

    Be concise and professional with email management.""",
    tools=[get_unread_emails, send_email, search_emails]
)


# Wrap for A2A
class EmailAgentExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            user_message = context.message.parts[0].text
            response = await email_adk_agent.arun(input=user_message)

            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=response.text)]
            ))
            await event_queue.put(Task(id=context.task_id, status="completed"))

        except Exception as e:
            await event_queue.put(Task(id=context.task_id, status="failed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        await event_queue.put(Task(id=context.task_id, status="cancelled"))


async def main():
    server = A2AServer(
        agent_executor=EmailAgentExecutor(),
        agent_name="Email Agent",
        agent_description="Manages email communications",
        agent_capabilities={
            "streaming": False,
            "multiTurn": True,
            "features": ["email_reading", "email_sending", "email_search"]
        },
        port=9002
    )

    print("Email Agent starting on port 9002...")
    print("Agent Card: http://localhost:9002/.well-known/agent.json")
    await server.start()


if __name__ == "__main__":
    asyncio.run(main())
```

## Step 3: Create Task Agent Service

Create `task_agent.py`:

```python
import asyncio
from google.adk.agents import LlmAgent
from google.adk.tools import tool
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task as A2ATask


# Task management tools
@tool
def list_tasks(status: str = "all") -> list:
    """List tasks.

    Args:
        status: Filter by status (all, active, completed)

    Returns:
        List of tasks
    """
    tasks = [
        {"id": 1, "title": "Review code", "status": "active", "priority": "high"},
        {"id": 2, "title": "Update documentation", "status": "active", "priority": "medium"},
        {"id": 3, "title": "Deploy v2.0", "status": "completed", "priority": "high"}
    ]

    if status == "all":
        return tasks
    return [t for t in tasks if t["status"] == status]


@tool
def create_task(title: str, priority: str = "medium", due_date: str = None) -> str:
    """Create a new task.

    Args:
        title: Task title
        priority: Priority level (low, medium, high)
        due_date: Due date (optional)

    Returns:
        Confirmation message
    """
    due_info = f" due {due_date}" if due_date else ""
    return f"Created {priority} priority task: '{title}'{due_info}"


@tool
def complete_task(task_id: int) -> str:
    """Mark a task as completed.

    Args:
        task_id: Task identifier

    Returns:
        Confirmation message
    """
    return f"Task {task_id} marked as completed"


# Create ADK task agent
task_adk_agent = LlmAgent(
    name="task_agent",
    model="gemini-2.5-flash",
    instruction="""You are a task management assistant.

    Capabilities:
    - List tasks with filters
    - Create new tasks
    - Mark tasks as completed

    Help users stay organized and productive.""",
    tools=[list_tasks, create_task, complete_task]
)


class TaskAgentExecutor(AgentExecutor):
    async def execute(self, context: RequestContext, event_queue: EventQueue):
        try:
            user_message = context.message.parts[0].text
            response = await task_adk_agent.arun(input=user_message)

            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=response.text)]
            ))
            await event_queue.put(A2ATask(id=context.task_id, status="completed"))

        except Exception as e:
            await event_queue.put(A2ATask(id=context.task_id, status="failed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        await event_queue.put(A2ATask(id=context.task_id, status="cancelled"))


async def main():
    server = A2AServer(
        agent_executor=TaskAgentExecutor(),
        agent_name="Task Agent",
        agent_description="Manages tasks and to-do lists",
        agent_capabilities={
            "streaming": False,
            "multiTurn": True,
            "features": ["task_management", "task_creation", "task_completion"]
        },
        port=9003
    )

    print("Task Agent starting on port 9003...")
    print("Agent Card: http://localhost:9003/.well-known/agent.json")
    await server.start()


if __name__ == "__main__":
    asyncio.run(main())
```

## Step 4: Create Coordinator (Personal Assistant)

Create `personal_assistant.py`:

```python
import asyncio
import httpx
from uuid import uuid4
from a2a.client import A2AClient
from a2a.types import SendMessageRequest, MessageSendParams


class PersonalAssistant:
    """Coordinator that discovers and uses distributed agents."""

    def __init__(self):
        self.agents = {}
        self.httpx_client = None

    async def discover_agents(self):
        """Discover available A2A agents."""
        print("Discovering agents...")

        agent_urls = {
            "calendar": "http://localhost:9001",
            "email": "http://localhost:9002",
            "task": "http://localhost:9003"
        }

        self.httpx_client = httpx.AsyncClient(timeout=30.0)

        for name, url in agent_urls.items():
            try:
                # Get agent card
                response = await self.httpx_client.get(f"{url}/.well-known/agent.json")
                agent_card = response.json()

                # Create A2A client
                client = await A2AClient.get_client_from_agent_card_url(
                    self.httpx_client,
                    url
                )

                self.agents[name] = {
                    "client": client,
                    "info": agent_card
                }

                print(f"  ✓ Discovered {name}: {agent_card['name']}")

            except Exception as e:
                print(f"  ✗ Failed to discover {name}: {e}")

        print(f"\nDiscovered {len(self.agents)} agents\n")

    async def send_to_agent(self, agent_name: str, message: str) -> str:
        """Send message to a specific agent."""
        if agent_name not in self.agents:
            return f"Error: Agent '{agent_name}' not found"

        try:
            client = self.agents[agent_name]["client"]

            request = SendMessageRequest(
                params=MessageSendParams(
                    message={
                        "role": "user",
                        "parts": [{"type": "text", "text": message}],
                        "messageId": uuid4().hex
                    }
                )
            )

            response = await client.send_message(request)

            # Extract text from response
            if hasattr(response, 'message') and response.message:
                if hasattr(response.message, 'parts') and response.message.parts:
                    return response.message.parts[0].text

            return str(response)

        except Exception as e:
            return f"Error communicating with {agent_name}: {e}"

    async def handle_request(self, user_input: str) -> str:
        """Route request to appropriate agent(s)."""

        # Simple routing logic (could be made smarter with an LLM)
        if any(word in user_input.lower() for word in ["calendar", "schedule", "meeting", "event"]):
            agent = "calendar"
        elif any(word in user_input.lower() for word in ["email", "message", "send"]):
            agent = "email"
        elif any(word in user_input.lower() for word in ["task", "todo", "complete"]):
            agent = "task"
        else:
            # Complex request - try to handle with multiple agents
            return await self.handle_complex_request(user_input)

        return await self.send_to_agent(agent, user_input)

    async def handle_complex_request(self, user_input: str) -> str:
        """Handle requests that span multiple agents."""

        # Example: "Check my emails and add any action items to my task list"
        responses = []

        # This is simplified - a real implementation would use an LLM to orchestrate
        if "email" in user_input.lower() and "task" in user_input.lower():
            email_response = await self.send_to_agent("email", "Check unread emails")
            responses.append(f"Emails: {email_response}")

            task_response = await self.send_to_agent("task", "List active tasks")
            responses.append(f"Tasks: {task_response}")

            return "\n\n".join(responses)

        return "I'm not sure which agent can help with that. Try being more specific."

    async def run_interactive(self):
        """Run interactive assistant."""
        print("=" * 70)
        print("PERSONAL ASSISTANT (Distributed Multi-Agent System)")
        print("=" * 70)
        print("\nCapabilities:")
        for name, agent_info in self.agents.items():
            print(f"  - {name.title()}: {agent_info['info']['description']}")
        print("\nType 'quit' to exit")
        print("=" * 70)

        while True:
            try:
                user_input = input("\nYou: ").strip()

                if not user_input:
                    continue

                if user_input.lower() in ['quit', 'exit']:
                    print("\nAssistant: Goodbye!")
                    break

                # Special commands
                if user_input.lower() == 'agents':
                    print("\nAvailable agents:")
                    for name in self.agents.keys():
                        print(f"  - {name}")
                    continue

                # Handle request
                response = await self.handle_request(user_input)
                print(f"\nAssistant: {response}")

            except KeyboardInterrupt:
                print("\n\nAssistant: Session ended.")
                break

        # Cleanup
        if self.httpx_client:
            await self.httpx_client.aclose()


async def main():
    assistant = PersonalAssistant()

    # Discover agents
    await assistant.discover_agents()

    if not assistant.agents:
        print("\nNo agents discovered! Make sure agent services are running.")
        print("Start them with:")
        print("  python calendar_agent.py")
        print("  python email_agent.py")
        print("  python task_agent.py")
        return

    # Run interactive assistant
    await assistant.run_interactive()


if __name__ == "__main__":
    asyncio.run(main())
```

## Step 5: Running the Distributed System

**Terminal 1** - Start Calendar Agent:
```bash
python calendar_agent.py
```

**Terminal 2** - Start Email Agent:
```bash
python email_agent.py
```

**Terminal 3** - Start Task Agent:
```bash
python task_agent.py
```

**Terminal 4** - Start Personal Assistant:
```bash
python personal_assistant.py
```

## Testing

**Sample conversation**:
```
Discovering agents...
  ✓ Discovered calendar: Calendar Agent
  ✓ Discovered email: Email Agent
  ✓ Discovered task: Task Agent

Discovered 3 agents

======================================================================
PERSONAL ASSISTANT (Distributed Multi-Agent System)
======================================================================

Capabilities:
  - Calendar: Manages calendar events and scheduling
  - Email: Manages email communications
  - Task: Manages tasks and to-do lists

Type 'quit' to exit
======================================================================

You: What's on my calendar today?
Assistant: You have 2 events today:
1. 10:00 AM - Team Meeting (1 hour)
2. 2:00 PM - Client Call (30 min)

You: Check my emails
Assistant: You have 3 unread emails:
1. From john@example.com: "Project Update"
2. From sarah@example.com: "Meeting Request"
3. From team@example.com: "Weekly Newsletter"

You: Add a task to review the project update
Assistant: Created medium priority task: 'Review project update'

You: agents
Available agents:
  - calendar
  - email
  - task

You: quit
Assistant: Goodbye!
```

## Step 6: Add LLM-Based Orchestration

Enhance coordinator with intelligent routing:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import tool


class SmartPersonalAssistant(PersonalAssistant):
    """Personal assistant with LLM-based orchestration."""

    def __init__(self):
        super().__init__()
        self.orchestrator = None

    async def initialize_orchestrator(self):
        """Create orchestrator agent after discovering services."""

        # Create tools for each discovered agent
        async def call_calendar(action: str) -> str:
            """Interact with calendar agent."""
            return await self.send_to_agent("calendar", action)

        async def call_email(action: str) -> str:
            """Interact with email agent."""
            return await self.send_to_agent("email", action)

        async def call_task(action: str) -> str:
            """Interact with task agent."""
            return await self.send_to_agent("task", action)

        # Create orchestrator
        self.orchestrator = LlmAgent(
            name="orchestrator",
            model="gemini-2.5-flash",
            instruction=f"""You are a personal assistant coordinator.

            Available services:
            - Calendar Agent: Manages calendar events and scheduling
            - Email Agent: Manages email communications
            - Task Agent: Manages tasks and to-do lists

            Route user requests to the appropriate service(s).
            Coordinate multiple services when needed.
            Provide helpful, clear responses.""",
            tools=[call_calendar, call_email, call_task]
        )

    async def handle_request(self, user_input: str) -> str:
        """Use LLM to handle request intelligently."""
        if self.orchestrator:
            response = await self.orchestrator.arun(input=user_input)
            return response.text
        else:
            return await super().handle_request(user_input)


# Use the smart assistant
async def main():
    assistant = SmartPersonalAssistant()
    await assistant.discover_agents()

    if assistant.agents:
        await assistant.initialize_orchestrator()
        await assistant.run_interactive()


if __name__ == "__main__":
    asyncio.run(main())
```

## Troubleshooting

### Agent discovery fails
- Ensure all agent services are running
- Check port numbers match (9001, 9002, 9003)
- Verify no firewall blocking localhost ports

### Communication timeouts
- Increase httpx timeout in A2AClient creation
- Check agent services are responding
- Look for errors in agent service logs

### Agents not responding correctly
- Verify A2A server is running (check agent logs)
- Test agent directly: `curl http://localhost:9001/.well-known/agent.json`
- Check AgentExecutor error handling

### Coordinator routing to wrong agent
- Improve routing logic in handle_request()
- Use LLM-based orchestration for smarter routing
- Add more specific keywords for each agent type

## Key Takeaways

1. **Independence**: Each agent is a separate service
2. **Discovery**: Agents can be discovered via A2A protocol
3. **Scalability**: Agents can be scaled independently
4. **Resilience**: System continues if one agent fails
5. **Flexibility**: Easy to add new agents to ecosystem

## Next Steps

**Continue to**: [Production Deployment](production-deployment.md)

Learn how to:
- Deploy distributed agents to cloud infrastructure
- Add monitoring and observability
- Implement authentication and security
- Scale agents based on load
- Create production-grade systems

**Extend this example**:
- Add more agents (weather, news, notifications)
- Implement agent health monitoring
- Add authentication between agents
- Create agent registry service
- Build web dashboard for agent management

## Related Documentation

- **[a2a Protocol](../../a2a/SKILL.md)** - Complete A2A documentation
- **[ADK Integration](../../a2a/references/adk-integration.md)** - ADK + A2A patterns
- **[google-adk](../../google-adk/SKILL.md)** - ADK documentation

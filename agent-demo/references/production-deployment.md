# Production Deployment

**Level**: Production Systems (Level 5)
**Complexity**: Production
**Skills**: [vertex-ai](../../vertex-ai/SKILL.md), [google-adk](../../google-adk/SKILL.md), [vertex-agent-engine](../../vertex-agent-engine/SKILL.md), [a2a](../../a2a/SKILL.md)

## Overview

Deploy a production-ready multi-agent system to Google Cloud. You'll learn how to:
- Deploy ADK agents to Vertex AI Agent Engine
- Implement monitoring and observability
- Add authentication and security
- Scale agents based on load
- Expose A2A endpoints for external integration
- Handle production failures gracefully

**What you'll build**: A production customer service platform with deployed agents, monitoring, and A2A API access.

## Architecture

```
External Clients
       ↓
   Load Balancer
       ↓
  A2A Gateway (Cloud Run)
       ↓
 ┌─────┴─────┐
 ↓           ↓
Agent Engine Instances
 ├─ Customer Service Agent (managed)
 ├─ Order Agent (managed)
 ├─ Product Agent (managed)
 └─ Support Agent (managed)
       ↓
Cloud Monitoring & Logging
```

**Production Features**:
- Auto-scaling based on demand
- Session persistence with Memory Bank
- Monitoring and alerting
- A2A protocol endpoints
- Authentication and rate limiting
- Error recovery and retries

## Prerequisites

Before starting, ensure your environment is set up. See the [Setup Guide](setup.md) for detailed instructions, or run:

```bash
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID
python scripts/validate_environment.py
```

For this example, you'll need:
```bash
pip install google-adk google-cloud-aiplatform[agent_engines] a2a-sdk
export PROJECT_ID="your-project-id"

# Enable additional APIs for production
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable monitoring.googleapis.com
```

## Step 1: Build Production-Ready Agent

Create `production_agent.py`:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search, tool
from google.cloud import aiplatform
from google import genai
import os


# Production tools with error handling
@tool
def lookup_order(order_id: str) -> dict:
    """Look up customer order.

    Args:
        order_id: Order identifier

    Returns:
        Order details or error
    """
    try:
        # In production, this would query a database
        orders = {
            "ORD-001": {
                "status": "shipped",
                "items": ["Widget Pro"],
                "total": 299.99,
                "tracking": "TRACK123"
            }
        }
        result = orders.get(order_id, {"error": "Order not found"})

        # Log access for monitoring
        print(f"Order lookup: {order_id} - {'found' if 'error' not in result else 'not found'}")

        return result

    except Exception as e:
        print(f"Error in lookup_order: {e}")
        return {"error": f"System error: {str(e)}"}


@tool
def create_support_ticket(
    issue: str,
    priority: str = "normal",
    customer_id: str = None
) -> dict:
    """Create support ticket.

    Args:
        issue: Issue description
        priority: Priority level
        customer_id: Customer identifier (optional)

    Returns:
        Ticket details or error
    """
    try:
        import random
        ticket_id = f"TKT-{random.randint(1000, 9999)}"

        ticket = {
            "id": ticket_id,
            "issue": issue,
            "priority": priority,
            "customer_id": customer_id,
            "status": "open",
            "created": "2024-01-15T10:00:00Z"
        }

        print(f"Support ticket created: {ticket_id} ({priority})")

        return ticket

    except Exception as e:
        print(f"Error creating ticket: {e}")
        return {"error": f"Failed to create ticket: {str(e)}"}


@tool
def search_knowledge_base(query: str) -> str:
    """Search internal knowledge base.

    Args:
        query: Search query

    Returns:
        Relevant documentation or error
    """
    try:
        kb = {
            "shipping": "Free shipping on orders over $50. Standard delivery: 3-5 business days.",
            "returns": "30-day return policy. Items must be unused and in original packaging.",
            "warranty": "1-year manufacturer warranty on all products.",
            "payment": "We accept all major credit cards and PayPal."
        }

        for key, value in kb.items():
            if key in query.lower():
                print(f"KB search: {query} - found {key}")
                return value

        print(f"KB search: {query} - no results")
        return "No matching documentation found. Please contact support."

    except Exception as e:
        print(f"Error searching KB: {e}")
        return f"Search error: {str(e)}"


# Create production agent
production_agent = LlmAgent(
    name="customer_service_agent",
    model="gemini-2.5-flash",
    instruction="""You are a professional customer service agent.

    Capabilities:
    - lookup_order: Check order status and details
    - create_support_ticket: Escalate issues to support team
    - search_knowledge_base: Find policy and procedure information
    - google_search: Research product information

    Guidelines:
    - Be professional, helpful, and empathetic
    - Always verify order IDs before looking them up
    - Create tickets for complex issues
    - Cite knowledge base sources
    - Handle errors gracefully

    For security:
    - Never share sensitive customer data
    - Don't process payment information
    - Escalate suspicious requests""",
    tools=[lookup_order, create_support_ticket, search_knowledge_base, google_search],
    config={
        "temperature": 0.3,  # More consistent responses
        "max_output_tokens": 1024
    }
)


def test_locally():
    """Test agent locally before deployment."""
    print("Testing agent locally...")
    print("=" * 70)

    test_cases = [
        "What's the status of order ORD-001?",
        "What's your return policy?",
        "My order arrived damaged, I need help",
        "Do you have wireless headphones?"
    ]

    for query in test_cases:
        print(f"\nUser: {query}")
        response = production_agent.run(input=query)
        print(f"Agent: {response.text}")
        print("-" * 70)


if __name__ == "__main__":
    test_locally()
```

## Step 2: Deploy to Vertex AI Agent Engine

Create `deploy.py`:

```python
from google.cloud import aiplatform
from google import genai
import os

# Import the production agent
from production_agent import production_agent


def deploy_agent():
    """Deploy agent to Vertex AI Agent Engine."""

    PROJECT_ID = os.getenv("PROJECT_ID")
    LOCATION = "us-central1"

    print(f"Deploying to project: {PROJECT_ID}, location: {LOCATION}")

    # Initialize Vertex AI
    aiplatform.init(project=PROJECT_ID, location=LOCATION)

    # Create client
    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

    print("\nDeploying agent to Vertex AI Agent Engine...")
    print("This may take 5-10 minutes...")

    # Deploy agent
    remote_agent = client.agent_engines.create(
        production_agent,
        config={
            "requirements": [
                "google-adk",
                "google-cloud-aiplatform[agent_engines]",
                "a2a-sdk[http-server]"
            ],
            "environment_variables": {
                "ENV": "production",
                "LOG_LEVEL": "INFO"
            },
            "machine_type": "n1-standard-4",  # Adjust based on load
        },
    )

    print(f"\n✓ Agent deployed successfully!")
    print(f"Resource name: {remote_agent.resource_name}")
    print(f"Agent ID: {remote_agent.resource_name.split('/')[-1]}")

    return remote_agent


def test_deployed_agent(remote_agent):
    """Test the deployed agent."""
    print("\nTesting deployed agent...")
    print("=" * 70)

    test_queries = [
        "Check order ORD-001",
        "What's your shipping policy?"
    ]

    for query in test_queries:
        print(f"\nUser: {query}")
        response = remote_agent.query(query)
        print(f"Agent: {response.text}")


if __name__ == "__main__":
    remote_agent = deploy_agent()
    test_deployed_agent(remote_agent)
```

**Deploy**:
```bash
export PROJECT_ID="your-project-id"
python deploy.py
```

## Step 3: Add Monitoring and Logging

Create `monitoring.py`:

```python
from google.cloud import monitoring_v3
from google.cloud import logging as cloud_logging
import time


class AgentMonitoring:
    """Monitor deployed agent performance."""

    def __init__(self, project_id: str):
        self.project_id = project_id
        self.metric_client = monitoring_v3.MetricServiceClient()
        self.logging_client = cloud_logging.Client(project=project_id)
        self.logger = self.logging_client.logger("agent-monitoring")

    def log_request(self, query: str, response: str, latency_ms: float, error: str = None):
        """Log agent request for analysis."""

        log_entry = {
            "query": query,
            "response_length": len(response) if response else 0,
            "latency_ms": latency_ms,
            "timestamp": time.time(),
            "error": error
        }

        if error:
            self.logger.log_struct(log_entry, severity="ERROR")
        else:
            self.logger.log_struct(log_entry, severity="INFO")

    def create_custom_metric(self, metric_name: str, value: float):
        """Create custom metric for dashboard."""

        project_name = f"projects/{self.project_id}"

        series = monitoring_v3.TimeSeries()
        series.metric.type = f"custom.googleapis.com/agent/{metric_name}"

        point = monitoring_v3.Point()
        point.value.double_value = value
        now = time.time()
        point.interval.end_time.seconds = int(now)
        point.interval.end_time.nanos = int((now - int(now)) * 10**9)

        series.points = [point]

        self.metric_client.create_time_series(
            name=project_name,
            time_series=[series]
        )

    def track_agent_query(self, remote_agent, query: str):
        """Track a query with monitoring."""

        start_time = time.time()
        error = None
        response_text = ""

        try:
            response = remote_agent.query(query)
            response_text = response.text

        except Exception as e:
            error = str(e)
            response_text = ""

        latency_ms = (time.time() - start_time) * 1000

        # Log the request
        self.log_request(query, response_text, latency_ms, error)

        # Create metrics
        self.create_custom_metric("response_latency", latency_ms)
        self.create_custom_metric("request_count", 1)

        if error:
            self.create_custom_metric("error_count", 1)

        return response_text if not error else f"Error: {error}"


# Usage example
def monitor_production_agent(remote_agent, project_id):
    """Monitor production agent."""

    monitor = AgentMonitoring(project_id)

    test_queries = [
        "What's the status of order ORD-001?",
        "What's your return policy?",
        "I need help with my order"
    ]

    print("Running monitored queries...")

    for query in test_queries:
        print(f"\nQuery: {query}")
        response = monitor.track_agent_query(remote_agent, query)
        print(f"Response: {response}")

    print("\n✓ Monitoring data sent to Cloud Monitoring and Logging")
    print(f"View logs: https://console.cloud.google.com/logs/query?project={project_id}")
```

## Step 4: Add A2A Gateway

Create `a2a_gateway.py` for external A2A access:

```python
import asyncio
import os
from google.cloud import aiplatform
from google import genai
from a2a.server import A2AServer
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_context import RequestContext
from a2a.server.event_queue import EventQueue
from a2a.types import Message, Part, Task


class VertexAgentExecutor(AgentExecutor):
    """A2A executor for Vertex AI deployed agent."""

    def __init__(self, agent_id: str, project_id: str, location: str = "us-central1"):
        self.agent_id = agent_id
        self.project_id = project_id
        self.location = location

        # Initialize Vertex AI
        aiplatform.init(project=project_id, location=location)
        self.client = genai.Client(vertexai=True, project=project_id, location=location)

        # Get deployed agent
        self.remote_agent = self.client.agent_engines.get(
            f"projects/{project_id}/locations/{location}/reasoning_engines/{agent_id}"
        )

    async def execute(self, context: RequestContext, event_queue: EventQueue):
        """Execute request on Vertex AI agent."""
        try:
            user_message = context.message.parts[0].text

            # Query deployed agent
            response = self.remote_agent.query(user_message)

            # Send response via A2A
            await event_queue.put(Message(
                role="agent",
                parts=[Part(type="text", text=response.text)]
            ))

            # Complete task
            await event_queue.put(Task(id=context.task_id, status="completed"))

        except Exception as e:
            print(f"Error: {e}")
            await event_queue.put(Task(id=context.task_id, status="failed"))

    async def cancel(self, context: RequestContext, event_queue: EventQueue):
        """Handle cancellation."""
        await event_queue.put(Task(id=context.task_id, status="cancelled"))


async def start_a2a_gateway(agent_id: str, project_id: str):
    """Start A2A gateway for deployed agent."""

    print(f"Starting A2A Gateway for agent {agent_id}...")

    server = A2AServer(
        agent_executor=VertexAgentExecutor(agent_id, project_id),
        agent_name="Production Customer Service",
        agent_description="Production-deployed customer service agent with order management and support",
        agent_capabilities={
            "streaming": False,
            "multiTurn": True,
            "features": ["order_lookup", "support_tickets", "knowledge_base"],
            "deployment": "vertex-ai-agent-engine"
        },
        port=int(os.getenv("PORT", "8080"))
    )

    print(f"A2A Gateway running on port {os.getenv('PORT', '8080')}")
    print(f"Agent Card: http://localhost:{os.getenv('PORT', '8080')}/.well-known/agent.json")

    await server.start()


if __name__ == "__main__":
    # Get from environment
    AGENT_ID = os.getenv("AGENT_ID")
    PROJECT_ID = os.getenv("PROJECT_ID")

    if not AGENT_ID or not PROJECT_ID:
        print("Error: Set AGENT_ID and PROJECT_ID environment variables")
        exit(1)

    asyncio.run(start_a2a_gateway(AGENT_ID, PROJECT_ID))
```

## Step 5: Deploy A2A Gateway to Cloud Run

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY a2a_gateway.py .

# Run gateway
CMD ["python", "a2a_gateway.py"]
```

Create `requirements.txt`:

```
google-cloud-aiplatform[agent_engines]>=1.112
google-genai
a2a-sdk[http-server]
```

**Deploy to Cloud Run**:

```bash
# Set variables
export PROJECT_ID="your-project-id"
export AGENT_ID="your-agent-id"  # From Step 2
export REGION="us-central1"

# Build and deploy
gcloud run deploy agent-a2a-gateway \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=$PROJECT_ID,AGENT_ID=$AGENT_ID \
  --memory 512Mi \
  --timeout 300

# Get the URL
gcloud run services describe agent-a2a-gateway \
  --region $REGION \
  --format 'value(status.url)'
```

## Step 6: Production Management

Create `manage.py` for managing deployed agents:

```python
from google.cloud import aiplatform
from google import genai
import os


class AgentManager:
    """Manage production agents."""

    def __init__(self, project_id: str, location: str = "us-central1"):
        self.project_id = project_id
        self.location = location
        aiplatform.init(project=project_id, location=location)
        self.client = genai.Client(vertexai=True, project=project_id, location=location)

    def list_agents(self):
        """List all deployed agents."""
        print("\nDeployed Agents:")
        print("=" * 70)

        agents = self.client.agent_engines.list()

        for i, agent in enumerate(agents, 1):
            print(f"\n{i}. {agent.resource_name}")
            print(f"   Created: {agent.create_time}")
            print(f"   Model: {getattr(agent, 'model', 'N/A')}")

        return list(agents)

    def get_agent_details(self, agent_id: str):
        """Get detailed agent information."""
        resource_name = f"projects/{self.project_id}/locations/{self.location}/reasoning_engines/{agent_id}"

        agent = self.client.agent_engines.get(resource_name)

        print(f"\nAgent Details:")
        print(f"  Resource: {agent.resource_name}")
        print(f"  Created: {agent.create_time}")
        print(f"  Updated: {agent.update_time}")

        return agent

    def update_agent(self, agent_id: str, config: dict):
        """Update agent configuration."""
        resource_name = f"projects/{self.project_id}/locations/{self.location}/reasoning_engines/{agent_id}"

        print(f"\nUpdating agent {agent_id}...")

        updated_agent = self.client.agent_engines.update(
            resource_name,
            config=config
        )

        print("✓ Agent updated successfully")
        return updated_agent

    def delete_agent(self, agent_id: str):
        """Delete a deployed agent."""
        resource_name = f"projects/{self.project_id}/locations/{self.location}/reasoning_engines/{agent_id}"

        print(f"\nDeleting agent {agent_id}...")
        confirm = input("Are you sure? (yes/no): ")

        if confirm.lower() == "yes":
            self.client.agent_engines.delete(resource_name)
            print("✓ Agent deleted successfully")
        else:
            print("Deletion cancelled")


# CLI interface
if __name__ == "__main__":
    import sys

    PROJECT_ID = os.getenv("PROJECT_ID")
    if not PROJECT_ID:
        print("Error: Set PROJECT_ID environment variable")
        exit(1)

    manager = AgentManager(PROJECT_ID)

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python manage.py list")
        print("  python manage.py details <agent_id>")
        print("  python manage.py delete <agent_id>")
        exit(1)

    command = sys.argv[1]

    if command == "list":
        manager.list_agents()

    elif command == "details" and len(sys.argv) == 3:
        manager.get_agent_details(sys.argv[2])

    elif command == "delete" and len(sys.argv) == 3:
        manager.delete_agent(sys.argv[2])

    else:
        print(f"Unknown command: {command}")
```

**Usage**:
```bash
# List agents
python manage.py list

# Get agent details
python manage.py details <agent-id>

# Delete agent
python manage.py delete <agent-id>
```

## Testing Production System

```bash
# Test A2A endpoint
curl https://your-gateway-url/.well-known/agent.json

# Send test message
curl -X POST https://your-gateway-url/a2a/v1/message \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "message": {
        "role": "user",
        "parts": [{"type": "text", "text": "What is order ORD-001 status?"}],
        "messageId": "test-123"
      }
    }
  }'
```

## Monitoring Production

**View logs**:
```bash
# Agent Engine logs
gcloud logging read "resource.type=aiplatform.googleapis.com/Endpoint" \
  --limit 50 \
  --format json

# Cloud Run logs (A2A Gateway)
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --format json
```

**View metrics**:
```bash
# Open Cloud Console
echo "https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
```

## Troubleshooting

### Deployment fails
- Check API quotas in Cloud Console
- Verify billing is enabled
- Ensure all required APIs are enabled
- Check IAM permissions for service account

### Agent not responding
- Check Agent Engine logs for errors
- Verify agent is in READY state
- Test with simple query first
- Check network connectivity

### A2A Gateway issues
- Verify Cloud Run service is running
- Check environment variables are set
- Test gateway health endpoint
- Review Cloud Run logs

### High latency
- Consider upgrading machine type
- Enable auto-scaling
- Optimize tool implementations
- Use caching where appropriate

## Key Takeaways

1. **Managed infrastructure**: Agent Engine handles scaling and reliability
2. **Monitoring**: Essential for production systems
3. **A2A integration**: Enables external system integration
4. **Security**: Authentication and access control required
5. **Cost optimization**: Choose appropriate machine types and scaling policies

## Best Practices

1. **Test locally first** before deploying
2. **Monitor everything** - logs, metrics, errors
3. **Implement retries** for transient failures
4. **Use sessions** for conversation continuity
5. **Version your agents** for safe updates
6. **Set up alerts** for critical failures
7. **Document APIs** for consumers
8. **Implement rate limiting** to prevent abuse

## Production Checklist

- [ ] Agent tested locally
- [ ] Deployed to Agent Engine
- [ ] Monitoring configured
- [ ] Logging enabled
- [ ] A2A gateway deployed
- [ ] Authentication implemented
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Documentation written
- [ ] Alerts configured
- [ ] Backup strategy defined
- [ ] Scaling policy set

## Next Steps

**You've completed all examples!**

You now know how to:
- Use Vertex AI SDK for direct model access
- Build agents with ADK framework
- Create multi-agent systems
- Deploy distributed agent ecosystems
- Run production systems on Google Cloud

**Further learning**:
- Explore advanced ADK features
- Build custom tools for your domain
- Implement complex multi-agent workflows
- Optimize for cost and performance
- Add advanced security features

## Related Documentation

- **[vertex-agent-engine](../../vertex-agent-engine/SKILL.md)** - Complete deployment guide
- **[google-adk](../../google-adk/SKILL.md)** - ADK documentation
- **[a2a](../../a2a/SKILL.md)** - A2A protocol documentation
- **[Cloud Monitoring](https://cloud.google.com/monitoring/docs)** - Monitoring and logging

# Multi-Agent System

**Level**: Multi-Agent Systems (Level 3)
**Complexity**: Advanced
**Skills**: [vertex-ai](../../vertex-ai/SKILL.md), [google-adk](../../google-adk/SKILL.md)

## Overview

Build a multi-agent system using ADK's sub-agents feature. You'll learn how to:
- Design hierarchical agent systems
- Create specialized agents for specific tasks
- Coordinate agents automatically with a controller
- Share context across agents
- Optimize multi-agent workflows

**What you'll build**: An e-commerce customer service system with specialized agents for orders, products, and support.

## Architecture

```
                    Customer Input
                          ↓
                  ┌───────────────┐
                  │  Coordinator  │ (Routes requests)
                  └───────┬───────┘
                          ↓
            ┌─────────────┼─────────────┐
            ↓             ↓             ↓
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │  Order   │  │ Product  │  │ Support  │
     │  Agent   │  │  Agent   │  │  Agent   │
     └──────────┘  └──────────┘  └──────────┘
          ↓              ↓             ↓
      Order DB      Product DB    Ticket System
```

**Components**:
- Coordinator agent (routing and delegation)
- Order management agent (order lookup, tracking)
- Product information agent (search, recommendations)
- Support agent (FAQs, ticket creation)
- Shared conversation context

## Prerequisites

Before starting, ensure your environment is set up. See the [Setup Guide](setup.md) for detailed instructions, or run:

```bash
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID
python scripts/validate_environment.py
```

For this example, you'll need:
```bash
pip install google-adk
```

## Step 1: Define Specialized Agents

Create `multi_agent_system.py`:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import tool, google_search

# Define custom tools for each agent

# Order Agent Tools
@tool
def lookup_order(order_id: str) -> dict:
    """Look up order details.

    Args:
        order_id: Order identifier

    Returns:
        Order details including status, items, shipping
    """
    orders = {
        "ORD-001": {
            "status": "shipped",
            "items": ["Smart Widget Pro", "USB Cable"],
            "total": 349.98,
            "tracking": "TRACK123",
            "estimated_delivery": "2024-01-15"
        },
        "ORD-002": {
            "status": "processing",
            "items": ["Classic Gadget"],
            "total": 49.99,
            "tracking": None,
            "estimated_delivery": "2024-01-18"
        }
    }
    return orders.get(order_id, {"error": "Order not found"})


@tool
def cancel_order(order_id: str, reason: str) -> str:
    """Cancel an order.

    Args:
        order_id: Order to cancel
        reason: Cancellation reason

    Returns:
        Cancellation confirmation
    """
    # Mock implementation
    return f"Order {order_id} cancelled. Reason: {reason}. Refund will be processed in 3-5 business days."


# Product Agent Tools
@tool
def search_products(query: str, category: str = "all") -> list:
    """Search product catalog.

    Args:
        query: Search query
        category: Product category filter

    Returns:
        List of matching products
    """
    products = [
        {"id": "PROD-001", "name": "Smart Widget Pro", "price": 299.99, "stock": 42, "category": "electronics"},
        {"id": "PROD-002", "name": "Classic Gadget", "price": 49.99, "stock": 0, "category": "accessories"},
        {"id": "PROD-003", "name": "Premium Headphones", "price": 199.99, "stock": 15, "category": "electronics"}
    ]

    results = []
    for product in products:
        if query.lower() in product["name"].lower():
            if category == "all" or product["category"] == category:
                results.append(product)

    return results


@tool
def get_product_details(product_id: str) -> dict:
    """Get detailed product information.

    Args:
        product_id: Product identifier

    Returns:
        Complete product details
    """
    products = {
        "PROD-001": {
            "name": "Smart Widget Pro",
            "price": 299.99,
            "stock": 42,
            "description": "Advanced smart widget with AI capabilities",
            "rating": 4.5,
            "reviews": 128
        },
        "PROD-002": {
            "name": "Classic Gadget",
            "price": 49.99,
            "stock": 0,
            "description": "Reliable classic gadget for everyday use",
            "rating": 4.0,
            "reviews": 45
        }
    }
    return products.get(product_id, {"error": "Product not found"})


# Support Agent Tools
@tool
def search_faq(question: str) -> str:
    """Search FAQ database.

    Args:
        question: User question

    Returns:
        Relevant FAQ answer
    """
    faqs = {
        "shipping": "Free shipping on orders over $50. Standard shipping takes 3-5 business days.",
        "return": "30-day return window for most items. Electronics have 14-day window.",
        "warranty": "1-year manufacturer warranty on all products.",
        "payment": "We accept all major credit cards, PayPal, and Apple Pay."
    }

    for key, answer in faqs.items():
        if key in question.lower():
            return answer

    return "Please contact support for specific inquiries."


@tool
def create_support_ticket(issue: str, priority: str = "normal") -> str:
    """Create a support ticket.

    Args:
        issue: Issue description
        priority: Priority level (low, normal, high, urgent)

    Returns:
        Ticket confirmation
    """
    import random
    ticket_id = f"TKT-{random.randint(1000, 9999)}"
    return f"Created {priority} priority ticket {ticket_id}: {issue}. Support will respond within 24 hours."


# Create specialized agents
order_agent = LlmAgent(
    name="order_specialist",
    model="gemini-2.5-flash",
    instruction="""You are an order management specialist.

    Handle:
    - Order lookups and tracking
    - Order cancellations
    - Shipping information
    - Order status updates

    Always be clear about order details and next steps.""",
    description="Manages customer orders",
    tools=[lookup_order, cancel_order]
)

product_agent = LlmAgent(
    name="product_specialist",
    model="gemini-2.5-flash",
    instruction="""You are a product information specialist.

    Handle:
    - Product searches and recommendations
    - Product details and specifications
    - Stock availability
    - Pricing information

    Help customers find the right products for their needs.""",
    description="Provides product information",
    tools=[search_products, get_product_details, google_search]
)

support_agent = LlmAgent(
    name="support_specialist",
    model="gemini-2.5-flash",
    instruction="""You are a customer support specialist.

    Handle:
    - General inquiries
    - FAQ questions
    - Issue escalation
    - Support ticket creation

    Be empathetic and solution-oriented.""",
    description="Handles customer support",
    tools=[search_faq, create_support_ticket]
)

print("Specialized agents created successfully!")
```

## Step 2: Create Coordinator Agent

Add the coordinator that routes requests:

```python
# Create coordinator with sub-agents
coordinator = LlmAgent(
    name="customer_service_coordinator",
    model="gemini-2.5-flash",
    instruction="""You are a customer service coordinator managing specialized agents.

    Your team:
    - order_specialist: Handles orders, tracking, cancellations
    - product_specialist: Handles product info, search, recommendations
    - support_specialist: Handles FAQs, general support, tickets

    Routing strategy:
    1. Analyze the customer's request
    2. Delegate to the most appropriate specialist
    3. If request spans multiple areas, coordinate between specialists
    4. Provide clear, helpful responses

    Always be friendly and professional.""",
    description="Coordinates customer service agents",
    sub_agents=[order_agent, product_agent, support_agent]
)

print("Coordinator agent created!")
print("\nMulti-agent system ready.")
```

## Step 3: Test the System

```python
# Test different request types
def test_multi_agent_system():
    """Test the multi-agent system with various requests."""

    test_cases = [
        # Order-related
        "What's the status of my order ORD-001?",

        # Product-related
        "Do you have any headphones in stock?",

        # Support-related
        "What's your return policy?",

        # Complex - spans multiple agents
        "I want to cancel order ORD-002 and order the Smart Widget Pro instead. Is it in stock?"
    ]

    print("\n" + "=" * 70)
    print("MULTI-AGENT SYSTEM TEST")
    print("=" * 70)

    for i, request in enumerate(test_cases, 1):
        print(f"\n[Test {i}]")
        print(f"Customer: {request}")
        print("-" * 70)

        response = coordinator.run(input=request)
        print(f"Coordinator: {response.text}")
        print("=" * 70)


if __name__ == "__main__":
    test_multi_agent_system()
```

**Expected output**:
```
[Test 1]
Customer: What's the status of my order ORD-001?
----------------------------------------------------------------------
Coordinator: Your order ORD-001 has been shipped! Here are the details:
- Items: Smart Widget Pro, USB Cable
- Total: $349.98
- Tracking: TRACK123
- Estimated Delivery: January 15, 2024
======================================================================

[Test 2]
Customer: Do you have any headphones in stock?
----------------------------------------------------------------------
Coordinator: Yes! We have Premium Headphones in stock:
- Price: $199.99
- Stock: 15 units available
- Category: Electronics
- Rating: 4.5/5 stars
======================================================================

[Test 3]
Customer: What's your return policy?
----------------------------------------------------------------------
Coordinator: Our return policy is: 30-day return window for most items. Electronics have a 14-day return window.
======================================================================

[Test 4]
Customer: I want to cancel order ORD-002 and order the Smart Widget Pro instead. Is it in stock?
----------------------------------------------------------------------
Coordinator: I can help you with that!

1. Cancellation: Order ORD-002 cancelled. Refund will be processed in 3-5 business days.

2. New Product: The Smart Widget Pro (PROD-001) is in stock!
   - Price: $299.99
   - Stock: 42 units available
   - Highly rated product (4.5/5 from 128 reviews)

Would you like to proceed with ordering the Smart Widget Pro?
======================================================================
```

## Step 4: Add Session Management

Maintain context across interactions:

```python
from google.adk.sessions import Session

def interactive_customer_service():
    """Interactive customer service with session management."""

    # Create session for this customer
    session = Session(session_id="customer-12345")

    print("\n" + "=" * 70)
    print("CUSTOMER SERVICE SYSTEM")
    print("=" * 70)
    print("Type 'quit' to exit")
    print("=" * 70)

    while True:
        try:
            user_input = input("\nCustomer: ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("\nAgent: Thank you for contacting us. Have a great day!")
                break

            # Use coordinator with session
            response = coordinator.run(input=user_input, session=session)
            print(f"\nAgent: {response.text}")

        except KeyboardInterrupt:
            print("\n\nAgent: Session ended. Thank you!")
            break


if __name__ == "__main__":
    interactive_customer_service()
```

**Sample conversation**:
```
Customer: I placed an order yesterday
Agent: I'd be happy to help! Could you provide your order ID?

Customer: It's ORD-001
Agent: Thank you! Your order ORD-001 has been shipped...

Customer: Great! Actually, I also want to buy headphones
Agent: Excellent! We have Premium Headphones available for $199.99...

Customer: What if I don't like them?
Agent: No problem! Our return policy gives you 14 days for electronics...
```

## Step 5: Advanced Multi-Agent Patterns

Create more sophisticated coordination:

```python
from google.adk.agents import LlmAgent
from google.adk.tools import tool, google_search

# Analytics Agent
@tool
def get_customer_history(customer_id: str) -> dict:
    """Get customer purchase history and preferences."""
    return {
        "total_orders": 5,
        "favorite_category": "electronics",
        "average_order_value": 250.00,
        "loyalty_tier": "gold"
    }


@tool
def generate_recommendations(customer_id: str, category: str = "all") -> list:
    """Generate personalized product recommendations."""
    return [
        {"product": "Premium Headphones", "reason": "Based on your electronics purchases"},
        {"product": "Smart Widget Pro 2", "reason": "Upgrade to your previous purchase"}
    ]


analytics_agent = LlmAgent(
    name="analytics_specialist",
    model="gemini-2.5-flash",
    instruction="""You analyze customer data and provide insights.

    Provide:
    - Purchase history analysis
    - Personalized recommendations
    - Customer value insights

    Use data to enhance customer experience.""",
    description="Analyzes customer data",
    tools=[get_customer_history, generate_recommendations]
)

# Enhanced coordinator with analytics
enhanced_coordinator = LlmAgent(
    name="enhanced_coordinator",
    model="gemini-2.5-pro",  # Use Pro for better coordination
    instruction="""You are an advanced customer service coordinator.

    Your team:
    - order_specialist: Order management
    - product_specialist: Product information
    - support_specialist: General support
    - analytics_specialist: Customer insights and recommendations

    Advanced features:
    - Use analytics to personalize responses
    - Proactively suggest relevant products
    - Consider customer history in recommendations
    - Coordinate complex multi-step requests

    Always provide exceptional, personalized service.""",
    description="Advanced customer service coordinator",
    sub_agents=[order_agent, product_agent, support_agent, analytics_agent]
)


# Test advanced coordination
def test_advanced_system():
    """Test advanced multi-agent coordination."""

    # Complex request requiring multiple agents
    request = "Show me my order history and recommend products I might like"

    print("\n" + "=" * 70)
    print("ADVANCED MULTI-AGENT COORDINATION")
    print("=" * 70)
    print(f"\nCustomer: {request}")
    print("-" * 70)

    response = enhanced_coordinator.run(input=request)
    print(f"Coordinator: {response.text}")


if __name__ == "__main__":
    test_advanced_system()
```

## Step 6: Performance Monitoring

Track agent performance:

```python
import time
from typing import Dict, List


class MultiAgentMonitor:
    """Monitor multi-agent system performance."""

    def __init__(self):
        self.metrics = {
            "total_requests": 0,
            "agent_usage": {},
            "avg_response_time": 0,
            "request_history": []
        }

    def track_request(self, request: str, agent_used: str, response_time: float):
        """Track a request and response."""
        self.metrics["total_requests"] += 1

        if agent_used not in self.metrics["agent_usage"]:
            self.metrics["agent_usage"][agent_used] = 0
        self.metrics["agent_usage"][agent_used] += 1

        self.metrics["request_history"].append({
            "request": request,
            "agent": agent_used,
            "response_time": response_time
        })

        # Update average response time
        total_time = sum(r["response_time"] for r in self.metrics["request_history"])
        self.metrics["avg_response_time"] = total_time / self.metrics["total_requests"]

    def get_report(self) -> str:
        """Generate performance report."""
        report = "\n" + "=" * 70
        report += "\nMULTI-AGENT SYSTEM PERFORMANCE REPORT"
        report += "\n" + "=" * 70

        report += f"\n\nTotal Requests: {self.metrics['total_requests']}"
        report += f"\nAverage Response Time: {self.metrics['avg_response_time']:.2f}s"

        report += "\n\nAgent Usage:"
        for agent, count in self.metrics["agent_usage"].items():
            percentage = (count / self.metrics["total_requests"]) * 100
            report += f"\n  - {agent}: {count} ({percentage:.1f}%)"

        return report


# Test with monitoring
def test_with_monitoring():
    """Test system with performance monitoring."""

    monitor = MultiAgentMonitor()

    test_requests = [
        "Track my order ORD-001",
        "Show me headphones",
        "What's your return policy?",
        "Cancel order ORD-002",
        "Search for electronics under $200"
    ]

    for request in test_requests:
        start_time = time.time()

        response = coordinator.run(input=request)

        response_time = time.time() - start_time

        # Determine which agent was likely used (simplified)
        agent_used = "coordinator"
        if "order" in request.lower():
            agent_used = "order_specialist"
        elif "product" in request.lower() or "search" in request.lower():
            agent_used = "product_specialist"
        elif "policy" in request.lower() or "help" in request.lower():
            agent_used = "support_specialist"

        monitor.track_request(request, agent_used, response_time)

        print(f"\nRequest: {request}")
        print(f"Response time: {response_time:.2f}s")
        print(f"Agent: {agent_used}")

    # Print report
    print(monitor.get_report())


if __name__ == "__main__":
    test_with_monitoring()
```

## Troubleshooting

### Agents not coordinating properly
- Check coordinator instruction clearly defines routing logic
- Verify sub-agent descriptions are clear
- Ensure tools don't overlap between agents

### Wrong agent being selected
- Improve coordinator instruction with specific routing rules
- Make sub-agent descriptions more distinct
- Add examples to coordinator instruction

### Slow multi-agent responses
- Use gemini-2.5-flash for sub-agents (faster)
- Use gemini-2.5-pro only for coordinator if needed
- Minimize tool complexity

### Context not shared between agents
- Use same Session object across all calls
- Ensure coordinator passes context to sub-agents
- Check that session_id is consistent

## Key Takeaways

1. **Specialization**: Dedicated agents for specific domains
2. **Automatic coordination**: ADK handles agent selection
3. **Shared context**: Session management across agents
4. **Scalable**: Easy to add new specialized agents
5. **Better accuracy**: Specialized agents outperform generalists

## Next Steps

**Continue to**: [Distributed Agents with A2A](distributed-agents.md)

Learn how to:
- Deploy agents as independent services
- Use A2A protocol for agent communication
- Implement agent discovery
- Build distributed multi-agent ecosystems

**Extend this example**:
- Add more specialized agents (billing, inventory, shipping)
- Implement agent handoff protocols
- Create agent performance dashboard
- Add multi-language support

## Related Documentation

- **[google-adk](../../google-adk/SKILL.md)** - Complete ADK documentation
- **[Agents](../../google-adk/references/agents.md)** - Multi-agent patterns
- **[Advanced Features](../../google-adk/references/advanced.md)** - Sessions and context

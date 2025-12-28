# Basic SDK Agent

**Level**: Foundation (Level 1)
**Complexity**: Foundation
**Skills**: [vertex-ai](../../vertex-ai/SKILL.md)

## Overview

Build your first AI agent using the Vertex AI SDK. You'll learn how to:
- Make direct API calls to Gemini models
- Handle text and image inputs
- Use function calling for tool integration
- Implement basic error handling

**What you'll build**: A customer support bot that answers questions and analyzes product images.

## Architecture

```
User Input → Vertex AI SDK → Gemini Model → Response
                ↓
         Function Calls (optional)
                ↓
         Custom Tools (weather, inventory)
```

**Components**:
- Gemini 2.5 Flash for fast responses
- Custom functions for weather and inventory lookup
- Error handling for API failures

## Prerequisites

Before starting, ensure your environment is set up. See the [Setup Guide](setup.md) for detailed instructions, or run:

```bash
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID
python scripts/validate_environment.py
```

For this example, you'll need:
```bash
pip install google-genai
export PROJECT_ID="your-project-id"
```

## Step 1: Simple Text Generation

Create `basic_agent.py`:

```python
from google import genai
from google.api_core import exceptions

# Initialize client
client = genai.Client(vertexai=True, location='us-central1')

def chat(message: str) -> str:
    """Send a message and get a response."""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=message,
            config={
                'system_instruction': '''You are a helpful customer support agent.
                Be friendly, concise, and helpful.'''
            }
        )
        return response.text

    except exceptions.ResourceExhausted as e:
        return f"Error: API quota exceeded. Please try again later."

    except exceptions.InvalidArgument as e:
        return f"Error: Invalid request - {e}"

    except Exception as e:
        return f"Error: {e}"

# Test it
if __name__ == "__main__":
    # Simple conversation
    questions = [
        "What are your business hours?",
        "How do I return a product?",
        "Do you offer international shipping?"
    ]

    for question in questions:
        print(f"\nUser: {question}")
        response = chat(question)
        print(f"Agent: {response}")
```

**Run it**:
```bash
python basic_agent.py
```

**Expected output**:
```
User: What are your business hours?
Agent: I'd be happy to help! However, I don't have access to specific business hours...

User: How do I return a product?
Agent: To help you with a return, I need a bit more information...

User: Do you offer international shipping?
Agent: I don't have access to shipping policy information...
```

## Step 2: Image Analysis

Add image understanding capabilities:

```python
from google.genai import types
import base64

def analyze_product_image(image_path: str, question: str) -> str:
    """Analyze a product image and answer questions about it."""
    try:
        # Read image file
        with open(image_path, 'rb') as f:
            image_bytes = f.read()

        # Create multimodal request
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                question,
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type='image/jpeg'  # or image/png
                )
            ],
            config={
                'system_instruction': '''You are a product support specialist.
                Analyze product images and help identify issues or answer questions.'''
            }
        )
        return response.text

    except FileNotFoundError:
        return f"Error: Image file not found at {image_path}"

    except Exception as e:
        return f"Error analyzing image: {e}"

# Test it
if __name__ == "__main__":
    # Test with image (you'll need to provide your own image)
    response = analyze_product_image(
        "product_photo.jpg",
        "What product is this and what condition is it in?"
    )
    print(f"Analysis: {response}")
```

## Step 3: Function Calling (Tool Use)

Add custom tools for the agent to use:

```python
from google.genai.types import GenerateContentConfig

# Define tools
def check_inventory(product_id: str) -> dict:
    """Check product inventory.

    Args:
        product_id: Product identifier

    Returns:
        Inventory information
    """
    # Mock implementation
    inventory = {
        "PROD-001": {"stock": 42, "warehouse": "US-West", "status": "in_stock"},
        "PROD-002": {"stock": 0, "warehouse": "US-East", "status": "out_of_stock"},
        "PROD-003": {"stock": 15, "warehouse": "US-Central", "status": "low_stock"}
    }
    return inventory.get(product_id, {"status": "not_found"})


def get_weather(location: str) -> str:
    """Get current weather for a location.

    Args:
        location: City name

    Returns:
        Weather description
    """
    # Mock implementation
    return f"Weather in {location}: Sunny, 72°F (22°C)"


def chat_with_tools(message: str) -> str:
    """Chat with function calling enabled."""
    try:
        # First request with tools
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=message,
            config=GenerateContentConfig(
                system_instruction='''You are a helpful customer support agent.
                Use available tools to provide accurate information.
                Always check inventory before answering stock questions.''',
                tools=[check_inventory, get_weather]
            )
        )

        # Check if model wants to call a function
        if response.candidates[0].content.parts[0].function_call:
            function_call = response.candidates[0].content.parts[0].function_call

            # Execute the requested function
            if function_call.name == "check_inventory":
                result = check_inventory(**function_call.args)
            elif function_call.name == "get_weather":
                result = get_weather(**function_call.args)
            else:
                result = {"error": "Unknown function"}

            # Send function result back to model
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    message,
                    response.candidates[0].content,  # Model's function call
                    types.Part.from_function_response(
                        name=function_call.name,
                        response={"result": result}
                    )
                ],
                config=GenerateContentConfig(
                    system_instruction='''You are a helpful customer support agent.
                    Use function results to provide accurate information.''',
                    tools=[check_inventory, get_weather]
                )
            )

        return response.text

    except Exception as e:
        return f"Error: {e}"


# Test it
if __name__ == "__main__":
    test_queries = [
        "Do you have PROD-001 in stock?",
        "What's the weather like in Seattle?",
        "Check inventory for PROD-002"
    ]

    for query in test_queries:
        print(f"\nUser: {query}")
        response = chat_with_tools(query)
        print(f"Agent: {response}")
```

**Expected output**:
```
User: Do you have PROD-001 in stock?
Agent: Yes! Product PROD-001 is in stock. We have 42 units available in our US-West warehouse.

User: What's the weather like in Seattle?
Agent: The weather in Seattle is currently sunny with a temperature of 72°F (22°C).

User: Check inventory for PROD-002
Agent: Unfortunately, product PROD-002 is currently out of stock at our US-East warehouse.
```

## Step 4: Complete Support Bot

Put it all together:

```python
from google import genai
from google.genai import types
from google.genai.types import GenerateContentConfig
from google.api_core import exceptions


class SupportBot:
    """Customer support chatbot with tools."""

    def __init__(self):
        self.client = genai.Client(vertexai=True, location='us-central1')
        self.conversation_history = []

    def check_inventory(self, product_id: str) -> dict:
        """Check product inventory."""
        inventory = {
            "PROD-001": {"stock": 42, "warehouse": "US-West", "status": "in_stock"},
            "PROD-002": {"stock": 0, "warehouse": "US-East", "status": "out_of_stock"},
            "PROD-003": {"stock": 15, "warehouse": "US-Central", "status": "low_stock"}
        }
        return inventory.get(product_id, {"status": "not_found"})

    def get_weather(self, location: str) -> str:
        """Get weather information."""
        return f"Weather in {location}: Sunny, 72°F"

    def create_support_ticket(self, issue: str, priority: str = "normal") -> str:
        """Create a support ticket.

        Args:
            issue: Description of the issue
            priority: Priority level (low, normal, high, urgent)
        """
        ticket_id = f"TICKET-{len(self.conversation_history):04d}"
        return f"Created {priority} priority ticket {ticket_id} for: {issue}"

    def chat(self, message: str) -> str:
        """Process a chat message."""
        try:
            # Add to history
            self.conversation_history.append({"role": "user", "content": message})

            # Call model with tools
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=message,
                config=GenerateContentConfig(
                    system_instruction='''You are a friendly customer support agent.
                    Help customers with:
                    - Product inventory questions (use check_inventory)
                    - Weather information (use get_weather)
                    - Issues that need escalation (use create_support_ticket)

                    Be concise and helpful.''',
                    tools=[self.check_inventory, self.get_weather, self.create_support_ticket]
                )
            )

            # Handle function calling
            if response.candidates[0].content.parts[0].function_call:
                fc = response.candidates[0].content.parts[0].function_call

                # Execute function
                if fc.name == "check_inventory":
                    result = self.check_inventory(**fc.args)
                elif fc.name == "get_weather":
                    result = self.get_weather(**fc.args)
                elif fc.name == "create_support_ticket":
                    result = self.create_support_ticket(**fc.args)
                else:
                    result = {"error": "Unknown function"}

                # Get final response
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        message,
                        response.candidates[0].content,
                        types.Part.from_function_response(
                            name=fc.name,
                            response={"result": result}
                        )
                    ],
                    config=GenerateContentConfig(
                        system_instruction='''You are a friendly customer support agent.
                        Use function results to provide helpful responses.''',
                        tools=[self.check_inventory, self.get_weather, self.create_support_ticket]
                    )
                )

            response_text = response.text
            self.conversation_history.append({"role": "agent", "content": response_text})
            return response_text

        except exceptions.ResourceExhausted:
            return "I'm experiencing high demand right now. Please try again in a moment."

        except Exception as e:
            return f"I encountered an error: {e}. Let me create a support ticket for you."


# Interactive demo
if __name__ == "__main__":
    bot = SupportBot()

    print("Customer Support Bot (type 'quit' to exit)")
    print("=" * 50)

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() in ['quit', 'exit', 'bye']:
            print("Agent: Thank you for contacting support. Have a great day!")
            break

        if not user_input:
            continue

        response = bot.chat(user_input)
        print(f"Agent: {response}")
```

## Testing

Save as `support_bot.py` and run:

```bash
python support_bot.py
```

**Test conversation**:
```
You: Hello!
Agent: Hi! How can I help you today?

You: Do you have PROD-001 in stock?
Agent: Yes! We have 42 units of PROD-001 in stock at our US-West warehouse.

You: What about PROD-002?
Agent: Unfortunately, PROD-002 is currently out of stock at our US-East warehouse.

You: My order hasn't arrived yet
Agent: I understand that's frustrating. I've created a normal priority ticket (TICKET-0003) to investigate your order. Our team will reach out within 24 hours.

You: quit
Agent: Thank you for contacting support. Have a great day!
```

## Troubleshooting

### Error: "Could not find Application Default Credentials"
```bash
gcloud auth application-default login
```

### Error: "ResourceExhausted" (Quota exceeded)
- Check your quota in Google Cloud Console
- Enable billing if you haven't
- Wait a few seconds between requests

### Error: "Invalid model name"
- Verify model name is exactly 'gemini-2.5-flash'
- Check that you have access to Vertex AI in your project

### Function not being called
- Ensure function has proper docstring
- Check that function signature matches type hints
- Verify function is included in `tools` list

## Key Takeaways

1. **Direct API control**: SDK gives you full control over requests
2. **Function calling**: Models can use tools when configured
3. **Error handling**: Always wrap API calls in try/except
4. **System instructions**: Guide model behavior with clear instructions
5. **Multimodal**: Models can handle text and images together

## Next Steps

**Continue to**: [ADK Agent with Tools](adk-agent-with-tools.md)

Learn how to:
- Use ADK framework for less boilerplate
- Integrate built-in tools (Google Search, code execution)
- Handle streaming responses
- Manage multi-turn conversations with sessions

**Extend this example**:
- Add more custom tools (order lookup, shipping tracking)
- Implement conversation persistence
- Add structured output for consistent responses
- Create a simple web UI with Flask or FastAPI

## Related Documentation

- **[vertex-ai SDK](../../vertex-ai/SKILL.md)** - Complete SDK documentation
- **[Function Calling](../../vertex-ai/references/function-calling.md)** - Detailed function calling guide
- **[Error Handling](../../vertex-ai/references/error-handling.md)** - Error handling patterns

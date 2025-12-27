# Function Calling

Enable models to call your functions for agentic workflows.

**Contents:**
- [Basic Function Calling](#basic-function-calling)
- [Function with Type Hints](#function-with-type-hints)
- [Handling Function Calls (Agentic Pattern)](#handling-function-calls-agentic-pattern)
- [Important Notes](#important-notes)

## Basic Function Calling

```python
from google.genai.types import GenerateContentConfig

def get_current_weather(location: str) -> str:
    """Returns the current weather for a location."""
    # Your implementation here
    return f"The weather in {location} is sunny, 72°F"

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents="What is the weather in Boston?",
    config=GenerateContentConfig(
        tools=[get_current_weather],
    ),
)

print(response.text)
```

## Function with Type Hints

```python
from typing import Literal

def set_light_color(color: Literal["red", "green", "blue"]) -> str:
    """Changes the light color."""
    return f"Light set to {color}"

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents="Make the light blue",
    config=GenerateContentConfig(tools=[set_light_color]),
)
```

## Handling Function Calls (Agentic Pattern)

For multi-turn function calling workflows:

```python
from google.genai import types
from google.genai.types import GenerateContentConfig

def get_weather(location: str) -> str:
    """Get current weather for a location."""
    return f"Sunny, 72°F in {location}"

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents="What's the weather in Boston?",
    config=GenerateContentConfig(tools=[get_weather]),
)

# Check if model wants to call a function
if response.candidates[0].content.parts[0].function_call:
    function_call = response.candidates[0].content.parts[0].function_call

    # Execute the function
    result = get_weather(**function_call.args)

    # Continue conversation with function result
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            "What's the weather in Boston?",
            response.candidates[0].content,  # Model's function call
            types.Part.from_function_response(
                name=function_call.name,
                response={"result": result}
            ),
        ],
        config=GenerateContentConfig(tools=[get_weather]),
    )

    print(response.text)
```

## Important Notes

- Function docstrings are used by the model to understand what the function does
- Type hints help the model understand expected parameters
- Use `Literal` types to restrict function arguments to specific values
- The model decides when to call functions based on the user's query

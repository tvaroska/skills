# Error Handling

Handle common errors when working with Vertex AI.

## Basic Error Handling

```python
from google.api_core import exceptions

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    text = response.text
except exceptions.ResourceExhausted as e:
    # Quota exceeded
    print(f"Quota exceeded: {e}")
except exceptions.InvalidArgument as e:
    # Invalid request parameters
    print(f"Invalid argument: {e}")
except Exception as e:
    # Other errors
    print(f"Unexpected error: {e}")
```

## Common Error Scenarios

- **`ResourceExhausted`**: Check quota limits in GCP console
- **`InvalidArgument`**: Verify model name, location, and parameters

## Complete Example with Error Handling

```python
from google import genai
from google.genai import types
from google.api_core import exceptions

# Initialize client
client = genai.Client(vertexai=True, location='global')

try:
    # Generate with custom config
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Write a haiku about programming',
        config=types.GenerateContentConfig(
            system_instruction='You are a creative poet.',
            temperature=0.8,
            max_output_tokens=100,
        )
    )

    print("Generated haiku:")
    print(response.text)

except Exception as e:
    print(f"Error: {e}")
```

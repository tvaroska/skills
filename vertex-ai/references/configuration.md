# Generation Configuration Parameters

Control model behavior with generation parameters.

## Basic Configuration

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Write a creative story about space exploration',
    config=types.GenerateContentConfig(
        temperature=0.9,           # 0.0-2.0: Higher = more creative/random
        top_p=0.95,               # 0.0-1.0: Nucleus sampling threshold
        top_k=40,                 # Consider top K tokens
        max_output_tokens=1024,   # Maximum tokens in response
    )
)
```

## Parameter Guidelines

- **`temperature`**: 0.0 for deterministic, 1.0+ for creative outputs
- **`top_p`**: Keep at 0.95 for most cases; lower for more focused outputs
- **`max_output_tokens`**: Limit response length (1 token ≈ 4 characters)

## Using Different Models

```python
# Flash for speed
response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)

# Pro for quality
response = client.models.generate_content(model='gemini-2.5-pro', contents=prompt)
```

## Combining System Instructions with Structured Output

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=user_prompt,
    config={
        "system_instruction": "You are a helpful assistant that extracts themes from text.",
        "response_mime_type": "application/json",
        "response_json_schema": ThemeList.model_json_schema()
    }
)
```

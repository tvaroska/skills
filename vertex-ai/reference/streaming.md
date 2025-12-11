# Streaming Responses

Stream responses for real-time output.

## Basic Streaming

```python
# Basic streaming
for chunk in client.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents='Tell me a story in 300 words.'
):
    print(chunk.text, end='')
```

## Async Streaming

```python
async for chunk in client.aio.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents='Tell me a story in 300 words.'
):
    print(chunk.text, end='')
```

## Streaming with Multimodal Inputs

```python
from google.genai import types

with open('image.jpg', 'rb') as f:
    image_bytes = f.read()

for chunk in client.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents=[
        'What is this image about?',
        types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
    ],
):
    print(chunk.text, end='')
```

## Important Notes

- **Streaming is not supported** with function calling or structured outputs
- Use streaming for better user experience with long responses
- Async streaming requires an async context

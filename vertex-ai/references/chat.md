# Multi-Turn Chat

Create stateful conversations with the Vertex AI models.

## Basic Chat Session

```python
# Create chat session
chat = client.chats.create(model='gemini-2.5-flash')

# Send messages
response = chat.send_message("I have 2 dogs in my house.")
print(response.text)

response = chat.send_message("How many paws are in my house?")
print(response.text)
```

## Chat with Initial History

```python
from google.genai.types import ModelContent, Part, UserContent

chat = client.chats.create(
    model='gemini-2.5-flash',
    history=[
        UserContent(parts=[Part(text="Hello")]),
        ModelContent(parts=[Part(text="Great to meet you. What would you like to know?")]),
    ],
)
response = chat.send_message("Tell me about Python.")
```

## Important Notes

- Full conversation history is sent with each turn to maintain context
- This can increase token usage as the conversation grows
- Consider truncating or summarizing history for long conversations

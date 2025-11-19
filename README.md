# Jarvis Core

Jarvis Core is a household AI assistant backend built with [Bun](https://bun.com). It leverages OpenAI's Realtime API to understand natural language commands and integrates with n8n webhooks to perform home automation tasks.

## Features

- **Natural Language Processing:** Uses OpenAI's Realtime API to interpret user requests.
- **Home Automation Integration:** Connects to n8n via webhooks to control smart home devices (lights, scenes, etc.).
- **API Endpoints:**
  - `POST /ask`: Accepts a JSON body `{ "text": "turn on the lights" }` and returns the assistant's response.
  - `GET /health`: Simple health check endpoint.

## Prerequisites

- [Bun](https://bun.com) (v1.0.0 or later)

## Installation

Install the dependencies:

```bash
bun install
```

## Environment Variables

Create a `.env` file in the root directory or set the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OPENAI_REALTIME_MODEL` | The OpenAI model to use (e.g., `gpt-4o-realtime-preview`) | Yes |
| `N8N_JARVIS_WEBHOOK_URL` | The webhook URL for your n8n instance to handle automation | Yes |
| `PORT` | Port for the server to listen on (default: 4000) | No |

## Running the Server

To start the server:

```bash
bun run src/server.ts
```

The server will start listening on `http://localhost:4000` (or your configured `PORT`).

## Usage Example

You can interact with the server using `curl`:

```bash
curl -X POST http://localhost:4000/ask \
  -H "Content-Type: application/json" \
  -d '{ "text": "Turn off the living room lights" }'
```

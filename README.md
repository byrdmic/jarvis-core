# Jarvis Core

Jarvis Core is a multi-device household AI assistant backend built with [Bun](https://bun.com). It features real-time audio streaming, device identity management, and seamless integration with OpenAI's Realtime API and n8n for comprehensive home automation control.

## Features

- **Real-Time Audio Streaming:** Bidirectional audio communication with connected devices
- **Multi-Device Support:** Manage multiple smart home devices with unique identities
- **Natural Language Processing:** Advanced OpenAI Realtime API integration for natural conversation
- **Home Automation Integration:** Robust n8n webhook system for controlling smart home devices
- **Wake Word Architecture:** Built for client-side wake word detection and audio streaming
- **Comprehensive Testing:** Full test suite covering all components and integrations

## Architecture

### Core Components

- **Device Manager:** Manages WebSocket connections and routes audio between devices and AI sessions
- **Jarvis Session:** Handles persistent OpenAI Realtime API connections with audio/text streaming
- **Server:** Bun-based HTTP/WebSocket server with device authentication and routing
- **Tools System:** Extensible tool framework for home automation commands

### Audio Pipeline

```
Device → WebSocket → DeviceManager → JarvisSession → OpenAI → JarvisSession → DeviceManager → WebSocket → Device
```

## API Endpoints

### HTTP Endpoints

- `GET /health`: Health check endpoint
- `POST /ask`: Legacy text-only endpoint accepting `{ "text": "command" }`

### WebSocket Endpoints

- `WS /ws?deviceId=<id>`: Real-time audio streaming for devices
  - Device identification via query parameter
  - Binary audio data (PCM16) streaming
  - Text transcript and response audio streaming

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
| `OPENAI_REALTIME_MODEL` | OpenAI Realtime model (e.g., `gpt-4o-realtime-preview-2024-10-01`) | Yes |
| `N8N_JARVIS_WEBHOOK_URL` | n8n webhook URL for home automation | Yes |
| `PORT` | Server port (default: 4000) | No |

## Running the Server

Start the development server:

```bash
bun run dev
```

Or run directly:

```bash
bun run src/server.ts
```

The server will start on `http://localhost:4000` (or your configured `PORT`).

## Testing

Run the comprehensive test suite:

```bash
bun test
```

Tests cover all components including device management, audio streaming, WebSocket handling, and integration scenarios.

## Usage Examples

### Legacy Text Endpoint

```bash
curl -X POST http://localhost:4000/ask \
  -H "Content-Type: application/json" \
  -d '{ "text": "Turn off the living room lights" }'
```

### WebSocket Audio Streaming

Devices connect via WebSocket for real-time audio:

```javascript
// Example device connection
const ws = new WebSocket('ws://localhost:4000/ws?deviceId=kitchen-speaker');

// Send audio data (base64 encoded PCM16)
ws.onopen = () => {
  ws.send(audioBuffer); // Binary audio data
};

// Receive responses
ws.onmessage = (event) => {
  if (typeof event.data === 'string') {
    // Text transcript or response metadata
    const message = JSON.parse(event.data);
    console.log('Transcript:', message.text);
  } else {
    // Binary audio response
    playAudio(event.data);
  }
};
```

### Health Check

```bash
curl http://localhost:4000/health
# Returns: {"ok": true, "env": "jarvis-core-bun"}
```

## Project Structure

```
jarvis-core/
├── src/
│   ├── config.ts          # Environment configuration and session setup
│   ├── server.ts          # Main Bun server with HTTP/WebSocket endpoints
│   ├── device/
│   │   └── manager.ts     # Device connection management and routing
│   ├── realtime/
│   │   ├── session.ts     # OpenAI Realtime API session handling
│   │   └── types.ts       # TypeScript type definitions
│   └── tools/
│       ├── index.ts       # Tool handler exports
│       ├── runHomeAutomation.ts # Home automation tool implementation
│       └── schema.ts      # OpenAI tool schema definitions
├── tests/                 # Comprehensive test suite
│   ├── *.test.ts         # Individual component tests
│   ├── integration.test.ts # End-to-end integration tests
│   └── README.md         # Test documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Key Technologies

- **Bun**: Fast JavaScript runtime and bundler
- **TypeScript**: Type-safe development
- **WebSocket**: Real-time bidirectional communication
- **OpenAI Realtime API**: Advanced AI conversation capabilities
- **n8n**: Workflow automation for home devices

### Audio Format

- **Input/Output**: PCM16 (16-bit linear PCM)
- **Sample Rate**: Configurable via OpenAI Realtime API
- **Streaming**: Base64 encoded for WebSocket transport

### Device Identity

Each device connects with a unique `deviceId` in the WebSocket URL query parameter. This enables:

- Individual AI sessions per device
- Targeted audio responses
- Device-specific conversation context
- Multi-room audio management

## Contributing

1. Ensure all tests pass: `bun test`
2. Follow TypeScript strict mode guidelines
3. Add tests for new functionality
4. Update documentation for API changes

## License

This project is part of the Jarvis Core household AI assistant system.

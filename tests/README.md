# Jarvis Core Tests

This directory contains comprehensive tests for the Jarvis Core audio assistant system.

## Test Structure

### Core Components

- **`device-manager.test.ts`** - Tests for the DeviceManager class
  - Device connection/disconnection handling
  - Multi-device support
  - Device state management

- **`jarvis-session.test.ts`** - Tests for JarvisSession functionality
  - Session creation and event handling
  - Message structure validation
  - Event type definitions

- **`server.test.ts`** - Tests for server logic
  - HTTP endpoint validation
  - WebSocket upgrade logic
  - Error handling

- **`config.test.ts`** - Tests for configuration management
  - Environment variable handling
  - Session config creation
  - Message event structures

- **`tools.test.ts`** - Tests for tool handlers
  - Home automation tool validation
  - Argument handling
  - Response processing

### Integration Tests

- **`integration.test.ts`** - End-to-end integration tests
  - Device-to-session audio routing
  - Audio data conversion (ArrayBuffer ↔ base64)
  - Error handling scenarios

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/device-manager.test.ts

# Run with coverage (if supported)
bun test --coverage
```

## Test Coverage

The tests cover:

✅ **Device Management**
- Connection handling for multiple devices
- Device identification and routing
- Clean disconnection and cleanup

✅ **Audio Streaming**
- Base64 encoding/decoding for audio data
- Binary audio data handling
- Real-time audio message routing

✅ **WebSocket Communication**
- Connection upgrades with device IDs
- Message validation and routing
- Error handling for malformed data

✅ **OpenAI Integration**
- Session configuration for audio modalities
- Message structure validation
- Event callback handling

✅ **Home Automation Tools**
- n8n webhook integration
- Tool argument validation
- Response processing

✅ **Configuration Management**
- Environment variable handling
- Session config generation
- Message event creation

## Mocking Strategy

- **WebSocket**: Mocked globally to avoid real network connections
- **Fetch API**: Mocked for tool testing without external dependencies
- **Environment Variables**: Isolated testing of config logic

## Test Philosophy

- **Unit Tests**: Focus on individual component behavior
- **Integration Tests**: Verify component interactions
- **Error Handling**: Comprehensive coverage of failure scenarios
- **Data Validation**: Ensure correct message structures and formats

## Adding New Tests

When adding new functionality:

1. Create tests in the appropriate file based on the component
2. Follow the existing naming conventions
3. Include both success and error scenarios
4. Add integration tests for new component interactions
5. Update this README if adding new test categories




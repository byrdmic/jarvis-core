// Test setup and global mocks
import { beforeAll, afterAll } from "bun:test";

// Set up test environment variables
process.env.NODE_ENV = "test";

// Mock environment variables for tests
process.env.OPENAI_API_KEY = "test-key";
process.env.OPENAI_REALTIME_MODEL = "test-model";
process.env.N8N_JARVIS_WEBHOOK_URL = "http://test-webhook.com";
process.env.PORT = "4000";

// Global test setup
beforeAll(() => {
  console.log("Setting up tests...");
});

// Global test cleanup
afterAll(() => {
  console.log("Cleaning up tests...");
});





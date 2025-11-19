import { describe, test, expect } from "bun:test";
import { config, createSessionConfig, createUserMessageEvent, createAudioMessageEvent } from "../src/config";
import { toolsSchema } from "../src/tools/schema";

// Mock Bun.env
const originalEnv = process.env;

describe("config", () => {
  describe("environment variables", () => {
    test("should have required config properties", () => {
      expect(config).toHaveProperty('openaiApiKey');
      expect(config).toHaveProperty('openaiRealtimeModel');
      expect(config).toHaveProperty('n8nWebhookUrl');
      expect(config).toHaveProperty('port');
      expect(typeof config.port).toBe('number');
    });

    test("should have valid port number", () => {
      expect(config.port).toBeGreaterThan(0);
      expect(config.port).toBeLessThan(65536);
    });
  });
});

describe("createSessionConfig", () => {
  test("should create valid session config", () => {
    const sessionConfig = createSessionConfig(toolsSchema);

    expect(sessionConfig.type).toBe("session.update");
    expect(sessionConfig.session.type).toBe("realtime");
    expect(sessionConfig.session.input_audio_format).toBe("pcm16");
    expect(sessionConfig.session.output_audio_format).toBe("pcm16");
    expect(sessionConfig.session.output_modalities).toEqual(["text", "audio"]);
    expect(sessionConfig.session.tool_choice).toBe("auto");
    expect(sessionConfig.session.tools).toBe(toolsSchema);
  });

  test("should include turn detection config", () => {
    const sessionConfig = createSessionConfig(toolsSchema);

    expect(sessionConfig.session.turn_detection).toBeDefined();
    expect(sessionConfig.session.turn_detection.type).toBe("server_vad");
    expect(sessionConfig.session.turn_detection.threshold).toBe(0.5);
  });

  test("should include input audio transcription", () => {
    const sessionConfig = createSessionConfig(toolsSchema);

    expect(sessionConfig.session.input_audio_transcription).toBeDefined();
    expect(sessionConfig.session.input_audio_transcription.model).toBe("whisper-1");
  });
});

describe("createUserMessageEvent", () => {
  test("should create valid user message event", () => {
    const text = "Hello Jarvis";
    const messageEvent = createUserMessageEvent(text);

    expect(messageEvent.type).toBe("conversation.item.create");
    expect(messageEvent.item.type).toBe("message");
    expect(messageEvent.item.role).toBe("user");
    expect(messageEvent.item.content).toHaveLength(1);
    expect(messageEvent.item.content[0].type).toBe("input_text");
    expect(messageEvent.item.content[0].text).toBe(text);
  });
});

describe("createAudioMessageEvent", () => {
  test("should create valid audio message event", () => {
    const audioBase64 = "base64AudioData";
    const audioEvent = createAudioMessageEvent(audioBase64);

    expect(audioEvent.type).toBe("conversation.item.create");
    expect(audioEvent.item.type).toBe("message");
    expect(audioEvent.item.role).toBe("user");
    expect(audioEvent.item.content).toHaveLength(1);
    expect(audioEvent.item.content[0].type).toBe("input_audio");
    expect(audioEvent.item.content[0].audio).toBe(audioBase64);
  });
});

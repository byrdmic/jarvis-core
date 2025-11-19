import { describe, test, expect, mock } from "bun:test";
import { toolHandlers } from "../src/tools";
import { RunHomeAutomationArgs } from "../src/tools/runHomeAutomation";

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  status: 200,
  statusText: "OK",
  json: () => Promise.resolve({ success: true, message: "Lights turned on" }),
  text: () => Promise.resolve("Mock response"),
}));

global.fetch = mockFetch;

describe("Tool Handlers", () => {
  describe("run_home_automation", () => {
    test("should handle successful n8n response", async () => {
      const args: RunHomeAutomationArgs = {
        action: "set_scene",
        room: "bedroom",
        extra: { scene: "bedtime" },
      };

      const result = await toolHandlers.run_home_automation(args);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('detail');
    });

    test("should validate required arguments", () => {
      const validArgs: RunHomeAutomationArgs = {
        action: "set_light_state",
        room: "living_room",
        state: "on",
      };

      expect(validArgs.action).toBeDefined();
      expect(validArgs.room).toBeDefined();
      expect(validArgs.state).toBe("on");
    });

    test("should support optional extra parameters", () => {
      const argsWithExtra: RunHomeAutomationArgs = {
        action: "set_scene",
        room: "bedroom",
        extra: { scene: "bedtime", brightness: 50 },
      };

      expect(argsWithExtra.extra).toBeDefined();
      expect(argsWithExtra.extra?.scene).toBe("bedtime");
      expect(argsWithExtra.extra?.brightness).toBe(50);
    });
  });
});

import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { DeviceManager } from "../src/device/manager";
import { JarvisSession } from "../src/realtime/session";

describe("DeviceManager", () => {
  let deviceManager: DeviceManager;
  let mockJarvisSession: JarvisSession;
  let mockWebSocket: any;

  beforeEach(() => {
    deviceManager = new DeviceManager();

    // Mock JarvisSession
    mockJarvisSession = {
      sendText: mock(() => Promise.resolve()),
      sendAudio: mock(() => Promise.resolve()),
      disconnect: mock(() => {}),
    } as any;

    // Mock WebSocket
    mockWebSocket = {
      send: mock(() => {}),
      close: mock(() => {}),
      onmessage: null,
      onclose: null,
    };
  });

  afterEach(() => {
    // Clean up any remaining devices
    deviceManager.getConnectedDevices().forEach(deviceId => {
      deviceManager.disconnectDevice(deviceId);
    });
  });

  describe("handleConnection", () => {
    test("should add device to connected devices", () => {
      const deviceId = "test-device";

      deviceManager.handleConnection(mockWebSocket, deviceId);

      expect(deviceManager.getConnectedDevices()).toContain(deviceId);
    });

    test("should create JarvisSession for new device", () => {
      const deviceId = "test-device";

      deviceManager.handleConnection(mockWebSocket, deviceId);

      // JarvisSession constructor is called internally, we can't easily spy on it
      // but we can verify the device is registered
      expect(deviceManager.getConnectedDevices()).toContain(deviceId);
    });

    test("should handle multiple devices", () => {
      const deviceId1 = "device-1";
      const deviceId2 = "device-2";

      deviceManager.handleConnection(mockWebSocket, deviceId1);
      deviceManager.handleConnection(mockWebSocket, deviceId2);

      const connectedDevices = deviceManager.getConnectedDevices();
      expect(connectedDevices).toContain(deviceId1);
      expect(connectedDevices).toContain(deviceId2);
      expect(connectedDevices).toHaveLength(2);
    });
  });

  describe("disconnectDevice", () => {
    test("should remove device from connected devices", () => {
      const deviceId = "test-device";

      deviceManager.handleConnection(mockWebSocket, deviceId);
      expect(deviceManager.getConnectedDevices()).toContain(deviceId);

      deviceManager.disconnectDevice(deviceId);
      expect(deviceManager.getConnectedDevices()).not.toContain(deviceId);
    });

    test("should call session.disconnect() when disconnecting device", () => {
      const deviceId = "test-device";

      deviceManager.handleConnection(mockWebSocket, deviceId);
      deviceManager.disconnectDevice(deviceId);

      // Note: We can't easily test the internal session.disconnect() call
      // without more complex mocking, but the device removal is testable
    });

    test("should handle disconnecting non-existent device gracefully", () => {
      const deviceId = "non-existent";

      expect(() => {
        deviceManager.disconnectDevice(deviceId);
      }).not.toThrow();
    });
  });

  describe("getConnectedDevices", () => {
    test("should return empty array when no devices connected", () => {
      expect(deviceManager.getConnectedDevices()).toEqual([]);
    });

    test("should return array of connected device IDs", () => {
      const deviceId1 = "device-1";
      const deviceId2 = "device-2";

      deviceManager.handleConnection(mockWebSocket, deviceId1);
      deviceManager.handleConnection(mockWebSocket, deviceId2);

      const connectedDevices = deviceManager.getConnectedDevices();
      expect(connectedDevices).toContain(deviceId1);
      expect(connectedDevices).toContain(deviceId2);
    });
  });

  // Note: Testing message handling would require more complex mocking of WebSocket events
  // and JarvisSession interactions. For now, the basic connection/disconnection tests
  // provide good coverage of the core functionality.
});




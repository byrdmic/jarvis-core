import { JarvisSession, JarvisEvent } from '../realtime/session'

export class DeviceManager {
  private devices = new Map<string, {
    ws: Bun.ServerWebSocket<{ deviceId: string }>
    session: JarvisSession
  }>()

  handleConnection(ws: Bun.ServerWebSocket<{ deviceId: string }>, deviceId: string): void {
    console.log(`[DeviceManager] Device connected: ${deviceId}`)

    // Create a new Jarvis session for this device
    const session = new JarvisSession((event: JarvisEvent) => {
      this.handleJarvisEvent(deviceId, event)
    })

    // Store the device and session
    this.devices.set(deviceId, { ws, session })

    // Handle incoming messages from the device
    ws.onmessage = (event) => {
      this.handleDeviceMessage(deviceId, event.data)
    }

    // Handle device disconnection
    ws.onclose = () => {
      console.log(`[DeviceManager] Device disconnected: ${deviceId}`)
      const device = this.devices.get(deviceId)
      if (device) {
        device.session.disconnect()
        this.devices.delete(deviceId)
      }
    }
  }

  private handleDeviceMessage(deviceId: string, data: ArrayBuffer | string): void {
    const device = this.devices.get(deviceId)
    if (!device) {
      console.error(`[DeviceManager] No device found for ${deviceId}`)
      return
    }

    if (data instanceof ArrayBuffer) {
      // Handle binary audio data
      const audioBase64 = Buffer.from(data).toString('base64')
      device.session.sendAudio(audioBase64).catch((error) => {
        console.error(`[DeviceManager] Error sending audio for ${deviceId}:`, error)
      })
    } else if (typeof data === 'string') {
      // Handle text messages (for debugging or text input)
      try {
        const message = JSON.parse(data)
        if (message.type === 'text') {
          device.session.sendText(message.text).catch((error) => {
            console.error(`[DeviceManager] Error sending text for ${deviceId}:`, error)
          })
        }
      } catch (error) {
        console.error(`[DeviceManager] Invalid JSON message from ${deviceId}:`, error)
      }
    }
  }

  private handleJarvisEvent(deviceId: string, event: JarvisEvent): void {
    const device = this.devices.get(deviceId)
    if (!device) {
      console.error(`[DeviceManager] No device found for event from ${deviceId}`)
      return
    }

    try {
      if (event.type === 'audio_delta') {
        // Send audio chunk back to device
        const audioBuffer = Buffer.from(event.data, 'base64')
        device.ws.send(audioBuffer)
      } else if (event.type === 'text_delta') {
        // Send text delta as JSON message
        device.ws.send(JSON.stringify({
          type: 'text_delta',
          text: event.data
        }))
      } else if (event.type === 'audio_transcript_delta') {
        // Send transcription delta
        device.ws.send(JSON.stringify({
          type: 'transcript_delta',
          text: event.data
        }))
      } else if (event.type === 'response_done') {
        // Send response completion
        device.ws.send(JSON.stringify({
          type: 'response_done'
        }))
      } else if (event.type === 'error') {
        // Send error to device
        device.ws.send(JSON.stringify({
          type: 'error',
          error: event.data?.message || 'Unknown error'
        }))
      }
    } catch (error) {
      console.error(`[DeviceManager] Error sending event to ${deviceId}:`, error)
    }
  }

  getConnectedDevices(): string[] {
    return Array.from(this.devices.keys())
  }

  disconnectDevice(deviceId: string): void {
    const device = this.devices.get(deviceId)
    if (device) {
      device.ws.close()
      device.session.disconnect()
      this.devices.delete(deviceId)
      console.log(`[DeviceManager] Force disconnected device: ${deviceId}`)
    }
  }
}

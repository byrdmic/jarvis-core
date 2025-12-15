export const toolsSchema = [
  {
    type: 'function',
    name: 'run_home_automation',
    description:
      'Execute a home automation action via n8n, such as controlling lights or scenes.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description:
            'High-level action name, e.g. "set_light_state", "set_scene".',
          enum: ['set_light_state', 'set_scene', 'toggle'],
        },
        room: {
          type: 'string',
          description: 'The room to control.',
          enum: [
            'living_room',
            'kitchen',
            'bedroom',
            'driveway',
            'side_driveway',
            'deck',
            'elizabeth_s_room',
            'playroom',
            'office',
            'dining_room',
            'master_bedroom',
            'breakfast_nook',
            'cookie_room',
            'foyer',
            'elizabeth_s_bathroom',
            'boy_bathroom',
            'basement_hallway',
          ],
        },
        state: {
          type: 'string',
          description: 'Optional state value, e.g. "on", "off".',
          enum: ['on', 'off'],
        },
        extra: {
          type: 'object',
          description:
            'Optional extra parameters, e.g. { brightness: 30 } or { scene: "bedtime" }.',
        },
      },
      required: ['action', 'room'],
    },
  },
] as const

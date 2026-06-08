# Newttrace

Discord-native telemetry SDK that converts Discord runtime events into structured, exportable lifecycle data.

## What it is

Newttrace is a telemetry layer for Discord bots that plugs into any external system (Datadog, webhooks, files, queues). It is not a dashboard and not an analytics platform.

It reconstructs your bot's install funnel by observing Discord runtime events and normalizing them into a consistent event stream.

## Installation

```bash
npm install newttrace discord.js
```

## Quick Start

```typescript
import { Client, GatewayIntentBits } from "discord.js";
import { initNewttrace, DatadogExporter, WebhookExporter } from "newttrace";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const newttrace = initNewttrace({
  botId: "my-discord-bot",
  exporters: [
    new DatadogExporter({
      apiKey: process.env.DD_API_KEY!,
      service: "discord-bot",
    }),
    new WebhookExporter({
      url: "https://your-api.com/newttrace",
    }),
  ],
  auto: true,
  client,
});

client.login(process.env.DISCORD_TOKEN);
```

## Architecture

```
Discord Bot (discord.js)
        ↓
   Newttrace SDK
   (hooks + normalization)
        ↓
     Event Pipeline
        ↓
   Pluggable Exporters
        ↓
 Datadog / Webhook / File / Queue
```

## Features

- **Event Capture**: Automatic hooks for `guildCreate`, `guildDelete`, `interactionCreate`
- **Lifecycle Inference**: Raw Discord events are converted into product intelligence (`guild_join`, `guild_leave`, `interaction`, `command_used`)
- **Attribution**: Track install sources via OAuth `state` parameter
- **Pluggable Exporters**: Datadog, Webhook, File, Redis, Kafka, NATS

## Exporters

### DatadogExporter

```typescript
new DatadogExporter({
  apiKey: process.env.DD_API_KEY!,
  service: "discord-bot",
  site: "datadoghq.com", // optional
});
```

### WebhookExporter

```typescript
new WebhookExporter({
  url: "https://your-api.com/newttrace",
  headers: { "Authorization": "Bearer token" }, // optional
});
```

### FileExporter

```typescript
new FileExporter({ path: "./newttrace.log" });
```

### StreamExporter

```typescript
new StreamExporter({
  type: "redis", // or "kafka", "nats"
  url: "redis://localhost:6379",
  channel: "newttrace", // optional
});
```

## Attribution

Generate tracked invite URLs to attribute installs to campaigns:

```typescript
const url = newttrace.generateInviteUrl("CLIENT_ID", {
  campaignId: "summer_2024",
  permissions: "8",
});
// → https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=8&state=campaign_summer_2024
```

On `guildCreate`, the SDK automatically attaches the campaign source to the event.

## Manual Tracking

```typescript
newttrace.trace("command_used", {
  command: "play",
  guildId: "123",
});
```

## License

MIT

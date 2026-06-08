# Getting Started

newttrace is a telemetry layer for Discord bots. It hooks into your `discord.js` client, normalizes events, and sends them to any external system like Datadog, webhooks, files, or message queues.

## Installation

```bash
npm install newttrace discord.js
```

If you plan to use the `StreamExporter` for Redis, Kafka, or NATS, install the corresponding client package separately:

```bash
npm install redis      # for Redis
npm install kafkajs    # for Kafka
npm install nats       # for NATS
```

## Quick Start

The simplest setup attaches newttrace to your existing `discord.js` client and sends events to Datadog:

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { initNewttrace, DatadogExporter } from "newttrace";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const newttrace = initNewttrace({
  botId: "my-discord-bot",
  version: "1.2.0",
  exporters: [
    new DatadogExporter({
      apiKey: process.env.DD_API_KEY!,
      service: "discord-bot",
      site: "datadoghq.com", // or "datadoghq.eu"
    }),
  ],
  auto: true,
  client,
});

client.login(process.env.DISCORD_TOKEN);
```

That's it. With `auto: true`, the SDK automatically listens for Discord events and emits normalized telemetry.

## Events captured automatically

| Discord event | newttrace event | When it fires |
|---------------|-----------------|---------------|
| `guildCreate` | `guild_join` | Bot is added to a server |
| `guildDelete` | `guild_leave` | Bot is removed from a server |
| `interactionCreate` | `interaction` | Any slash command, button, or modal interaction |
| `interactionCreate` (first per guild) | `guild_activated` | First interaction in a newly joined server |

## Using multiple exporters

Send events to multiple destinations simultaneously:

```ts
import { initNewttrace, DatadogExporter, WebhookExporter, FileExporter } from "newttrace";

initNewttrace({
  botId: "my-bot",
  exporters: [
    new DatadogExporter({ apiKey: "...", service: "my-bot" }),
    new WebhookExporter({ url: "https://my-api.com/telemetry" }),
    new FileExporter({ path: "./newttrace.log" }),
  ],
  auto: true,
  client,
});
```

Events are dispatched to all exporters in parallel. If one exporter fails, the others still receive the event.

## Manual tracking

For custom events that the SDK does not capture automatically:

```ts
newttrace.trace("premium_upgrade", {
  userId: "123",
  tier: "pro",
});
```

You can also attach a `guildId` to link the event to a specific server:

```ts
newttrace.trace("premium_upgrade", { tier: "pro" }, interaction.guildId);
```

## Tracking command usage explicitly

If you use a custom command framework and want to ensure every command is tracked:

```ts
newttrace.traceCommand(interaction, "play");
```

This emits a `command_used` event with the command name and interaction metadata.

## Shutdown and cleanup

Always clean up listeners before exiting to avoid memory leaks:

```ts
process.on("SIGINT", () => {
  newttrace.shutdown();
  client.destroy();
  process.exit(0);
});
```

## Configuration reference

```ts
interface NewttraceConfig {
  botId: string;           // Required. Unique identifier for your bot
  version?: string;        // Optional. Defaults to "1.0.0"
  exporters: Exporter[];   // Required. At least one exporter
  auto?: boolean;          // Optional. Auto-attach Discord hooks. Default: true
  client?: Client;         // Optional. The discord.js client to hook into
  attribution?: {          // Optional. See Attribution guide
    enabled?: boolean;
    storage?: StateStore;
    guildStore?: GuildStore;
  };
}
```

## Common issues

**Missing Discord events**

If `guild_join` or `interaction` events are not appearing, check that your bot's intents include `GatewayIntentBits.Guilds`:

```ts
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, // if tracking messages
  ],
});
```

**Events not showing in Datadog**

- Verify `DD_API_KEY` is set and correct
- Check `DD_SITE` — use `"datadoghq.eu"` for EU accounts
- Allow 10–30 seconds for Datadog ingestion delay
- Filter by `service:` name and `ddsource:newttrace`

**Environment variables in PowerShell**

```powershell
$env:DD_API_KEY="your-key"
$env:DD_SITE="datadoghq.eu"
npx ts-node bot.ts
```

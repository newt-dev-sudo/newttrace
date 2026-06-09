# newttrace

[![npm version](https://img.shields.io/npm/v/newttrace)](https://www.npmjs.com/package/newttrace)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Discord-native telemetry SDK that converts Discord runtime events into structured, exportable lifecycle data.

**[Live Documentation](https://newttrace-docs.pages.dev)** | **[npm Package](https://www.npmjs.com/package/newttrace)** | **[GitHub Issues](https://github.com/newt-dev-sudo/newttrace/issues)**

## What it is

newttrace is a telemetry layer for Discord bots that plugs into any external system (Datadog, webhooks, files, queues). It is not a dashboard and not an analytics platform.

It reconstructs your bot's install funnel by observing Discord runtime events and normalizing them into a consistent event stream.

## Installation

```bash
npm install newttrace discord.js
```

## Quick Start

```typescript
import { Client, GatewayIntentBits } from "discord.js";
import { initNewttrace, FileExporter } from "newttrace"; // or WebhookExporter, DatadogExporter

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

initNewttrace({
  botId: "my-discord-bot",
  exporters: [new FileExporter({ path: "./events.log" })], // free, no external service
  auto: true,
  client,
});

client.login(process.env.DISCORD_TOKEN);
```

**Swap one line to use Datadog, Better Stack, your own API, Redis, Kafka, or NATS. No other code changes needed.**

## Features

- **Event Capture**: Automatic hooks for `guildCreate`, `guildDelete`, `interactionCreate`
- **Activation Tracking**: Detects first meaningful interaction after install (`guild_activated`)
- **Attribution**: Two approaches — time-window correlation (zero infrastructure) or per-install tracking via redirect server
- **Pluggable Exporters**: Datadog, Webhook, File, Redis, Kafka, NATS

## Why newttrace?

| Approach | Setup time | Cost | Know actual installs? | Per-guild attribution? | Track activation? |
|----------|-----------|------|----------------------|------------------------|-----------------|
| No tracking | 0 min | $0 | No | No | No |
| TOPGG stats | 5 min | Free | No | No | No |
| Build your own | 2+ weeks | $100+/mo | Yes | Maybe | Hard |
| **newttrace** | 5 min | Free | Yes | Yes | Yes |

## Attribution

### Option 1: Time-window correlation (default, $0)

Run one listing site at a time. Correlate `guild_join` counts with the site's click data.

```typescript
import { initNewttrace, DatadogExporter } from "newttrace";

initNewttrace({
  botId: "my-bot",
  exporters: [new DatadogExporter({ apiKey: "...", service: "my-bot" })],
  auto: true,
  client,
});
```

### Option 2: Per-install tracking (advanced, $0)

Know exactly which server came from TOPGG, Twitter, Reddit, your website, or any custom source. Requires a Cloudflare Worker (free tier included).

```typescript
import { initNewttrace, DatadogExporter, HttpGuildStore } from "newttrace";

const newttrace = initNewttrace({
  botId: "my-bot",
  exporters: [new DatadogExporter({ apiKey: "...", service: "my-bot" })],
  auto: true,
  client,
  attribution: {
    guildStore: new HttpGuildStore("https://your-worker.workers.dev"),
  },
});
```

See the [Attribution Guide](https://github.com/newt-dev-sudo/newttrace/blob/main/docs/guide/attribution.md) for full setup including Cloudflare Worker deployment.

## Documentation

All documentation is hosted at **[newttrace-docs.pages.dev](https://newttrace-docs.pages.dev)**.

- [Getting Started](https://newttrace-docs.pages.dev/guide/getting-started)
- [Activation Tracking](https://newttrace-docs.pages.dev/guide/activation)
- [Attribution](https://newttrace-docs.pages.dev/guide/attribution)
- [TOPGG Conversion Tracking](https://newttrace-docs.pages.dev/guide/topgg)
- [API Reference](https://newttrace-docs.pages.dev/reference/api)
- [Exporters](https://newttrace-docs.pages.dev/reference/exporters)

## License

MIT

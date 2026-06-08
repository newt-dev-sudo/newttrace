# Newttrace — Discord Bot Telemetry SDK

## What it is

Newttrace is a Discord-native telemetry SDK that runs inside bot code and automatically converts Discord runtime events into structured, exportable lifecycle data.

It is not a dashboard and not an analytics platform.

It is a telemetry layer for Discord bots that plugs into any external system (Datadog, webhooks, files, queues).

## Core idea

Discord bots generate valuable lifecycle signals:

- installs (guild joins)
- uninstalls (guild leaves)
- activation (first meaningful usage)
- engagement (commands/interactions)
- retention (ongoing activity)

But Discord does not expose a full funnel view.

Newttrace reconstructs that funnel by observing bot runtime events and normalizing them into a consistent event stream.

## High-level architecture

```
Discord Bot (discord.js / nextcord)
            ↓
       Newttrace SDK
   (hooks + normalization)
            ↓
     Event Pipeline Layer
            ↓
   Pluggable Exporters
            ↓
 Datadog / Webhook / File / Queue
```

## Core responsibilities

### 1. Event capture layer

Newttrace hooks into Discord client events.

Required:
- `guildCreate` → bot installed in server
- `guildDelete` → bot removed from server
- `interactionCreate` → slash commands / interactions

Optional:
- command framework hooks
- error events
- latency / heartbeat signals

### 2. Event normalization

All raw Discord events must be converted into a single unified schema.

Standard event format:
```json
{
  "event": "guild_join",
  "timestamp": 1712345678,
  "bot_id": "abc123",
  "guild_id": "hashed_or_raw",
  "source": "invite|oauth|unknown",
  "version": "1.0.0",
  "meta": {
    "guild_size": "large",
    "region": "eu-west",
    "shard": 1
  }
}
```

### 3. Lifecycle inference (key value)

Newttrace must infer higher-level meaning:

| Discord event         | Newttrace event |
|-----------------------|-----------------|
| `guildCreate`         | `guild_join`    |
| `guildDelete`         | `guild_leave`   |
| `interactionCreate`   | `interaction`   |
| command execution     | `command_used`  |

### 4. Attribution system (important differentiator)

Newttrace supports install source tracking via invite state.

Flow:
- SDK generates OAuth invite link with `state=campaign_123`
- SDK stores `state` → `campaign_id` mapping
- On `guildCreate`, match stored state and attach `"source": "campaign_123"`

This enables campaign tracking, traffic source analysis, and install attribution.

## Export system (no dashboard required)

Newttrace does NOT store or visualize data. It emits events to external systems via exporters.

### Exporter interface

```ts
interface Exporter {
  send(event: TraceEvent): Promise<void>;
}
```

### Supported exporters

1. **DatadogExporter** (primary integration)
2. **WebhookExporter**
3. **FileExporter** (dev mode)
4. **Stream exporters** (advanced): Redis, Kafka, NATS

## SDK API design

### Initialization
```ts
import { initNewttrace } from "newttrace";

initNewttrace({
  botId: "my-bot",
  exporters: [
    new DatadogExporter({
      apiKey: process.env.DD_API_KEY,
      service: "discord-bot"
    })
  ]
});
```

### Manual tracking (optional)
```ts
trace("command_used", {
  command: "play",
  guildId: "123"
});
```

### Auto mode (default behavior)

If enabled, automatically hooks Discord client and emits lifecycle events without manual setup.

## Internal event flow

Example: bot joins server

1. Discord emits `guildCreate`
2. Newttrace intercepts event
3. Normalize → `guild_join` event
4. Enrich (source, metadata, shard info)
5. Send to all exporters
6. Datadog / webhook receives structured event

## What makes Newttrace different

It IS a Discord-aware telemetry instrumentation layer.

It understands bot lifecycle, install funnels, usage activation, and Discord-specific event semantics.

It is NOT an analytics tool, dashboard SaaS, or logging library.

## MVP scope

Must ship:
- Discord event hooks
- normalization layer
- Datadog exporter
- webhook exporter
- simple install attribution (state tracking)

Do NOT build initially:
- dashboard
- complex UI
- analytics UI layer
- multi-tenant SaaS platform

# TOPGG Conversion Tracking

TOPGG tracks invite button clicks, but it cannot verify that a bot was actually added to a server. newttrace bridges this gap without any extra infrastructure.

## The Problem

| What TOPGG knows | What the bot knows | What nobody knows |
|------------------|-------------------|-------------------|
| Invite clicks    | Actual `guild_join` | Which click led to which install |

## The SDK-Only Solution

newttrace emits structured `guild_join` events with timestamps to Datadog. You correlate counts over the same time window.

### Setup

Just import and initialize. Nothing else is required.

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { initNewttrace, DatadogExporter } from "newttrace";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const newttrace = initNewttrace({
  botId: "my-bot",
  exporters: [
    new DatadogExporter({
      apiKey: process.env.DD_API_KEY!,
      service: "my-bot",
    }),
  ],
  auto: true,
  client,
});

client.login(process.env.DISCORD_TOKEN);
```

### Step 1: Check guild_join count in Datadog

Query for a specific time window:

```
@service:my-bot @event:guild_join
```

### Step 2: Get invite-click count from TOPGG

Check your TOPGG analytics dashboard for the same time window.

### Step 3: Compute conversion rate

| Metric | Source |
|--------|--------|
| Invite clicks | TOPGG dashboard |
| Actual installs | Datadog `guild_join` count |
| **Conversion rate** | installs / clicks |

You can also compute activation quality:

| Metric | Source |
|--------|--------|
| Installs | Datadog `guild_join` count |
| Activated servers | Datadog `guild_activated` count |
| **Activation rate** | activated / installs |

### Step 4: Compare sources

If you list on multiple bot sites, run separate campaigns per day:

| Day | Listing Site | Clicks | `guild_join` | Install Rate |
|-----|-------------|--------|--------------|--------------|
| Mon | TOPGG only  | 200    | 80           | 40%          |
| Tue | DBL only    | 150    | 90           | 60%          |

Datadog queries for each day:

```
@service:my-bot @event:guild_join @timestamp:[MONDAY_RANGE]
@service:my-bot @event:guild_join @timestamp:[TUESDAY_RANGE]
```

This tells you which listing drives better **actual installs**, not just clicks.

## Why this works

- **No databases** — events are stored in Datadog, not in the SDK
- **No servers** — the SDK runs entirely inside your existing bot process
- **No state to manage** — correlation happens at query time in Datadog, not in code
- **Zero config for attribution** — just install and compare counts

## What does NOT work

**Adding `source=topgg` to the Discord OAuth URL does nothing.** Discord strips unknown query parameters before the bot ever receives `guildCreate`. Verified by real test:

```
https://discord.com/oauth2/authorize?...&source=topgg
```

Result: `guildCreate` contains zero trace of `source` or `topgg`.

The only way to pass data through Discord OAuth is the `state` parameter, which requires a redirect server to intercept the callback.

## Conversion metrics you can compute

- **Install rate**: `guild_join` / bot-site clicks
- **Activation rate**: `guild_activated` / `guild_join`
- **Time-to-activation**: `avg(@meta.time_to_activation_ms)`
- **Source quality**: Compare `activation rate` across listing sites and campaigns

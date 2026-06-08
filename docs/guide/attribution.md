# Attribution

Track which invite sources lead to bot installs.

## The Problem

Discord's OAuth flow does **not** tell your bot where a user came from. When someone adds your bot from TOPGG, DiscordBotList, or Twitter, your bot just sees `guildCreate` — no source, no referrer, nothing.

newttrace gives you two ways to solve this:

1. **Time-window correlation** (default, zero infrastructure)
2. **Tracked invite URLs** (advanced, requires a redirect server)

## Approach 1: Time-Window Correlation

The default approach. No extra code, no servers, no databases.

### How it works

Run one bot listing site at a time. Count `guild_join` events in Datadog for that time window. Compare to the listing site's click count.

### Setup

Just install and configure the SDK:

```ts
import { initNewttrace, DatadogExporter } from "newttrace";

initNewttrace({
  botId: "my-bot",
  exporters: [
    new DatadogExporter({ apiKey: "...", service: "my-bot" }),
  ],
  auto: true,
  client,
});
```

### Example workflow

**Monday:** Set your TOPGG invite URL to your normal Discord OAuth URL. Run for 24 hours.

**Tuesday morning:** Check Datadog:
```
@service:my-bot @event:guild_join @timestamp:[2024-06-09T00:00:00Z TO 2024-06-10T00:00:00Z]
```
Result: 80 `guild_join` events.

Check TOPGG dashboard: 200 invite clicks.

**TOPGG install rate: 80 / 200 = 40%**

**Tuesday:** Switch to DiscordBotList only.

**Wednesday morning:** Check Datadog:
```
@service:my-bot @event:guild_join @timestamp:[2024-06-10T00:00:00Z TO 2024-06-11T00:00:00Z]
```
Result: 90 `guild_join` events.

Check DBL dashboard: 150 invite clicks.

**DBL install rate: 90 / 150 = 60%**

**Conclusion:** DBL converts better than TOPGG for this bot.

### What this gives you

| Question | Answer |
|----------|--------|
| Which listing site drives more installs? | Compare `guild_join` counts per day |
| Which listing has better conversion? | `guild_join` / listing clicks |
| Which listing sends more engaged users? | `guild_activated` / `guild_join` |

## What does NOT work

**Adding `source=topgg` to the Discord OAuth URL does nothing.** Discord strips unknown query parameters before the bot ever receives `guildCreate`. Verified by live test:

```
https://discord.com/oauth2/authorize?...&source=topgg
```

Result: `guildCreate` contains zero trace of `source` or `topgg`.

## Approach 2: Tracked Invite URLs (Advanced)

If you already run a web service and want per-guild attribution, the SDK can generate tracked invite URLs with the `state` parameter.

```ts
const url = newttrace.generateInviteUrl("CLIENT_ID", {
  campaignId: "summer_2024",
  permissions: "8",
});
// https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=8&state=campaign_summer_2024
```

**Important:** Discord only returns `state` if you provide a `redirect_uri` pointing to your own server. Without a redirect server, `state` is lost. See `example/topgg-redirect-server.ts` for a minimal implementation.

## Custom state store

For the redirect-server flow, you can provide your own storage:

```ts
import { initNewttrace } from "newttrace";

initNewttrace({
  botId: "my-bot",
  exporters: [...],
  attribution: {
    storage: new RedisStateStore(), // implement StateStore interface
  },
});
```

## StateStore interface

```ts
interface StateStore {
  get(state: string): string | undefined;
  set(state: string, campaignId: string): void;
  delete(state: string): void;
}
```

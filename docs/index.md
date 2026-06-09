# newttrace

Discord-native telemetry SDK. Track installs, activations, and attribution with one line of code. Send data anywhere — file, webhook, Datadog, Redis, Kafka, or NATS.

## Why newttrace?

| Approach | Setup | Cost | Know installs? | Per-guild attribution? | Track activation? |
|----------|-------|------|---------------|------------------------|-----------------|
| No tracking | None | $0 | No | No | No |
| TOPGG stats | 5 min | Free | No | No | No |
| Build your own | 2+ weeks | $100+/mo | Yes | Maybe | Hard |
| **newttrace** | 5 min | Free | Yes | Yes | Yes |

## The 30-second pitch

You write this once:

```ts
import { initNewttrace, FileExporter } from "newttrace";

initNewttrace({
  botId: "my-bot",
  exporters: [new FileExporter({ path: "./events.log" })], // free
  auto: true,
  client,
});
```

You get this forever:

```json
{
  "event": "guild_join",
  "timestamp": 1712345678901,
  "bot_id": "my-bot",
  "guild_id": "1234567890",
  "meta": { "guild_size": "small", "member_count": 42 }
}
```

**Swap one line** to send to Datadog, Better Stack, your API, or a message queue. The rest of your code never changes.

## Where to start

**New to analytics?** Start here:
- [Getting Started](/guide/getting-started) — Install, write 5 lines of code, see your first event in 5 minutes

**Want to know where users come from?**
- [Attribution](/guide/attribution) — Track TOPGG, Twitter, Reddit, or any custom source

**Already sending events and want to analyze them?**
- [Datadog Query Cookbook](/guide/datadog-queries) — 20+ ready-to-use queries

## Exporters

| Exporter | Cost | Best for |
|----------|------|----------|
| `FileExporter` | **Free** | Local dev, quick testing, self-hosted analysis |
| `WebhookExporter` | **Free** (usually) | Better Stack, Grafana, your own API, any JSON endpoint |
| `DatadogExporter` | Paid (Pro plan) | Managed dashboards, team sharing, alerts |
| `StreamExporter` | Varies | Redis, Kafka, NATS — real-time pipelines |

## No lock-in

newttrace normalizes Discord events into a simple JSON schema. You own the data. Switch exporters anytime without changing your bot logic.

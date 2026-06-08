# Exporters

Exporters receive normalized `TraceEvent` objects and send them to external systems. Multiple exporters can be used simultaneously.

## DatadogExporter

The primary integration. Sends events as structured logs to Datadog's HTTP logs intake.

```ts
new DatadogExporter({
  apiKey: process.env.DD_API_KEY!,  // Required
  service: "discord-bot",            // Required. Appears as service in Datadog
  site: "datadoghq.com",             // Optional. Default: "datadoghq.com"
  hostname?: "my-host",              // Optional
  tags?: { env: "production" },      // Optional. Static tags added to every event
});
```

### Datadog event format

Each event is sent to `https://http-intake.logs.{site}/api/v2/logs` as:

```json
{
  "message": "guild_join",
  "ddsource": "newttrace",
  "service": "discord-bot",
  "status": "info",
  "timestamp": 1712345678901,
  "attributes": {
    "guild_id": "xxx",
    "source": "campaign_1",
    "bot_id": "my-bot",
    "version": "1.0.0",
    "guild_size": "small",
    "region": "us-east",
    "env": "production"
  }
}
```

### Datadog query examples

**All guild joins:**
```
@service:discord-bot @event:guild_join
```

**Guild joins from a specific source:**
```
@service:discord-bot @event:guild_join @attributes.source:campaign_1
```

**Activation rate:**
Build a dashboard widget with:
- `count(@event:guild_activated)` / `count(@event:guild_join)`

**Average time to activation:**
```
avg(@attributes.time_to_activation_ms)
```

### EU accounts

If your Datadog account is on the EU datacenter:

```ts
new DatadogExporter({
  apiKey: process.env.DD_API_KEY!,
  service: "discord-bot",
  site: "datadoghq.eu",
});
```

## WebhookExporter

Posts raw JSON events to any HTTP endpoint. Useful for sending events to your own API, Segment, or analytics platforms.

```ts
new WebhookExporter({
  url: "https://your-api.com/newttrace",
  headers?: {
    "Authorization": "Bearer token",
    "X-Custom-Header": "value",
  },
});
```

### Payload format

The raw `TraceEvent` is POSTed as JSON:

```json
{
  "event": "guild_join",
  "timestamp": 1712345678901,
  "bot_id": "my-bot",
  "guild_id": "123456789",
  "source": "campaign_1",
  "version": "1.0.0",
  "meta": {
    "guild_size": "small",
    "region": "us-east"
  }
}
```

## FileExporter

Appends newline-delimited JSON to a local file. Useful for development and debugging.

```ts
new FileExporter({ path: "./newttrace.log" });
```

### Output format

Each line is a JSON event:

```
{"event":"guild_join","timestamp":1712345678901,...}
{"event":"interaction","timestamp":1712345678902,...}
```

Tail the file in real time:

```bash
tail -f newttrace.log | jq .
```

## StreamExporter

Sends events to message brokers. Requires the corresponding client package to be installed separately.

```ts
new StreamExporter({
  type: "redis",
  url: "redis://localhost:6379",
  channel: "newttrace",  // for redis
});
```

### Supported types

| Type | Required package | Config field | Description |
|------|-----------------|-------------|-------------|
| `redis` | `redis` | `channel` | Redis pub/sub channel |
| `kafka` | `kafkajs` | `topic` | Kafka topic name |
| `nats` | `nats` | `topic` | NATS subject name |

### Redis example

```bash
npm install redis
```

```ts
new StreamExporter({
  type: "redis",
  url: "redis://localhost:6379",
  channel: "bot-events",
});
```

### Kafka example

```bash
npm install kafkajs
```

```ts
new StreamExporter({
  type: "kafka",
  url: "localhost:9092",
  topic: "bot-events",
});
```

### NATS example

```bash
npm install nats
```

```ts
new StreamExporter({
  type: "nats",
  url: "nats://localhost:4222",
  topic: "bot-events",
});
```

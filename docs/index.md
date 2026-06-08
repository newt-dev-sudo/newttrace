# newttrace

Discord-native telemetry SDK for structured lifecycle analytics.

![newttrace logo](/newttrace.png)

## Overview

newttrace converts Discord runtime events into structured, exportable telemetry data. Track installs, activations, and attributions without managing infrastructure.

## Documentation

### Guides

- [Getting Started](/guide/getting-started) — Installation, configuration, and first events
- [Activation Tracking](/guide/activation) — Measure meaningful bot engagement
- [Attribution](/guide/attribution) — Track install sources with zero or minimal infrastructure
- [TOPGG Conversion Tracking](/guide/topgg) — Correlate listing clicks with actual installs

### API Reference

- [Exporters](/reference/exporters) — Datadog, Webhook, File, Stream
- [API](/reference/api) — SDK methods and type definitions

## Quick Start

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

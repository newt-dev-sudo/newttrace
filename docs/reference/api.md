# API Reference

## `initNewttrace(config)`

Initialize the SDK with automatic Discord client hooks.

```ts
import { initNewttrace } from "newttrace";

const newttrace = initNewttrace({
  botId: "my-bot",
  version: "1.0.0",
  exporters: [
    new DatadogExporter({ apiKey: "...", service: "my-bot" }),
  ],
  auto: true,
  client,
});
```

Returns a `NewttraceSDK` instance with hooks already attached.

## `NewttraceSDK`

### `init(client?)`

Attach event listeners to a Discord client. Called automatically by `initNewttrace` if `auto: true`.

```ts
const sdk = new NewttraceSDK(config);
sdk.init(client); // manual init if auto: false
```

### `trace(eventName, meta?, guildId?)`

Emit a custom event with optional metadata and guild ID.

```ts
// Simple event
newttrace.trace("premium_upgrade");

// With metadata
newttrace.trace("premium_upgrade", {
  userId: "123",
  tier: "pro",
});

// With metadata and guild ID
newttrace.trace("premium_upgrade", { tier: "pro" }, interaction.guildId);
```

**Parameters:**
- `eventName: string` — Event type (e.g., `"premium_upgrade"`)
- `meta?: Record<string, unknown>` — Arbitrary metadata attached to the event
- `guildId?: string` — Optional guild ID to link the event to a server

### `traceCommand(interaction, commandName)`

Explicitly track a command usage. Emits a `command_used` event.

```ts
newttrace.traceCommand(interaction, "play");
```

**Parameters:**
- `interaction: Interaction` — Discord interaction object
- `commandName: string` — Name of the command executed

### `generateInviteUrl(clientId, options)`

Generate a Discord OAuth invite URL with campaign attribution via the `state` parameter.

```ts
const url = newttrace.generateInviteUrl("123456789", {
  campaignId: "summer_2024",
  permissions: "8",
  scopes: ["bot", "applications.commands"],
});
```

**Parameters:**
- `clientId: string` — Your Discord application's client ID
- `options:`
  - `permissions?: string` — Discord permission integer. Default: `"0"`
  - `scopes?: string[]` — OAuth scopes. Default: `["bot"]`
  - `campaignId?: string` — Campaign identifier stored in `state`
  - `redirectUri?: string` — OAuth redirect URI (required for `state` to be returned)

**Returns:** `string` — The complete Discord OAuth URL

**Note:** Without a `redirectUri`, Discord does not return `state` to the bot. The `guildCreate` event will not contain attribution data. See the Attribution guide for details.

### `shutdown()`

Remove Discord event listeners and clean up internal state.

```ts
process.on("SIGINT", () => {
  newttrace.shutdown();
  client.destroy();
});
```

## Type Exports

### `TraceEvent`

The normalized event object sent to all exporters:

```ts
interface TraceEvent {
  event: string;           // Event name: "guild_join", "interaction", etc.
  timestamp: number;       // Unix timestamp in milliseconds
  bot_id: string;          // Your botId from config
  guild_id?: string;       // Guild ID, if applicable
  source?: string;          // Attribution source, if resolved
  version: string;         // SDK version from config
  meta: Record<string, unknown>; // Event-specific metadata
}
```

### `Exporter`

Implement this interface to create a custom exporter:

```ts
interface Exporter {
  send(event: TraceEvent): Promise<void>;
}
```

### `NewttraceConfig`

```ts
interface NewttraceConfig {
  botId: string;
  version?: string;
  exporters: Exporter[];
  auto?: boolean;
  client?: Client;
  attribution?: {
    enabled?: boolean;
    storage?: StateStore;
    guildStore?: GuildStore;
  };
}
```

### `StateStore`

For the advanced redirect-server attribution flow:

```ts
interface StateStore {
  get(state: string): string | undefined;
  set(state: string, campaignId: string): void;
  delete(state: string): void;
}
```

### `GuildStore`

Maps guild IDs to attribution sources. Used with `recordGuildSource()` / `resolveGuildSource()`:

```ts
interface GuildStore {
  get(guildId: string): string | undefined;
  set(guildId: string, source: string): void;
  delete(guildId: string): void;
}
```

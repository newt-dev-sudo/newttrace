# newttrace Redirect Server (Cloudflare Worker)

Per-install attribution server. Tracks which platform each bot install came from.

**Cost: $0** — Cloudflare Workers free tier covers 100,000 requests/day.

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- Your Discord application's [Client ID](https://discord.com/developers/applications)

## Step-by-step deployment

### 1. Install dependencies

```bash
cd templates/cloudflare-worker
npm install
```

### 2. Log in to Cloudflare

```bash
npx wrangler login
```

This opens a browser tab. Authorize Wrangler and return to the terminal.

### 3. Create a KV namespace

```bash
npx wrangler kv:namespace create NEWTTRACE_KV
```

Output looks like:
```
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "NEWTTRACE_KV"
id = "cb80c7cec1d3461495065993276e6706"
```

Copy the `id` into `wrangler.toml`, replacing `your-kv-namespace-id`:

```toml
[[kv_namespaces]]
binding = "NEWTTRACE_KV"
id = "cb80c7cec1d3461495065993276e6706"
```

### 4. Deploy the worker

```bash
npx wrangler deploy
```

Output:
```
Uploaded newttrace-redirect
Deployed newttrace-redirect triggers
  https://newttrace-redirect.yourname.workers.dev
```

**Save this URL.** You will need it for the next steps.

### 5. Set secrets

The worker needs two secrets to build Discord OAuth URLs.

**Discord Client ID:**
```bash
npx wrangler secret put DISCORD_CLIENT_ID
```
Paste your Discord application's Client ID when prompted.

**Discord Redirect URI:**
```bash
npx wrangler secret put DISCORD_REDIRECT_URI
```
Paste your worker URL with `/callback` appended. Example:
```
https://newttrace-redirect.yourname.workers.dev/callback
```

### 6. Register the redirect URI with Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** → **Redirects**
4. Click **Add Redirect**
5. Paste your callback URL:
   ```
   https://newttrace-redirect.yourname.workers.dev/callback
   ```
6. Click **Save Changes**

## Bot configuration

### Option A: HTTP lookup (no shared database)

```ts
import { initNewttrace, DatadogExporter, HttpGuildStore } from "newttrace";

const newttrace = initNewttrace({
  botId: "my-bot",
  exporters: [new DatadogExporter({ apiKey: "...", service: "my-bot" })],
  auto: true,
  client,
  attribution: {
    guildStore: new HttpGuildStore("https://newttrace-redirect.yourname.workers.dev"),
  },
});
```

### Option B: Shared Redis (faster)

```ts
import { initNewttrace, DatadogExporter, RedisGuildStore } from "newttrace";

const newttrace = initNewttrace({
  botId: "my-bot",
  exporters: [new DatadogExporter({ apiKey: "...", service: "my-bot" })],
  auto: true,
  client,
  attribution: {
    guildStore: new RedisGuildStore("redis://..."),
  },
});
```

## Generating tracked invite URLs

```ts
const url = newttrace.generateInviteUrl("CLIENT_ID", {
  campaignId: "topgg",
  permissions: "8",
  redirectUri: "https://newttrace-redirect.yourname.workers.dev/callback",
});
```

Each call generates a unique UUID for per-install tracking.

## How it works

```
User clicks: /install?source=topgg
      ↓
Worker generates UUID, stores {uuid: "topgg"} in KV
      ↓
Worker redirects to Discord OAuth with state=uuid
      ↓
Discord redirects back to /callback?state=uuid&guild_id=...
      ↓
Worker looks up uuid → "topgg", stores guild_id → "topgg" in KV
      ↓
Bot's guildCreate handler asks Worker: "who added guild X?"
      ↓
Worker responds: "topgg"
      ↓
Bot emits guild_join event with source: "topgg" to Datadog
```

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

For **per-guild attribution** — knowing exactly which server came from TOPGG vs DiscordBotList — you need a redirect server.

### How it works

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

### Architecture

| Layer | Responsibility |
|-------|---------------|
| **Acquisition** | Tracked URLs (`/install?source=topgg`) |
| **Attribution** | UUID→source mapping, callback resolution |
| **Telemetry** | Bot emits `guild_join` with resolved `source` |

### Prerequisites

Before starting, you need:

- A [Discord application](https://discord.com/developers/applications) with a bot user
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- Your Discord application's **Client ID** (found in Discord Developer Portal)

### Step 1: Get the template and deploy

The Cloudflare Worker template is in the GitHub repository, not the npm package. Clone the repo to get it:

```bash
git clone https://github.com/newt-dev-sudo/newttrace.git
cd newttrace/templates/cloudflare-worker
npm install
```

Log in to Cloudflare:
```bash
npx wrangler login
```

Create a KV namespace:
```bash
npx wrangler kv:namespace create NEWTTRACE_KV
```

Copy the printed `id` into `wrangler.toml`, replacing `your-kv-namespace-id`.

Deploy:
```bash
npx wrangler deploy
```

Output:
```
Deployed newttrace-redirect triggers
  https://newttrace-redirect.yourname.workers.dev
```

**Save this URL.**

### Step 2: Set secrets

```bash
npx wrangler secret put DISCORD_CLIENT_ID
```
Paste your Discord application's Client ID.

```bash
npx wrangler secret put DISCORD_REDIRECT_URI
```
Paste your worker URL with `/callback`:
```
https://newttrace-redirect.yourname.workers.dev/callback
```

### Step 3: Register with Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → **OAuth2** → **Redirects**
3. Click **Add Redirect**
4. Paste your callback URL:
   ```
   https://newttrace-redirect.yourname.workers.dev/callback
   ```
5. Click **Save Changes**

### Step 4: Configure the bot

**Option A: HTTP lookup (no shared database)**

```ts
import { initNewttrace, DatadogExporter, HttpGuildStore } from "newttrace";

const newttrace = initNewttrace({
  botId: "my-bot",
  exporters: [
    new DatadogExporter({
      apiKey: process.env.DD_API_KEY!,
      service: "my-bot",
      site: "datadoghq.eu", // use "datadoghq.com" for US accounts
    }),
  ],
  auto: true,
  client,
  attribution: {
    guildStore: new HttpGuildStore("https://newttrace-redirect.yourname.workers.dev"),
  },
});
```

**Option B: Shared Redis (faster)**

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

### Step 5: Generate tracked invite URLs

For each platform or campaign, use the worker's `/install` endpoint directly:

```
# Bot listing sites
https://newttrace-redirect.yourname.workers.dev/install?source=topgg
https://newttrace-redirect.yourname.workers.dev/install?source=discordbotlist

# Social and community
https://newttrace-redirect.yourname.workers.dev/install?source=twitter
https://newttrace-redirect.yourname.workers.dev/install?source=reddit
https://newttrace-redirect.yourname.workers.dev/install?source=github

# Your own properties
https://newttrace-redirect.yourname.workers.dev/install?source=website
https://newttrace-redirect.yourname.workers.dev/install?source=newsletter

# With campaign tracking
https://newttrace-redirect.yourname.workers.dev/install?source=topgg&campaign=summer_2024
```

**Any source string works.** Use whatever naming convention makes sense for your analytics. The value is stored as-is in the `source` attribute of your Datadog events.

Or generate programmatically:

```ts
const url = newttrace.generateInviteUrl("CLIENT_ID", {
  campaignId: "topgg",
  permissions: "8",
  redirectUri: "https://newttrace-redirect.yourname.workers.dev/callback",
});
```

Each call generates a **new UUID** for per-install tracking.

### Step 6: Verify in Datadog

After adding the bot through a tracked URL, query Datadog:

```
@service:my-bot @event:guild_join
```

Check the `source` attribute:
- `source:topgg` — came from TOPGG
- `source:dbl` — came from DiscordBotList
- `source:unknown` — guildCreate without prior tracked install

## Troubleshooting

### "Install session expired or invalid"

The user clicked a Discord OAuth URL directly instead of going through `/install`. The worker must generate the UUID and store it first.

**Fix:** Always direct users to the worker URL:
```
https://your-worker.workers.dev/install?source=topgg
```

### Datadog returns 403 Forbidden

Your Datadog account is on the EU datacenter. Add `site: "datadoghq.eu"`:

```ts
new DatadogExporter({
  apiKey: "...",
  service: "my-bot",
  site: "datadoghq.eu",
})
```

### "source" is always "unknown"

The bot's `guildCreate` fired before the callback completed, or the worker and bot are using different storage (e.g., worker uses KV, bot uses in-memory).

**Fix:** Ensure both use the same storage backend (HttpGuildStore or RedisGuildStore).

### Events show old attribution value

Multiple bot instances are running. Only one should be running at a time.

**Fix:** Kill all node processes before restarting:
```bash
taskkill /F /IM node.exe    # Windows
pkill -f node                # macOS/Linux
```

## StateStore interface

For custom storage backends:

```ts
interface StateStore {
  get(state: string): string | undefined;
  set(state: string, campaignId: string): void;
  delete(state: string): void;
}
```

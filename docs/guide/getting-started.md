# Getting Started

This guide takes you from zero to your first tracked Discord event in about 5 minutes. No prior analytics experience needed.

**What you will learn:**
- How to install newttrace
- Where to send your bot's data (and how to pick)
- How to write the minimal code
- How to verify it works

---

## Before You Start

You need two things:

1. **A Discord bot token** — Get this from [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Reset Token
2. **Node.js installed** — Run `node --version`. You need v18 or higher.

That is it. You do not need a cloud account or a database to begin.

---

## Step 1: Install

Open your terminal in your bot's project folder and run:

```bash
npm install newttrace discord.js
```

If you do not have a project folder yet, create one:

```bash
mkdir my-bot
cd my-bot
npm init -y
npm install newttrace discord.js
```

---

## Step 2: Pick Where Your Data Goes

newttrace sends your bot's events to a destination of your choice. You can change this later without changing any other code.

| If you want... | Use this exporter | Cost | Setup |
|----------------|-------------------|------|-------|
| The fastest way to see events | `FileExporter` | **Free** | One line |
| A free cloud dashboard | `WebhookExporter` → Better Stack | **Free** (1GB/month) | Sign up, paste URL |
| A managed enterprise dashboard | `DatadogExporter` | Paid (Pro plan) | API key |
| Your own API or database | `WebhookExporter` | Free (you host) | Your own URL |
| Real-time streaming | `StreamExporter` | Varies | Redis/Kafka/NATS |

**Recommendation for beginners:** Start with `FileExporter`. It writes events to a file on your computer. No accounts, no APIs, no cost. Once you see events flowing, swap to a cloud service if you want dashboards.

---

## Step 3: Write Your Bot File

Create a file named `bot.ts` in your project folder. Paste the code below for your chosen exporter.

### Option A: FileExporter (recommended for beginners)

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { initNewttrace, FileExporter } from "newttrace";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

initNewttrace({
  botId: "my-bot",
  exporters: [new FileExporter({ path: "./events.log" })],
  auto: true,
  client,
});

client.login(process.env.DISCORD_TOKEN);
```

### Option B: Better Stack (free cloud dashboard)

1. Sign up at [betterstack.com](https://betterstack.com)
2. Create a new source and copy the ingestion URL
3. Paste it below:

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { initNewttrace, WebhookExporter } from "newttrace";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

initNewttrace({
  botId: "my-bot",
  exporters: [
    new WebhookExporter({
      url: "https://in.logs.betterstack.com",
      headers: { Authorization: "Bearer your-source-token" },
    }),
  ],
  auto: true,
  client,
});

client.login(process.env.DISCORD_TOKEN);
```

### Option C: Datadog (paid, full-featured)

Requires a Datadog Pro plan. The free tier does not include log ingestion.

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { initNewttrace, DatadogExporter } from "newttrace";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

initNewttrace({
  botId: "my-bot",
  exporters: [
    new DatadogExporter({
      apiKey: process.env.DD_API_KEY!,
      service: "my-bot",
      site: "datadoghq.com",
    }),
  ],
  auto: true,
  client,
});

client.login(process.env.DISCORD_TOKEN);
```

**What is `botId`?** Any name you make up to identify your bot. Examples: `"music-bot"`, `"mod-bot-prod"`, `"v2"`. It appears in every event so you can filter later.

---

## Step 4: Add Your Environment Variables

Your Discord token is a secret. Never paste it directly into your code.

Create a file named `.env` in the same folder as `bot.ts`:

```env
DISCORD_TOKEN=your-bot-token-goes-here
```

If using Datadog, also add:

```env
DISCORD_TOKEN=your-bot-token-goes-here
DD_API_KEY=your-datadog-api-key
```

Install the dotenv package so your code can read this file:

```bash
npm install dotenv
```

Add this line at the very top of `bot.ts`:

```ts
import "dotenv/config";
```

**Important:** Add `.env` to your `.gitignore` file so you never accidentally upload your token to GitHub.

```bash
echo ".env" >> .gitignore
```

---

## Step 5: Run Your Bot

```bash
npx ts-node bot.ts
```

You should see:

```
Logged in as MyBot#1234
```

Your bot is now running and newttrace is listening for events.

---

## Step 6: See Your First Event

### If you chose FileExporter

In a new terminal window, run:

```bash
cat events.log | jq .
```

Or on Windows without `jq`:

```bash
type events.log
```

You will see a JSON line like this:

```json
{
  "event": "guild_join",
  "timestamp": 1712345678901,
  "bot_id": "my-bot",
  "guild_id": "1234567890123456789",
  "source": "unknown",
  "version": "1.0.0",
  "meta": {
    "guild_size": "small",
    "member_count": 42,
    "region": "en-US",
    "shard": 0
  }
}
```

Each time your bot joins or leaves a server, or someone uses a command, a new line appears.

### If you chose Better Stack

Open your Better Stack dashboard. Events appear under your source within a few seconds.

### If you chose Datadog

Open Datadog → Logs. Search:

```
@service:my-bot @event:guild_join
```

Allow 10–30 seconds for ingestion.

---

## How It Works

When your bot starts with `auto: true`, newttrace silently attaches listeners to three Discord.js events:

| Discord.js event | newttrace event | What it means |
|------------------|-----------------|---------------|
| `guildCreate` | `guild_join` | Your bot was added to a server |
| `guildDelete` | `guild_leave` | Your bot was removed from a server |
| `interactionCreate` | `interaction` | Someone used a slash command or button |
| `interactionCreate` (first per guild) | `guild_activated` | A new server used your bot for the first time |

You do not need to change your command handlers. The SDK captures everything automatically.

---

## What If I Want to Change Destinations Later?

Change one line. The rest of your code stays the same.

```ts
// Before
exporters: [new FileExporter({ path: "./events.log" })]

// After — swap to Datadog
exporters: [new DatadogExporter({ apiKey: "...", service: "my-bot" })]

// Or send to both
exporters: [
  new FileExporter({ path: "./events.log" }),
  new DatadogExporter({ apiKey: "...", service: "my-bot" }),
]
```

Events are sent to all exporters in parallel.

---

## Manual Tracking

For events newttrace does not capture automatically, like a user upgrading to premium:

```ts
newttrace.trace("premium_upgrade", { tier: "pro" }, guildId);
```

This emits a custom event with your metadata included.

---

## Security Checklist

- [ ] Discord token is in `.env`, not in code
- [ ] `.env` is in `.gitignore`
- [ ] `.env` is never committed to GitHub

**If you accidentally expose a token:**
1. Go to Discord Developer Portal → Bot → Reset Token immediately
2. Update your `.env` file with the new token
3. If you pushed to GitHub, also check `git log -p | grep -i token`

---

## What newttrace Does NOT Collect

- Message content (unless you explicitly send it via `trace()`)
- User emails, real names, or personal data
- Server invite links

It only captures: guild ID, member count, region, and interaction metadata (command name, user ID).

---

## Troubleshooting

**"Events not appearing"**

Check that your bot has the `Guilds` intent:

```ts
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
```

**"Datadog shows nothing"**

- Verify your API key is correct
- EU accounts need `site: "datadoghq.eu"`
- Wait 30 seconds for ingestion
- Ensure you are on a Pro plan or higher (free tier does not include logs)

**"Permission denied on events.log"**

Make sure your bot script has write permissions to the folder, or specify an absolute path:

```ts
new FileExporter({ path: "C:/Users/You/bot/events.log" })
```

---

## Next Steps

Now that you have events flowing, you can:

- **[Track where users come from](/guide/attribution)** — Did they find your bot on TOPGG, Twitter, or your website?
- **[Measure activation](/guide/activation)** — Are new servers actually using your bot or just adding it?
- **[Query your data](/guide/datadog-queries)** — Ready-to-use searches for installs, churn, and attribution

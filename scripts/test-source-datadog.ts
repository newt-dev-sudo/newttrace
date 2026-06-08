/**
 * Test whether arbitrary query params survive Discord OAuth,
 * but this time we log the result to Datadog so you can inspect it.
 *
 * Setup:
 *   $env:DISCORD_TOKEN="your-bot-token"
 *   $env:DD_API_KEY="your-datadog-api-key"
 *   $env:DD_SITE="datadoghq.eu"
 *
 * Run:
 *   npx ts-node scripts/test-source-datadog.ts
 *
 * Then visit:
 *   https://discord.com/oauth2/authorize?client_id=1511848581651501196&scope=bot&permissions=8&source=topgg
 *
 * Add the bot to a server.
 * Check Datadog in ~30 seconds for the event.
 */

import { Client, GatewayIntentBits } from "discord.js";
import { NewttraceSDK, DatadogExporter } from "../src";

const token = process.env.DISCORD_TOKEN;
const ddApiKey = process.env.DD_API_KEY;

if (!token || !ddApiKey) {
  console.error("Missing DISCORD_TOKEN or DD_API_KEY");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const sdk = new NewttraceSDK({
  botId: "source-test-bot",
  version: "1.0.0",
  exporters: [
    new DatadogExporter({
      apiKey: ddApiKey,
      service: "source-test-bot",
      site: process.env.DD_SITE ?? "datadoghq.com",
    }),
  ],
});

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  console.log("\nTest URL:");
  console.log(
    `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&scope=bot&permissions=8&source=topgg`
  );
  console.log("\nAdd the bot to a server, then check Datadog in ~30 seconds.\n");
});

client.on("guildCreate", async (guild) => {
  console.log(`guildCreate fired: ${guild.name} (${guild.id})`);

  // Dispatch a custom event with all guild fields as metadata
  // so we can inspect in Datadog whether "source" or "topgg" appears anywhere
  await (sdk as any).dispatch({
    event: "source_param_test",
    timestamp: Date.now(),
    bot_id: client.user?.id ?? "unknown",
    guild_id: guild.id,
    version: "1.0.0",
    meta: {
      guild_name: guild.name,
      guild_ownerId: guild.ownerId,
      guild_memberCount: guild.memberCount,
      guild_preferredLocale: guild.preferredLocale,
      guild_shardId: guild.shardId,
      guild_features: guild.features,
      // The key test: did Discord pass any of our custom params?
      contains_source_in_json: JSON.stringify(guild).includes("source"),
      contains_topgg_in_json: JSON.stringify(guild).includes("topgg"),
    },
  });

  console.log("Event dispatched to Datadog.");
  console.log("Search: @service:source-test-bot @event:source_param_test");

  sdk.shutdown();
  client.destroy();
  process.exit(0);
});

client.login(token);

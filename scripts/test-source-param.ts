/**
 * Test whether arbitrary query params (like source=) survive Discord OAuth.
 *
 * What this does:
 * 1. Logs into Discord as your bot
 * 2. Waits for guildCreate
 * 3. Prints EVERY field in the guild object + any metadata
 * 4. You check if "source", "topgg", or any attribution data is present
 *
 * To test:
 * 1. Set DISCORD_TOKEN env var
 * 2. Run: npx ts-node scripts/test-source-param.ts
 * 3. Visit this URL in your browser (logged into Discord):
 *    https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=8&source=topgg
 * 4. Add the bot to a test server
 * 5. Check the console output — look for "source" anywhere
 */

import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  console.log(`Client ID: ${client.user?.id}`);
  console.log("\n--- Build your test URL ---");
  console.log(
    `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&scope=bot&permissions=8&source=topgg`
  );
  console.log("\nAdd the bot to a server, then check the guildCreate output below.\n");
});

client.on("guildCreate", (guild) => {
  console.log("\n========== GUILD CREATE EVENT ==========");
  console.log("guild.id:", guild.id);
  console.log("guild.name:", guild.name);
  console.log("guild.ownerId:", guild.ownerId);
  console.log("guild.memberCount:", guild.memberCount);
  console.log("\n--- Full guild object keys ---");
  console.log(Object.keys(guild).sort().join(", "));
  console.log("\n--- Raw guild object (JSON) ---");
  console.log(
    JSON.stringify(
      {
        id: guild.id,
        name: guild.name,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
        preferredLocale: guild.preferredLocale,
        shardId: guild.shardId,
      },
      null,
      2
    )
  );
  console.log("\n--- Looking for 'source' or 'topgg' anywhere ---");
  const fullJson = JSON.stringify(guild);
  console.log("Contains 'source':", fullJson.includes("source"));
  console.log("Contains 'topgg':", fullJson.includes("topgg"));
  console.log("==========================================\n");

  // Exit after first guild create for clean test
  client.destroy();
  process.exit(0);
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("Missing DISCORD_TOKEN environment variable");
  process.exit(1);
}

client.login(token);

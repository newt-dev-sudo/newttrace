import { Client, GatewayIntentBits } from "discord.js";
import {
  initNewttrace,
  DatadogExporter,
  WebhookExporter,
  FileExporter,
} from "../src";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const newttrace = initNewttrace({
  botId: "my-discord-bot",
  version: "1.2.0",
  exporters: [
    new DatadogExporter({
      apiKey: process.env.DD_API_KEY!,
      service: "discord-bot",
    }),
    new WebhookExporter({
      url: "https://your-api.com/newttrace",
    }),
    new FileExporter({
      path: "./newttrace.log",
    }),
  ],
  auto: true,
  client,
});

// Generate an invite URL with campaign attribution
const inviteUrl = newttrace.generateInviteUrl("123456789", {
  campaignId: "summer_2024",
  permissions: "8",
});
console.log("Invite URL:", inviteUrl);

// Manual tracking
client.on("messageCreate", (message) => {
  if (message.content === "!ping") {
    newttrace.trace("custom_event", {
      command: "ping",
      userId: message.author.id,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", () => {
  newttrace.shutdown();
  client.destroy();
  process.exit(0);
});

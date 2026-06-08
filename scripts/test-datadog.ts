import { NewttraceSDK, DatadogExporter } from "../src";

async function main() {
  const apiKey = process.env.DD_API_KEY;
  if (!apiKey) {
    console.error("Missing DD_API_KEY environment variable");
    console.error("Set it with: $env:DD_API_KEY='your-key-here' (PowerShell)");
    process.exit(1);
  }

  const site = process.env.DD_SITE ?? "datadoghq.com";
  console.log(`Using Datadog site: ${site}`);

  const sdk = new NewttraceSDK({
    botId: "test-bot",
    version: "1.0.0",
    exporters: [
      new DatadogExporter({
        apiKey,
        service: "newttrace-smoke-test",
        site,
      }),
    ],
  });

  console.log("Sending test event to Datadog...");

  await (sdk as any).dispatch({
    event: "guild_join",
    timestamp: Date.now(),
    bot_id: "test-bot",
    guild_id: "test-guild-123",
    source: "campaign_smoke_test",
    version: "1.0.0",
    meta: {
      guild_size: "small",
      region: "us-east",
      member_count: 42,
    },
  });

  console.log("Event dispatched.");
  console.log("Check Datadog in 10–30 seconds: Logs → Search for 'service:newttrace-smoke-test'");

  sdk.shutdown();
}

main().catch(console.error);

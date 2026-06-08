/**
 * Minimal Express server for TOPGG OAuth callback attribution.
 *
 * This server sits between TOPGG and Discord OAuth.
 * It receives the OAuth callback, resolves the campaign source,
 * records the guild→source mapping, then redirects the user to Discord.
 *
 * Flow:
 * 1. TOPGG listing invite URL → this server /invite?source=topgg
 * 2. This server redirects to Discord OAuth with state=campaign_topgg
 * 3. Discord redirects back to this server /callback?state=...&guild_id=...
 * 4. This server records guild_id → "topgg" in the shared guild store
 * 5. Bot's guildCreate handler reads the source from the same store
 */

import express from "express";
import { AttributionTracker, InMemoryGuildStore } from "../src";

const app = express();
const PORT = 3000;

// Shared attribution tracker — in production use Redis or a database
const attribution = new AttributionTracker({
  guildStore: new InMemoryGuildStore(),
});

const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "YOUR_CLIENT_ID";
const REDIRECT_URI = process.env.REDIRECT_URI ?? `http://localhost:${PORT}/callback`;

// Step 1: TOPGG invite button hits this endpoint
app.get("/invite", (req, res) => {
  const source = (req.query.source as string) ?? "unknown";

  const inviteUrl = attribution.generateInviteUrl(CLIENT_ID, {
    campaignId: source,
    redirectUri: REDIRECT_URI,
    permissions: "8",
  });

  res.redirect(inviteUrl);
});

// Step 2: Discord OAuth redirects back here after authorization
app.get("/callback", (req, res) => {
  const state = req.query.state as string | undefined;
  const guildId = req.query.guild_id as string | undefined;

  if (!guildId) {
    res.status(400).send("Missing guild_id");
    return;
  }

  // Resolve state → source (e.g., "campaign_topgg" → "topgg")
  const source = attribution.resolveSource(state) ?? "unknown";

  // Record guild → source so the bot can pick it up on guildCreate
  attribution.recordGuildSource(guildId, source);

  console.log(`[Attribution] Guild ${guildId} → source: ${source}`);

  // Redirect user to their new server or a success page
  res.redirect(`https://discord.com/channels/${guildId}`);
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Attribution redirect server running on http://localhost:${PORT}`);
  console.log(`Invite URL for TOPGG: http://localhost:${PORT}/invite?source=topgg`);
});

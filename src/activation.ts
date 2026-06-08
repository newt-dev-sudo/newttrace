import { Interaction } from "discord.js";
import { TraceEvent } from "./types";

interface GuildJoinRecord {
  timestamp: number;
  source?: string;
}

export class ActivationTracker {
  private joins = new Map<string, GuildJoinRecord>();
  private activatedGuilds = new Set<string>();

  recordJoin(guildId: string, source?: string): void {
    if (this.joins.has(guildId) || this.activatedGuilds.has(guildId)) return;
    this.joins.set(guildId, { timestamp: Date.now(), source });
  }

  recordInteraction(
    guildId: string,
    interaction: Interaction
  ): TraceEvent | null {
    if (!guildId || this.activatedGuilds.has(guildId)) return null;

    const join = this.joins.get(guildId);
    if (!join) return null;

    this.activatedGuilds.add(guildId);
    this.joins.delete(guildId);

    const activationTime = Date.now();
    const timeToActivation = activationTime - join.timestamp;

    return {
      event: "guild_activated",
      timestamp: activationTime,
      bot_id: interaction.client.user?.id ?? "unknown",
      guild_id: guildId,
      source: join.source,
      version: "1.0.0",
      meta: {
        time_to_activation_ms: timeToActivation,
        first_command:
          "commandName" in interaction ? interaction.commandName : undefined,
        interaction_type: interaction.type,
        user_id: interaction.user?.id,
      },
    };
  }

  getPendingCount(): number {
    return this.joins.size;
  }
}

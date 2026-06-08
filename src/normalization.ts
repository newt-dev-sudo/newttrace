import { Guild, Interaction } from "discord.js";
import {
  TraceEvent,
  NormalizedGuildData,
  NormalizedInteractionData,
} from "./types";

export function normalizeGuild(
  guild: Guild,
  base: Partial<TraceEvent> = {}
): TraceEvent {
  const guildData = extractGuildData(guild);

  return {
    event: "guild_join",
    timestamp: Date.now(),
    bot_id: base.bot_id ?? guild.client.user?.id ?? "unknown",
    guild_id: guildData.guild_id,
    source: base.source ?? "unknown",
    version: base.version ?? "1.0.0",
    meta: {
      ...base.meta,
      guild_size: guildData.guild_size,
      region: guildData.region,
      shard: guildData.shard,
      member_count: guildData.member_count,
    },
  };
}

export function normalizeGuildDelete(
  guild: Guild,
  base: Partial<TraceEvent> = {}
): TraceEvent {
  const guildData = extractGuildData(guild);

  return {
    event: "guild_leave",
    timestamp: Date.now(),
    bot_id: base.bot_id ?? guild.client.user?.id ?? "unknown",
    guild_id: guildData.guild_id,
    source: base.source ?? "unknown",
    version: base.version ?? "1.0.0",
    meta: {
      ...base.meta,
      guild_size: guildData.guild_size,
      region: guildData.region,
      shard: guildData.shard,
      member_count: guildData.member_count,
    },
  };
}

export function normalizeInteraction(
  interaction: Interaction,
  base: Partial<TraceEvent> = {}
): TraceEvent {
  const data = extractInteractionData(interaction);

  return {
    event: "interaction",
    timestamp: Date.now(),
    bot_id: base.bot_id ?? interaction.client.user?.id ?? "unknown",
    guild_id: data.guild_id,
    version: base.version ?? "1.0.0",
    meta: {
      ...base.meta,
      user_id: data.user_id,
      command_name: data.command_name,
      command_type: data.command_type,
      interaction_type: interaction.type,
    },
  };
}

export function normalizeCommandUsed(
  interaction: Interaction,
  commandName: string,
  base: Partial<TraceEvent> = {}
): TraceEvent {
  const data = extractInteractionData(interaction);

  return {
    event: "command_used",
    timestamp: Date.now(),
    bot_id: base.bot_id ?? interaction.client.user?.id ?? "unknown",
    guild_id: data.guild_id,
    version: base.version ?? "1.0.0",
    meta: {
      ...base.meta,
      user_id: data.user_id,
      command: commandName,
      command_type: data.command_type,
      interaction_type: interaction.type,
    },
  };
}

export function createCustomEvent(
  eventName: string,
  meta: Record<string, unknown>,
  base: Partial<TraceEvent> = {}
): TraceEvent {
  return {
    event: eventName,
    timestamp: Date.now(),
    bot_id: base.bot_id ?? "unknown",
    guild_id: base.guild_id,
    source: base.source,
    version: base.version ?? "1.0.0",
    meta,
  };
}

function extractGuildData(guild: Guild): NormalizedGuildData {
  const memberCount = guild.memberCount ?? guild.approximateMemberCount ?? 0;
  let guildSize = "small";
  if (memberCount > 10000) guildSize = "massive";
  else if (memberCount > 1000) guildSize = "large";
  else if (memberCount > 100) guildSize = "medium";

  return {
    guild_id: guild.id,
    guild_size: guildSize,
    region: guild.preferredLocale ?? "unknown",
    shard: guild.shardId ?? undefined,
    member_count: memberCount,
  };
}

function extractInteractionData(
  interaction: Interaction
): NormalizedInteractionData {
  return {
    guild_id: interaction.guildId ?? undefined,
    user_id: interaction.user?.id,
    command_name:
      "commandName" in interaction ? interaction.commandName : undefined,
    command_type:
      "commandType" in interaction ? interaction.commandType : undefined,
  };
}

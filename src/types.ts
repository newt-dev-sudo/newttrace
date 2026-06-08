import { Client, Guild, Interaction } from "discord.js";

export interface TraceEvent {
  event: string;
  timestamp: number;
  bot_id: string;
  guild_id?: string;
  source?: string;
  version: string;
  meta: Record<string, unknown>;
}

export interface Exporter {
  send(event: TraceEvent): Promise<void>;
}

export interface NewttraceConfig {
  botId: string;
  version?: string;
  exporters: Exporter[];
  auto?: boolean;
  client?: Client;
  attribution?: AttributionConfig;
}

export interface AttributionConfig {
  enabled?: boolean;
  storage?: StateStore;
  guildStore?: GuildStore;
}

export interface StateStore {
  get(state: string): string | undefined;
  set(state: string, campaignId: string): void;
  delete(state: string): void;
}

export interface GuildStore {
  get(guildId: string): string | undefined | Promise<string | undefined>;
  set(guildId: string, source: string): void | Promise<void>;
  delete(guildId: string): void | Promise<void>;
}

export interface DatadogExporterConfig {
  apiKey: string;
  service: string;
  site?: string;
  hostname?: string;
  tags?: Record<string, string>;
}

export interface WebhookExporterConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface FileExporterConfig {
  path: string;
}

export interface StreamExporterConfig {
  type: "redis" | "kafka" | "nats";
  url: string;
  topic?: string;
  channel?: string;
}

export interface NormalizedGuildData {
  guild_id: string;
  guild_size: string;
  region: string;
  shard?: number;
  member_count?: number;
}

export interface NormalizedInteractionData {
  guild_id?: string;
  user_id?: string;
  command_name?: string;
  command_type?: number;
}

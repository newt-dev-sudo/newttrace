import { AttributionConfig, StateStore, GuildStore } from "./types";

// HTTP store: queries redirect server directly. No shared Redis needed.
export class HttpGuildStore implements GuildStore {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async get(guildId: string): Promise<string | undefined> {
    try {
      const res = await fetch(`${this.baseUrl}/resolve?guild_id=${guildId}`);
      const data = await res.json() as { source?: string | null };
      return data.source ?? undefined;
    } catch {
      return undefined;
    }
  }

  async set(): Promise<void> {
    // Server handles writes via /callback
    return;
  }

  async delete(): Promise<void> {
    return;
  }
}

// Redis store for shared attribution between redirect server and bot
// Requires `npm install ioredis`
export class RedisGuildStore implements GuildStore {
  private client: any;
  private ttlSeconds: number;

  constructor(redisUrl: string, ttlSeconds = 86400) {
    try {
      const Redis = require("ioredis");
      this.client = new Redis(redisUrl);
      this.ttlSeconds = ttlSeconds;
    } catch {
      throw new Error(
        "ioredis is required for RedisGuildStore. Install it: npm install ioredis"
      );
    }
  }

  async get(guildId: string): Promise<string | undefined> {
    const value = await this.client.get(`newttrace:guild:${guildId}`);
    return value ?? undefined;
  }

  async set(guildId: string, source: string): Promise<void> {
    await this.client.setex(
      `newttrace:guild:${guildId}`,
      this.ttlSeconds,
      source
    );
  }

  async delete(guildId: string): Promise<void> {
    await this.client.del(`newttrace:guild:${guildId}`);
  }
}

export class InMemoryStateStore implements StateStore {
  private store = new Map<string, string>();

  get(state: string): string | undefined {
    return this.store.get(state);
  }

  set(state: string, campaignId: string): void {
    this.store.set(state, campaignId);
  }

  delete(state: string): void {
    this.store.delete(state);
  }
}

export class InMemoryGuildStore implements GuildStore {
  private store = new Map<string, string>();

  get(guildId: string): string | undefined {
    return this.store.get(guildId);
  }

  set(guildId: string, source: string): void {
    this.store.set(guildId, source);
  }

  delete(guildId: string): void {
    this.store.delete(guildId);
  }
}

export class AttributionTracker {
  private store: StateStore;
  private guildStore: GuildStore;

  constructor(config?: AttributionConfig) {
    this.store = config?.storage ?? new InMemoryStateStore();
    this.guildStore = config?.guildStore ?? new InMemoryGuildStore();
  }

  trackState(state: string, campaignId: string): void {
    this.store.set(state, campaignId);
  }

  resolveSource(state?: string): string | undefined {
    if (!state) return undefined;
    const source = this.store.get(state);
    if (source) {
      this.store.delete(state);
    }
    return source;
  }

  async recordGuildSource(guildId: string, source: string): Promise<void> {
    await this.guildStore.set(guildId, source);
  }

  async resolveGuildSource(guildId: string): Promise<string | undefined> {
    const source = await this.guildStore.get(guildId);
    if (source) {
      await this.guildStore.delete(guildId);
    }
    return source;
  }

  generateInviteUrl(
    clientId: string,
    options: {
      permissions?: string;
      scopes?: string[];
      campaignId?: string;
      redirectUri?: string;
    } = {}
  ): string {
    const {
      permissions = "0",
      scopes = ["bot"],
      campaignId,
      redirectUri,
    } = options;

    const params = new URLSearchParams();
    params.set("client_id", clientId);
    params.set("scope", scopes.join(" "));
    params.set("permissions", permissions);

    if (campaignId) {
      const state = crypto.randomUUID();
      this.trackState(state, campaignId);
      params.set("state", state);
    }

    if (redirectUri) {
      params.set("redirect_uri", redirectUri);
      params.set("response_type", "code");
    }

    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }
}

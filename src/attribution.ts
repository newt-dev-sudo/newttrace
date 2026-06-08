import { AttributionConfig, StateStore, GuildStore } from "./types";

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

  recordGuildSource(guildId: string, source: string): void {
    this.guildStore.set(guildId, source);
  }

  resolveGuildSource(guildId: string): string | undefined {
    const source = this.guildStore.get(guildId);
    if (source) {
      this.guildStore.delete(guildId);
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
      const state = `campaign_${campaignId}`;
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

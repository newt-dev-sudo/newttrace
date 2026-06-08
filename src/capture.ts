import { Client, Guild, Interaction } from "discord.js";
import { AttributionTracker } from "./attribution";
import { ActivationTracker } from "./activation";
import {
  normalizeGuild,
  normalizeGuildDelete,
  normalizeInteraction,
  normalizeCommandUsed,
} from "./normalization";
import { TraceEvent, NewttraceConfig } from "./types";

export class EventCapture {
  private client?: Client;
  private attribution: AttributionTracker;
  private activation: ActivationTracker;
  private config: NewttraceConfig;
  private onEvent: (event: TraceEvent) => void;
  private _listenersAttached = false;

  constructor(
    config: NewttraceConfig,
    onEvent: (event: TraceEvent) => void
  ) {
    this.config = config;
    this.onEvent = onEvent;
    this.attribution = new AttributionTracker(config.attribution);
    this.activation = new ActivationTracker();
  }

  attach(client: Client): void {
    if (this._listenersAttached) return;
    this.client = client;
    this._listenersAttached = true;

    client.on("guildCreate", (guild) => this.handleGuildCreate(guild));
    client.on("guildDelete", (guild) => this.handleGuildDelete(guild));
    client.on("interactionCreate", (interaction) =>
      this.handleInteraction(interaction)
    );
  }

  detach(): void {
    if (!this.client || !this._listenersAttached) return;

    this.client.removeAllListeners("guildCreate");
    this.client.removeAllListeners("guildDelete");
    this.client.removeAllListeners("interactionCreate");
    this._listenersAttached = false;
  }

  private async handleGuildCreate(guild: Guild): Promise<void> {
    const source = await this.attribution.resolveGuildSource(guild.id);
    this.activation.recordJoin(guild.id, source ?? undefined);

    const event = normalizeGuild(guild, {
      bot_id: this.config.botId,
      version: this.config.version,
      source: source ?? "unknown",
    });
    this.onEvent(event);
  }

  private handleGuildDelete(guild: Guild): void {
    const event = normalizeGuildDelete(guild, {
      bot_id: this.config.botId,
      version: this.config.version,
    });
    this.onEvent(event);
  }

  private handleInteraction(interaction: Interaction): void {
    const guildId = interaction.guildId ?? undefined;
    if (guildId) {
      const activationEvent = this.activation.recordInteraction(
        guildId,
        interaction
      );
      if (activationEvent) {
        this.onEvent(activationEvent);
      }
    }

    const event = normalizeInteraction(interaction, {
      bot_id: this.config.botId,
      version: this.config.version,
    });
    this.onEvent(event);
  }

  getAttribution(): AttributionTracker {
    return this.attribution;
  }
}

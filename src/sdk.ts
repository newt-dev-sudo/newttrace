import { Client } from "discord.js";
import { EventCapture } from "./capture";
import {
  normalizeCommandUsed,
  createCustomEvent,
} from "./normalization";
import { NewttraceConfig, TraceEvent, Exporter } from "./types";

export class NewttraceSDK {
  private config: NewttraceConfig;
  private capture?: EventCapture;
  private client?: Client;

  constructor(config: NewttraceConfig) {
    if (!config.botId) {
      throw new Error("Newttrace requires a botId");
    }
    if (!config.exporters || config.exporters.length === 0) {
      throw new Error("Newttrace requires at least one exporter");
    }
    this.config = {
      version: "1.0.0",
      auto: true,
      ...config,
    };
  }

  init(client?: Client): void {
    if (client) {
      this.client = client;
    } else if (this.config.client) {
      this.client = this.config.client;
    }

    if (this.config.auto !== false && this.client) {
      this.capture = new EventCapture(this.config, (event) =>
        this.dispatch(event)
      );
      this.capture.attach(this.client);
    }
  }

  trace(
    eventName: string,
    meta: Record<string, unknown> = {},
    guildId?: string
  ): void {
    const event = createCustomEvent(eventName, meta, {
      bot_id: this.config.botId,
      version: this.config.version,
      guild_id: guildId,
    });
    this.dispatch(event);
  }

  traceCommand(
    interaction: import("discord.js").Interaction,
    commandName: string
  ): void {
    const event = normalizeCommandUsed(interaction, commandName, {
      bot_id: this.config.botId,
      version: this.config.version,
    });
    this.dispatch(event);
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
    return (
      this.capture?.getAttribution().generateInviteUrl(clientId, options) ??
      ""
    );
  }

  shutdown(): void {
    this.capture?.detach();
  }

  private async dispatch(event: TraceEvent): Promise<void> {
    const promises = this.config.exporters.map(async (exporter) => {
      try {
        await exporter.send(event);
      } catch (error) {
        console.error(`[Newttrace] Exporter failed:`, error);
      }
    });
    await Promise.all(promises);
  }
}

import { Exporter, TraceEvent, DatadogExporterConfig } from "../types";

export class DatadogExporter implements Exporter {
  private apiKey: string;
  private service: string;
  private site: string;
  private hostname?: string;
  private tags: Record<string, string>;

  constructor(config: DatadogExporterConfig) {
    if (!config.apiKey) {
      throw new Error("DatadogExporter requires an apiKey");
    }
    this.apiKey = config.apiKey;
    this.service = config.service;
    this.site = config.site ?? "datadoghq.com";
    this.hostname = config.hostname;
    this.tags = config.tags ?? {};
  }

  async send(event: TraceEvent): Promise<void> {
    const payload = {
      message: event.event,
      ddsource: "newttrace",
      service: this.service,
      status: "info",
      timestamp: event.timestamp,
      hostname: this.hostname,
      attributes: {
        ...event.meta,
        guild_id: event.guild_id,
        source: event.source,
        bot_id: event.bot_id,
        version: event.version,
        ...this.tags,
      },
    };

    const url = `https://http-intake.logs.${this.site}/api/v2/logs`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Datadog export failed: ${response.status} ${response.statusText}`
      );
    }
  }
}

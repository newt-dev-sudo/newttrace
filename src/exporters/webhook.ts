import { Exporter, TraceEvent, WebhookExporterConfig } from "../types";

export class WebhookExporter implements Exporter {
  private url: string;
  private headers: Record<string, string>;

  constructor(config: WebhookExporterConfig) {
    if (!config.url) {
      throw new Error("WebhookExporter requires a url");
    }
    this.url = config.url;
    this.headers = config.headers ?? {};
  }

  async send(event: TraceEvent): Promise<void> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(
        `Webhook export failed: ${response.status} ${response.statusText}`
      );
    }
  }
}

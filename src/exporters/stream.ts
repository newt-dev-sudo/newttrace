import { Exporter, TraceEvent, StreamExporterConfig } from "../types";

export class StreamExporter implements Exporter {
  private config: StreamExporterConfig;

  constructor(config: StreamExporterConfig) {
    if (!config.url) {
      throw new Error("StreamExporter requires a url");
    }
    this.config = config;
  }

  async send(event: TraceEvent): Promise<void> {
    switch (this.config.type) {
      case "redis":
        await this.sendToRedis(event);
        break;
      case "kafka":
        await this.sendToKafka(event);
        break;
      case "nats":
        await this.sendToNats(event);
        break;
      default:
        throw new Error(`Unsupported stream type: ${this.config.type}`);
    }
  }

  private async sendToRedis(event: TraceEvent): Promise<void> {
    try {
      // @ts-ignore optional peer dependency
      const { createClient } = await import("redis");
      const client = createClient({ url: this.config.url });
      await client.connect();
      await client.publish(
        this.config.channel ?? "newttrace",
        JSON.stringify(event)
      );
      await client.disconnect();
    } catch {
      throw new Error(
        "Redis export failed. Ensure the 'redis' package is installed."
      );
    }
  }

  private async sendToKafka(event: TraceEvent): Promise<void> {
    try {
      // @ts-ignore optional peer dependency
      const { Kafka } = await import("kafkajs");
      const kafka = new Kafka({
        brokers: [this.config.url],
      });
      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        topic: this.config.topic ?? "newttrace",
        messages: [{ value: JSON.stringify(event) }],
      });
      await producer.disconnect();
    } catch {
      throw new Error(
        "Kafka export failed. Ensure the 'kafkajs' package is installed."
      );
    }
  }

  private async sendToNats(event: TraceEvent): Promise<void> {
    try {
      // @ts-ignore optional peer dependency
      const { connect, StringCodec } = await import("nats");
      const nc = await connect({ servers: this.config.url });
      const sc = StringCodec();
      nc.publish(
        this.config.topic ?? "newttrace",
        sc.encode(JSON.stringify(event))
      );
      await nc.drain();
    } catch {
      throw new Error(
        "NATS export failed. Ensure the 'nats' package is installed."
      );
    }
  }
}

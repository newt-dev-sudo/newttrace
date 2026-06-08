import { appendFile } from "fs/promises";
import { Exporter, TraceEvent, FileExporterConfig } from "../types";

export class FileExporter implements Exporter {
  private path: string;

  constructor(config: FileExporterConfig) {
    if (!config.path) {
      throw new Error("FileExporter requires a path");
    }
    this.path = config.path;
  }

  async send(event: TraceEvent): Promise<void> {
    const line = JSON.stringify(event) + "\n";
    await appendFile(this.path, line, "utf-8");
  }
}

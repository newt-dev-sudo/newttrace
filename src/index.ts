export { NewttraceSDK } from "./sdk";
export { EventCapture } from "./capture";
export { AttributionTracker, InMemoryStateStore, InMemoryGuildStore } from "./attribution";
export { ActivationTracker } from "./activation";
export {
  normalizeGuild,
  normalizeGuildDelete,
  normalizeInteraction,
  normalizeCommandUsed,
  createCustomEvent,
} from "./normalization";
export {
  DatadogExporter,
  WebhookExporter,
  FileExporter,
  StreamExporter,
} from "./exporters";

export type {
  TraceEvent,
  Exporter,
  NewttraceConfig,
  AttributionConfig,
  StateStore,
  GuildStore,
  DatadogExporterConfig,
  WebhookExporterConfig,
  FileExporterConfig,
  StreamExporterConfig,
  NormalizedGuildData,
  NormalizedInteractionData,
} from "./types";

import { NewttraceSDK } from "./sdk";
import { NewttraceConfig } from "./types";

export function initNewttrace(config: NewttraceConfig): NewttraceSDK {
  const sdk = new NewttraceSDK(config);
  sdk.init();
  return sdk;
}

export function trace(
  eventName: string,
  meta?: Record<string, unknown>,
  config?: Partial<NewttraceConfig>
): void {
  if (!config) {
    console.warn("[Newttrace] trace() requires a config or use sdk.trace()");
    return;
  }
  const sdk = new NewttraceSDK(config as NewttraceConfig);
  sdk.trace(eventName, meta);
}

// Plugin manifest response from manifest.json
export interface PluginManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  resources: string[];
  types: string[];
  idPrefixes: string[];
}

// Firestore plugin document structure
export interface PluginDocument {
  id: string;
  user_id: string;
  manifest_url: string;
  plugin_id: string;
  name: string;
  version: string;
  description: string;
  resources: string[];
  types: string[];
  id_prefixes: string[];
  is_active: boolean;
  is_default: boolean;
  last_fetched: Date;
  created_at: Date;
  updated_at: Date;
}

// Stream response from plugin API
export interface StreamSource {
  url: string;
  name: string;
}

export interface StreamResponse {
  streams: StreamSource[];
}

// Aggregated stream from multiple plugins
export interface AggregatedStream {
  url: string;
  name: string;
  quality: string;
  pluginName: string;
  pluginId: string;
  label: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Plugin analytics event parameters
export interface PluginAnalyticsParams {
  plugin_id?: string;
  plugin_name?: string;
  manifest_url?: string;
  media_type?: "movie" | "tv";
  media_id?: string;
  success?: boolean;
  error_message?: string;
  url?: string;
  quality?: string;
  duration_watched?: number;
  watch_position?: number;
  [key: string]: string | number | boolean | undefined;
}

// Default plugin configuration
export interface DefaultPluginConfig {
  manifestUrl: string;
  name: string;
  description: string;
}

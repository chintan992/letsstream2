import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks";
import {
  PluginManifest,
  PluginDocument,
  PluginAnalyticsParams,
} from "@/utils/types/plugin";
import { DEFAULT_PLUGINS } from "@/config/default-plugins";
import { trackEvent } from "@/lib/analytics";

/**
 * Hook for managing streaming plugins
 * Handles CRUD operations, manifest validation, and default plugin initialization
 */
export function usePluginManager() {
  const { user } = useAuth();
  const [plugins, setPlugins] = useState<PluginDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and validate plugin manifest from URL
   */
  const fetchPluginManifest = useCallback(
    async (url: string): Promise<PluginManifest> => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch manifest: ${response.status} ${response.statusText}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Manifest URL did not return JSON");
        }

        const manifest: PluginManifest = await response.json();

        // Validate required fields
        if (!manifest.id || !manifest.name || !manifest.version) {
          throw new Error("Invalid manifest: missing required fields");
        }

        return manifest;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch manifest";
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Add a new plugin to the user's collection
   */
  const addPlugin = useCallback(
    async (manifestUrl: string): Promise<string> => {
      if (!user) {
        throw new Error("User must be authenticated to add plugins");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch and validate manifest
        const manifest = await fetchPluginManifest(manifestUrl);

        // Check if plugin already exists for this user
        const existingQuery = query(
          collection(db, "plugins"),
          where("user_id", "==", user.uid),
          where("plugin_id", "==", manifest.id)
        );
        const existingDocs = await getDocs(existingQuery);

        if (!existingDocs.empty) {
          throw new Error("Plugin already added");
        }

        // Add to Firestore
        const docRef = await addDoc(collection(db, "plugins"), {
          user_id: user.uid,
          manifest_url: manifestUrl,
          plugin_id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          resources: manifest.resources || [],
          types: manifest.types || [],
          id_prefixes: manifest.idPrefixes || [],
          is_active: true,
          is_default: false,
          last_fetched: new Date(),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        // Track analytics
        await trackEvent({
          name: "plugin_added",
          params: {
            plugin_id: manifest.id,
            plugin_name: manifest.name,
            manifest_url: manifestUrl,
          } as PluginAnalyticsParams,
        });

        // Refresh plugin list
        await loadPlugins();

        return docRef.id;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add plugin";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user, fetchPluginManifest]
  );

  /**
   * Remove a plugin from the user's collection
   */
  const removePlugin = useCallback(
    async (pluginId: string): Promise<void> => {
      if (!user) {
        throw new Error("User must be authenticated to remove plugins");
      }

      setIsLoading(true);
      setError(null);

      try {
        const pluginDoc = doc(db, "plugins", pluginId);
        await deleteDoc(pluginDoc);

        // Track analytics
        const plugin = plugins.find(p => p.id === pluginId);
        if (plugin) {
          await trackEvent({
            name: "plugin_removed",
            params: {
              plugin_id: plugin.plugin_id,
              plugin_name: plugin.name,
            } as PluginAnalyticsParams,
          });
        }

        // Refresh plugin list
        await loadPlugins();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove plugin";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user, plugins]
  );

  /**
   * Update plugin data by re-fetching manifest
   */
  const updatePlugin = useCallback(
    async (pluginId: string): Promise<void> => {
      if (!user) {
        throw new Error("User must be authenticated to update plugins");
      }

      setIsLoading(true);
      setError(null);

      try {
        const plugin = plugins.find(p => p.id === pluginId);
        if (!plugin) {
          throw new Error("Plugin not found");
        }

        const manifest = await fetchPluginManifest(plugin.manifest_url);

        const pluginDoc = doc(db, "plugins", pluginId);
        await updateDoc(pluginDoc, {
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          resources: manifest.resources || [],
          types: manifest.types || [],
          id_prefixes: manifest.idPrefixes || [],
          last_fetched: new Date(),
          updated_at: serverTimestamp(),
        });

        // Track analytics
        await trackEvent({
          name: "plugin_updated",
          params: {
            plugin_id: manifest.id,
            plugin_name: manifest.name,
          } as PluginAnalyticsParams,
        });

        // Refresh plugin list
        await loadPlugins();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update plugin";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user, plugins, fetchPluginManifest]
  );

  /**
   * Toggle plugin active/inactive status
   */
  const togglePluginStatus = useCallback(
    async (pluginId: string): Promise<void> => {
      if (!user) {
        throw new Error("User must be authenticated to toggle plugins");
      }

      setIsLoading(true);
      setError(null);

      try {
        const plugin = plugins.find(p => p.id === pluginId);
        if (!plugin) {
          throw new Error("Plugin not found");
        }

        const pluginDoc = doc(db, "plugins", pluginId);
        const newStatus = !plugin.is_active;

        await updateDoc(pluginDoc, {
          is_active: newStatus,
          updated_at: serverTimestamp(),
        });

        // Track analytics
        await trackEvent({
          name: newStatus ? "plugin_activated" : "plugin_deactivated",
          params: {
            plugin_id: plugin.plugin_id,
            plugin_name: plugin.name,
          } as PluginAnalyticsParams,
        });

        // Refresh plugin list
        await loadPlugins();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to toggle plugin";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user, plugins]
  );

  /**
   * Load all plugins for the current user
   */
  const loadPlugins = useCallback(async () => {
    if (!user) {
      setPlugins([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pluginsQuery = query(
        collection(db, "plugins"),
        where("user_id", "==", user.uid)
      );
      const querySnapshot = await getDocs(pluginsQuery);

      const loadedPlugins: PluginDocument[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user_id: data.user_id,
          manifest_url: data.manifest_url,
          plugin_id: data.plugin_id,
          name: data.name,
          version: data.version,
          description: data.description,
          resources: data.resources || [],
          types: data.types || [],
          id_prefixes: data.id_prefixes || [],
          is_active: data.is_active ?? true,
          is_default: data.is_default ?? false,
          last_fetched: data.last_fetched?.toDate() || new Date(),
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        };
      });

      setPlugins(loadedPlugins);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load plugins";
      setError(message);
      console.error("Error loading plugins:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Get all active plugins
   */
  const getActivePlugins = useCallback(() => {
    return plugins.filter(p => p.is_active);
  }, [plugins]);

  /**
   * Initialize default plugins for new users
   */
  const initializeDefaultPlugins = useCallback(async () => {
    if (!user) {
      throw new Error("User must be authenticated");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if user already has plugins
      const existingQuery = query(
        collection(db, "plugins"),
        where("user_id", "==", user.uid)
      );
      const existingDocs = await getDocs(existingQuery);

      // Only add default plugins if user has no plugins yet
      if (existingDocs.empty) {
        const promises = DEFAULT_PLUGINS.map(async pluginConfig => {
          try {
            const manifest = await fetchPluginManifest(pluginConfig.manifestUrl);

            await addDoc(collection(db, "plugins"), {
              user_id: user.uid,
              manifest_url: pluginConfig.manifestUrl,
              plugin_id: manifest.id,
              name: manifest.name,
              version: manifest.version,
              description: manifest.description,
              resources: manifest.resources || [],
              types: manifest.types || [],
              id_prefixes: manifest.idPrefixes || [],
              is_active: true,
              is_default: true,
              last_fetched: new Date(),
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });

            // Track analytics
            await trackEvent({
              name: "plugin_added",
              params: {
                plugin_id: manifest.id,
                plugin_name: manifest.name,
                manifest_url: pluginConfig.manifestUrl,
                is_default: true,
              } as PluginAnalyticsParams,
            });
          } catch (err) {
            console.warn(
              `Failed to add default plugin ${pluginConfig.name}:`,
              err
            );
            // Continue with other plugins even if one fails
          }
        });

        await Promise.all(promises);

        // Refresh plugin list
        await loadPlugins();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to initialize default plugins";
      setError(message);
      console.error("Error initializing default plugins:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchPluginManifest, loadPlugins]);

  /**
   * Test plugin connection by fetching manifest
   */
  const testPluginConnection = useCallback(
    async (pluginId: string): Promise<boolean> => {
      try {
        const plugin = plugins.find(p => p.id === pluginId);
        if (!plugin) {
          throw new Error("Plugin not found");
        }

        await fetchPluginManifest(plugin.manifest_url);

        // Track analytics
        await trackEvent({
          name: "plugin_tested",
          params: {
            plugin_id: plugin.plugin_id,
            plugin_name: plugin.name,
            success: true,
          } as PluginAnalyticsParams,
        });

        return true;
      } catch (err) {
        const plugin = plugins.find(p => p.id === pluginId);
        if (plugin) {
          await trackEvent({
            name: "plugin_tested",
            params: {
              plugin_id: plugin.plugin_id,
              plugin_name: plugin.name,
              success: false,
              error_message:
                err instanceof Error ? err.message : "Unknown error",
            } as PluginAnalyticsParams,
          });
        }

        return false;
      }
    },
    [plugins, fetchPluginManifest]
  );

  // Load plugins when user changes
  useEffect(() => {
    if (user) {
      loadPlugins();
    } else {
      setPlugins([]);
    }
  }, [user, loadPlugins]);

  return {
    plugins,
    isLoading,
    error,
    fetchPluginManifest,
    addPlugin,
    removePlugin,
    updatePlugin,
    togglePluginStatus,
    loadPlugins,
    getActivePlugins,
    initializeDefaultPlugins,
    testPluginConnection,
  };
}

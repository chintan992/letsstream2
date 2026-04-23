import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, RefreshCw, TestTube, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePluginManager } from "@/hooks/use-plugin-manager";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";

const Plugins = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    plugins,
    isLoading,
    error,
    addPlugin,
    removePlugin,
    updatePlugin,
    togglePluginStatus,
    testPluginConnection,
    initializeDefaultPlugins,
  } = usePluginManager();

  const [manifestUrl, setManifestUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [testingPluginId, setTestingPluginId] = useState<string | null>(null);

  const handleAddPlugin = async () => {
    if (!manifestUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid manifest URL",
      });
      return;
    }

    setIsAdding(true);
    try {
      await addPlugin(manifestUrl);
      toast({
        title: "Plugin Added",
        description: "The plugin has been successfully added",
      });
      setManifestUrl("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Add Plugin",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePlugin = async (pluginId: string) => {
    try {
      await removePlugin(pluginId);
      toast({
        title: "Plugin Removed",
        description: "The plugin has been removed",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Remove Plugin",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleTogglePlugin = async (pluginId: string) => {
    try {
      await togglePluginStatus(pluginId);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Toggle Plugin",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleTestPlugin = async (pluginId: string) => {
    setTestingPluginId(pluginId);
    try {
      const success = await testPluginConnection(pluginId);
      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success
          ? "The plugin is working correctly"
          : "Failed to connect to the plugin",
        variant: success ? "default" : "destructive",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setTestingPluginId(null);
    }
  };

  const handleUpdatePlugin = async (pluginId: string) => {
    try {
      await updatePlugin(pluginId);
      toast({
        title: "Plugin Updated",
        description: "The plugin has been updated to the latest version",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Update Plugin",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultPlugins();
      toast({
        title: "Default Plugins Added",
        description: "Default streaming plugins have been added to your account",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Add Default Plugins",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-4xl px-4 py-6 pt-20">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Streaming Plugins</h1>
              <p className="mt-1 text-muted-foreground">
                Manage your streaming service plugins
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>

          {/* Add Plugin Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Plugin</CardTitle>
              <CardDescription>
                Enter the manifest URL of a Stremio-compatible plugin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/manifest.json"
                  value={manifestUrl}
                  onChange={e => setManifestUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddPlugin()}
                  disabled={isAdding}
                />
                <Button onClick={handleAddPlugin} disabled={isAdding}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Default Plugins Button */}
          {plugins.length === 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      No Plugins Installed
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Add default streaming plugins to get started
                    </p>
                  </div>
                  <Button onClick={handleInitializeDefaults}>
                    Add Default Plugins
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plugins List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Installed Plugins ({plugins.length})
            </h2>

            {isLoading && plugins.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading plugins...
              </div>
            ) : plugins.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No plugins installed. Add a plugin to get started.
              </div>
            ) : (
              plugins.map(plugin => (
                <Card key={plugin.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {plugin.name}
                          </h3>
                          {plugin.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {plugin.is_active ? (
                            <Badge variant="default" className="bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {plugin.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Version {plugin.version} • {plugin.plugin_id}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          URL: {plugin.manifest_url}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <Switch
                          checked={plugin.is_active}
                          onCheckedChange={() => handleTogglePlugin(plugin.id)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {plugin.is_active ? "On" : "Off"}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestPlugin(plugin.id)}
                        disabled={testingPluginId === plugin.id}
                      >
                        {testingPluginId === plugin.id ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="mr-2 h-4 w-4" />
                        )}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdatePlugin(plugin.id)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update
                      </Button>
                      {!plugin.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePlugin(plugin.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Plugins;

import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  MinimizeIcon,
  MaximizeIcon,
  RefreshCcw,
  WifiOff,
  Activity,
  Trash2,
  RotateCcw,
  Download,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { swMonitor } from "@/utils/sw-monitor";
import {
  performanceMonitor,
  type WebVitalData,
} from "@/utils/performance-monitor";
import { cn } from "@/lib/utils";

interface ServiceWorkerEvent {
  id: number;
  type: string;
  timestamp: number;
  details?: string;
}

interface ServiceWorkerMetrics {
  cacheSize: number;
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
}

export function ServiceWorkerDebugPanel() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [controllerState, setControllerState] = useState<string>("");
  const [webVitals, setWebVitals] = useState<WebVitalData[]>([]);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [events, setEvents] = useState<ServiceWorkerEvent[]>([]);
  const [metrics, setMetrics] = useState<ServiceWorkerMetrics>({
    cacheSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
  });
  const [networkCondition, setNetworkCondition] = useState("online");
  const [logLevel, setLogLevel] = useState("info");

  const addEvent = useCallback((type: string, details: string) => {
    setEvents(prevEvents => [
      { id: Date.now() + Math.random(), type, timestamp: Date.now(), details },
      ...prevEvents.slice(0, 99),
    ]);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    addEvent("System", "Event log cleared");
  }, [addEvent]);

  const checkRegistration = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      setRegistration(reg || null);
      setControllerState(
        navigator.serviceWorker.controller ? "active" : "none"
      );

      if (reg?.active) {
        reg.active.postMessage({ type: "GET_BYPASS_STATUS" });
        reg.active.postMessage({ type: "GET_METRICS" });
      }

      addEvent("Registration", "Service worker registration status checked");
    } catch (error) {
      console.error("Failed to get service worker registration:", error);
      addEvent("Error", "Failed to get service worker registration");
    }
  }, [addEvent]);

  // Subscribe to web vitals updates
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribeToWebVitals(vitals => {
      setWebVitals(vitals);
    });

    return unsubscribe;
  }, []);

  const handleSwMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type === "BYPASS_STATUS") {
        setBypassEnabled(event.data.active);
        addEvent(
          "Bypass",
          `Bypass ${event.data.active ? "enabled" : "disabled"}`
        );
      } else if (event.data?.type === "METRICS_UPDATE") {
        setMetrics(event.data.metrics);
        addEvent("Metrics", "Performance metrics updated");
      }
    },
    [addEvent]
  );

  const handleNetworkChange = useCallback(() => {
    const status = navigator.onLine ? "online" : "offline";
    setNetworkCondition(status);
    addEvent("Network", `Network status changed to ${status}`);
  }, [addEvent]);

  const handleSwStateChange = useCallback(() => {
    checkRegistration();
    addEvent("State", "Service worker state changed");
  }, [checkRegistration, addEvent]);

  const handleControllerChange = useCallback(() => {
    setControllerState(navigator.serviceWorker.controller ? "active" : "none");
    addEvent("Controller", "Service worker controller changed");
  }, [addEvent]);

  useEffect(() => {
    checkRegistration();

    // Attach statechange listeners to existing workers and listen for future updates
    const attachStateChangeListeners = () => {
      if (!registration) return;
      const workers = [
        registration.installing,
        registration.waiting,
        registration.active,
      ].filter((w): w is ServiceWorker => !!w);
      workers.forEach(w =>
        w.addEventListener("statechange", handleSwStateChange)
      );
    };

    attachStateChangeListeners();
    // Listen for updates so we can attach to the new installing worker
    const onUpdateFound = () => {
      if (registration?.installing) {
        registration.installing.addEventListener(
          "statechange",
          handleSwStateChange
        );
      }
    };
    registration?.addEventListener("updatefound", onUpdateFound as any);

    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      if (registration) {
        const workers = [
          registration.installing,
          registration.waiting,
          registration.active,
        ].filter((w): w is ServiceWorker => !!w);
        workers.forEach(w =>
          w.removeEventListener("statechange", handleSwStateChange)
        );
      }
      registration?.removeEventListener("updatefound", onUpdateFound as any);
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, [
    registration,
    checkRegistration,
    handleSwMessage,
    handleNetworkChange,
    handleSwStateChange,
    handleControllerChange,
  ]);

  const handleSkipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      addEvent("Action", "Skip waiting triggered");
    }
  }, [registration, addEvent]);

  const handleBypassToggle = useCallback(() => {
    if (registration?.active) {
      registration.active.postMessage({
        type: "TOGGLE_BYPASS",
        enable: !bypassEnabled,
        duration: 300000,
      });
    }
  }, [registration, bypassEnabled]);

  const handleLogLevelChange = useCallback(
    (level: string) => {
      setLogLevel(level);
      if (registration?.active) {
        registration.active.postMessage({
          type: "SET_LOG_LEVEL",
          payload: { level },
        });
        addEvent("LogLevel", `Log level set to ${level}`);
      }
    },
    [registration, addEvent]
  );

  const handleNetworkSimulation = useCallback(
    (condition: string) => {
      if (registration?.active) {
        registration.active.postMessage({
          type: "SIMULATE_NETWORK",
          condition,
        });
        setNetworkCondition(condition);
        addEvent("Network", `Network condition simulated: ${condition}`);
      }
    },
    [registration, addEvent]
  );

  const handleForceUpdate = useCallback(async () => {
    try {
      const success = await swMonitor.updateServiceWorker();
      if (success) {
        addEvent("Update", "Service worker update triggered");
      } else {
        addEvent("Error", "Failed to update service worker");
      }
    } catch (error) {
      addEvent("Error", `Update failed: ${error}`);
    }
  }, [addEvent]);

  const handleUnregister = useCallback(async () => {
    try {
      const success = await swMonitor.unregisterServiceWorker();
      if (success) {
        addEvent("Unregister", "Service worker unregistered");
        setTimeout(() => window.location.reload(), 500);
      } else {
        addEvent("Error", "Failed to unregister service worker");
      }
    } catch (error) {
      addEvent("Error", `Unregister failed: ${error}`);
    }
  }, [addEvent]);

  const handleResetMetrics = useCallback(() => {
    swMonitor.reset();
    setMetrics({
      cacheSize: 0,
      cacheHits: 0,
      cacheMisses: 0,
      networkRequests: 0,
    });
    addEvent("Metrics", "Metrics reset");
  }, [addEvent]);

  // Calculate cache hit ratio
  const cacheHitRatio =
    metrics.cacheHits + metrics.cacheMisses > 0
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
      : 0;

  // Return early if not in development environment or no registration
  if (!import.meta.env.DEV || !registration) {
    return null;
  }

  if (isMinimized) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-50 p-2"
        variant="outline"
        size="icon"
        onClick={() => setIsMinimized(false)}
        title="Expand Debug Panel"
      >
        <MaximizeIcon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="bg-background/80 supports-[backdrop-filter]:bg-background/80 fixed bottom-4 right-4 z-50 max-h-[80vh] w-96 space-y-4 overflow-auto p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Service Worker Debug</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={checkRegistration}
            title="Refresh Status"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            title="Minimize Panel"
          >
            <MinimizeIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="status">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="perf">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Controller:</span>
              <span className="text-sm font-medium">{controllerState}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Client ID:</span>
              <span className="max-w-[150px] truncate font-mono text-sm text-xs">
                {swMonitor.getClientId()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Iframe Proxy Bypass:</span>
              <Switch
                checked={bypassEnabled}
                onCheckedChange={handleBypassToggle}
                aria-label="Toggle iframe proxy bypass"
              />
            </div>

            {registration.active && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Active State:</span>
                <span className="text-sm font-medium">
                  {registration.active.state}
                </span>
              </div>
            )}

            {registration.waiting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Waiting State:</span>
                  <span className="text-sm font-medium">
                    {registration.waiting.state}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipWaiting}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Apply Update
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">Log Level:</span>
              <Select value={logLevel} onValueChange={handleLogLevelChange}>
                <SelectTrigger className="w-[120px]" aria-label="Log Level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Worker Controls */}
            <div className="flex gap-2 border-t pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleForceUpdate}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Force Update
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleUnregister}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Unregister
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Event Log ({events.length})
            </span>
            <Button variant="ghost" size="sm" onClick={clearEvents}>
              <Trash2 className="mr-1 h-4 w-4" />
              Clear
            </Button>
          </div>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {events.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No events yet
              </p>
            ) : (
              events.map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "border-l-2 pl-2 text-sm",
                    event.type === "Error"
                      ? "border-red-500"
                      : event.type === "Network"
                        ? "border-blue-500"
                        : "border-accent"
                  )}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{event.type}</span>
                    <span className="text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.details && (
                    <p className="text-muted-foreground">{event.details}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="perf" className="space-y-4">
          {/* Web Vitals Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Core Web Vitals</span>
            </div>
            {webVitals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Web vitals data will appear as metrics are collected...
              </p>
            ) : (
              <div className="space-y-1">
                {webVitals.map(vital => (
                  <div
                    key={vital.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{vital.name}</span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-sm font-medium",
                        vital.rating === "good" &&
                        "bg-green-500/20 text-green-700 dark:text-green-400",
                        vital.rating === "needs-improvement" &&
                        "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                        vital.rating === "poor" &&
                        "bg-red-500/20 text-red-700 dark:text-red-400"
                      )}
                    >
                      {vital.value.toFixed(vital.name === "CLS" ? 3 : 0)}
                      {vital.name !== "CLS" && "ms"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cache Metrics Section */}
          <div className="space-y-2 border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cache Metrics</span>
              <Button variant="ghost" size="sm" onClick={handleResetMetrics}>
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium">Cache Hits</span>
                <div className="text-2xl font-bold">{metrics.cacheHits}</div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Cache Misses</span>
                <div className="text-2xl font-bold">{metrics.cacheMisses}</div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Network Requests</span>
                <div className="text-2xl font-bold">
                  {metrics.networkRequests}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Cache Size</span>
                <div className="text-2xl font-bold">
                  {(metrics.cacheSize / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>

            {/* Cache Hit Ratio */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache Hit Ratio</span>
                <span className="text-sm font-medium">
                  {cacheHitRatio.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    cacheHitRatio > 75
                      ? "bg-green-500"
                      : cacheHitRatio > 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  )}
                  style={{ width: `${cacheHitRatio}%` }}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Network Status:</span>
              <div className="flex items-center gap-2">
                {navigator.onLine ? (
                  <Activity className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium capitalize">
                  {networkCondition}
                </span>
              </div>
            </div>

            {/* Network Metrics from swMonitor */}
            <div className="space-y-2 border-t pt-2">
              <span className="text-sm font-medium">Network Metrics</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {swMonitor.getNetworkMetrics().successes}
                  </div>
                  <div className="text-xs text-muted-foreground">Successes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {swMonitor.getNetworkMetrics().failures}
                  </div>
                  <div className="text-xs text-muted-foreground">Failures</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {swMonitor.getNetworkMetrics().timeouts}
                  </div>
                  <div className="text-xs text-muted-foreground">Timeouts</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-2">
              <span className="text-sm font-medium">
                Simulate Network Condition
              </span>
              <Select
                value={networkCondition}
                onValueChange={handleNetworkSimulation}
              >
                <SelectTrigger aria-label="Network Condition">
                  <SelectValue placeholder="Simulate Network Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Normal)</SelectItem>
                  <SelectItem value="slow-3g">Slow 3G</SelectItem>
                  <SelectItem value="fast-3g">Fast 3G</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

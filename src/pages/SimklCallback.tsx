import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SimklService } from "@/lib/simkl";
import { useUserPreferences } from "@/contexts/user-preferences";
import { useToast } from "@/components/ui/use-toast";

export default function SimklCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePreferences } = useUserPreferences();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const connectionPromiseRef = useRef<Promise<string | null> | null>(null);
  const completionHandledRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!connectionPromiseRef.current) {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");

      connectionPromiseRef.current = (async (): Promise<string | null> => {
        if (errorParam) return "Simkl authentication was denied.";
        if (!code || !state) return "No authentication code received.";

        try {
          const redirectUri = `${window.location.origin}/simkl-callback`;
          const tokenResponse = await SimklService.exchangeCodeForToken(
            code,
            redirectUri,
            state
          );

          if (!tokenResponse.access_token) {
            throw new Error("Token response missing access_token");
          }

          await updatePreferences({
            simklToken: tokenResponse.access_token,
            isSimklEnabled: true,
          });
          return null;
        } catch (err) {
          console.error("Simkl authentication error:", err);
          return "Failed to connect to Simkl. Please try again.";
        }
      })();
    }

    void connectionPromiseRef.current.then(errorMsg => {
      if (!isMounted || completionHandledRef.current) return;
      completionHandledRef.current = true;

      if (errorMsg) {
        setError(errorMsg);
        toast({
          title:
            errorMsg === "Failed to connect to Simkl. Please try again."
              ? "Connection Failed"
              : "Authentication Failed",
          description: errorMsg,
          variant: "destructive",
        });
        timeoutId = setTimeout(() => navigate("/profile"), 2000);
        return;
      }

      toast({
        title: "Simkl Connected",
        description: "Your Simkl account has been successfully connected.",
      });
      navigate("/profile");
    });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [location.search, updatePreferences, navigate, toast]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="mb-4 text-2xl font-bold text-red-500">Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="mb-4 text-2xl font-bold">Connecting to Simkl...</h1>
      <p className="text-muted-foreground">
        Please wait while we complete the setup.
      </p>
    </div>
  );
}

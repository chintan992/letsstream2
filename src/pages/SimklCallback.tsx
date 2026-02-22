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
  const processedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const handleCallback = async () => {
      // Guard against double runs
      if (processedRef.current) return;

      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      let errorMsg: string | null = null;

      if (errorParam) {
        processedRef.current = true;
        errorMsg = "Simkl authentication denied.";
        toast({
          title: "Authentication Failed",
          description: "Simkl authentication was denied.",
          variant: "destructive",
        });
        if (isMounted) setTimeout(() => navigate("/profile"), 2000);
      } else if (!code) {
        processedRef.current = true;
        errorMsg = "No authentication code received.";
        toast({
          title: "Authentication Failed",
          description: "No authentication code received.",
          variant: "destructive",
        });
        if (isMounted) setTimeout(() => navigate("/profile"), 2000);
      } else if (!processedRef.current) {
        processedRef.current = true;

        try {
          const redirectUri = `${window.location.origin}/simkl-callback`;
          const tokenResponse = await SimklService.exchangeCodeForToken(
            code,
            redirectUri
          );

          if (!tokenResponse.access_token) {
            throw new Error("Token response missing access_token");
          }

          await updatePreferences({
            simklToken: tokenResponse.access_token,
            isSimklEnabled: true,
          });

          if (isMounted) {
            toast({
              title: "Simkl Connected",
              description:
                "Your Simkl account has been successfully connected.",
            });
            navigate("/profile");
          }
        } catch (err) {
          if (!isMounted) return;
          console.error("Simkl authentication error:", err);
          errorMsg = "Failed to connect to Simkl. Please try again.";
          toast({
            title: "Connection Failed",
            description: "Could not connect to Simkl. Please try again.",
            variant: "destructive",
          });
          if (isMounted) setTimeout(() => navigate("/profile"), 2000);
        }
      }

      if (errorMsg) {
        if (isMounted) setError(errorMsg);
      }
    };

    handleCallback();
    return () => {
      isMounted = false;
    };
  }, [location, updatePreferences, navigate, toast]);

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

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
        const handleCallback = async () => {
            const searchParams = new URLSearchParams(location.search);
            const code = searchParams.get("code");
            const errorParam = searchParams.get("error");

            if (errorParam) {
                setError("Simkl authentication denied.");
                toast({
                    title: "Authentication Failed",
                    description: "Simkl authentication was denied.",
                    variant: "destructive",
                });
                setTimeout(() => navigate("/profile"), 2000);
                return;
            }

            if (!code) {
                setError("No authentication code received.");
                return;
            }

            if (processedRef.current) return;
            processedRef.current = true;

            try {
                const redirectUri = `${window.location.origin}/simkl-callback`;
                const tokenResponse = await SimklService.exchangeCodeForToken(
                    code,
                    redirectUri
                );

                // IMPORTANT: Check valid token
                if (!tokenResponse.access_token) {
                    throw new Error("Token response missing access_token");
                }

                await updatePreferences({
                    simklToken: tokenResponse.access_token,
                    isSimklEnabled: true,
                });

                toast({
                    title: "Simkl Connected",
                    description: "Your Simkl account has been successfully connected.",
                });

                navigate("/profile");
            } catch (err) {
                console.error("Simkl authentication error:", err);
                setError("Failed to connect to Simkl. Please try again.");
                toast({
                    title: "Connection Failed",
                    description: "Could not connect to Simkl. Please try again.",
                    variant: "destructive",
                });
                setTimeout(() => navigate("/profile"), 2000);
            }
        };

        handleCallback();
    }, [location, updatePreferences, navigate, toast]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <h1 className="text-2xl font-bold mb-4">Connecting to Simkl...</h1>
            <p className="text-muted-foreground">Please wait while we complete the setup.</p>
        </div>
    );
}

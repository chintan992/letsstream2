import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useScrollRestoration } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileActions } from "@/hooks/useProfileActions";
import ProfileHeader from "@/components/ProfileHeader";

// Lazy load tab components for better performance
const OverviewTab = lazy(() => import("../components/profile/OverviewTab"));
const FavoritesTab = lazy(() => import("../components/profile/FavoritesTab"));
const WatchlistTab = lazy(() => import("../components/profile/WatchlistTab"));
const PreferencesTab = lazy(
  () => import("../components/profile/PreferencesTab")
);
const BackupTab = lazy(() => import("../components/profile/BackupTab"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-accent" />
  </div>
);

const Profile = () => {
  const { user } = useProfileData();
  const [activeTab, setActiveTab] = useState("overview");
  const [isTabHydrated, setIsTabHydrated] = useState(false);
  const navigate = useNavigate();

  const updateTabHydration = useCallback(() => {
    setIsTabHydrated(false);
    const timer = setTimeout(() => {
      setIsTabHydrated(true);
    }, 100); // Small delay to ensure content has rendered

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Reset hydration state when tab changes and set it after a short timeout
  useEffect(() => {
    const cleanup = updateTabHydration();
    return cleanup;
  }, [activeTab, updateTabHydration]);

  // Use tab-specific scroll restoration with hydration check
  useScrollRestoration({
    storageKey: `scroll-profile-${activeTab}`,
    enabled: isTabHydrated,
  });

  useEffect(() => {
    // Redirect to home if not logged in
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse-slow font-medium text-white">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <ProfileHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="container mx-auto px-4 pb-8">
        <Tabs value={activeTab} className="mt-6">
          <TabsContent value="overview" className="pt-4">
            <Suspense fallback={<LoadingFallback />}>
              <OverviewTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            <Suspense fallback={<LoadingFallback />}>
              <OverviewTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="favorites" className="pt-4">
            <Suspense fallback={<LoadingFallback />}>
              <FavoritesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="watchlist" className="pt-4">
            <Suspense fallback={<LoadingFallback />}>
              <WatchlistTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="preferences" className="pt-4">
            <Suspense fallback={<LoadingFallback />}>
              <PreferencesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="backup" className="pt-4">
            <Suspense fallback={<LoadingFallback />}>
              <BackupTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;

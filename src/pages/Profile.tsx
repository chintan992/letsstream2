import { useState, useEffect, useRef, useCallback } from 'react';
import { triggerHapticFeedback, triggerSuccessHaptic } from '@/utils/haptic-feedback';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { useWatchHistory } from '@/hooks/watch-history';
import { useUserPreferences } from '@/hooks/user-preferences';
import { User, History, Settings, Check, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import AccentColorPicker from '@/components/AccentColorPicker';
import { BackupRestore } from '@/components/BackupRestore';
import { BackupRestoreErrorBoundary } from '@/components/BackupRestoreErrorBoundary';
import { videoSources } from '@/utils/video-sources';
import { trackEvent } from '@/lib/analytics';

const Profile = () => {
  const { user, logout } = useAuth();
  const { watchHistory, clearWatchHistory, hasMore, isLoading, loadMore } = useWatchHistory();
  const { userPreferences, toggleWatchHistory, toggleNotifications, updatePreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('history');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loader = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    await loadMore();
    setIsLoadingMore(false);
  }, [loadMore]);

  useEffect(() => {
    // Redirect to home if not logged in
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const currentLoader = loader.current;
    const currentObserver = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && activeTab === 'history') {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoader) {
      currentObserver.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        currentObserver.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoadingMore, activeTab, handleLoadMore]);

  const handleClearHistory = () => {
    triggerHapticFeedback(25);
    clearWatchHistory();
    toast({
      title: "Watch history cleared",
      description: "Your watch history has been successfully cleared."
    });
  };


  const handleSignOut = async () => {
    triggerHapticFeedback(25);
    try {
      await logout();
      await trackEvent({
        name: 'user_logout',
        params: {
          user: user?.email || user?.uid || 'unknown',
        },
      });
      navigate('/login');
    } catch (error) {
      // Error is handled in auth context
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-slow text-white font-medium">Loading...</div>
      </div>
    );
  }

  // Convert watch history items to Media format for the MediaGrid
  const watchHistoryMedia = watchHistory.map(item => ({
    id: item.media_id,
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    // Additional watch info to display
    watch_position: item.watch_position,
    duration: item.duration,
    created_at: item.created_at
  }));

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />
      
      <motion.div 
        className="container mx-auto pt-24 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass p-6 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 bg-accent text-white text-2xl">
              <AvatarImage src={user.photoURL || ""} alt={user.email || 'User'} />
              <AvatarFallback>
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {user.displayName || user.email || 'User Profile'}
              </h1>
              <p className="text-white/70">{user.email}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => {
          triggerHapticFeedback(15);
          setActiveTab(value);
        }} className="mt-6">
          <TabsList className="bg-background border border-white/10">
            <TabsTrigger value="history" className="data-[state=active]:bg-accent">
              <History className="h-4 w-4 mr-2" />
              Watch History
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-accent">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-accent">
              <User className="h-4 w-4 mr-2" />
              Backup & Restore
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Your Watch History</h2>
              
              {watchHistory.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearHistory}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  Clear History
                </Button>
              )}
            </div>
            
            {watchHistory.length > 0 ? (
              <>
                <MediaGrid media={watchHistoryMedia} listView />
                {(hasMore || isLoadingMore) && (
                  <div 
                    ref={loader}
                    className="w-full flex justify-center py-4"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                )}
              </>
            ) : (
              <div className="glass p-8 rounded-lg text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-white/50" />
                <h3 className="text-lg font-medium text-white mb-2">No watch history yet</h3>
                <p className="text-white/70 mb-4">
                  Start watching movies and shows to build your history.
                </p>
                <Button onClick={() => navigate('/')}>
                  Browse Content
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preferences" className="pt-4">
            <div className="glass p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Your Preferences</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-medium text-white">Watch History</h3>
                    <p className="text-sm text-white/70">
                      {userPreferences?.isWatchHistoryEnabled
                        ? "Your watch history is being recorded"
                        : "Your watch history is not being recorded"}
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.isWatchHistoryEnabled}
                    onCheckedChange={() => {
                      triggerHapticFeedback(20);
                      toggleWatchHistory();
                    }}
                    aria-label="Toggle watch history"
                  />
                </div>
                
                {/* Accent Color Picker */}
                <AccentColorPicker />
                
                {/* Video Source Preference removed */}

                {/* Feature Notifications Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-medium">Feature Notifications</h3>
                    <p className="text-sm text-white/70">
                      Get notified about new features and updates
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.isNotificationsEnabled}
                    onCheckedChange={() => {
                      triggerHapticFeedback(20);
                      toggleNotifications();
                    }}
                    aria-label="Toggle feature notifications"
                  />
                </div>

                {/* Display Override */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Display Override</h3>
                  <p className="text-sm text-white/70">
                    Select the display mode for the app
                  </p>
                  <Select
                    value={userPreferences?.display_override || ''}
                    onValueChange={async (value) => {
                      triggerSuccessHaptic();
                      await updatePreferences({ display_override: value });
                      await trackEvent({
                        name: 'user_profile_update',
                        params: {
                          field: 'display_override',
                          value,
                          user: user?.email || user?.uid || 'unknown',
                        },
                      });
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[200px] bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      {['fullscreen', 'minimal-ui', 'browser', 'standalone'].map(mode => (
                        <SelectItem
                          key={mode}
                          value={mode}
                          className="text-white focus:text-white focus:bg-white/10"
                        >
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="pt-4">
            <BackupRestoreErrorBoundary>
              <BackupRestore />
            </BackupRestoreErrorBoundary>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      <Footer />
    </div>
  );
};

export default Profile;

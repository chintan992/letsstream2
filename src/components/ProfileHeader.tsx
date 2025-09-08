import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, History, Heart, Bookmark, Database, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileStatistics from './ProfileStatistics';
import ProfileEditModal from './ProfileEditModal';
import { useProfileData } from '@/hooks/useProfileData';
import { useProfileActions } from '@/hooks/useProfileActions';

interface ProfileHeaderProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ activeTab, onTabChange }) => {
  const { userDisplayInfo, profileStats } = useProfileData();
  const { handleSignOut, handleTabChange } = useProfileActions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const tabs = [
    { value: 'overview', label: 'Overview', icon: User },
    { value: 'history', label: 'Watch History', icon: History },
    { value: 'favorites', label: 'Favorites', icon: Heart },
    { value: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { value: 'preferences', label: 'Preferences', icon: Settings },
    { value: 'backup', label: 'Backup', icon: Database }
  ];

  return (
    <motion.div
      className="container mx-auto pt-24 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Profile Header */}
      <div className="glass p-6 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 bg-accent text-white text-2xl">
            <AvatarImage src={userDisplayInfo.avatar} alt={userDisplayInfo.name} />
            <AvatarFallback>{userDisplayInfo.initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {userDisplayInfo.name}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                aria-label="Edit profile"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-white/70">{userDisplayInfo.email}</p>
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

      {/* Statistics */}
      <ProfileStatistics stats={profileStats} className="mb-8" />

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value, onTabChange)} className="mb-6">
        <TabsList className="bg-background border border-white/10 w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-accent flex items-center gap-2 whitespace-nowrap"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </motion.div>
  );
};

export default ProfileHeader;
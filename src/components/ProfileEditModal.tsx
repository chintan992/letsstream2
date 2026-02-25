import React, { useState, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { triggerSuccessHaptic } from "@/utils/haptic-feedback";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleSave = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      let photoURL = user.photoURL ?? undefined;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const storageRef = ref(storage, `users/${user.uid}/profile.${ext}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }
      await updateProfile(user, {
        displayName: displayName.trim(),
        ...(photoURL !== user.photoURL ? { photoURL } : {}),
      });
      triggerSuccessHaptic();
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Photo must be under 5 MB.",
        variant: "destructive",
      });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="border-white/10 bg-background sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-white">
                <User className="mr-2 h-5 w-5" />
                Edit Profile
              </DialogTitle>
            </DialogHeader>

            <m.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 bg-accent text-2xl text-white">
                    <AvatarImage
                      src={photoPreview || user?.photoURL || ""}
                      alt={user?.email || "User"}
                    />
                    <AvatarFallback>
                      {user?.email
                        ? user.email.substring(0, 2).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={handlePhotoUpload}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-center text-sm text-white/70">
                  Click the camera icon to change your profile picture
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-white">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
                />
                <p className="text-xs text-white/70">
                  This is the name that will be displayed on your profile
                </p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label className="text-white">Email Address</Label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="cursor-not-allowed border-white/10 bg-white/5 text-white/70"
                />
                <p className="text-xs text-white/70">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isUpdating || !displayName.trim()}
                  className="flex-1"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </m.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ProfileEditModal;

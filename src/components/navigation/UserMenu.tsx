import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserCircle, LogOut, Settings, User, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  mobile?: boolean;
  onAction?: () => void;
}

const UserMenu = ({ mobile = false, onAction }: UserMenuProps) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsOpen(false);
      if (onAction) onAction();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (mobile) {
    return (
      <div className="flex flex-col space-y-2">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
          onClick={onAction}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-medium">{user?.displayName || "User"}</div>
            <div className="text-xs text-white/60">{user?.email}</div>
          </div>
        </Link>

        <Button
          variant="outline"
          className="w-full justify-start text-white/80"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="nav-profile-button">
          <span className="sr-only">User menu</span>
          <UserCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="mt-1 w-56 border-white/10 bg-black/95 p-2 backdrop-blur-xl"
      >
        <div className="mb-1 flex items-center gap-3 p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-medium">{user?.displayName || "User"}</div>
            <div className="text-xs text-white/60">{user?.email}</div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem asChild className="h-9 cursor-pointer">
          <Link
            to="/profile"
            className="flex items-center"
            onClick={() => {
              setIsOpen(false);
              if (onAction) onAction();
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="h-9 cursor-pointer">
          <Link
            to="/watch-history"
            className="flex items-center"
            onClick={() => {
              setIsOpen(false);
              if (onAction) onAction();
            }}
          >
            <History className="mr-2 h-4 w-4" />
            <span>Watch History</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="h-9 cursor-pointer">
          <Link
            to="/profile"
            className="flex items-center"
            onClick={() => {
              setIsOpen(false);
              if (onAction) onAction();
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          className="h-9 cursor-pointer text-red-400 focus:text-red-400"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

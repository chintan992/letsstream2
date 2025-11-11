import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Film,
  Tv2,
  Trophy,
  Flame,
  Search,
  User,
  History,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
  };

  const menuItemVariants = {
    closed: {
      opacity: 0,
      x: 20,
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const menuItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Movies", path: "/movie", icon: Film },
    { name: "TV Shows", path: "/tv", icon: Tv2 },
    { name: "Sports", path: "/sports", icon: Trophy },
    // { name: 'Live', path: '/live', icon: Flame },
    { name: "Trending", path: "/trending", icon: Flame },
    { name: "Search", path: "/search", icon: Search },
  ];

  if (user) {
    menuItems.push(
      { name: "Profile", path: "/profile", icon: User },
      { name: "Watch History", path: "/watch-history", icon: History }
    );
  } else {
    menuItems.push(
      { name: "Login", path: "/login", icon: User },
      { name: "Sign Up", path: "/signup", icon: User }
    );
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Menu */}
      <motion.div
        className="bg-background/95 fixed bottom-0 right-0 top-0 z-50 w-64 overflow-y-auto shadow-lg backdrop-blur-lg"
        variants={menuVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 text-white/80 transition-colors hover:text-white"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 pb-6">
          <ul className="space-y-1">
            {menuItems.map(item => (
              <motion.li key={item.path} variants={menuItemVariants}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center rounded-md px-4 py-3 transition-colors",
                    isActive(item.path)
                      ? "bg-accent/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon size={18} className="mr-3" />
                  {item.name}
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>
      </motion.div>
    </>
  );
};

export default MobileMenu;

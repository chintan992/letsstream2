import React, { useState, useEffect } from "react";
import { triggerHapticFeedback } from "@/utils/haptic-feedback";
import PWAInstallPrompt from "./PWAInstallPrompt";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "./navigation/Logo";
import SearchBar from "./navigation/SearchBar";
import NavLinks from "./navigation/NavLinks";
import MobileMenu from "./navigation/MobileMenu";
import UserMenu from "./navigation/UserMenu";
import AuthButtons from "./navigation/AuthButtons";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Show install prompt after a delay, but only if not shown recently in this session
    const hasSeenPrompt = sessionStorage.getItem("pwaPromptShown");
    if (!hasSeenPrompt) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
        sessionStorage.setItem("pwaPromptShown", "true");
      }, 5000); // 5 seconds delay
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleSearch = () => {
    triggerHapticFeedback(15);
    setIsSearchExpanded(!isSearchExpanded);
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isScrolled ? "nav-scrolled" : "nav-transparent"
        }`}
    >
      {/* z-50: Ensures navbar stays above all page content including modals and overlays */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo area - always visible */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop nav links - hidden on mobile */}
          <div className="ml-8 hidden items-center justify-center md:flex">
            <NavLinks />
          </div>

          {/* Right side: Search, Profile/Auth, Menu button */}
          <div className="flex items-center gap-3">
            {/* Desktop search bar - hidden on mobile */}
            <div className="hidden md:block">
              <SearchBar />
            </div>

            {/* Mobile search - Only visible on mobile */}
            {isMobile && !isSearchExpanded && (
              <SearchBar
                isMobile
                expanded={isSearchExpanded}
                onToggleExpand={toggleSearch}
              />
            )}

            {/* Expanded mobile search takes full width - Only visible when expanded */}
            {isMobile && isSearchExpanded && (
              <div className="absolute inset-x-0 top-0 z-50 flex items-center bg-black/95 p-3 backdrop-blur-xl">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    triggerHapticFeedback(15);
                    toggleSearch();
                  }}
                  className="mr-2 text-white hover:bg-white/10"
                  aria-label="Close search"
                >
                  <X className="h-6 w-6" />
                </Button>
                <SearchBar
                  isMobile
                  expanded={true}
                  onToggleExpand={toggleSearch}
                  className="flex-1"
                  onSearch={toggleSearch}
                />
              </div>
            )}

            {/* User menu or auth buttons */}
            {!isSearchExpanded && (
              <>
                {user ? (
                  <>
                    {showInstallPrompt && <PWAInstallPrompt />}
                    <UserMenu />
                  </>
                ) : (
                  <>
                    {showInstallPrompt && <PWAInstallPrompt />}
                    <AuthButtons />
                  </>
                )}

                {/* Mobile menu button - only visible on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 md:hidden"
                  onClick={() => {
                    triggerHapticFeedback(20);
                    setIsMobileMenuOpen(true);
                  }}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => {
          triggerHapticFeedback(20);
          setIsMobileMenuOpen(false);
        }}
      />
    </header>
  );
};

export default Navbar;

import React, { useState, useEffect } from "react";
import { useChatbot } from "@/contexts/chatbot-context";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

/**
 * ProactiveSuggestions component that provides contextual suggestions
 * based on time of day, viewing history, etc.
 */
const ProactiveSuggestions: React.FC = () => {
  const [suggestionState, setSuggestionState] = useState({
    visible: false,
    text: "",
  });
  const autoHideTimerRef = React.useRef<number | null>(null);
  const { visible, text: suggestion } = suggestionState;
  const { sendMessage, isOpen } = useChatbot();
  const { profile } = useUserProfile();

  // Generate a contextual suggestion based on time and profile
  const generateSuggestion = (): string => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;

    // Suggestions based on time of day
    if (hour < 12) {
      return isWeekend
        ? "Looking for something to watch with breakfast?"
        : "Need a quick show recommendation before work?";
    } else if (hour < 17) {
      return "How about a recommendation for this afternoon?";
    } else if (hour < 21) {
      return isWeekend
        ? "Looking for a movie for weekend night?"
        : "Need something to unwind after work?";
    } else {
      return "Late night viewing recommendations?";
    }
  };

  // Only show proactive suggestions when the chat is closed
  // and randomly (not too frequently)
  useEffect(() => {
    if (isOpen) {
      setSuggestionState(prev => ({ ...prev, visible: false }));
      return;
    }

    const checkProactiveSuggestion = () => {
      if (Math.random() < 0.3) {
        // Clear any existing timer before creating a new one
        if (autoHideTimerRef.current) {
          clearTimeout(autoHideTimerRef.current);
          autoHideTimerRef.current = null;
        }
        setSuggestionState({ text: generateSuggestion(), visible: true });

        autoHideTimerRef.current = window.setTimeout(() => {
          setSuggestionState(prev => ({ ...prev, visible: false }));
        }, 15000);
      }
    };

    // Initial check
    const timer = setTimeout(checkProactiveSuggestion, 10000);

    // Check again periodically
    const interval = setInterval(checkProactiveSuggestion, 60000 * 30); // every 30 minutes

    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isOpen]);

  const handleSuggestionClick = () => {
    const message = suggestion.replace(/\?$/, "");
    sendMessage(message);
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    setSuggestionState(prev => ({ ...prev, visible: false }));
  };

  const handleDismiss = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    setSuggestionState(prev => ({ ...prev, visible: false }));
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 right-4 z-40"
        >
          <Card className="w-[250px] shadow-lg">
            <CardContent className="flex flex-col p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center text-primary">
                  <Sparkles size={14} className="mr-1" />
                  <span className="text-xs font-medium">Suggestion</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleDismiss}
                >
                  <X size={12} />
                </Button>
              </div>

              <p className="mb-3 text-sm">{suggestion}</p>

              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={handleSuggestionClick}
              >
                Get Recommendations
              </Button>
            </CardContent>
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default ProactiveSuggestions;

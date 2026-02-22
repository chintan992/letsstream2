import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Mic, BellOff, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatbot } from "@/contexts/chatbot-context";
import { cn } from "@/lib/utils";
import {
  triggerHapticFeedback,
  triggerHapticPattern,
} from "@/utils/haptic-feedback";
import { m, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChatbotButton: React.FC = () => {
  const {
    isOpen,
    openChatbot,
    closeChatbot,
    messages,
    hasUnread,
    setHasUnread,
    isMuted,
    setIsMuted,
  } = useChatbot();
  const [position, setPosition] = useState(() => {
    if (typeof window !== "undefined") {
      return {
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      };
    }
    return { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const dragConstraints = useRef<HTMLDivElement>(null);

  // Reset unread indicator when opening chat
  useEffect(() => {
    if (isOpen && hasUnread) {
      setHasUnread(false);
    }
  }, [isOpen, hasUnread, setHasUnread]);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      // Snap to edge if near edge after resize
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const thresholdDistance = 60; // px from edge to trigger snap

      let newX = position.x;
      let newY = position.y;

      // Snap to right edge
      if (windowWidth - position.x < thresholdDistance) {
        newX = windowWidth - 80;
      }

      // Snap to bottom edge
      if (windowHeight - position.y < thresholdDistance) {
        newY = windowHeight - 80;
      }

      // Snap to left edge
      if (position.x < thresholdDistance) {
        newX = 20;
      }

      // Snap to top edge
      if (position.y < thresholdDistance) {
        newY = 20;
      }

      setPosition({ x: newX, y: newY });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  // Toggle voice recording
  const toggleRecording = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if Web Speech API is available
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    setIsRecording(!isRecording);

    if (!isRecording) {
      // Create speech recognition instance
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = event => {
        const speechResult = event.results[0][0].transcript;
        setIsRecording(false);

        // Send the transcribed speech to the chatbot
        if (speechResult.trim()) {
          openChatbot();
          // Use setTimeout to ensure state is updated
          setTimeout(() => {
            // We would call the sendMessage function here
            // Since we don't have direct access to input field and form submission,
            // ideally we would emit an event or use a shared context method
            console.log("Speech recognized:", speechResult);
          }, 100);
        }
      };

      recognition.onerror = event => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    }
  };

  // Toggle notification sound
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    setShowOptions(false);
    // Provide haptic feedback if supported
    triggerHapticFeedback(50);
  };

  const handleLongPress = () => {
    setShowOptions(!showOptions);
    // Provide haptic feedback if supported
    triggerHapticPattern([50, 50, 50]);
  };

  const mainButtonSize = isOpen ? "w-12 h-12" : "w-14 h-14";

  // Use a dark icon color when open (on light background), white when closed
  const iconColorClass = isOpen ? "text-gray-900" : "text-white";
  // Use the darkest blue background when closed (almost black, but blue)
  const closedBgClass = "bg-[#010a1a]";

  return (
    <div
      ref={dragConstraints}
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <m.div
        drag
        dragConstraints={dragConstraints}
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setIsDragging(false);

          // Snap to edge logic
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const thresholdDistance = 50; // px from edge to trigger snap

          let newX = position.x;
          let newY = position.y;

          // Snap to right edge
          if (windowWidth - position.x < thresholdDistance) {
            newX = windowWidth - 80;
          }

          // Snap to left edge
          if (position.x < thresholdDistance) {
            newX = 20;
          }

          // Snap to bottom (priority over top)
          if (windowHeight - position.y < thresholdDistance) {
            newY = windowHeight - 80;
          }
          // Snap to top
          else if (position.y < thresholdDistance) {
            newY = 20;
          }

          setPosition({ x: newX, y: newY });

          // Provide haptic feedback when snapping to edges
          triggerHapticFeedback(30);
        }}
        initial={{ x: position.x, y: position.y }}
        animate={{
          x: position.x,
          y: position.y,
          scale: isDragging ? 0.95 : 1,
        }}
        whileTap={{ scale: 0.95 }}
        onPointerDown={() => {
          if (isRecording) return; // Prevent opening chat if recording
          if (!isDragging && !showOptions) {
            if (isOpen) {
              closeChatbot();
            } else {
              openChatbot();
            }
          }
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 400,
        }}
        style={{ position: "absolute" }}
        className="pointer-events-auto"
      >
        {/* Main button with pulse effect when unread messages */}
        <div className="relative">
          <AnimatePresence>
            {hasUnread && !isOpen && (
              <m.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute -right-1 -top-1 z-10 h-4 w-4 rounded-full bg-red-500"
              />
            )}
          </AnimatePresence>

          <Button
            className={cn(
              "flex items-center justify-center rounded-full shadow-lg",
              mainButtonSize,
              isOpen ? "bg-white/90" : `${closedBgClass} text-white`,
              hasUnread && !isOpen && "animate-pulse",
              isDragging && "cursor-grabbing"
            )}
            variant="default"
            onContextMenu={e => {
              e.preventDefault();
              handleLongPress();
            }}
            onTouchStart={e => {
              // Start a timer for long press detection
              const timer = setTimeout(() => {
                handleLongPress();
              }, 500);
              // Clear timer on touch end/move
              const clearTimer = () => {
                clearTimeout(timer);
                document.removeEventListener("touchend", clearTimer);
                document.removeEventListener("touchmove", clearTimer);
              };
              document.addEventListener("touchend", clearTimer, {
                once: true,
                passive: true,
              });
              document.addEventListener("touchmove", clearTimer, {
                once: true,
              });
            }}
          >
            {isOpen ? (
              <X className={cn("h-5 w-5", iconColorClass)} />
            ) : isRecording ? (
              <m.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Mic className="h-6 w-6 text-red-500" />
              </m.div>
            ) : (
              <MessageSquare className={cn("h-6 w-6", iconColorClass)} />
            )}
          </Button>
        </div>

        {/* Additional button options */}
        <AnimatePresence>
          {showOptions && (
            <>
              {/* Mic Button */}
              <m.div
                initial={{ y: 0, opacity: 0, scale: 0.5 }}
                animate={{ y: -60, opacity: 1, scale: 1 }}
                exit={{ y: 0, opacity: 0, scale: 0.5 }}
                transition={{ delay: 0, duration: 0.2 }}
                className="absolute left-0"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-md"
                      onClick={toggleRecording}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voice input</p>
                  </TooltipContent>
                </Tooltip>
              </m.div>

              {/* Notification Toggle Button */}
              <m.div
                initial={{ y: 0, opacity: 0, scale: 0.5 }}
                animate={{ y: -110, opacity: 1, scale: 1 }}
                exit={{ y: 0, opacity: 0, scale: 0.5 }}
                transition={{ delay: 0.05, duration: 0.2 }}
                className="absolute left-0"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-full shadow-md",
                        isMuted
                          ? "bg-gray-300 text-gray-600"
                          : "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
                      )}
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <BellOff className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isMuted ? "Unmute notifications" : "Mute notifications"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </m.div>
            </>
          )}
        </AnimatePresence>
      </m.div>
    </div>
  );
};

export default ChatbotButton;

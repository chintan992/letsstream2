import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import * as Toast from "@radix-ui/react-toast";
import { useWillChange } from "@/hooks/useWillChange";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, "id">) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NotificationToast: React.FC<{
  notification: Notification;
  removeNotification: (id: string) => void;
}> = ({ notification, removeNotification }) => {
  const toastRef = useRef<HTMLLIElement>(null);

  // Manage will-change for notification toast using the updated hook
  const { setWillChange, removeWillChange } = useWillChange(
    toastRef,
    "transform, opacity",
    {
      animationName: "slideIn, slideOut", // For slide animations
      animationDuration: 150, // 150ms for slideIn/slideOut animations
      cleanupOnUnmount: true,
      respectReducedMotion: true,
    }
  );

  // Apply will-change when toast mounts and manage animation lifecycle
  useEffect(() => {
    const element = toastRef.current;
    if (element) {
      // Set will-change before animation
      setWillChange();

      // Listen for animation end to clean up will-change appropriately
      const handleAnimationEnd = (e: AnimationEvent) => {
        if (e.animationName === "slideOut") {
          // After slideOut, remove will-change
          removeWillChange();
        } else if (e.animationName === "slideIn") {
          // For slideIn, keep will-change until slideOut or unmount
          // This is handled by the hook's cleanup
        }
      };

      element.addEventListener("animationend", handleAnimationEnd);

      // Cleanup
      return () => {
        element.removeEventListener("animationend", handleAnimationEnd);
        removeWillChange();
      };
    }
  }, [setWillChange, removeWillChange]);

  return (
    <Toast.Root
      ref={toastRef}
      key={notification.id}
      className={`notification-toast notification-${notification.type}`}
      duration={notification.duration || 5000}
      onOpenChange={open => {
        if (!open) removeNotification(notification.id);
      }}
    >
      <Toast.Title className="notification-title">
        {notification.title}
      </Toast.Title>
      {notification.description && (
        <Toast.Description className="notification-description">
          {notification.description}
        </Toast.Description>
      )}
    </Toast.Root>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const showNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [...prev, { ...notification, id }]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            removeNotification={removeNotification}
          />
        ))}
        <Toast.Viewport className="notification-viewport" />
      </Toast.Provider>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

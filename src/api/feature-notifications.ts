export interface FeatureNotification {
  id: string;
  title: string;
  description: string;
  version: string;
  date: string;
  details?: {
    link?: string;
    imageUrl?: string;
    category?: string;
  };
}

interface FeatureNotificationResponse {
  notifications: FeatureNotification[];
  currentVersion: string;
}

export async function fetchFeatureNotifications(): Promise<FeatureNotificationResponse> {
  // In production, this would be an actual API call
  // For now, we'll simulate the response

  // You could fetch this from your backend, GitHub releases API, or a CMS
  const notifications: FeatureNotification[] = [
    {
      id: "feature-2023-1",
      title: "🎥 Enhanced Video Player",
      description:
        "We've improved our video player with new controls and better performance.",
      version: "1.0.0",
      date: "2023-12-01",
      details: {
        category: "player",
        link: "/player",
      },
    },
    // Add more feature notifications here
  ];

  return {
    notifications,
    currentVersion: "1.0.0", // This should match your current deployment version
  };
}

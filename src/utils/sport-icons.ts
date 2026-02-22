// Sport icons mapping
export const sportIcons: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  "american-football": "🏈",
  hockey: "🏒",
  baseball: "⚾",
  "motor-sports": "🏎️",
  fight: "🥊",
  tennis: "🎾",
  rugby: "🏉",
  golf: "⛳",
  billiards: "🎱",
  afl: "🏉",
  darts: "🎯",
  cricket: "🏏",
  other: "🏅",
};

export const getSportIcon = (sportId: string): string => {
  return sportIcons[sportId] || sportIcons.other;
};

// Tab icons
export const tabIcons = {
  popular: "🔥",
  live: "🔴",
  all: "📅",
};

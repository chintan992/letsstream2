interface Keyword {
  id: number;
  name: string;
}

interface TVShowKeywordsProps {
  keywords: Keyword[];
}

export const TVShowKeywords = ({ keywords }: TVShowKeywordsProps) => {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Keywords</h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map(keyword => (
          <span
            key={keyword.id}
            className="from-accent/20 to-accent/10 rounded-full border border-white/10 bg-gradient-to-r px-3 py-1.5 text-sm text-white/90 backdrop-blur-sm"
          >
            {keyword.name}
          </span>
        ))}
      </div>
    </div>
  );
};

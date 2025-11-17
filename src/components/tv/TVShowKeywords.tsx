interface TVShowKeywordsProps {
  keywords: any[];
}

export const TVShowKeywords = ({ keywords }: TVShowKeywordsProps) => {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Keywords</h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span 
            key={keyword.id}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 border border-white/10 text-white/90 text-sm backdrop-blur-sm"
          >
            {keyword.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TVShowKeywords;
import React from "react";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Spinner: React.FC<SpinnerProps> = ({ className, size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className="h-full w-full animate-spin rounded-full border-b-transparent border-l-transparent border-r-transparent border-t-accent"></div>
    </div>
  );
};

export default Spinner;

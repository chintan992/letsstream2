import React, { useState, useEffect } from "react";
import { m } from "framer-motion";

interface TypingTextProps {
  text: string;
  onComplete?: () => void;
}

export const TypingText: React.FC<TypingTextProps> = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const onCompleteRef = React.useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    setIsTyping(true);
    let timeoutId: NodeJS.Timeout;

    const typingSpeed = Math.max(
      5,
      Math.min(20, Math.floor(1000 / text.length))
    );

    const typeNextChar = () => {
      if (index >= text.length) {
        setIsTyping(false);
        if (onCompleteRef.current) onCompleteRef.current();
        return;
      }

      setDisplayedText(prev => prev + text[index]);
      index++;

      let delay = typingSpeed;
      if (index < text.length) {
        const punctuation = [".", "!", "?", ",", ";", ":"];
        if (punctuation.includes(text[index - 1])) {
          delay = text[index - 1] === "." ? 300 : 150;
        }
      }

      timeoutId = setTimeout(typeNextChar, delay);
    };

    timeoutId = setTimeout(typeNextChar, typingSpeed);
    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <>
      {displayedText}
      {isTyping && (
        <m.span
          className="ml-1 inline-block opacity-70"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ▋
        </m.span>
      )}
    </>
  );
};

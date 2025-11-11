import { useEffect, useRef } from "react";

export function useInfiniteScroll(callback: () => void, isLoading: boolean) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const node = observerRef.current;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 1 }
    );
    if (node) {
      observer.observe(node);
    }
    return () => {
      if (node) {
        observer.unobserve(node);
      }
    };
  }, [callback, isLoading]);

  return observerRef;
}

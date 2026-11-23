import { useEffect, useRef, useState } from 'react';

/**
 * Avisa uma única vez quando o elemento entra na tela, para disparar a animação de entrada
 * (ex.: o `countReveal` dos cards de Indicadores e de Nossos valores).
 */
export function useInViewOnce<T extends Element = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasEntered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEntered, threshold]);

  return { ref, hasEntered };
}

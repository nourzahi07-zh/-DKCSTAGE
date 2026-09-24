"use client";

import { useEffect, useRef } from "react";
import type { ElementType, ReactNode } from "react";

/** Reveal anything that hasn't appeared after this long, whatever happens. */
const SAFETY_DELAY_MS = 2000;

/**
 * Fades content in as it scrolls into view.
 *
 * Built to fail open, because a decorative animation must never be able to
 * hide real content:
 *  - the server-rendered markup is fully visible; the hidden state is added
 *    by JavaScript only;
 *  - content already on screen is never hidden at all;
 *  - if IntersectionObserver never reports the element (disabled JS, an
 *    unsupported browser, a background tab that stops painting), a timer
 *    reveals it anyway;
 *  - visitors who ask for reduced motion get no animation at all.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadyVisible = element.getBoundingClientRect().top < window.innerHeight;
    if (reduced || alreadyVisible || typeof IntersectionObserver === "undefined") return;

    element.style.transitionDelay = `${delay}s`;
    element.classList.add("reveal");

    const show = () => element.classList.add("reveal-visible");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);

    const safety = window.setTimeout(() => {
      show();
      observer.disconnect();
    }, SAFETY_DELAY_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
    };
  }, [delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

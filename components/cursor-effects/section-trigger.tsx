"use client";

import { useRef, useEffect } from "react";
import { useInView } from "framer-motion";
import { useCursorEffect, CursorEffectType } from "@/hooks/use-cursor-effect";

interface SectionTriggerProps {
  effect: CursorEffectType;
  children: React.ReactNode;
  className?: string;
}

export function SectionTrigger({ effect, children, className }: SectionTriggerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const { setEffect } = useCursorEffect();

  useEffect(() => {
    if (isInView) {
      setEffect(effect);
    }
  }, [isInView, effect, setEffect]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

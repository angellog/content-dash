"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Platform } from "@/lib/omnisocial";

interface PlatformViewProps {
  platform: Platform;
  direction: number;
  children: React.ReactNode;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export function PlatformView({ platform, direction, children }: PlatformViewProps) {
  const xOffset = direction > 0 ? 300 : -300;
  const exitXOffset = direction > 0 ? -300 : 300;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={platform}
        initial={{ x: xOffset, opacity: 0, scale: 0.98 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: exitXOffset, opacity: 0, scale: 0.98 }}
        transition={springTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

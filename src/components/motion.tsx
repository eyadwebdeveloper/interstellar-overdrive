import type { ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * Shared Framer Motion helpers. Every animation in the workspace is
 * gated twice: the in-app "Reduce motion" preference and the OS-level
 * prefers-reduced-motion setting. When either asks for stillness,
 * components render without motion wrappers.
 */

export function useMotionAllowed(): boolean {
  const enabled = useSettingsStore((s) => s.animationsEnabled);
  const osReduced = useReducedMotion() ?? false;
  return enabled && !osReduced;
}

export const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const SHAKE: Variants = {
  hidden: {},
  show: {},
  shake: {
    x: [0, -7, 6, -4, 3, 0],
    transition: { duration: 0.4, ease: "easeInOut" },
  },
};

/** Route-level transition wrapper (see App.tsx for the keyed usage). */
export function PageTransition({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  const allowed = useMotionAllowed();
  if (!allowed) return <>{children}</>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Gentle mount reveal for panels, strips and list rows. */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const allowed = useMotionAllowed();
  if (!allowed) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

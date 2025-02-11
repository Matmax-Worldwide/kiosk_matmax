"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { pageTransitionVariants, pageTransitionConfig } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransitionConfig}
    >
      {children}
    </motion.div>
  );
} 
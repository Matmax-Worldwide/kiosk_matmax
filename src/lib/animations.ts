export const pageTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const pageTransitionConfig = {
  type: "spring",
  stiffness: 260,
  damping: 20
}; 
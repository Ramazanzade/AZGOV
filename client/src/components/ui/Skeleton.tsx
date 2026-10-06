export const CardSkeleton = () => (
  <div className="h-32 rounded-xl bg-bg-card border border-border animate-pulse" />
);

export const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
  </div>
);
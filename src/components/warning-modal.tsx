import { motion } from "framer-motion";

export function WarningModal({ stillFor }: { stillFor: number }) {
  const remaining = Math.max(0, 5 - stillFor);

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, scale: 1.3 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      className="alarm fixed inset-0 z-50 flex cursor-none flex-col items-center justify-center gap-6 p-6 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="text-[8rem] md:text-[12rem]"
      >
        🦥
      </motion.div>

      <h2 className="font-display text-3xl text-foreground glow-pink md:text-6xl">
        CRITICAL ALERT
      </h2>
      <p className="max-w-2xl font-display text-lg text-foreground md:text-2xl">
        HIGH PRODUCTIVITY DETECTED. CEASE WORKING IMMEDIATELY.
      </p>
      <p className="text-sm text-foreground">
        Keep your mouse perfectly still to unlock: {remaining.toFixed(1)}s
      </p>

      <div className="h-3 w-64 overflow-hidden rounded-full bg-background/50">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(1 - remaining / 5) * 100}%` }}
        />
      </div>
    </motion.div>
  );
}

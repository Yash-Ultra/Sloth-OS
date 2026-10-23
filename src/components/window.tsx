import { motion, useDragControls } from "framer-motion";
import type { ReactNode } from "react";

type WindowProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

/** A draggable desktop window with the three traffic-light dots. */
export function Window({ title, children, className = "" }: WindowProps) {
  const controls = useDragControls();

  return (
    <motion.section
      drag
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      whileDrag={{ scale: 1.02, zIndex: 30 }}
      initial={{ y: 60, opacity: 0, rotate: -3 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
      className={`glass flex min-h-[420px] flex-col overflow-hidden rounded-xl ${className}`}
    >
      <div
        onPointerDown={(event) => controls.start(event)}
        className="flex touch-none cursor-grab items-center gap-2 border-b border-border px-3 py-2 select-none active:cursor-grabbing"
      >
        <span className="h-3 w-3 rounded-full bg-accent" />
        <span className="h-3 w-3 rounded-full bg-secondary" />
        <span className="h-3 w-3 rounded-full bg-primary" />
        <span className="ml-2 truncate font-mono text-xs text-muted-foreground">{title}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">⠿ drag</span>
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </motion.section>
  );
}

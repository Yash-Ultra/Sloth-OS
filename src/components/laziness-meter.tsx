import { motion } from "framer-motion";

import { useSloth } from "@/components/sloth-provider";

export function LazinessMeter() {
  const sloth = useSloth();

  return (
    <div className="relative z-10 mx-auto mt-6 max-w-7xl px-4 md:px-8">
      <div className="glass flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-sm text-secondary glow-cyan">
              ⚡ SLOTH ENERGY / LAZINESS METER
            </span>
            <span className="font-display text-2xl text-primary glow-green">{sloth.laziness}%</span>
          </div>

          <div className="mt-2 h-4 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-accent via-secondary to-primary"
              animate={{ width: `${sloth.laziness}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </div>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {sloth.automationActive
              ? "🖐️ AI working — take your hands off the mouse to bank the combo."
              : "Trigger an automation, then stay perfectly still while the local AI works."}
          </p>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          <div className="text-center">
            <div className="font-display text-3xl text-accent glow-pink">{sloth.idleCombo}×</div>
            <div className="text-[11px] text-muted-foreground">IDLE COMBO</div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl text-secondary glow-cyan">
              {sloth.stillFor.toFixed(1)}s
            </div>
            <div className="text-[11px] text-muted-foreground">STILLNESS</div>
          </div>
          <div className="text-center">
            <div
              className={`font-display text-sm ${sloth.automationActive ? "text-primary glow-green" : "text-muted-foreground"}`}
            >
              {sloth.automationActive ? "● WORKING" : "○ AT REST"}
            </div>
            <div className="text-[11px] text-muted-foreground">LOCAL AI</div>
          </div>
        </div>
      </div>
    </div>
  );
}

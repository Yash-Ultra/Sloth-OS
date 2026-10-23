import { useEffect, useState } from "react";

import { useSloth } from "@/components/sloth-provider";

export function Taskbar() {
  const sloth = useSloth();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 rounded-none px-4 py-3 text-xs">
      <span className="font-display text-primary glow-green">🦥 START (later)</span>
      <span className="hidden text-secondary md:inline">
        Happy International Sloth Day · nap.exe running
      </span>
      <span className="flex items-center gap-3">
        <span className="text-accent">zzz {sloth.laziness}%</span>
        <span className="text-secondary">combo ×{sloth.idleCombo}</span>
        <span className="text-foreground">{clock}</span>
      </span>
    </footer>
  );
}

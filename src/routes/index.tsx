import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";

import { ChatDaemon } from "@/components/chat-daemon";
import { ClutterVacuum } from "@/components/clutter-vacuum";
import { FridgeScanner } from "@/components/fridge-scanner";
import { LazinessMeter } from "@/components/laziness-meter";
import { SlothProvider, useSloth } from "@/components/sloth-provider";
import { StatusBar } from "@/components/status-bar";
import { Taskbar } from "@/components/taskbar";
import { WarningModal } from "@/components/warning-modal";
import { WindDownSynth } from "@/components/wind-down-synth";
import { Window } from "@/components/window";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sloth-OS: Zero-Effort Chore Engine" },
      {
        name: "description",
        content:
          "A neon fake OS that does your chores with local open-source AI while you nap. Happy International Sloth Day.",
      },
      { property: "og:title", content: "Sloth-OS: Zero-Effort Chore Engine" },
      {
        property: "og:description",
        content: "Local AI that sorts, summarizes and winds you down. Zero effort, 100% private.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SlothOS,
});

const ZZZ = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 1 + ((i * 7) % 4),
  duration: 12 + ((i * 5) % 14),
  delay: -((i * 3) % 20),
}));

function SlothOS() {
  return (
    <SlothProvider>
      <Desktop />
    </SlothProvider>
  );
}

function Desktop() {
  const sloth = useSloth();

  return (
    <div className="relative min-h-screen overflow-hidden pb-24">
      {/* Drifting Zzz in the background. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {ZZZ.map((z, index) => (
          <span
            key={index}
            className="zzz"
            style={{
              left: z.left,
              bottom: "-3rem",
              fontSize: `${z.size}rem`,
              animationDuration: `${z.duration}s`,
              animationDelay: `${z.delay}s`,
            }}
          >
            Zzz
          </span>
        ))}
      </div>

      <header className="relative z-10 px-4 pt-6 text-center md:pt-10">
        <motion.h1
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.6 }}
          className="font-display text-4xl text-primary glow-green md:text-6xl"
        >
          SLOTH-OS 🦥
        </motion.h1>
        <p className="mt-2 text-sm text-secondary glow-cyan md:text-base">
          Zero-Effort Chore Engine · the anti-productivity suite · nap.exe running
        </p>
      </header>

      <LazinessMeter />
      <StatusBar />

      <AnimatePresence>{sloth.automationActive && <AutomationBanner />}</AnimatePresence>

      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 md:grid-cols-2 md:p-8 lg:grid-cols-3">
        <Window title="overnight_chat_daemon.sh" className="md:col-span-2 lg:col-span-2">
          <ChatDaemon />
        </Window>
        <Window title="fridge_vision_scanner.exe" className="md:col-span-2 lg:col-span-1">
          <FridgeScanner />
        </Window>
        <Window title="clutter_vacuum.py" className="md:col-span-2 lg:col-span-3">
          <ClutterVacuum />
        </Window>
        <Window title="wind_down_synth.wav" className="md:col-span-2 lg:col-span-3">
          <WindDownSynth />
        </Window>
      </main>

      <Taskbar />

      <AnimatePresence>{sloth.alert && <WarningModal stillFor={sloth.stillFor} />}</AnimatePresence>

      <div className="scanlines fixed inset-0 z-[60]" />
    </div>
  );
}

function AutomationBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="fixed inset-x-0 top-0 z-[70] flex justify-center p-2"
    >
      <div className="glass rounded-full px-5 py-2 text-sm font-bold text-accent glow-pink">
        🦥 Take your hands off the mouse while the local AI works…
      </div>
    </motion.div>
  );
}

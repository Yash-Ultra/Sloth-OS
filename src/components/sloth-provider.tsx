/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SlothApi = {
  /** 0–100, rises while you sit still and drops when you touch the machine. */
  laziness: number;
  stillFor: number;
  idleCombo: number;
  automationActive: boolean;
  promptsRun: number;
  moneySaved: number;
  alert: boolean;
  beginAutomation: () => void;
  endAutomation: () => void;
  registerPrompt: () => void;
};

type SlothActions = Pick<SlothApi, "beginAutomation" | "endAutomation" | "registerPrompt">;

const SlothContext = createContext<SlothApi | null>(null);
const SlothActionsContext = createContext<SlothActions | null>(null);

/** Roughly what a cloud API would charge for one short prompt. */
const SAVINGS_PER_PROMPT = 0.03;

const TICK_MS = 200;
const GAIN_WHILE_WORKING = 1.1;
const GAIN_WHILE_IDLE = 0.15;
const DECAY_WHILE_MOVING = 0.6;

/** Move more than this many pixels in a second and the productivity alarm fires. */
const MOVEMENT_ALERT_PX = 4000;
const CLICK_ALERT_COUNT = 5;
const CLICK_WINDOW_MS = 5000;

export function SlothProvider({ children }: { children: ReactNode }) {
  const [laziness, setLaziness] = useState(0);
  const [stillFor, setStillFor] = useState(0);
  const [idleCombo, setIdleCombo] = useState(0);
  const [automationActive, setAutomationActive] = useState(false);
  const [promptsRun, setPromptsRun] = useState(0);
  const [alert, setAlert] = useState(false);

  const lastMove = useRef(Date.now());
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const recentDistance = useRef<{ at: number; px: number }[]>([]);
  const recentClicks = useRef<number[]>([]);
  const alertOpen = useRef(false);
  alertOpen.current = alert;

  // Several windows can run at once, so jobs are counted rather than flagged.
  const activeJobs = useRef(0);
  const startedAt = useRef(0);
  const interrupted = useRef(false);

  useEffect(() => {
    const touch = () => {
      lastMove.current = Date.now();
      if (activeJobs.current > 0) interrupted.current = true;
    };

    const onMove = (event: MouseEvent) => {
      touch();

      const previous = lastPosition.current;
      lastPosition.current = { x: event.clientX, y: event.clientY };
      if (!previous) return;

      const now = Date.now();
      const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
      const recent = recentDistance.current.filter((entry) => now - entry.at < 1000);
      recentDistance.current = [...recent, { at: now, px: distance }];

      const total = recentDistance.current.reduce((sum, entry) => sum + entry.px, 0);
      if (total > MOVEMENT_ALERT_PX && !alertOpen.current) setAlert(true);
    };

    const onPress = () => {
      touch();

      const now = Date.now();
      recentClicks.current = [
        ...recentClicks.current.filter((at) => now - at < CLICK_WINDOW_MS),
        now,
      ];
      if (recentClicks.current.length > CLICK_ALERT_COUNT && !alertOpen.current) {
        recentClicks.current = [];
        setAlert(true);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onPress);
    window.addEventListener("touchstart", onPress);
    window.addEventListener("keydown", onPress);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onPress);
      window.removeEventListener("touchstart", onPress);
      window.removeEventListener("keydown", onPress);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const stillSeconds = (Date.now() - lastMove.current) / 1000;
      const working = activeJobs.current > 0;

      setStillFor(stillSeconds);
      setLaziness((current) => {
        if (stillSeconds < 1) return Math.max(0, current - DECAY_WHILE_MOVING);
        const gain = working ? GAIN_WHILE_WORKING : GAIN_WHILE_IDLE;
        return Math.min(100, current + gain);
      });

      if (alertOpen.current && stillSeconds >= 5) {
        setAlert(false);
        recentDistance.current = [];
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  const beginAutomation = useCallback(() => {
    if (activeJobs.current === 0) {
      interrupted.current = false;
      startedAt.current = Date.now();
    }
    activeJobs.current += 1;
    setAutomationActive(true);
  }, []);

  const endAutomation = useCallback(() => {
    activeJobs.current = Math.max(0, activeJobs.current - 1);
    if (activeJobs.current > 0) return;

    setAutomationActive(false);

    // A clean combo means hands stayed off the mouse for the whole job.
    const ranFor = Date.now() - startedAt.current;
    if (!interrupted.current && ranFor >= 1200) {
      setIdleCombo((combo) => combo + 1);
    } else {
      setIdleCombo(0);
    }
    interrupted.current = false;
  }, []);

  const registerPrompt = useCallback(() => {
    setPromptsRun((count) => count + 1);
  }, []);

  const actions = useMemo<SlothActions>(
    () => ({ beginAutomation, endAutomation, registerPrompt }),
    [beginAutomation, endAutomation, registerPrompt],
  );

  return (
    <SlothActionsContext.Provider value={actions}>
      <SlothContext.Provider
        value={{
          laziness: Math.round(laziness),
          stillFor,
          idleCombo,
          automationActive,
          promptsRun,
          moneySaved: promptsRun * SAVINGS_PER_PROMPT,
          alert,
          beginAutomation,
          endAutomation,
          registerPrompt,
        }}
      >
        {children}
      </SlothContext.Provider>
    </SlothActionsContext.Provider>
  );
}

export function useSloth(): SlothApi {
  const context = useContext(SlothContext);
  if (!context) throw new Error("useSloth must be used inside a SlothProvider");
  return context;
}

export function useSlothActions(): SlothActions {
  const context = useContext(SlothActionsContext);
  if (!context) throw new Error("useSlothActions must be used inside a SlothProvider");
  return context;
}

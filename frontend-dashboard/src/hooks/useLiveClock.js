import { useEffect, useState } from "react";

/** Ticking wall-clock string, updated once a second. */
export function useLiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-IN", { hour12: false }));

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

import { useState, useCallback, useRef } from 'react';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isFinished: boolean;
}

export function useTimer(initialSeconds: number) {
  const [state, setState] = useState<TimerState>({
    timeLeft: initialSeconds,
    isRunning: false,
    isFinished: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({ timeLeft: initialSeconds, isRunning: true, isFinished: false });
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return { timeLeft: 0, isRunning: false, isFinished: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  }, [initialSeconds]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({ timeLeft: initialSeconds, isRunning: false, isFinished: false });
  }, [initialSeconds]);

  return { ...state, start, pause, reset };
}

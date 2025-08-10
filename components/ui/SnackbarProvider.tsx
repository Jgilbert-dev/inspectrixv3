// components/ui/SnackbarProvider.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Snackbar } from "react-native-paper";

type Options = { critical?: boolean; timeoutMs?: number };
type Ctx = { show: (msg: string, opts?: Options) => void };

const Ctx = createContext<Ctx>({ show: () => {} });

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [timeoutMs, setTimeoutMs] = useState(4000);

  const show = useCallback((msg: string, opts?: Options) => {
    setMessage(msg);
    setTimeoutMs(opts?.timeoutMs ?? (opts?.critical ? 7000 : 4000));
    setVisible(true);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={timeoutMs}
        style={{ top: 12, position: "absolute", alignSelf: "center" }}
      >
        {message}
      </Snackbar>
    </Ctx.Provider>
  );
}

export function useSnackbar() {
  return useContext(Ctx);
}

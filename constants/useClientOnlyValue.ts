import { useEffect, useState } from "react";

export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? client : server;
}

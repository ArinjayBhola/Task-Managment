import { useCallback, useEffect, useState } from "react";
import api from "../utils/axiosInstance";
export default function useWorkspaceData(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    api
      .get(endpoint, { signal: controller.signal })
      .then((result) => setData(result.data))
      .catch((failure) => {
        if (failure.code !== "ERR_CANCELED") setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [endpoint, version]);
  return { data, loading, error, retry };
}

import { useEffect, useState } from 'react';

const EMPTY = { visitors: 0, registered: 0 };

let bootstrapPromise = null;

async function fetchStatsJson() {
  const res = await fetch('/api/stats', { credentials: 'include' });
  return res.json();
}

/**
 * One shared bootstrap so React StrictMode cannot fire two cookie-less
 * GET /api/stats in parallel. First response sets lk_vid; second persists
 * exactly one visitor row.
 */
function bootstrapStats() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const first = await fetchStatsJson();
      const second = await fetchStatsJson();
      return second?.success ? second : first;
    })().catch((err) => {
      bootstrapPromise = null;
      throw err;
    });
  }
  return bootstrapPromise;
}

export default function useSocialProof() {
  const [counts, setCounts] = useState(EMPTY);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let source;
    let pollTimer;
    let retryTimer;
    let cancelled = false;
    let sseFailures = 0;

    const apply = (data) => {
      if (cancelled || !data) return;
      const visitors = Number(data.visitors);
      const registered = Number(data.registered);
      if (!Number.isFinite(visitors) || !Number.isFinite(registered)) return;
      setCounts({ visitors, registered });
    };

    const fetchCounts = async () => {
      const data = await fetchStatsJson();
      if (data.success) apply(data);
    };

    const startPoll = () => {
      if (pollTimer || cancelled) return;
      pollTimer = setInterval(() => {
        fetchCounts().catch(() => {});
      }, 5000);
    };

    const startSse = () => {
      if (cancelled) return;
      if (typeof EventSource === 'undefined') {
        startPoll();
        return;
      }

      source = new EventSource('/api/stats/stream', { withCredentials: true });
      source.addEventListener('stats', (event) => {
        try {
          apply(JSON.parse(event.data));
          setLive(true);
          sseFailures = 0;
        } catch {
          /* ignore malformed frames */
        }
      });
      source.onerror = () => {
        setLive(false);
        sseFailures += 1;
        source.close();
        source = null;
        if (cancelled) return;
        if (sseFailures >= 3) {
          startPoll();
          return;
        }
        retryTimer = setTimeout(startSse, 1500);
      };
    };

    bootstrapStats()
      .then((data) => {
        if (data?.success) apply(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) startSse();
      });

    return () => {
      cancelled = true;
      if (source) source.close();
      if (pollTimer) clearInterval(pollTimer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return { ...counts, live };
}

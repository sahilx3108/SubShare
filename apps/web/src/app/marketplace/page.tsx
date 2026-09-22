"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, PlayCircle, RefreshCw, ShoppingBag, Star } from "lucide-react";
import type { MarketplaceSlotDto } from "@subshare/shared";
import { api, ApiClientError, type MeResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { email?: string };
  theme?: { color: string };
  handler: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Platform accent colors for visual variety
const platformColors: Record<string, string> = {
  Netflix:           "linear-gradient(135deg,#e50914,#b00610)",
  "Amazon Prime":    "linear-gradient(135deg,#00A8E0,#0072A3)",
  Hotstar:           "linear-gradient(135deg,#1f80e0,#0d5fbf)",
  Spotify:           "linear-gradient(135deg,#1db954,#158a3e)",
  "YouTube Premium": "linear-gradient(135deg,#ff0000,#cc0000)",
};

function getPlatformGradient(name: string) {
  for (const [key, val] of Object.entries(platformColors)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "linear-gradient(135deg,#e50914,#ff6b35)";
}

export default function MarketplacePage() {
  const [slots, setSlots] = useState<MarketplaceSlotDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busySlotId, setBusySlotId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(() => {
    api
      .get<{ slots: MarketplaceSlotDto[] }>("/slots")
      .then((res) => setSlots(res.slots))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load slots"));
  }, []);

  useEffect(load, [load]);

  async function buy(slot: MarketplaceSlotDto) {
    setNotice(null);
    setError(null);

    // Must be logged in before we can create an order.
    try {
      await api.get<MeResponse>("/auth/me");
    } catch {
      router.push("/login?next=/marketplace");
      return;
    }

    setBusySlotId(slot.id);
    try {
      const order = await api.post<{
        order_id: string;
        amount_paise: number;
        currency: string;
        key_id: string;
      }>("/payments/order", { slot_id: slot.id });

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error("Could not load Razorpay checkout");

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency,
        order_id: order.order_id,
        name: "subShare",
        description: `${slot.platform_name} slot — ${formatInr(slot.price_per_month)}/mo`,
        theme: { color: "#e50914" },
        handler: () =>
          setNotice(
            "Payment received! Your slot activates as soon as our payment webhook confirms it (a few seconds). Check My Slots.",
          ),
      });
      rzp.open();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.push("/login?next=/marketplace");
        return;
      }
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusySlotId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" style={{ minHeight: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Marketplace
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            Available screens shared by verified students on your campus
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
        </Button>
      </div>

      {/* Notices */}
      {notice && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#4ade80",
          }}
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {/* Slot grid */}
      {!slots ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-52" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <ShoppingBag className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="text-center text-base font-medium" style={{ color: "var(--text-primary)" }}>
            No slots listed yet
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Be the first — list your plan!
          </p>
          <Button variant="secondary" size="sm" onClick={() => router.push("/owner")}>
            List a plan
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => {
            const gradient = getPlatformGradient(slot.platform_name);
            return (
              <li
                key={slot.id}
                className="glass group rounded-2xl overflow-hidden shadow-card-dark transition-all duration-300 hover:shadow-glow-red hover:border-[var(--border-hover)]"
              >
                {/* Colored top stripe */}
                <div className="h-1.5 w-full" style={{ background: gradient }} />

                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-xl text-xl font-bold text-white shadow-glow-sm"
                      style={{ background: gradient }}
                    >
                      {slot.platform_name[0]?.toUpperCase()}
                    </span>
                    {/* Session status pill */}
                    {slot.session_stale ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          color: "#fbbf24",
                          border: "1px solid rgba(245,158,11,0.25)",
                        }}
                      >
                        <AlertTriangle className="h-3 w-3" /> stale
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: "rgba(34,197,94,0.1)",
                          color: "#4ade80",
                          border: "1px solid rgba(34,197,94,0.25)",
                        }}
                      >
                        <span className="status-dot-green" /> ready
                      </span>
                    )}
                  </div>

                  <h2
                    className="mt-3 text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {slot.platform_name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    by {slot.owner_name}
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" aria-hidden />
                      {slot.owner_rating.toFixed(1)}
                    </span>
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold gradient-text">{formatInr(slot.price_per_month)}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>per month</p>
                    </div>
                    <Button size="sm" loading={busySlotId === slot.id} onClick={() => buy(slot)}>
                      <PlayCircle className="h-4 w-4" aria-hidden /> Join
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


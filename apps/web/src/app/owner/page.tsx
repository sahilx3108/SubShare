"use client";

import { useCallback, useEffect, useState } from "react";
import { Chrome, Minus, Plus, RefreshCw, TrendingUp } from "lucide-react";
import {
  PLATFORMS,
  OWNER_PAYOUT_PERCENT,
  computeSplit,
  type OwnerSubscriptionDto,
} from "@subshare/shared";
import { api } from "@/lib/api";
import { Badge, Card, CardContent, statusBadgeTone } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatInr } from "@/lib/utils";

function getPlatformGradient(name: string) {
  const map: Record<string, string> = {
    Netflix: "linear-gradient(135deg,#e50914,#b00610)",
    "Amazon Prime": "linear-gradient(135deg,#00A8E0,#0072A3)",
    Hotstar: "linear-gradient(135deg,#1f80e0,#0d5fbf)",
    Spotify: "linear-gradient(135deg,#1db954,#158a3e)",
    "YouTube Premium": "linear-gradient(135deg,#ff0000,#cc0000)",
  };
  for (const [key, val] of Object.entries(map)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "linear-gradient(135deg,#e50914,#ff6b35)";
}

function SlotCircleGrid({ slots }: { slots: OwnerSubscriptionDto["slots"] }) {
  return (
    <div className="flex items-center gap-2">
      {slots.map((slot, i) => {
        const color =
          slot.status === "ACTIVE"    ? "#22c55e" :
          slot.status === "AVAILABLE" ? "var(--surface-3)" :
          slot.status === "EXPIRED"   ? "#525252" : "#f59e0b";
        const glow =
          slot.status === "ACTIVE" ? "0 0 8px rgba(34,197,94,0.5)" :
          slot.status === "AVAILABLE" ? "none" : "none";
        return (
          <div key={slot.id} className="flex flex-col items-center gap-1">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: color, boxShadow: glow }}
              title={`Slot #${i + 1} — ${slot.status.toLowerCase()}`}
            />
          </div>
        );
      })}
      <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
        {slots.filter((s) => s.status === "ACTIVE").length}/{slots.length} active
      </span>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [subs, setSubs] = useState<OwnerSubscriptionDto[] | null>(null);
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [slotCount, setSlotCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ subscriptions: OwnerSubscriptionDto[] }>("/subscriptions/mine")
      .then((res) => setSubs(res.subscriptions))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load listings"));
  }, []);

  useEffect(load, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/subscriptions", {
        platform_name: platform,
        total_slots_offered: Number(slotCount),
      });
      setSlotCount(1);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing");
    } finally {
      setSubmitting(false);
    }
  }

  const payoutPreview = computeSplit(199).ownerPayout;
  const totalEarnings = subs?.reduce((acc, s) => acc + s.monthly_earnings_inr, 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" style={{ minHeight: "calc(100vh - 4rem)" }}>
      {/* Earnings hero */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Monthly earnings</p>
          <p className="text-4xl font-extrabold gradient-text">{formatInr(totalEarnings)}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            You keep {OWNER_PAYOUT_PERCENT}% — that&apos;s{" "}
            <span style={{ color: "var(--text-primary)" }} className="font-semibold">
              {formatInr(payoutPreview)}
            </span>{" "}
            per slot/mo
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} className="shrink-0">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Create listing card */}
        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-white"
                style={{ background: "linear-gradient(135deg,#e50914,#ff6b35)" }}
              >
                <TrendingUp className="h-4 w-4" />
              </span>
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                List a new subscription
              </h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 text-sm transition-colors duration-200"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} style={{ background: "var(--surface-2)" }}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="slots">Screens to share (1–3)</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setSlotCount((c) => Math.max(1, c - 1))}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <Input
                    id="slots"
                    type="number"
                    min={1}
                    max={3}
                    value={slotCount}
                    onChange={(e) => setSlotCount(Number(e.target.value))}
                    className="text-center"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSlotCount((c) => Math.min(3, c + 1))}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  {error}
                </div>
              )}

              <Button type="submit" loading={submitting} className="w-full">
                Create listing
              </Button>
            </form>

            <p
              className="rounded-xl p-3 text-xs leading-relaxed"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              After creating a listing, use the subShare Chrome extension while logged into the
              platform to sync your encrypted session. Buyers can only see slots with a synced session.
            </p>
          </CardContent>
        </Card>

        {/* Subscription cards */}
        <div className="space-y-4">
          {!subs ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <div key={i} className="shimmer h-40" />)}
            </div>
          ) : subs.length === 0 ? (
            <div
              className="flex h-40 flex-col items-center justify-center rounded-2xl gap-2"
              style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}
            >
              <p className="text-sm">No listings yet.</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Create your first listing on the left.
              </p>
            </div>
          ) : (
            subs.map((sub) => {
              const gradient = getPlatformGradient(sub.platform_name);
              return (
                <Card key={sub.id} className="overflow-hidden">
                  <div className="h-1 w-full" style={{ background: gradient }} />
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-10 w-10 place-items-center rounded-lg font-bold text-white"
                          style={{ background: gradient }}
                        >
                          {sub.platform_name[0]?.toUpperCase()}
                        </span>
                        <div>
                          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                            {sub.platform_name}
                          </h3>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {sub.total_slots_offered} slots · earns{" "}
                            <span className="gradient-text font-semibold">
                              {formatInr(sub.monthly_earnings_inr)}/mo
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sub.has_session ? (
                          sub.session_stale ? (
                            <Badge tone="amber">session stale</Badge>
                          ) : (
                            <Badge tone="green">session synced</Badge>
                          )
                        ) : (
                          <Badge tone="red">no session synced</Badge>
                        )}
                      </div>
                    </div>

                    {/* Resource Pool — slot circles */}
                    <div>
                      <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        Slot pool
                      </p>
                      <SlotCircleGrid slots={sub.slots} />
                    </div>

                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr
                          className="border-b text-xs uppercase tracking-wide"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          <th className="py-2 font-medium">Slot</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium">Buyer</th>
                          <th className="py-2 font-medium">Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sub.slots.map((slot, i) => (
                          <tr
                            key={slot.id}
                            className="border-b last:border-0"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <td className="py-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                              #{i + 1}
                            </td>
                            <td className="py-2">
                              <Badge tone={statusBadgeTone(slot.status)}>
                                {slot.status.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                              {slot.buyer_name ? (
                                <span>
                                  {slot.buyer_name}{" "}
                                  <span className="text-xs text-amber-400">
                                    ({slot.buyer_rating?.toFixed(1)}★)
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>—</span>
                              )}
                            </td>
                            <td className="py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                              {slot.expires_at
                                ? new Date(slot.expires_at).toLocaleDateString("en-IN")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <p
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Chrome className="h-3.5 w-3.5" aria-hidden />
                      Sync session: open the extension → pick this listing → "Sync session".
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

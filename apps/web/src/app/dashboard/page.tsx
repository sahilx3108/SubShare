"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Chrome, LayoutDashboard, RefreshCw } from "lucide-react";
import type { MySlotDto } from "@subshare/shared";
import { api } from "@/lib/api";
import { Badge, statusBadgeTone } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { daysUntil, formatInr } from "@/lib/utils";
import Link from "next/link";

function CredentialPipeline({ hasSession, sessionStale, status }: {
  hasSession: boolean;
  sessionStale: boolean;
  status: string;
}) {
  const synced   = hasSession && !sessionStale;
  const encrypted = hasSession;
  const ready    = hasSession && !sessionStale && status === "ACTIVE";

  const steps = [
    { label: "Owner Synced", ok: synced || (hasSession && !sessionStale) },
    { label: "Encrypted",    ok: encrypted },
    { label: "Ready",        ok: ready },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: step.ok ? "#22c55e" : "var(--surface-3)",
                boxShadow: step.ok ? "0 0 6px rgba(34,197,94,0.5)" : "none",
              }}
            />
          </div>
          {i < steps.length - 1 && (
            <span
              className="h-px w-4"
              style={{ background: step.ok ? "rgba(34,197,94,0.4)" : "var(--surface-3)" }}
            />
          )}
        </div>
      ))}
      <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        {ready ? "Ready to launch" : encrypted ? "Session synced" : "Awaiting sync"}
      </span>
    </div>
  );
}

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

export default function BuyerDashboardPage() {
  const [slots, setSlots] = useState<MySlotDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<{ slots: MySlotDto[] }>("/slots/mine")
      .then((res) => setSlots(res.slots))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load your slots"));
  }, []);

  useEffect(load, [load]);

  async function requestLaunch(slot: MySlotDto) {
    setNotice(null);
    setError(null);
    setBusyId(slot.id);
    try {
      await api.post(`/slots/${slot.id}/request-launch`);
      setNotice(
        `Launch requested for ${slot.platform_name}. Open the subShare extension and hit "Launch" — it will pick this up automatically.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not request launch");
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = slots?.filter((s) => s.status === "ACTIVE").length ?? 0;
  const totalSpend  = slots?.reduce((acc, s) => acc + s.price_per_month, 0) ?? 0;
  const nextRenewal = slots
    ?.map((s) => daysUntil(s.expires_at))
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b)[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" style={{ minHeight: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            My Slots
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            Your purchased subscriptions
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
        </Button>
      </div>

      {/* Stats strip */}
      {slots && slots.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Active slots",    value: String(activeCount) },
            { label: "Total spend",     value: formatInr(totalSpend) + "/mo" },
            { label: "Next renewal",    value: nextRenewal !== null ? `${nextRenewal}d` : "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl px-4 py-3 text-center"
            >
              <p className="gradient-text text-xl font-bold">{stat.value}</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notices */}
      {notice && (
        <div
          role="status"
          className="mt-6 rounded-xl px-4 py-3 text-sm"
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
          className="mt-6 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {/* Slot list */}
      {!slots ? (
        <div className="mt-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shimmer h-28" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="mt-20 flex flex-col items-center gap-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <LayoutDashboard className="h-8 w-8" style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
            No active purchases yet
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Grab a slot on the marketplace!
          </p>
          <Link href="/marketplace">
            <Button size="sm">Browse marketplace</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {slots.map((slot) => {
            const days     = daysUntil(slot.expires_at);
            const gradient = getPlatformGradient(slot.platform_name);
            return (
              <li
                key={slot.id}
                className="glass rounded-2xl overflow-hidden shadow-card-dark transition-all duration-300 hover:shadow-glow-red"
              >
                {/* Top accent stripe */}
                <div className="h-1 w-full" style={{ background: gradient }} />

                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  {/* Platform icon */}
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl font-bold text-white"
                    style={{ background: gradient }}
                  >
                    {slot.platform_name[0]?.toUpperCase()}
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {slot.platform_name}
                      </h2>
                      <Badge tone={statusBadgeTone(slot.status)}>
                        {slot.status.toLowerCase()}
                      </Badge>
                      {slot.session_stale && slot.has_session && (
                        <Badge tone="amber">session may be stale</Badge>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-sm font-medium gradient-text">
                        {formatInr(slot.price_per_month)}/mo
                      </span>
                      {days !== null && slot.expires_at && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                          <CalendarClock className="h-3 w-3" aria-hidden />
                          renews in {days} day{days === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    {/* Credential pipeline */}
                    <div className="mt-2">
                      <CredentialPipeline
                        hasSession={slot.has_session}
                        sessionStale={slot.session_stale}
                        status={slot.status}
                      />
                    </div>
                  </div>

                  {/* Launch button */}
                  <Button
                    size="sm"
                    disabled={!slot.has_session || slot.status !== "ACTIVE"}
                    loading={busyId === slot.id}
                    onClick={() => requestLaunch(slot)}
                    className="shrink-0"
                  >
                    <Chrome className="h-4 w-4" aria-hidden /> Launch via Extension
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


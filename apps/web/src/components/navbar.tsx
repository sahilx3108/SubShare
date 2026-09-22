"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Play, Shield } from "lucide-react";
import { api, type MeResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard",   label: "My Slots" },
  { href: "/owner",       label: "List a Plan" },
];

export function Navbar() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api
      .get<MeResponse>("/auth/me")
      .then((res) => !cancelled && setMe(res.user))
      .catch(() => !cancelled && setMe(null));
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    await api.post("/auth/logout").catch(() => undefined);
    setMe(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-glow-sm"
            style={{ background: "linear-gradient(135deg, #e50914 0%, #ff6b35 100%)" }}
          >
            <Play className="h-4 w-4 fill-white" aria-hidden />
          </span>
          <span className="gradient-text">sub</span>
          <span style={{ color: "var(--text-primary)", marginLeft: "-6px" }}>Share</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
                )}
              >
                {l.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-px h-px rounded-full"
                    style={{ background: "linear-gradient(90deg,#e50914,#ff6b35)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {me ? (
            <>
              {!me.email_verified && (
                <span className="hidden items-center gap-1.5 rounded-full bg-amber-950/60 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30 md:flex">
                  <Shield className="h-3 w-3" aria-hidden /> Unverified
                </span>
              )}
              <span className="hidden text-sm md:flex md:flex-col md:items-end">
                <span style={{ color: "var(--text-primary)" }} className="font-medium leading-none">
                  {me.name.split(" ")[0]}
                </span>
                <span style={{ color: "var(--text-muted)" }} className="text-xs leading-none mt-0.5">
                  {me.university_email}
                </span>
              </span>
              <div
                className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white md:grid"
                style={{ background: "linear-gradient(135deg,#e50914,#ff6b35)" }}
                title={me.name}
              >
                {me.name[0]?.toUpperCase()}
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
                <LogOut className="h-4 w-4" aria-hidden /> Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


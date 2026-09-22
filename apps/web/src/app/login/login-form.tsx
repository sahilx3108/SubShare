"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, type LoginInput } from "@subshare/shared";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [values, setValues] = useState<LoginInput>({ university_email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verified = search.get("verified") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDevVerifyUrl(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your inputs");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/login", parsed.data);
      const next = search.get("next");
      router.push(next && next.startsWith("/") ? next : "/marketplace");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Network error — is the API running?");
      if (err instanceof ApiClientError) setDevVerifyUrl(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {verified && (
        <div
          role="status"
          className="rounded-xl px-3 py-2 text-sm"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#4ade80",
          }}
        >
          Email verified — log in to continue.
        </div>
      )}

      <div>
        <Label htmlFor="email">University email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@iitb.ac.in"
          value={values.university_email}
          onChange={(e) => setValues((v) => ({ ...v, university_email: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          required
        />
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
      {devVerifyUrl && (
        <Link href={devVerifyUrl} className="block text-sm font-medium underline" style={{ color: "#ff6b6b" }}>
          Open verification link (dev)
        </Link>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Log in
      </Button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        New here?{" "}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: "#ff6b6b" }}>
          Create an account
        </Link>
      </p>
    </form>
  );
}


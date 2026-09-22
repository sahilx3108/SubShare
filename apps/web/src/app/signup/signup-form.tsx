"use client";

import { useState } from "react";
import Link from "next/link";
import { signupSchema, type SignupInput } from "@subshare/shared";
import { api, type SignupResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function SignupForm() {
  const [values, setValues] = useState<SignupInput>({
    name: "",
    university_email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<SignupResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your inputs");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<SignupResponse>("/auth/signup", parsed.data);
      setDone(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        className="space-y-4 rounded-xl p-5"
        style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        <h2 className="font-semibold" style={{ color: "#4ade80" }}>Verify your email</h2>
        <p className="text-sm" style={{ color: "#86efac" }}>
          We sent a verification link to{" "}
          <strong style={{ color: "#4ade80" }}>{values.university_email}</strong>. Click it to
          activate your account, then log in.
        </p>
        {done.dev_verify_url && (
          <p className="text-xs" style={{ color: "#86efac" }}>
            Dev mode:{" "}
            <a href={done.dev_verify_url} className="font-medium underline" style={{ color: "#4ade80" }}>
              open verification link
            </a>
          </p>
        )}
        <Link
          href="/login"
          className="inline-block text-sm font-medium hover:underline"
          style={{ color: "#4ade80" }}
        >
          Go to login →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Aarav Sharma"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
        />
      </div>

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
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Must end in .ac.in or .edu
        </p>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          required
        />
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          8+ characters with at least one letter and number
        </p>
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

      <Button type="submit" loading={loading} className="w-full">
        Sign up
      </Button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium hover:underline" style={{ color: "#ff6b6b" }}>
          Log in
        </Link>
      </p>
    </form>
  );
}


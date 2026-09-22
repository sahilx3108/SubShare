import { Play } from "lucide-react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16"
      style={{ background: "var(--bg)" }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute rounded-full blur-[100px] opacity-10"
        style={{
          background: "radial-gradient(circle, #e50914 0%, transparent 70%)",
          width: "500px",
          height: "500px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-glow-sm"
            style={{ background: "linear-gradient(135deg, #e50914 0%, #ff6b35 100%)" }}
          >
            <Play className="h-6 w-6 fill-white" />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Join subShare
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Only verified .ac.in / .edu emails can register
            </p>
          </div>
        </div>

        <div
          className="glass rounded-2xl p-6 shadow-card-dark"
          style={{ border: "1px solid var(--border)" }}
        >
          <SignupForm />
        </div>
      </div>
    </div>
  );
}


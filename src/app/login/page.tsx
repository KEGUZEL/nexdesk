"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FolderKanban, Mail, Lock, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      // Successful login
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-8 text-text-primary select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border-default bg-bg-surface px-6 py-8 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary/20 blur-2xl" />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <FolderKanban className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-text-primary via-slate-100 to-text-secondary bg-clip-text text-transparent">
              Welcome back to NexDesk
            </h1>
            <p className="mt-1.5 text-xs text-text-secondary">
              Enter your credentials to access your support workspace.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center text-xs text-red-400 font-semibold leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input 
                type="email" 
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-bg-base py-2.5 pl-10 pr-4 text-sm md:text-xs text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-bg-base py-2.5 pl-10 pr-4 text-sm md:text-xs text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover px-4 py-3 md:py-2.5 text-sm md:text-xs font-semibold text-white transition-all shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Log In to Account</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-text-secondary">
            Don&apos;t have an account?{" "}
            <a href="/register" className="font-semibold text-primary hover:underline">
              Create an Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

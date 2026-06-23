"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../config";
import { Shield, Key, Mail, User, ShieldAlert, Cpu } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Engineer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isLogin) {
      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
          // Store session role
          localStorage.setItem("user_role", data.role);
          localStorage.setItem("username", data.username);
          router.push("/dashboard");
        } else {
          setError(data.detail || "Authentication failed. Try again.");
        }
      } catch (err) {
        setError("Unable to connect to the backend server.");
      }
    } else {
      // Signup Flow
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);

      try {
        const response = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          body: formData
        });
        const data = await response.json();
        if (response.ok) {
          setSuccess("Account registered! Proceed to Login.");
          setIsLogin(true);
        } else {
          setError(data.detail || "Signup failed.");
        }
      } catch (err) {
        setError("Unable to connect to the backend server.");
      }
    }
  };

  const roles = [
    { name: "Plant Manager", desc: "Global asset KPIs, high-risk flags, budget timelines" },
    { name: "Engineer", desc: "Predictive ML runs, CAD drawings, digital twin data" },
    { name: "Technician", desc: "Maintenance logs, field checklists, SOPs" },
    { name: "Auditor", desc: "Compliance center, cert audits, violation reports" },
  ];

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-md glass-panel space-y-6 font-outfit relative">
      <div className="absolute inset-0 bg-cyan-500/5 rounded-xl blur-3xl pointer-events-none"></div>

      {/* Header Logo */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 items-center justify-center cyan-glow mb-2">
          <Cpu className="w-6 h-6 text-navy-deep font-bold animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          {isLogin ? "Sign In to Industrial Brain" : "Register Engineering Account"}
        </h2>
        <p className="text-xs text-slate-500">
          Role-Based Access Control and Industrial Knowledge Graph Systems
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-semibold uppercase">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              required
              placeholder="e.g. engineer1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#f3f4f6] placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Email for Signup */}
        {!isLogin && (
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="email"
                required
                placeholder="engineer@plant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#f3f4f6] placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-semibold uppercase">Password</label>
          <div className="relative">
            <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
            <input 
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#f3f4f6] placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Role selection for signup */}
        {!isLogin && (
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold uppercase block">Select Plant Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => setRole(r.name)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    role === r.name 
                      ? "bg-cyan-950/20 border-cyan-500/50 text-cyan-400" 
                      : "bg-[#0a0f1d] border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold">{r.name}</div>
                  <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 mt-2 rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-navy-deep font-bold uppercase text-xs transition-all shadow-glass-glow"
        >
          {isLogin ? "Sign In" : "Register Credentials"}
        </button>
      </form>

      {/* Switch Link */}
      <div className="text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-all"
        >
          {isLogin ? "Need a plant access account? Register" : "Already registered? Sign In"}
        </button>
      </div>
    </div>
  );
}

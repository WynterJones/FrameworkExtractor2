// Mock of the scaffold's src/lib/auth.ts. Same exports, no network.
// On OverSkill this file is replaced by the real SDK wrapper; nothing that
// imports from "@/lib/auth" has to change.
import { useState, useEffect, useCallback } from "react";
import { entities } from "./mock/entities";

export interface OverSkillUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  roles?: string[];
}

const KEY = "overskill_token";
const DEMO_USER: OverSkillUser = { id: "proto-user", email: "you@example.com", name: "Jordan Lee", roles: ["member"] };

export const overskill = {
  entities,
  auth: {
    async login() { localStorage.setItem(KEY, "proto.jwt.token"); window.dispatchEvent(new Event("proto:auth")); return DEMO_USER; },
    async logout() { localStorage.removeItem(KEY); window.dispatchEvent(new Event("proto:auth")); },
    async me() { if (!localStorage.getItem(KEY)) throw new Error("Not signed in"); return DEMO_USER; },
    async checkSession() { return localStorage.getItem(KEY) ? DEMO_USER : null; },
    getToken: () => localStorage.getItem(KEY),
    isAuthenticated: () => !!localStorage.getItem(KEY),
  },
};

export const getAuthToken = () => localStorage.getItem(KEY);
export const isAuthenticated = () => !!localStorage.getItem(KEY);
export async function getCurrentUser() { return overskill.auth.checkSession(); }
export async function hasRole(role: string) { return (await getCurrentUser())?.roles?.includes(role) ?? false; }

/** Same shape as the scaffold: { user, loading, isAuthenticated, login, logout, refreshUser }. */
export function useAuth() {
  const [user, setUser] = useState<OverSkillUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = useCallback(async () => { setUser(await overskill.auth.checkSession()); setLoading(false); }, []);
  useEffect(() => {
    refreshUser();
    window.addEventListener("proto:auth", refreshUser);
    return () => window.removeEventListener("proto:auth", refreshUser);
  }, [refreshUser]);
  return { user, loading, isAuthenticated: !!user, login: overskill.auth.login, logout: overskill.auth.logout, refreshUser };
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AdminProfile,
  UNAUTHORIZED_EVENT,
  clearSession,
  getAccessToken,
  getProfile,
} from "@/lib/auth";

interface AuthContextValue {
  /** 로그인 여부. 첫 렌더에서는 아직 알 수 없어 null */
  isAuthenticated: boolean | null;
  /** 로그인한 검수자 정보 */
  profile: AdminProfile | null;
  /** 로그인 직후 상태를 갱신한다 */
  refresh: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // localStorage는 클라이언트에서만 읽을 수 있어 마운트 후에 확정된다
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  const refresh = useCallback(() => {
    // 만료된 토큰이면 getAccessToken이 세션을 비우고 null을 준다
    setIsAuthenticated(getAccessToken() !== null);
    setProfile(getProfile());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // 다른 탭에서 로그아웃하면 이 탭도 따라간다
    function onStorage() {
      refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  useEffect(() => {
    // 토큰 만료(401)를 api 계층이 알려주면 로그인 상태를 내린다
    function onUnauthorized() {
      clearSession();
      queryClient.clear();
      setIsAuthenticated(false);
      setProfile(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [queryClient]);

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setIsAuthenticated(false);
    setProfile(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, profile, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있습니다.");
  return value;
}

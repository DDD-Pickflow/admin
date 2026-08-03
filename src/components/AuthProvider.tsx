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
  getProfile,
  hasSession,
  logout as endSession,
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
    // 액세스 토큰이 만료됐어도 refreshToken이 있으면 로그인 상태로 본다
    setIsAuthenticated(hasSession());
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
    // 서버 호출을 기다리지 않고 화면은 즉시 로그아웃 상태로 만든다
    void endSession();
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

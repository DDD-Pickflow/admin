"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";

// /settings 를 열어두는 이유: 서버를 잘못 바꿔 로그인이 막히면 되돌릴 길이 없어진다
const PUBLIC_PATHS = ["/login", "/auth/callback", "/settings"];

/** 미인증 상태로 검수 화면에 들어오면 로그인으로 돌려보낸다 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isAuthenticated === false && !isPublic) router.replace("/login");
  }, [isAuthenticated, isPublic, router]);

  // 로그인 여부를 확정하기 전에는 화면을 그리지 않는다 (깜빡임 방지)
  if (isAuthenticated === null) {
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    );
  }

  return <>{children}</>;
}

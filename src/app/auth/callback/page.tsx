"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Center, Loader, Stack } from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { completeKakaoLogin } from "@/lib/auth";

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <Center mih="60vh">
          <Loader />
        </Center>
      }
    >
      <KakaoCallback />
    </Suspense>
  );
}

function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const [error, setError] = useState<string | null>(null);
  // React StrictMode에서 이펙트가 두 번 도는데, 인가 코드는 한 번만 쓸 수 있다
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = searchParams.get("code");
    const kakaoError = searchParams.get("error");

    if (kakaoError) {
      setError(
        searchParams.get("error_description") ?? "카카오 인증이 취소되었습니다."
      );
      return;
    }
    if (!code) {
      setError("인가 코드를 받지 못했습니다.");
      return;
    }

    completeKakaoLogin(code)
      .then(() => {
        refresh();
        router.replace("/");
      })
      .catch((e: Error) => setError(e.message));
  }, [searchParams, refresh, router]);

  if (error) {
    return (
      <Center mih="60vh">
        <Stack align="center">
          <Alert color="red" title="로그인하지 못했습니다">
            {error}
          </Alert>
          <Button variant="light" onClick={() => router.replace("/login")}>
            다시 시도
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Center mih="60vh">
      <Loader />
    </Center>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Center,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { KAKAO_LABEL, KAKAO_YELLOW, KakaoIcon } from "@/components/KakaoIcon";
import { LogoTile } from "@/components/Logo";
import { isMockAuth, startKakaoLogin } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, refresh } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미 로그인돼 있으면 목록으로 보낸다 (데모 모드도 항상 여기 해당)
  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  async function handleLogin() {
    setIsSubmitting(true);
    setError(null);
    try {
      await startKakaoLogin();
      // 실제 로그인은 카카오로 이동했다가 /auth/callback 에서 마무리된다.
      // 목 모드에서는 이동 없이 바로 토큰이 저장되므로 여기서 진입시킨다.
      if (isMockAuth()) {
        refresh();
        router.replace("/");
      }
    } catch (e) {
      setError((e as Error).message);
      setIsSubmitting(false);
    }
  }

  return (
    <Center mih="70vh">
      <Card withBorder padding="xl" w={360}>
        <Stack>
          <Stack gap="sm" align="center" mb="xs">
            <LogoTile size={56} />
            <Stack gap={4} align="center">
              <Title order={4}>Pickflow Admin</Title>
              <Text size="sm" c="dimmed" ta="center">
                검수 권한이 있는 계정만 이용할 수 있습니다.
              </Text>
            </Stack>
          </Stack>

          {error && (
            <Alert color="red" title="로그인하지 못했습니다">
              {error}
            </Alert>
          )}

          {/* 색·문구는 카카오 로그인 버튼 규격을 따른다 */}
          <Button
            fullWidth
            color={KAKAO_YELLOW}
            c={KAKAO_LABEL}
            leftSection={<KakaoIcon size={18} />}
            loading={isSubmitting}
            onClick={handleLogin}
          >
            카카오 로그인
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}

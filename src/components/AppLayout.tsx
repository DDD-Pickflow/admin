"use client";

import { useEffect, useState } from "react";
import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Group,
  NavLink,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BRAND_ORANGE, Logo } from "@/components/Logo";
import { DEMO_MODE } from "@/lib/auth";
import { DEFAULT_API_BASE_URL, getApiBaseUrl, getApiEnv } from "@/lib/devSettings";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, profile, logout } = useAuth();

  // 로그인 화면에서는 검수 메뉴를 감춘다
  const showNav = isAuthenticated === true;

  // 기본 서버가 아닐 때만 알린다 — 어느 서버를 보고 있는지 모르는 채로 검수하면 안 된다.
  // localStorage는 서버 렌더링에 없으므로 마운트 뒤에 읽는다.
  const [apiEnvLabel, setApiEnvLabel] = useState<string | null>(null);
  useEffect(() => {
    if (getApiBaseUrl() !== DEFAULT_API_BASE_URL) setApiEnvLabel(getApiEnv().label);
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={
        showNav
          ? { width: 220, breakpoint: "sm", collapsed: { mobile: !opened } }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm" justify="space-between">
          <Group gap="sm">
            {showNav && (
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            )}
            <Group gap={8}>
              <Box c={BRAND_ORANGE}>
                <Logo size={22} />
              </Box>
              <Text fw={700}>Pickflow Admin</Text>
            </Group>
          </Group>
          <Group gap="xs">
            {apiEnvLabel && (
              <Badge color="orange" variant="light">
                {apiEnvLabel}
              </Badge>
            )}
            {showNav && (
              <>
                {DEMO_MODE ? (
                  // 실데이터가 아님을 분명히 알린다
                  <Badge color="gray" variant="light">
                    데모 · 목 데이터
                  </Badge>
                ) : (
                  <>
                    {profile && (
                      <Text size="sm" c="dimmed">
                        {profile.nickname}
                      </Text>
                    )}
                    <Button variant="subtle" size="xs" onClick={handleLogout}>
                      로그아웃
                    </Button>
                  </>
                )}
              </>
            )}
            {/* 로그인 전에도 서버를 바꿀 수 있어야 해서 항상 띄운다 */}
            <Tooltip label="개발자 설정">
              <ActionIcon
                component={Link}
                href="/settings"
                variant="subtle"
                color="gray"
                aria-label="개발자 설정"
              >
                <IconSettings size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      {showNav && (
        <AppShell.Navbar p="xs">
          <NavLink
            component={Link}
            href="/"
            label="검수 목록"
            active={pathname === "/" || pathname.startsWith("/spots")}
          />
          <NavLink
            component={Link}
            href="/settings"
            label="개발자 설정"
            active={pathname === "/settings"}
          />
        </AppShell.Navbar>
      )}

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

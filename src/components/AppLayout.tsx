"use client";

import {
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Group,
  NavLink,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BRAND_ORANGE, Logo } from "@/components/Logo";
import { DEMO_MODE } from "@/lib/auth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, profile, logout } = useAuth();

  // 로그인 화면에서는 검수 메뉴를 감춘다
  const showNav = isAuthenticated === true;

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
              <Text fw={700}>스팟 검수 어드민</Text>
            </Group>
          </Group>
          {showNav && (
            <Group gap="xs">
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
            </Group>
          )}
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
        </AppShell.Navbar>
      )}

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

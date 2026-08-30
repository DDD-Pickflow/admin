"use client";

import { useEffect, useRef, useState } from "react";
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
import { notifications } from "@mantine/notifications";
import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BRAND_ORANGE, Logo } from "@/components/Logo";
import { DEMO_MODE } from "@/lib/auth";
import {
  DEFAULT_API_BASE_URL,
  UNLOCK_CLICKS,
  UNLOCK_CLICK_WINDOW,
  getApiBaseUrl,
  getApiEnv,
  isDevSettingsUnlocked,
  unlockDevSettings,
} from "@/lib/devSettings";

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
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    if (getApiBaseUrl() !== DEFAULT_API_BASE_URL) setApiEnvLabel(getApiEnv().label);
    setUnlocked(isDevSettingsUnlocked());
  }, []);

  /**
   * 로그인한 검수자에게는 그냥 보이고, 로그인 화면에서는 로고를 연속으로 눌러 연
   * 브라우저에만 보인다 — 처음 들어온 사람에게 개발 서버 주소를 알려줄 이유가 없다.
   */
  const showDevSettings = showNav || unlocked;

  // 연속 클릭 판정용. 렌더에 영향이 없으므로 state로 두지 않는다.
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
  }, []);

  function handleLogoClick() {
    if (showDevSettings) return;

    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, UNLOCK_CLICK_WINDOW);

    if (clickCount.current < UNLOCK_CLICKS) return;

    clickCount.current = 0;
    unlockDevSettings();
    setUnlocked(true);
    notifications.show({
      color: "gray",
      message: "개발자 설정을 열었습니다. 헤더의 톱니 아이콘으로 들어갑니다.",
    });
  }

  // 설정 화면이 적용 후 돌아올 곳 — 공개 경로라 스스로는 나갈 데를 모른다
  const settingsHref = `/settings?from=${encodeURIComponent(pathname)}`;

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
            {/* 로고 연속 클릭이 개발자 설정을 여는 통로다 (안드로이드 개발자 옵션 방식) */}
            <Group gap={8} onClick={handleLogoClick} style={{ userSelect: "none" }}>
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
            {showDevSettings && (
              <Tooltip label="개발자 설정">
                <ActionIcon
                  component={Link}
                  href={settingsHref}
                  variant="subtle"
                  color="gray"
                  aria-label="개발자 설정"
                >
                  <IconSettings size={18} />
                </ActionIcon>
              </Tooltip>
            )}
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
            href={settingsHref}
            label="개발자 설정"
            active={pathname === "/settings"}
          />
        </AppShell.Navbar>
      )}

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

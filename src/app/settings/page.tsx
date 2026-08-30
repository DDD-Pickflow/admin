"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Code,
  Group,
  Loader,
  Radio,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { IconAlertTriangle, IconServer } from "@tabler/icons-react";
import { useAuth } from "@/components/AuthProvider";
import { DEMO_MODE, USE_MOCK_DATA } from "@/lib/config";
import {
  API_ENVS,
  DEFAULT_API_BASE_URL,
  clearDevSettings,
  getApiBaseUrl,
  isDevSettingsUnlocked,
  isMockData,
  isUnlockFlagSet,
  lockDevSettings,
  saveDevSettings,
} from "@/lib/devSettings";
import { clearSession } from "@/lib/auth";

/**
 * 개발자 설정.
 *
 * 어느 서버를 보고 있는지 화면에서 바꾸고 확인하기 위한 곳이다. 저장은 localStorage라
 * 이 브라우저에만 남는다.
 *
 * 로그인 없이 열 수 있다(AuthGuard의 공개 경로). 개발 서버 로그인을 확인하려면
 * 로그인하기 전에 서버를 골라야 하기 때문이다. 대신 로그인하지 않은 상태에서는
 * 헤더 로고를 연속으로 눌러 연 브라우저만 들어올 수 있다.
 *
 * 적용하면 들어온 화면(?from)으로 전체 로드로 나간다. 제자리에서 새로고침하면 공개
 * 경로라 아무도 내보내주지 않아 설정 화면에 갇히고, react-query 캐시에 이전 서버의
 * 응답이 남아 있으면 어느 쪽 데이터인지 알 수 없게 된다.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // localStorage는 서버 렌더링에 없다. 마운트 뒤에 읽어야 하이드레이션이 어긋나지 않는다.
  const [ready, setReady] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [useMock, setUseMock] = useState(USE_MOCK_DATA);
  const [returnTo, setReturnTo] = useState("/");

  useEffect(() => {
    setApiBaseUrl(getApiBaseUrl());
    setUseMock(isMockData());
    // useSearchParams 대신 직접 읽는다 — 이 페이지를 정적 프리렌더로 두기 위해서다
    setReturnTo(safeReturnPath(new URLSearchParams(window.location.search).get("from")));
    setReady(true);
  }, []);

  // 주소를 직접 쳐서 들어온 경우 — 열어두지 않은 브라우저는 돌려보낸다
  useEffect(() => {
    if (isAuthenticated === false && !isDevSettingsUnlocked()) router.replace("/login");
  }, [isAuthenticated, router]);

  const blocked = isAuthenticated === false && ready && !isDevSettingsUnlocked();

  if (!ready || blocked) {
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    );
  }

  const serverChanged = apiBaseUrl !== getApiBaseUrl();
  const changed = serverChanged || useMock !== isMockData();
  const overridden =
    getApiBaseUrl() !== DEFAULT_API_BASE_URL || isMockData() !== USE_MOCK_DATA;

  function apply() {
    saveDevSettings({ apiBaseUrl, useMockData: useMock });
    // 다른 서버에서 발급된 토큰은 옮겨간 서버에서 통하지 않는다
    if (serverChanged) clearSession();
    leave();
  }

  function reset() {
    clearDevSettings();
    clearSession();
    leave();
  }

  /** 로고 연속 클릭으로 연 상태를 되돌린다. 설정값 자체는 건드리지 않는다. */
  function hide() {
    lockDevSettings();
    leave();
  }

  /**
   * router.push가 아니라 전체 로드로 나간다. 이전 서버의 응답이 남은 쿼리 캐시와
   * 메모리 상태를 통째로 버려야 어느 쪽 데이터인지 헷갈리지 않는다.
   */
  function leave() {
    window.location.assign(returnTo);
  }

  return (
    <Stack maw={640} gap="lg">
      <Stack gap={4}>
        <Group gap="sm">
          <Title order={3}>개발자 설정</Title>
          {overridden && (
            <Badge color="orange" variant="light">
              기본값 아님
            </Badge>
          )}
        </Group>
        <Text size="sm" c="dimmed">
          이 브라우저에만 적용됩니다. 배포 설정이나 다른 사람의 화면은 바뀌지 않습니다.
        </Text>
      </Stack>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Group gap="xs">
            <IconServer size={18} />
            <Text fw={600}>API 서버</Text>
          </Group>

          <Radio.Group value={apiBaseUrl} onChange={setApiBaseUrl}>
            <Stack gap="sm">
              {API_ENVS.map((env) => (
                <Radio
                  key={env.id}
                  value={env.baseUrl}
                  label={
                    <Stack gap={2}>
                      <Group gap="xs">
                        <Text size="sm">{env.label}</Text>
                        {env.baseUrl === DEFAULT_API_BASE_URL && (
                          <Badge size="xs" variant="light" color="gray">
                            환경변수 기본값
                          </Badge>
                        )}
                      </Group>
                      <Code>{env.baseUrl}</Code>
                    </Stack>
                  }
                />
              ))}
            </Stack>
          </Radio.Group>

          {serverChanged && (
            <Alert
              color="yellow"
              icon={<IconAlertTriangle size={18} />}
              title="적용하면 로그아웃됩니다"
            >
              토큰은 서버마다 따로 발급되므로, 서버를 바꾸면 다시 로그인해야 합니다.
            </Alert>
          )}
        </Stack>
      </Card>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Switch
            checked={useMock}
            onChange={(event) => setUseMock(event.currentTarget.checked)}
            disabled={DEMO_MODE}
            label="목 데이터 사용"
            description={
              DEMO_MODE
                ? "데모 배포에서는 끌 수 없습니다. 로그인을 건너뛰는 상태라 실데이터가 무인증으로 열립니다."
                : "켜면 위에서 고른 서버로 요청을 보내지 않고 화면 안의 샘플 데이터로 동작합니다."
            }
          />
          {useMock && !DEMO_MODE && (
            <Text size="sm" c="dimmed">
              목 데이터가 켜져 있는 동안에는 서버 선택이 실제 요청에 영향을 주지 않습니다.
            </Text>
          )}
        </Stack>
      </Card>

      <Group justify="space-between">
        <Button variant="subtle" color="gray" onClick={reset} disabled={!overridden}>
          기본값으로 되돌리기
        </Button>
        <Group gap="sm">
          {isUnlockFlagSet() && (
            <Button variant="subtle" color="gray" onClick={hide}>
              로그인 화면에서 숨기기
            </Button>
          )}
          <Button variant="default" onClick={leave}>
            닫기
          </Button>
          <Button onClick={apply} disabled={!changed}>
            적용
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}

/**
 * 돌아갈 경로. 주소창에서 오는 값이라 같은 사이트 안의 경로인지 확인한다.
 * 로그인 상태가 아니면 "/"에서 AuthGuard가 로그인 화면으로 보내준다.
 */
function safeReturnPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) return "/";
  // 설정 화면으로 되돌아오면 나간 것이 아니다
  return from.startsWith("/settings") ? "/" : from;
}

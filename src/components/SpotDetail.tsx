"use client";

import Link from "next/link";
import {
  Alert,
  Anchor,
  Badge,
  Card,
  Center,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useSpot } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { Spot, SpotStatus } from "@/types/spot";

export function SpotDetail({ id }: { id: string }) {
  const { data: spot, isLoading, isError, error } = useSpot(id);

  return (
    <Stack>
      <Anchor component={Link} href="/" size="sm">
        <Group gap={4}>
          <IconArrowLeft size={16} />
          목록으로
        </Group>
      </Anchor>

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && (
        <Alert color="red" title="스팟을 불러오지 못했습니다">
          {(error as Error).message}
        </Alert>
      )}

      {spot && <SpotDetailBody spot={spot} />}
    </Stack>
  );
}

function SpotDetailBody({ spot }: { spot: Spot }) {
  // 재검토대기 건은 직전 반려 사유를 상단에 강조한다 (기획서 4.2)
  const lastRejection =
    spot.status === SpotStatus.RE_REVIEW_PENDING
      ? spot.rejectionHistory[0]
      : undefined;

  return (
    <>
      <Group gap="sm">
        <Title order={3}>{spot.name}</Title>
        <StatusBadge status={spot.status} />
      </Group>

      {lastRejection && (
        <Alert
          color="orange"
          variant="light"
          icon={<IconAlertTriangle size={18} />}
          title="이전에 반려된 건입니다"
        >
          <Stack gap={4}>
            <Text fw={600}>{lastRejection.reason}</Text>
            {lastRejection.detail && <Text size="sm">{lastRejection.detail}</Text>}
            <Text size="sm" c="dimmed">
              {lastRejection.handlerName} · {formatDateTime(lastRejection.rejectedAt)}
            </Text>
          </Stack>
        </Alert>
      )}

      <Card withBorder padding="md">
        <Text fw={600} mb="sm">
          등록 사진
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {spot.photoUrls.map((url) => (
            <Image key={url} src={url} alt={spot.name} radius="sm" />
          ))}
        </SimpleGrid>
      </Card>

      <Card withBorder padding="md">
        <Text fw={600} mb="sm">
          등록 정보
        </Text>
        <Stack gap="xs">
          <Field label="신청일시" value={formatDateTime(spot.appliedAt)} />
          <Field label="등록 유저" value={spot.userNickname} />
          <Field label="상세주소" value={spot.address} />
          <Field label="한줄코멘트" value={spot.comment} />
          <Field label="촬영일시" value={formatDateTime(spot.shotAt)} />
          <Field
            label="필터"
            value={
              <Group gap={6}>
                {spot.filters.map((f) => (
                  <Badge key={f} variant="outline" color="gray">
                    {f}
                  </Badge>
                ))}
              </Group>
            }
          />
        </Stack>
      </Card>

      {spot.handledAt && (
        <Card withBorder padding="md">
          <Text fw={600} mb="sm">
            처리 정보
          </Text>
          <Stack gap="xs">
            <Field label="처리자" value={spot.handlerName ?? "-"} />
            <Field label="처리일시" value={formatDateTime(spot.handledAt)} />
            {spot.status === SpotStatus.REJECTED && spot.rejectionHistory[0] && (
              <Field
                label="반려 사유"
                value={
                  spot.rejectionHistory[0].detail
                    ? `${spot.rejectionHistory[0].reason} — ${spot.rejectionHistory[0].detail}`
                    : spot.rejectionHistory[0].reason
                }
              />
            )}
          </Stack>
        </Card>
      )}

      {/* 유저 신뢰도: 서버 스펙 미확정이라 자리만 잡아둔다 (기획서 8장) */}
      <Card withBorder padding="md">
        <Text fw={600} mb={4}>
          유저 신뢰도
        </Text>
        <Text size="sm" c="dimmed">
          서버 스펙 확정 후 가입일 / 누적 등록·승인·반려 횟수를 표시합니다.
        </Text>
      </Card>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group align="flex-start" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed" w={80} style={{ flexShrink: 0 }}>
        {label}
      </Text>
      {typeof value === "string" ? <Text size="sm">{value}</Text> : value}
    </Group>
  );
}

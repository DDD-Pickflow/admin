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
import { SpotActions } from "@/components/SpotActions";
import { StatusBadge } from "@/components/StatusBadge";
import { useSpot } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import {
  RejectionRecord,
  SpotDetail as SpotDetailData,
  SpotStatus,
  UserTrust,
} from "@/types/spot";

export function SpotDetail({ id }: { id: number }) {
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

function SpotDetailBody({ spot }: { spot: SpotDetailData }) {
  // 재검토대기 건은 직전 반려 사유를 상단에 강조한다 (기획서 4.2)
  const lastRejection =
    spot.status === SpotStatus.RE_REVIEW_PENDING
      ? spot.rejectionHistory[0]
      : undefined;

  // 상세 응답에 처리자/처리일시가 없어, 반려 건은 이력에서 가져온다
  const rejectedBy =
    spot.status === SpotStatus.REJECTED ? spot.rejectionHistory[0] : undefined;

  return (
    <>
      <Group justify="space-between" align="center" wrap="wrap">
        <Group gap="sm">
          <Title order={3}>{spot.name}</Title>
          <StatusBadge status={spot.status} />
        </Group>
        <SpotActions spot={spot} />
      </Group>

      {lastRejection && (
        <Alert
          color="orange"
          variant="light"
          icon={<IconAlertTriangle size={18} />}
          title="이전에 반려된 건입니다"
        >
          <RejectionSummary record={lastRejection} />
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
        {spot.status !== SpotStatus.PUBLISHED && (
          <Text size="xs" c="dimmed" mt="xs">
            미승인 사진은 만료되는 링크(약 60분)로 제공됩니다. 오래 열어두면 새로고침하세요.
          </Text>
        )}
      </Card>

      <Card withBorder padding="md">
        <Text fw={600} mb="sm">
          등록 정보
        </Text>
        <Stack gap="xs">
          <Field label="신청일시" value={formatDateTime(spot.appliedAt)} />
          <Field label="등록 유저" value={spot.userNickname} />
          <Field label="상세주소" value={spot.address} />
          <Field
            label="좌표"
            value={
              <Anchor
                href={`https://map.kakao.com/link/map/${encodeURIComponent(spot.name)},${spot.latitude},${spot.longitude}`}
                target="_blank"
                rel="noreferrer"
                size="sm"
              >
                {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
              </Anchor>
            }
          />
          <Field label="한줄코멘트" value={spot.comment} />
          <Field label="촬영일시" value={formatDateTime(spot.shotAt)} />
          <Field
            label="테마"
            value={
              <Badge variant="outline" color="gray">
                {spot.themeLabel}
              </Badge>
            }
          />
        </Stack>
      </Card>

      {rejectedBy && (
        <Card withBorder padding="md">
          <Text fw={600} mb="sm">
            처리 정보
          </Text>
          <RejectionSummary record={rejectedBy} />
        </Card>
      )}

      <Card withBorder padding="md">
        <Text fw={600} mb="sm">
          유저 신뢰도
        </Text>
        {spot.userTrust ? (
          <TrustSummary trust={spot.userTrust} />
        ) : (
          <Text size="sm" c="dimmed">
            제공되지 않았습니다.
          </Text>
        )}
      </Card>
    </>
  );
}

function RejectionSummary({ record }: { record: RejectionRecord }) {
  return (
    <Stack gap={4}>
      <Text fw={600}>{record.reasonLabel}</Text>
      {record.detail && <Text size="sm">{record.detail}</Text>}
      <Text size="sm" c="dimmed">
        {record.handlerName} · {formatDateTime(record.rejectedAt)}
      </Text>
    </Stack>
  );
}

function TrustSummary({ trust }: { trust: UserTrust }) {
  return (
    <Stack gap="xs">
      <Field label="가입일" value={formatDateTime(trust.joinedAt)} />
      <Field label="누적 등록" value={`${trust.totalRegistered}건`} />
      <Field label="승인" value={`${trust.totalApproved}건`} />
      <Field label="반려" value={`${trust.totalRejected}건`} />
    </Stack>
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

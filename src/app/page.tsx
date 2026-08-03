"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { StatusBadge } from "@/components/StatusBadge";
import { DEFAULT_PAGE_SIZE } from "@/lib/api";
import { useSpots } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { ADMIN_STATUSES, SPOT_STATUS_LABEL, SpotStatus } from "@/types/spot";

const ALL = "ALL";

const STATUS_FILTERS = [
  { label: "전체", value: ALL },
  ...ADMIN_STATUSES.map((s) => ({ label: SPOT_STATUS_LABEL[s], value: s })),
];

export default function SpotListPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  // 타이핑마다 요청이 나가지 않도록 한 박자 늦춘다 (검색은 서버가 처리)
  const [debouncedQuery] = useDebouncedValue(query, 300);

  // 조건이 바뀌면 첫 페이지로 되돌린다
  useEffect(() => {
    setPage(0);
  }, [statusFilter, debouncedQuery]);

  const { data, isLoading, isError, error, refetch, isFetching } = useSpots({
    status: statusFilter === ALL ? undefined : (statusFilter as SpotStatus),
    q: debouncedQuery.trim() || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
  });

  return (
    <Stack>
      <Title order={3}>검수 목록</Title>

      <Group justify="space-between" align="flex-end" wrap="wrap">
        <SegmentedControl
          value={statusFilter}
          onChange={setStatusFilter}
          data={STATUS_FILTERS}
        />
        <TextInput
          placeholder="스팟명 · 닉네임 검색"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          w={260}
        />
      </Group>

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {isError && (
        <Alert color="red" title="목록을 불러오지 못했습니다">
          <Stack align="flex-start" gap="xs">
            <Text size="sm">{(error as Error).message}</Text>
            <Button size="xs" variant="light" color="red" onClick={() => refetch()}>
              다시 시도
            </Button>
          </Stack>
        </Alert>
      )}

      {data && (
        <>
          <Text size="sm" c="dimmed">
            {page + 1}페이지 · {data.items.length}건
            {isFetching && " · 불러오는 중"}
          </Text>

          <Table.ScrollContainer minWidth={720}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>신청일시</Table.Th>
                  <Table.Th>유저</Table.Th>
                  <Table.Th>스팟명</Table.Th>
                  <Table.Th>상태</Table.Th>
                  <Table.Th>처리자</Table.Th>
                  <Table.Th>처리일시</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.items.map((spot) => (
                  <Table.Tr
                    key={spot.id}
                    onClick={() => router.push(`/spots/${spot.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <Table.Td>{formatDateTime(spot.appliedAt)}</Table.Td>
                    <Table.Td>{spot.userNickname}</Table.Td>
                    <Table.Td>{spot.name}</Table.Td>
                    <Table.Td>
                      <StatusBadge status={spot.status} />
                    </Table.Td>
                    <Table.Td>{spot.handlerName ?? "-"}</Table.Td>
                    <Table.Td>{formatDateTime(spot.handledAt)}</Table.Td>
                  </Table.Tr>
                ))}
                {data.items.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" py="md">
                        조건에 맞는 스팟이 없습니다.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {/* 서버가 전체 페이지 수를 주지 않고 hasNext만 주므로 이전/다음만 제공한다 */}
          {(page > 0 || data.hasNext) && (
            <Group justify="center" gap="sm">
              <Button
                variant="default"
                size="xs"
                disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <Button
                variant="default"
                size="xs"
                disabled={!data.hasNext || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}

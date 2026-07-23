"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
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
import { IconSearch } from "@tabler/icons-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useSpots } from "@/lib/queries";
import { matchesQuery, sortSpots } from "@/lib/sort";
import { formatDateTime } from "@/lib/format";
import { SpotStatus } from "@/types/spot";

const STATUS_FILTERS = [
  { label: "전체", value: "ALL" },
  { label: SpotStatus.UNDER_REVIEW, value: SpotStatus.UNDER_REVIEW },
  { label: SpotStatus.RE_REVIEW_PENDING, value: SpotStatus.RE_REVIEW_PENDING },
  { label: SpotStatus.APPROVED, value: SpotStatus.APPROVED },
  { label: SpotStatus.REJECTED, value: SpotStatus.REJECTED },
];

export default function SpotListPage() {
  const router = useRouter();
  const { data, isLoading, isError, error } = useSpots();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter(
      (s) =>
        (statusFilter === "ALL" || s.status === statusFilter) &&
        matchesQuery(s, query)
    );
    return sortSpots(filtered);
  }, [data, statusFilter, query]);

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
          {(error as Error).message}
        </Alert>
      )}

      {data && (
        <>
          <Text size="sm" c="dimmed">
            총 {rows.length}건
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
                {rows.map((spot) => (
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
                {rows.length === 0 && (
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
        </>
      )}
    </Stack>
  );
}

import { Alert, Stack, Title } from "@mantine/core";

// Phase 2에서 여기에 Table + 필터 + 검색을 붙인다.
export default function SpotListPage() {
  return (
    <Stack>
      <Title order={3}>검수 목록</Title>
      <Alert color="gray">
        Phase 2에서 구현: Mantine Table 6컬럼 + 복합 정렬(sortSpots) + 상태 필터 + 검색
      </Alert>
    </Stack>
  );
}

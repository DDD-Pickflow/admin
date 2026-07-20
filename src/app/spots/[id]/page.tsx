import { Alert, Stack, Title } from "@mantine/core";

// Phase 3에서 등록 필드 전량 + 이전 반려 사유 블록, Phase 4에서 승인/반려 모달을 붙인다.
export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Stack>
      <Title order={3}>스팟 상세 #{id}</Title>
      <Alert color="gray">
        Phase 3에서 구현: 사진 / 상세주소 / 한줄코멘트 / 촬영일시 / 필터, 재검토 건이면 이전 반려 사유 블록
      </Alert>
    </Stack>
  );
}

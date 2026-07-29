import { SpotDetail } from "@/components/SpotDetail";

// 데이터 조회는 클라이언트 컴포넌트(TanStack Query)에서 하고, 여기서는 id만 넘긴다.
export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SpotDetail id={id} />;
}

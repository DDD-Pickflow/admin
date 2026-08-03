import {
  QueryClient,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlreadyHandledError,
  ReviewRequest,
  SpotListParams,
  fetchSpot,
  fetchSpots,
  reviewSpot,
} from "@/lib/api";

export const spotKeys = {
  all: ["spots"] as const,
  list: (params: SpotListParams) => ["spots", "list", params] as const,
  detail: (id: number) => ["spots", "detail", id] as const,
};

export function useSpots(params: SpotListParams) {
  return useQuery({
    queryKey: spotKeys.list(params),
    queryFn: () => fetchSpots(params),
    // 페이지·검색어가 바뀌어도 이전 결과를 잠깐 유지해 표가 깜빡이지 않게 한다
    placeholderData: keepPreviousData,
  });
}

export function useSpot(id: number) {
  return useQuery({
    queryKey: spotKeys.detail(id),
    queryFn: () => fetchSpot(id),
  });
}

/** 승인/반려는 서버에서 단일 엔드포인트(POST .../reviews)로 통합돼 있다 */
export function useReviewSpot(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewRequest) => reviewSpot(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: spotKeys.all }),
    onError: (error) => refreshOnConflict(queryClient, error),
  });
}

/**
 * 다른 담당자가 먼저 처리한 경우 화면이 낡은 상태로 남지 않도록 다시 조회한다 (기획서 7.2).
 * 네트워크 실패는 서버 상태가 그대로이므로 무효화하지 않는다.
 */
function refreshOnConflict(queryClient: QueryClient, error: Error): void {
  if (error instanceof AlreadyHandledError) {
    queryClient.invalidateQueries({ queryKey: spotKeys.all });
  }
}

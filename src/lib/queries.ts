import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlreadyHandledError,
  approveSpot,
  fetchSpot,
  fetchSpots,
  rejectSpot,
} from "@/lib/api";
import { RejectReason } from "@/types/spot";

export const spotKeys = {
  all: ["spots"] as const,
  detail: (id: string) => ["spots", id] as const,
};

export function useSpots() {
  return useQuery({ queryKey: spotKeys.all, queryFn: fetchSpots });
}

export function useSpot(id: string) {
  return useQuery({ queryKey: spotKeys.detail(id), queryFn: () => fetchSpot(id) });
}

export function useApproveSpot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveSpot(id),
    // spotKeys.all이 접두사라 목록·상세가 함께 무효화된다
    onSuccess: () => queryClient.invalidateQueries({ queryKey: spotKeys.all }),
    onError: (error) => refreshOnConflict(queryClient, error),
  });
}

export function useRejectSpot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { reason: RejectReason; detail?: string }) =>
      rejectSpot(id, payload),
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

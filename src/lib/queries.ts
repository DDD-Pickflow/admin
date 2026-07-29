import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveSpot, fetchSpot, fetchSpots, rejectSpot } from "@/lib/api";
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
  });
}

export function useRejectSpot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { reason: RejectReason; detail?: string }) =>
      rejectSpot(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: spotKeys.all }),
  });
}

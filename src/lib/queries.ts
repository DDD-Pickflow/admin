import { useQuery } from "@tanstack/react-query";
import { fetchSpot, fetchSpots } from "@/lib/api";

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

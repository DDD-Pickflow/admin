import { Badge } from "@mantine/core";
import { SPOT_STATUS_LABEL, SpotStatus } from "@/types/spot";

const COLOR: Record<SpotStatus, string> = {
  [SpotStatus.DRAFT]: "gray",
  [SpotStatus.PENDING]: "blue",
  [SpotStatus.RE_REVIEW_PENDING]: "orange",
  [SpotStatus.PUBLISHED]: "green",
  [SpotStatus.REJECTED]: "red",
};

export function StatusBadge({ status }: { status: SpotStatus }) {
  return (
    <Badge color={COLOR[status]} variant="light">
      {SPOT_STATUS_LABEL[status]}
    </Badge>
  );
}

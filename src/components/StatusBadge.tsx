import { Badge } from "@mantine/core";
import { SpotStatus } from "@/types/spot";

const COLOR: Record<SpotStatus, string> = {
  [SpotStatus.UNDER_REVIEW]: "blue",
  [SpotStatus.RE_REVIEW_PENDING]: "orange",
  [SpotStatus.APPROVED]: "green",
  [SpotStatus.REJECTED]: "red",
};

export function StatusBadge({ status }: { status: SpotStatus }) {
  return (
    <Badge color={COLOR[status]} variant="light">
      {status}
    </Badge>
  );
}

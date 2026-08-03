import dayjs from "dayjs";

/** 목록/상세 공통 일시 표기 */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return dayjs(iso).format("YYYY.MM.DD HH:mm");
}

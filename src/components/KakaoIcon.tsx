/** 카카오 심볼(말풍선). 색은 currentColor를 따른다. */
export function KakaoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d="M12 3C6.48 3 2 6.52 2 10.86c0 2.79 1.86 5.24 4.66 6.62-.2.73-.74 2.7-.85 3.12-.13.52.19.51.4.37.17-.11 2.61-1.77 3.67-2.49.69.1 1.4.15 2.12.15 5.52 0 10-3.52 10-7.86S17.52 3 12 3z" />
    </svg>
  );
}

/** 카카오 로그인 버튼 규격 색상 */
export const KAKAO_YELLOW = "#FEE500";
export const KAKAO_LABEL = "rgba(0, 0, 0, 0.85)";

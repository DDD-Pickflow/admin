import Image from "next/image";
import appIcon from "../../public/app-icon.png";

/**
 * Pickflow 심볼 — 앱 아이콘의 배경을 뺀 벡터 버전.
 * 헤더처럼 밝은 배경에 인라인으로 들어갈 때 쓴다(원본 PNG는 어두운 배경이 붙어 있다).
 * 색은 currentColor를 따르므로 감싸는 쪽에서 c 속성으로 지정한다.
 */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      role="img"
      aria-label="Pickflow"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx="50" cy="50" r="8.6" />

      {/* 상하좌우 광선 */}
      <rect x="46.9" y="17.5" width="6.2" height="17.5" />
      <rect x="46.9" y="65" width="6.2" height="17.5" />
      <rect x="17.5" y="46.9" width="17.5" height="6.2" />
      <rect x="65" y="46.9" width="17.5" height="6.2" />

      {/* 대각선 광선 — 정사각형을 45° 돌려 마름모로 */}
      <g transform="rotate(45 50 50)">
        <rect x="46.25" y="27.25" width="7.5" height="7.5" />
        <rect x="46.25" y="65.25" width="7.5" height="7.5" />
        <rect x="27.25" y="46.25" width="7.5" height="7.5" />
        <rect x="65.25" y="46.25" width="7.5" height="7.5" />
      </g>
    </svg>
  );
}

/** 앱 아이콘 원본 — 로그인 화면처럼 아이콘 그대로를 보여줄 자리에 쓴다 */
export function LogoTile({ size = 56 }: { size?: number }) {
  return (
    <Image
      src={appIcon}
      alt="Pickflow"
      width={size}
      height={size}
      style={{ borderRadius: size * 0.24 }}
      priority
    />
  );
}

export const BRAND_ORANGE = "#F96A38";
export const BRAND_DARK = "#1E2225";

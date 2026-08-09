/**
 * 앱 전체 동작 스위치.
 *
 * 두 값이 서로 묶여 있다. 데모 모드는 목 데이터일 때만 켜지므로, 실제 API로
 * 전환하면 로그인 건너뛰기도 자동으로 꺼진다. 한쪽만 바꿔서 실데이터가 무인증으로
 * 열리는 상황이 생기지 않게 하기 위한 것이다.
 */

/**
 * 목 데이터로 동작한다(기본값). 실제 API를 붙이려면 환경변수로 끈다.
 *   NEXT_PUBLIC_USE_MOCK_DATA=false
 *
 * 환경별로 나눌 수 있으므로, Preview에서 먼저 실서버로 검증한 뒤 Production을
 * 전환하는 식으로 쓸 수 있다.
 */
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

/**
 * 로그인을 건너뛰고 검수 화면을 바로 보여준다 (팀 공유용 데모 배포).
 *
 * 기본은 꺼짐. 켜려면 NEXT_PUBLIC_DEMO_MODE=true 를 환경변수로 준다.
 * 목 데이터일 때만 유효하므로, USE_MOCK_DATA를 false로 바꾸면 환경변수가 켜져 있어도
 * 자동으로 꺼진다 — 실데이터가 인증 없이 열리는 조합은 만들어지지 않는다.
 */
export const DEMO_MODE =
  USE_MOCK_DATA && process.env.NEXT_PUBLIC_DEMO_MODE === "true";

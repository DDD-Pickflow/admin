/**
 * 앱 전체 동작 스위치.
 *
 * 두 값이 서로 묶여 있다. 데모 모드는 목 데이터일 때만 켜지므로, 실제 API로
 * 전환하면 로그인 건너뛰기도 자동으로 꺼진다. 한쪽만 바꿔서 실데이터가 무인증으로
 * 열리는 상황이 생기지 않게 하기 위한 것이다.
 */

/** 서버 연동 전까지 목 데이터로 동작한다. 실제 API를 붙일 때 false로 바꾼다. */
export const USE_MOCK_DATA = true;

/**
 * 로그인을 건너뛰고 검수 화면을 바로 보여준다 (팀 공유용 데모 배포).
 *
 * 목 데이터일 때만 유효하다. USE_MOCK_DATA를 false로 바꾸는 순간 자동으로 꺼지므로
 * 실데이터가 인증 없이 노출될 일은 없다.
 * 로그인을 정상 동작시켜 확인하려면 NEXT_PUBLIC_DEMO_MODE=false 로 끌 수 있다.
 */
export const DEMO_MODE =
  USE_MOCK_DATA && process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

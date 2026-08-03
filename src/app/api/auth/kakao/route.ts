import { NextResponse } from "next/server";

/**
 * 카카오 인가 코드를 서버 JWT로 바꾼다.
 *
 * 브라우저에서 직접 할 수 없는 이유: 코드 → 카카오 토큰 교환에 client secret이 필요한데
 * 이건 브라우저에 노출하면 안 된다. 그래서 이 라우트(서버)가 대신 처리한다.
 *
 *   브라우저(code) → 여기 → 카카오(토큰 교환) → 백엔드 /v1/auth/kakao → 서버 JWT → 브라우저
 *
 * 백엔드는 iOS 앱과 동일하게 { accessToken }만 받으므로 수정이 필요 없다.
 */

const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://pickflow-api.us/api";

/**
 * 카카오 에러를 설정 담당자가 바로 조치할 수 있는 문구로 바꾼다.
 * 원문(error_description)은 영문이라 화면에 그대로 띄우면 알아보기 어렵다.
 */
function kakaoErrorMessage(body: {
  error_code?: string;
  error_description?: string;
} | null): string {
  switch (body?.error_code) {
    case "KOE010":
      return "카카오 앱 설정이 맞지 않습니다. REST API 키와 Client Secret을 확인해주세요.";
    case "KOE006":
      return "카카오에 등록되지 않은 주소입니다. Redirect URI 등록을 확인해주세요.";
    case "KOE320":
      return "인가 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.";
    default:
      return body?.error_description
        ? `카카오 인증에 실패했습니다. (${body.error_description})`
        : "카카오 인증에 실패했습니다.";
  }
}

export async function POST(request: Request) {
  const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;

  if (!restApiKey) {
    return NextResponse.json(
      { message: "카카오 REST API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const { code, redirectUri } = await request.json();
  if (!code || !redirectUri) {
    return NextResponse.json(
      { message: "인가 코드가 없습니다." },
      { status: 400 }
    );
  }

  // 1) 인가 코드 → 카카오 액세스 토큰
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: restApiKey,
    redirect_uri: redirectUri,
    code,
  });
  // 카카오 앱에서 "보안 > client secret"을 사용 중일 때만 필요하다
  if (clientSecret) tokenParams.set("client_secret", clientSecret);

  const kakaoResponse = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: tokenParams,
  });
  const kakaoBody = await kakaoResponse.json().catch(() => null);

  if (!kakaoResponse.ok || !kakaoBody?.access_token) {
    console.error("[auth/kakao] 토큰 교환 실패", {
      status: kakaoResponse.status,
      body: kakaoBody,
      redirectUri,
      hasClientSecret: Boolean(clientSecret),
    });
    return NextResponse.json(
      { message: kakaoErrorMessage(kakaoBody) },
      { status: 401 }
    );
  }

  // 2) 카카오 액세스 토큰 → 서버 JWT (iOS 앱과 동일한 엔드포인트)
  const loginResponse = await fetch(`${API_BASE_URL}/v1/auth/kakao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: kakaoBody.access_token }),
  });
  const loginBody = await loginResponse.json().catch(() => null);

  if (!loginResponse.ok || loginBody?.success === false) {
    console.error("[auth/kakao] 백엔드 로그인 실패", {
      status: loginResponse.status,
      body: loginBody,
    });
    return NextResponse.json(
      { message: loginBody?.message ?? "로그인에 실패했습니다." },
      { status: loginResponse.status }
    );
  }

  const { accessToken, refreshToken, profile } = loginBody?.data ?? {};
  if (!accessToken) {
    return NextResponse.json(
      { message: "로그인 응답에서 토큰을 찾지 못했습니다." },
      { status: 502 }
    );
  }

  return NextResponse.json({ accessToken, refreshToken, profile });
}

// middleware.ts (프로젝트 루트 디렉토리에 생성)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // /admin 경로 접근 시에만 실행
  if (request.nextUrl.pathname.startsWith("/admin/root")) {
    try {
      // Spring Boot 백엔드에 토큰 검증 요청
      // 미들웨어에서는 NEXT_PUBLIC_ 없이 직접 환경변수 사용
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/viewer/status`, {
        method: "GET",
        headers: {
          // 클라이언트가 보낸 쿠키를 그대로 백엔드에 전달
          Cookie: request.headers.get("cookie") || "",
        },
        // credentials 설정 (withCredentials: true와 동일)
        credentials: "include",
      });

      // 200 응답이 아니면 로그인 페이지로 리다이렉트
      if (!response.ok) {
        console.log(`토큰 검증 실패: ${response.status}`);
        return NextResponse.redirect(new URL("/", request.url));
      }

      // 200 응답이면 페이지 접근 허용
      console.log("토큰 검증 성공 - 관리자 페이지 접근 허용");
      return NextResponse.next();
    } catch (error) {
      // 네트워크 오류 등 예외 발생 시 로그인 페이지로 리다이렉트
      console.error("토큰 검증 중 오류 발생:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // /admin 경로가 아니면 그대로 진행
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    // /admin으로 시작하는 모든 경로에서 실행
    "/admin/:path*",
  ],
};

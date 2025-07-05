import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/root/approve, /admin/root/users 경로만 검사
  if (pathname === "/admin/root/approve" || pathname === "/admin/root/users") {
    try {
      // Spring Boot 백엔드에 토큰 검증 요청
      // 미들웨어에서는 NEXT_PUBLIC_ 없이 직접 환경변수 사용
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      // 권한 체크용 API 요청
      const response = await fetch(`${apiUrl}/root/signList`, {
        method: "GET",
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
        credentials: "include",
      });

      // 200이 아니면 /admin/login으로 리다이렉트
      if (!response.ok) {
        const url = request.nextUrl.clone();
        // admin/login으로 리다이렉트
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }

      // 200 응답이면 페이지 접근 허용
      return NextResponse.next();
    } catch (err) {
      // 네트워크 오류 등 예외 발생 시 /admin/login으로 리다이렉트
      console.error("인증 확인 중 오류:", err);
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "no-auth");
      return NextResponse.redirect(url);
    }
  }

  // /admin/root/approve, /admin/root/users 외의 /admin 경로는 기존 방식 유지
  if (pathname.startsWith("/admin/root")) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/viewer/status`, {
        method: "GET",
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
        credentials: "include",
      });

      if (!response.ok) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return NextResponse.next();
    } catch (err) {
      console.error("ROOT 권한 확인 중 오류:", err);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // 그 외 경로는 그대로 진행
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: ["/admin/:path*"],
};

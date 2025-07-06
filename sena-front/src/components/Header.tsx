"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { useRoleStore } from "@/store/role";

export default function Header() {
  const [adminName, setAdminName] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname.startsWith("/admin/root");

  // 관리자 페이지 여부를 판단하기 위한 변수
  //zustand store 사용 useRoleStore
  const { setRole } = useRoleStore();

  useEffect(() => {
    // 관리자 페이지에서만 관리자 이름을 가져옴
    if (isAdminPage) {
      fetchAdminName();
    }
  }, [isAdminPage]);

  const fetchAdminName = async () => {
    try {
      const response = await apiClient.get("/viewer/admin/info");
      setAdminName(response.data.name || ""); // 이름이 없을 경우 빈 문자열로 설정
      setRole(response.data.role || "VIEWER"); // role 정보도 저장
    } catch (error) {
      console.error("관리자 이름 조회 실패:", error);
      // 에러 시 이름을 빈 문자열로 유지
      setAdminName("");
      setRole("VIEWER"); // 에러 시 기본 role로 설정
    }
  };

  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청 (서버에서 httpOnly 쿠키 삭제)
      await apiClient.post("/viewer/logout", {});
      
      // 클라이언트 측 상태 초기화
      setAdminName("");
      setRole("VIEWER");
      
      // 브라우저의 일반 쿠키나 localStorage 정리 (필요한 경우)
      // localStorage.clear(); // 필요한 경우 주석 해제
      // sessionStorage.clear(); // 필요한 경우 주석 해제
      
      // 로그아웃 성공 시 로그인 페이지로 리다이렉트
      router.push("/admin/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      // 에러가 발생해도 클라이언트 상태는 초기화
      setAdminName("");
      setRole("VIEWER");
      router.push("/admin/login");
    }
  };

  return (
    <header className="bg-gray-800 text-white p-4 w-screen">
      <div className="flex justify-between items-center">
        <h1 onClick={() => router.push("/")} className="text-2xl font-bold cursor-pointer">
          세븐나이츠 패키지 효율 계산기
        </h1>
        {isAdminPage && adminName && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{adminName}</span>
              <span className="font-medium"> 님</span>
            </div>
            <button onClick={handleLogout} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

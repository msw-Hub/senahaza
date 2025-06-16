"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Admin {
  adminId: number;
  name: string;
  role: "VIEWER" | "EDITOR" | "ROOT";
  dept: string;
  email: string;
  tel: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface AdminListResponse {
  adminList: Admin[];
  count: number;
  totalPages: number;
  currentPage: number;
}

export default function UsersPage() {
  // 이 페이지는 ROOT 관리자 전용 페이지로, 토큰 검증은 미들웨어에서 처리됨
  // 따라서 이곳에서는 별도의 인증 로직이 필요 없음
  // 구현 기능 리스트
  // 1. 관리자 목록 조회 (페이징, 정렬)
  // 2. 관리자 권한 변경 기능
  // 3. 관리자 삭제 기능

  const [adminData, setAdminData] = useState<AdminListResponse>({
    adminList: [],
    count: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  // 관리자 목록 테이블 제목
  const adminListTitle = ["이름", "권한", "부서", "이메일", "전화번호", "최근 로그인", "권한 변경", "삭제"];

  // 관리자 목록을 조회하는 API 호출
  const fetchAdminList = async (page: number = 1, sort: string = "") => {
    try {
      const params = new URLSearchParams();
      if (page) params.append("page", page.toString());
      if (sort) params.append("sortBy", sort);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/root/admins?${params.toString()}`, { withCredentials: true });

      setAdminData(response.data);
      console.log("관리자 목록:", response.data);
    } catch (error) {
      // 권한이 없으므로 에러 발생시 packages 페이지로 리다이렉트
      router.push("/admin/root/packages");
    }
  };

  // 관리자 권한 변경
  const handleRoleChange = async (adminId: number, newRole: "VIEWER" | "EDITOR" | "ROOT") => {
    try {
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/root/admins/${adminId}/role`, { role: newRole }, { withCredentials: true });

      if (response.status === 200) {
        alert(`관리자 권한이 ${newRole}로 변경되었습니다.`);
        fetchAdminList(currentPage, sortBy); // 권한 변경 후 목록 갱신
      } else {
        alert("관리자 권한 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("관리자 권한 변경 중 오류 발생", error);
      alert("관리자 권한 변경 중 오류가 발생했습니다.");
    }
  };

  // 관리자 삭제
  const handleDeleteAdmin = async (adminId: number, adminName: string) => {
    if (!confirm(`정말로 "${adminName}" 관리자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/root/admins/${adminId}`, { withCredentials: true });

      if (response.status === 200) {
        alert("관리자가 삭제되었습니다.");
        fetchAdminList(currentPage, sortBy); // 삭제 후 목록 갱신
      } else {
        alert("관리자 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("관리자 삭제 중 오류 발생", error);
      alert("관리자 삭제 중 오류가 발생했습니다.");
    }
  };

  // 권한 변경 드롭다운 핸들러
  const handleRoleSelect = (adminId: number, currentRole: string, event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = event.target.value as "VIEWER" | "EDITOR" | "ROOT";
    if (newRole !== currentRole) {
      handleRoleChange(adminId, newRole);
    }
  };

  // 검색 기능 (클라이언트 사이드 필터링)
  const filteredAdmins = adminData.adminList.filter((admin) => admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || admin.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // 권한별 색상 스타일
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "ROOT":
        return "text-red-600 font-semibold";
      case "EDITOR":
        return "text-blue-600 font-semibold";
      case "VIEWER":
        return "text-green-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  useEffect(() => {
    fetchAdminList(currentPage, sortBy);
  }, [currentPage, sortBy]); // 페이지나 정렬 옵션이 변경될 때 관리자 목록을 조회

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4">
      <h1 className="text-black font-bold text-xl">관리자 관리</h1>

      {/* 검색창 */}
      <div className="relative w-full">
        <input type="text" className="bg-foreground border border-gray-300 rounded-sm pl-10 p-2 w-[400px]" placeholder="관리자 이름 또는 이메일을 검색해주세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <i className="xi-search absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"></i>
      </div>

      {/* 정렬 옵션 */}
      <div className="flex gap-2 items-center">
        <span className="text-gray-700">정렬:</span>
        <select className="border border-gray-300 rounded-sm px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">기본</option>
          <option value="name">이름순</option>
          <option value="role">권한순</option>
          <option value="createdAt">생성일순</option>
          <option value="lastLoginAt">최근 로그인순</option>
        </select>
      </div>

      {/* 관리자 목록 테이블 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2 overflow-y-auto grid grid-cols-[1fr_0.8fr_1fr_1.5fr_1fr_1fr_1fr_0.5fr] grid-rows-12">
        {/* 테이블 헤더 */}
        {adminListTitle.map((title, index) => (
          <span key={index} className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 " + (index >= 6 ? "justify-center" : "justify-start")}>
            {title}
          </span>
        ))}

        {/* 테이블 데이터 */}
        {filteredAdmins.map((admin, index) => (
          <React.Fragment key={admin.adminId}>
            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{admin.name}</span>

            <span className={`border-b border-gray-200 h-12 flex items-center ${getRoleStyle(admin.role)}`}>{admin.role}</span>

            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{admin.dept}</span>

            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{admin.email}</span>

            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{admin.tel}</span>

            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "로그인 기록 없음"}</span>

            {/* 권한 변경 드롭다운 */}
            <div className="flex items-center justify-center border-b border-gray-200 h-12">
              <select className="border border-gray-300 rounded-sm px-2 py-1 text-sm" defaultValue={admin.role} onChange={(e) => handleRoleSelect(admin.adminId, admin.role, e)}>
                <option value="VIEWER">VIEWER</option>
                <option value="EDITOR">EDITOR</option>
                <option value="ROOT">ROOT</option>
              </select>
            </div>

            {/* 삭제 버튼 */}
            <div onClick={() => admin.role !== "ROOT" && handleDeleteAdmin(admin.adminId, admin.name)} className={`flex items-center justify-center border-b border-gray-200 h-12 ${admin.role === "ROOT" ? "text-gray-400 cursor-not-allowed" : "text-red-600 cursor-pointer hover:bg-red-50"}`}>
              <i className="xi-close"></i>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* 페이지네이션 */}
      {adminData.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed">
            이전
          </button>

          <span className="px-3 py-1 text-gray-700">
            {currentPage} / {adminData.totalPages}
          </span>

          <button onClick={() => setCurrentPage((prev) => Math.min(adminData.totalPages, prev + 1))} disabled={currentPage === adminData.totalPages} className="px-3 py-1 border border-gray-300 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed">
            다음
          </button>
        </div>
      )}

      {/* 총 관리자 수 표시 */}
      <div className="text-gray-600 text-sm">총 {adminData.count}명의 관리자가 있습니다.</div>
    </div>
  );
}

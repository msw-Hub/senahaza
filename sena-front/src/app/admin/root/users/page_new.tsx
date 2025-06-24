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
  const [adminData, setAdminData] = useState<AdminListResponse>({
    adminList: [],
    count: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmins, setSelectedAdmins] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // 관리자 목록 테이블 헤더
  const adminListHeaders = ["선택", "이름", "권한", "부서", "이메일", "전화번호", "최근 로그인", "권한 변경", "삭제"];

  // 관리자 목록을 조회하는 API 호출
  const fetchAdminList = async (page: number = 1, sort: string = "") => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 권한 변경
  const handleRoleChange = async (adminId: number, newRole: "VIEWER" | "EDITOR" | "ROOT") => {
    try {
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/root/admins/${adminId}/role`, { role: newRole }, { withCredentials: true });

      if (response.status === 200) {
        alert(`관리자 권한이 ${newRole}로 변경되었습니다.`);
        fetchAdminList(currentPage, sortBy);
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
        fetchAdminList(currentPage, sortBy);
        setSelectedAdmins((prev) => prev.filter((id) => id !== adminId));
      } else {
        alert("관리자 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("관리자 삭제 중 오류 발생", error);
      alert("관리자 삭제 중 오류가 발생했습니다.");
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedAdmins.length === 0) {
      alert("삭제할 관리자를 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedAdmins.length}명의 관리자를 삭제하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    const failedAdmins: string[] = [];

    try {
      for (const adminId of selectedAdmins) {
        try {
          const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/root/admins/${adminId}`, { withCredentials: true });

          if (response.status === 200) {
            successCount++;
          } else {
            failCount++;
            const adminName = adminData.adminList.find((admin) => admin.adminId === adminId)?.name || `ID: ${adminId}`;
            failedAdmins.push(adminName);
          }
        } catch (error) {
          failCount++;
          const adminName = adminData.adminList.find((admin) => admin.adminId === adminId)?.name || `ID: ${adminId}`;
          failedAdmins.push(adminName);
          console.error(`관리자 ${adminName} 삭제 중 오류:`, error);
        }
      }

      // 결과 메시지 표시
      if (successCount > 0 && failCount === 0) {
        alert(`${successCount}명의 관리자가 삭제되었습니다.`);
      } else if (successCount > 0 && failCount > 0) {
        alert(`${successCount}명 삭제 완료, ${failCount}명 실패\n실패한 관리자: ${failedAdmins.join(", ")}`);
      } else {
        alert(`모든 삭제 요청이 실패했습니다.\n실패한 관리자: ${failedAdmins.join(", ")}`);
      }

      fetchAdminList(currentPage, sortBy);
      setSelectedAdmins([]);
    } catch (error) {
      console.error("일괄 삭제 중 오류 발생", error);
      alert("일괄 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedAdmins.length === filteredAdmins.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(filteredAdmins.map((admin) => admin.adminId));
    }
  };

  // 개별 선택/해제
  const handleSelectAdmin = (adminId: number) => {
    setSelectedAdmins((prev) => (prev.includes(adminId) ? prev.filter((id) => id !== adminId) : [...prev, adminId]));
  };

  // 검색 및 정렬 기능
  const filteredAdmins = adminData.adminList
    .filter((admin) => admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || admin.email.toLowerCase().includes(searchTerm.toLowerCase()) || admin.dept.toLowerCase().includes(searchTerm.toLowerCase()) || admin.role.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "lastLoginAt":
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt) : new Date(0);
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt) : new Date(0);
          break;
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "dept":
          aValue = a.dept.toLowerCase();
          bValue = b.dept.toLowerCase();
          break;
        case "role":
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // 정렬 변경 핸들러
  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  // 권한 스타일 반환
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "ROOT":
        return "text-red-600 bg-red-50";
      case "EDITOR":
        return "text-blue-600 bg-blue-50";
      case "VIEWER":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // 권한 텍스트 반환
  const getRoleText = (role: string) => {
    switch (role) {
      case "ROOT":
        return "최고관리자";
      case "EDITOR":
        return "편집자";
      case "VIEWER":
        return "뷰어";
      default:
        return role;
    }
  };

  useEffect(() => {
    fetchAdminList(currentPage, sortBy);
  }, [currentPage]);

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4">
      <h1 className="text-black font-bold text-xl">유저/관리자 관리</h1>

      {/* 검색창 */}
      <div className="relative w-full">
        <input type="text" className="bg-foreground border border-gray-300 rounded-sm pl-10 p-2 w-[400px]" placeholder="이름, 이메일, 부서 또는 권한을 검색해주세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <i className="xi-search absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"></i>
      </div>

      {/* 컨트롤 패널 */}
      <div className="flex gap-4 items-center w-full justify-between">
        {/* 정렬 옵션 */}
        <div className="flex gap-2 items-center">
          <span className="text-gray-700">정렬:</span>
          <select
            className="border border-gray-300 rounded-sm px-2 py-1"
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split("_");
              setSortBy(newSortBy);
              setSortOrder(newSortOrder as "asc" | "desc");
            }}>
            <option value="createdAt_desc">최신 가입순</option>
            <option value="createdAt_asc">오래된 가입순</option>
            <option value="lastLoginAt_desc">최근 로그인순</option>
            <option value="lastLoginAt_asc">오래된 로그인순</option>
            <option value="name_asc">이름 오름차순</option>
            <option value="name_desc">이름 내림차순</option>
            <option value="email_asc">이메일 오름차순</option>
            <option value="email_desc">이메일 내림차순</option>
            <option value="dept_asc">부서 오름차순</option>
            <option value="dept_desc">부서 내림차순</option>
            <option value="role_asc">권한순</option>
            <option value="role_desc">권한 역순</option>
          </select>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 items-center">
          <span className="text-gray-600 text-sm">{selectedAdmins.length > 0 && `${selectedAdmins.length}명 선택됨`}</span>
          <button onClick={handleBulkDelete} disabled={selectedAdmins.length === 0 || isLoading} className="px-3 py-1 bg-red-500 text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600">
            {isLoading ? "처리 중..." : "일괄 삭제"}
          </button>
        </div>
      </div>

      {/* 관리자 리스트 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2">
        <div className="grid grid-cols-[0.3fr_0.8fr_0.8fr_0.8fr_1.2fr_1fr_1fr_0.8fr_0.3fr] overflow-x-auto">
          {/* 테이블 헤더 */}
          {adminListHeaders.map((title, index) => (
            <span
              key={index}
              className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 px-2 " + (index === 0 || index >= 7 ? "justify-center" : "justify-start") + (index > 0 && index < 7 ? " cursor-pointer hover:bg-gray-50" : "")}
              onClick={() => {
                if (index === 0) {
                  handleSelectAll();
                } else if (index === 1) {
                  handleSortChange("name");
                } else if (index === 2) {
                  handleSortChange("role");
                } else if (index === 3) {
                  handleSortChange("dept");
                } else if (index === 4) {
                  handleSortChange("email");
                } else if (index === 6) {
                  handleSortChange("lastLoginAt");
                }
              }}>
              <div className="flex justify-center items-center gap-1">
                {index === 0 && <input type="checkbox" checked={selectedAdmins.length === filteredAdmins.length && filteredAdmins.length > 0} onChange={handleSelectAll} className="w-4 h-4" />}
                {index !== 0 && title}
                {index > 0 && index < 7 && index !== 5 && index !== 7 && <i className={`ml-1 text-xs ${sortBy === ["", "name", "role", "dept", "email", "", "lastLoginAt", ""][index] ? (sortOrder === "asc" ? "xi-angle-up" : "xi-angle-down") : "xi-angle-up opacity-30"}`}></i>}
              </div>
            </span>
          ))}

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="col-span-9 flex items-center justify-center h-20">
              <span className="text-gray-500">로딩 중...</span>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="col-span-9 flex items-center justify-center h-20">
              <span className="text-gray-500">{searchTerm ? "검색 결과가 없습니다." : "등록된 관리자가 없습니다."}</span>
            </div>
          ) : (
            /* 테이블 데이터 */
            filteredAdmins.map((admin) => (
              <React.Fragment key={admin.adminId}>
                {/* 체크박스 */}
                <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-16 px-2">
                  <input type="checkbox" checked={selectedAdmins.includes(admin.adminId)} onChange={() => handleSelectAdmin(admin.adminId)} className="w-4 h-4" />
                </div>

                {/* 이름 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center font-medium px-2">{admin.name}</span>

                {/* 권한 */}
                <div className="border-b border-gray-200 h-16 flex items-center px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleStyle(admin.role)}`}>{getRoleText(admin.role)}</span>
                </div>

                {/* 부서 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2">{admin.dept}</span>

                {/* 이메일 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2">{admin.email}</span>

                {/* 전화번호 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2">{admin.tel}</span>

                {/* 최근 로그인 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center text-sm px-2">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "로그인 기록 없음"}</span>

                {/* 권한 변경 */}
                <div className="border-b border-gray-200 h-16 flex items-center justify-center px-2">
                  <select
                    value={admin.role}
                    onChange={(e) => handleRoleChange(admin.adminId, e.target.value as "VIEWER" | "EDITOR" | "ROOT")}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    disabled={admin.role === "ROOT"} // ROOT 권한은 변경 불가
                  >
                    <option value="VIEWER">뷰어</option>
                    <option value="EDITOR">편집자</option>
                    <option value="ROOT">최고관리자</option>
                  </select>
                </div>

                {/* 삭제 버튼 */}
                <div
                  onClick={() => handleDeleteAdmin(admin.adminId, admin.name)}
                  className={`flex items-center justify-center border-b border-gray-200 h-16 px-2 ${admin.role === "ROOT" ? "text-gray-400 cursor-not-allowed" : "text-red-600 cursor-pointer hover:bg-red-50"}`}
                  title={admin.role === "ROOT" ? "최고관리자는 삭제할 수 없습니다" : "삭제"}>
                  <i className="xi-trash text-lg"></i>
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="flex justify-between items-center w-full text-gray-600 text-sm">
        <span>
          총 {adminData.count}명의 관리자
          {searchTerm && ` (검색 결과: ${filteredAdmins.length}명)`}
        </span>
        {adminData.totalPages > 1 && (
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 border rounded text-sm disabled:opacity-50">
              처음
            </button>
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 border rounded text-sm disabled:opacity-50">
              이전
            </button>
            <span className="px-2 py-1 text-sm">
              {currentPage} / {adminData.totalPages}
            </span>
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === adminData.totalPages} className="px-2 py-1 border rounded text-sm disabled:opacity-50">
              다음
            </button>
            <button onClick={() => setCurrentPage(adminData.totalPages)} disabled={currentPage === adminData.totalPages} className="px-2 py-1 border rounded text-sm disabled:opacity-50">
              마지막
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

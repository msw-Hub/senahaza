"use client";

import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { TableLoading } from "@/components/LoadingSpinner";

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

// 페이지별 캐시 인터페이스
interface PageCache {
  [page: number]: Admin[];
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
  const [isLoading, setIsLoading] = useState(false);

  // 페이지별 캐시 및 로드된 페이지 추적
  const [pageCache, setPageCache] = useState<PageCache>({});
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [maxLoadedPage, setMaxLoadedPage] = useState(0);

  const router = useRouter();
  // 관리자 목록 테이블 헤더
  const adminListHeaders = ["ID", "이름", "권한", "부서", "이메일", "전화번호", "최근 로그인", "권한 변경", "삭제"];

  // 관리자 목록을 조회하는 API 호출 (개선된 버전)
  const fetchAdminList = async (page: number = 1, sort: string = "", mergeWithPrevious: boolean = false) => {
    // 이미 로드된 페이지인지 확인
    if (loadedPages.has(page) && !sort) {
      console.log(`Page ${page} already loaded, using cache`);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (page) params.append("page", page.toString());
      if (sort) params.append("sortBy", sort);

      const response = await apiClient.get(`/root/admins?${params.toString()}`);
      const newData = response.data;

      if (mergeWithPrevious && pageCache[page - 1]) {
        // 이전 페이지들과 새 페이지를 합치기
        const allAdmins: Admin[] = [];

        // 1페이지부터 현재 페이지까지 순서대로 합치기
        for (let i = 1; i <= page; i++) {
          if (i === page) {
            allAdmins.push(...newData.adminList);
            // 새 페이지 캐시에 저장
            setPageCache((prev) => ({ ...prev, [page]: newData.adminList }));
          } else if (pageCache[i]) {
            allAdmins.push(...pageCache[i]);
          }
        }

        setAdminData({
          ...newData,
          adminList: allAdmins,
        });
      } else {
        // 첫 로드이거나 정렬 변경시
        setAdminData(newData);
        setPageCache({ [page]: newData.adminList });

        // 정렬이 변경된 경우 캐시 초기화
        if (sort) {
          setLoadedPages(new Set([page]));
          setMaxLoadedPage(page);
        }
      }

      // 로드된 페이지 추적 업데이트
      if (!sort) {
        setLoadedPages((prev) => new Set([...prev, page]));
        setMaxLoadedPage((prev) => Math.max(prev, page));
      }

      console.log("관리자 목록:", newData);
    } catch (err) {
      // 권한이 없으므로 에러 발생시 packages 페이지로 리다이렉트
      console.error("관리자 목록 조회 실패:", err);
      router.push("/admin/root/packages");
    } finally {
      setIsLoading(false);
    }
  };

  // 다음 페이지 로드 함수
  const loadNextPage = () => {
    const nextPage = maxLoadedPage + 1;
    if (nextPage <= adminData.totalPages) {
      setCurrentPage(nextPage);
      fetchAdminList(nextPage, "", true); // mergeWithPrevious = true
    }
  };

  // 캐시 초기화 함수 (정렬이나 검색 시 사용)
  const resetCache = () => {
    setPageCache({});
    setLoadedPages(new Set());
    setMaxLoadedPage(0);
  };

  // 관리자 권한 변경
  const handleRoleChange = async (adminId: number, newRole: "VIEWER" | "EDITOR" | "ROOT") => {
    try {
      const response = await apiClient.patch(`/root/admins/${adminId}/role`, { role: newRole });

      if (response.status === 200) {
        alert(`관리자 권한이 ${newRole}로 변경되었습니다.`);
        // 캐시를 초기화하고 첫 페이지부터 다시 로드
        resetCache();
        setCurrentPage(1);
        fetchAdminList(1, sortBy);
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
      const response = await apiClient.delete(`/root/admins/${adminId}`);
      if (response.status === 200) {
        alert("관리자가 삭제되었습니다.");
        // 캐시를 초기화하고 첫 페이지부터 다시 로드
        resetCache();
        setCurrentPage(1);
        fetchAdminList(1, sortBy);
      } else {
        alert("관리자 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("관리자 삭제 중 오류 발생", error);
      alert("관리자 삭제 중 오류가 발생했습니다.");
    }
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

    // 정렬 변경시 캐시 초기화하고 첫 페이지부터 다시 로드
    resetCache();
    setCurrentPage(1);
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
        return "ROOT";
      case "EDITOR":
        return "EDITOR";
      case "VIEWER":
        return "VIEWER";
      default:
        return role;
    }
  };

  useEffect(() => {
    // 페이지 변경 시에만 실행 (정렬은 handleSortChange에서 별도 처리)
    if (currentPage === 1 || !loadedPages.has(currentPage)) {
      fetchAdminList(currentPage, sortBy);
    }
  }, [currentPage]);

  useEffect(() => {
    // 정렬 변경 시 실행
    fetchAdminList(1, sortBy);
  }, [sortBy, sortOrder]);

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

              // 정렬 변경시 캐시 초기화하고 첫 페이지부터 다시 로드
              resetCache();
              setCurrentPage(1);
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
        </div>{" "}
        {/* 액션 버튼 */}
        <div className="flex gap-2 items-center">
          <span className="text-gray-600 text-sm">총 {adminData.count}명의 관리자</span>
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
                if (index === 1) {
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
              {" "}
              <div className="flex justify-center items-center gap-1">
                {index !== 0 && title}
                {index > 0 && index < 7 && index !== 5 && index !== 7 && <i className={`ml-1 text-xs ${sortBy === ["", "name", "role", "dept", "email", "", "lastLoginAt", ""][index] ? (sortOrder === "asc" ? "xi-angle-up" : "xi-angle-down") : "xi-angle-up opacity-30"}`}></i>}
                {index === 0 && title}
              </div>
            </span>
          ))}

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="col-span-9">
              <TableLoading rows={5} />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="col-span-9 flex items-center justify-center h-20">
              <span className="text-gray-500">{searchTerm ? "검색 결과가 없습니다." : "등록된 관리자가 없습니다."}</span>
            </div>
          ) : (
            /* 테이블 데이터 */
            filteredAdmins.map((admin) => (
              <React.Fragment key={admin.adminId}>
                {" "}
                {/* ID */}
                <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-16 px-2 font-mono text-sm">{admin.adminId}</div>
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
                    <option value="VIEWER">VIEWER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ROOT">ROOT</option>
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
        <div className="flex flex-col gap-1">
          <span>
            총 {adminData.count}명의 관리자
            {searchTerm && ` (검색 결과: ${filteredAdmins.length}명)`}
          </span>
          {loadedPages.size > 1 && (
            <span className="text-xs text-gray-500">
              로드된 페이지:{" "}
              {Array.from(loadedPages)
                .sort((a, b) => a - b)
                .join(", ")}{" "}
              ({adminData.adminList.length}명 표시 중)
            </span>
          )}
        </div>
        {adminData.totalPages > 1 && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                resetCache();
                setCurrentPage(1);
                fetchAdminList(1, sortBy);
              }}
              disabled={currentPage === 1}
              className="px-2 py-1 border rounded text-sm disabled:opacity-50">
              처음
            </button>
            <button
              onClick={() => {
                const prevPage = currentPage - 1;
                setCurrentPage(prevPage);
                if (!loadedPages.has(prevPage)) {
                  fetchAdminList(prevPage, sortBy);
                }
              }}
              disabled={currentPage === 1}
              className="px-2 py-1 border rounded text-sm disabled:opacity-50">
              이전
            </button>
            <span className="px-2 py-1 text-sm">
              {currentPage} / {adminData.totalPages}
            </span>
            <button onClick={loadNextPage} disabled={maxLoadedPage >= adminData.totalPages} className="px-2 py-1 border rounded text-sm disabled:opacity-50" title={maxLoadedPage >= adminData.totalPages ? "마지막 페이지입니다" : "다음 페이지 로드"}>
              다음
            </button>
            <button
              onClick={() => {
                setCurrentPage(adminData.totalPages);
                fetchAdminList(adminData.totalPages, sortBy);
              }}
              disabled={currentPage === adminData.totalPages}
              className="px-2 py-1 border rounded text-sm disabled:opacity-50">
              마지막
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

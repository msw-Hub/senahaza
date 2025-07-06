"use client";

import apiClient from "@/lib/axios";
import React, { useEffect, useState } from "react";

interface SignupRequest {
  dept: string;
  email: string;
  name: string;
  pendingAdminId: string;
  requestedAt: string;
  tel: string;
}

interface SignupRequestList {
  count: number;
  signList: SignupRequest[];
}

export default function ApprovePage() {
  const [signupReqs, setSignupReqs] = useState<SignupRequestList>({
    count: 0,
    signList: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("requestedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  // 가입 승인 리스트 테이블 헤더
  const signupReqHeaders = ["선택", "ID", "부서", "이름", "이메일", "전화번호", "요청 일시", "승인", "거절"];

  // 승인 대기 중인 사용자 목록을 조회하는 API 호출
  const fetchSignupRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/root/signList");
      setSignupReqs(response.data);
      console.log("승인 대기 중인 사용자 목록:", response.data);
    } catch (error) {
      console.error("승인 요청 조회 중 오류 발생", error);
      alert("승인 요청 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 단일 승인
  const handleApprove = async (pendingAdminId: string, userName?: string) => {
    try {
      const response = await apiClient.post("/root/signList/approve", { pendingAdminIds: [pendingAdminId] });
      if (response.status === 200) {
        alert(`${userName ? `"${userName}"` : "사용자"} 승인이 완료되었습니다.`);
        fetchSignupRequests();
      } else {
        alert("사용자 승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 승인 중 오류 발생", error);
      alert("사용자 승인 중 오류가 발생했습니다.");
    }
  };

  // 단일 거절
  const handleReject = async (pendingAdminId: string, userName?: string) => {
    if (!confirm(`정말로 "${userName || "이 사용자"}"의 가입 요청을 거절하시겠습니까?`)) {
      return;
    }

    try {
      const response = await apiClient.post("/root/signList/reject", { pendingAdminIds: [pendingAdminId] });
      if (response.status === 200) {
        alert(`${userName ? `"${userName}"` : "사용자"} 거절이 완료되었습니다.`);
        fetchSignupRequests();
      } else {
        alert("사용자 거절에 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 거절 중 오류 발생", error);
      alert("사용자 거절 중 오류가 발생했습니다.");
    }
  };

  // 일괄 승인
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) {
      alert("승인할 사용자를 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedIds.length}명의 사용자를 승인하시겠습니까?`)) {
      return;
    }

    setIsBatchProcessing(true);
    try {
      const response = await apiClient.post("/root/signList/approve", { pendingAdminIds: selectedIds });
      if (response.status === 200) {
        alert(`${selectedIds.length}명의 사용자 승인이 완료되었습니다.`);
        setSelectedIds([]);
        fetchSignupRequests();
      } else {
        alert("일괄 승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("일괄 승인 중 오류 발생", error);
      alert("일괄 승인 중 오류가 발생했습니다.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // 일괄 거절
  const handleBatchReject = async () => {
    if (selectedIds.length === 0) {
      alert("거절할 사용자를 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedIds.length}명의 사용자를 거절하시겠습니까?`)) {
      return;
    }

    setIsBatchProcessing(true);
    try {
      const response = await apiClient.post("/root/signList/reject", { pendingAdminIds: selectedIds });
      if (response.status === 200) {
        alert(`${selectedIds.length}명의 사용자 거절이 완료되었습니다.`);
        setSelectedIds([]);
        fetchSignupRequests();
      } else {
        alert("일괄 거절에 실패했습니다.");
      }
    } catch (error) {
      console.error("일괄 거절 중 오류 발생", error);
      alert("일괄 거절 중 오류가 발생했습니다.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // 체크박스 핸들러
  const handleCheckboxChange = (pendingAdminId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, pendingAdminId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== pendingAdminId));
    }
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRequests.map((req) => req.pendingAdminId));
    } else {
      setSelectedIds([]);
    }
  };

  // 검색 및 정렬 기능
  const filteredRequests = signupReqs.signList
    .filter((req) => req.name.toLowerCase().includes(searchTerm.toLowerCase()) || req.email.toLowerCase().includes(searchTerm.toLowerCase()) || req.dept.toLowerCase().includes(searchTerm.toLowerCase()) || req.tel.includes(searchTerm))
    .sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case "requestedAt":
          aValue = new Date(a.requestedAt);
          bValue = new Date(b.requestedAt);
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

  useEffect(() => {
    fetchSignupRequests();
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4">
      <h1 className="text-black font-bold text-xl">가입 승인 관리</h1>

      {/* 검색창 */}
      <div className="relative w-full">
        <input type="text" className="bg-foreground border border-gray-300 rounded-sm pl-10 p-2 w-[400px]" placeholder="이름, 이메일, 부서 또는 전화번호를 검색해주세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <option value="requestedAt_desc">최신 요청순</option>
            <option value="requestedAt_asc">오래된 요청순</option>
            <option value="name_asc">이름 오름차순</option>
            <option value="name_desc">이름 내림차순</option>
            <option value="email_asc">이메일 오름차순</option>
            <option value="email_desc">이메일 내림차순</option>
            <option value="dept_asc">부서 오름차순</option>
            <option value="dept_desc">부서 내림차순</option>
          </select>
        </div>{" "}
        {/* 액션 버튼 */}
        <div className="flex gap-2 items-center">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-600">{selectedIds.length}개 선택됨</span>
              <button onClick={handleBatchApprove} disabled={isBatchProcessing} className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded text-sm font-medium transition-colors">
                {isBatchProcessing ? "처리 중..." : "일괄 승인"}
              </button>
              <button onClick={handleBatchReject} disabled={isBatchProcessing} className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-sm font-medium transition-colors">
                {isBatchProcessing ? "처리 중..." : "일괄 거절"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 승인 요청 리스트 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2">
        <div className="grid grid-cols-[0.3fr_0.3fr_0.8fr_0.8fr_1.2fr_1fr_1fr_0.3fr_0.3fr] overflow-x-auto">
          {/* 테이블 헤더 */}
          {signupReqHeaders.map((title, index) => (
            <span
              key={index}
              className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 px-2 " + (index === 0 || index === 1 || index >= 7 ? "justify-center" : "justify-start") + (index > 1 && index < 7 ? " cursor-pointer hover:bg-gray-50" : "")}
              onClick={() => {
                if (index === 2) {
                  handleSortChange("dept");
                } else if (index === 3) {
                  handleSortChange("name");
                } else if (index === 4) {
                  handleSortChange("email");
                } else if (index === 6) {
                  handleSortChange("requestedAt");
                }
              }}>
              <div className="flex justify-center items-center gap-1">
                {index === 0 ? (
                  <input type="checkbox" checked={filteredRequests.length > 0 && selectedIds.length === filteredRequests.length} onChange={(e) => handleSelectAll(e.target.checked)} className="w-4 h-4" />
                ) : (
                  <>
                    {title}
                    {index > 1 && index < 7 && index !== 5 && <i className={`ml-1 text-xs ${sortBy === ["", "", "dept", "name", "email", "", "requestedAt", ""][index] ? (sortOrder === "asc" ? "xi-angle-up" : "xi-angle-down") : "xi-angle-up opacity-30"}`}></i>}
                  </>
                )}
              </div>
            </span>
          ))}

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="col-span-9 flex items-center justify-center h-20">
              <span className="text-gray-500">로딩 중...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="col-span-9 flex items-center justify-center h-20">
              <span className="text-gray-500">{searchTerm ? "검색 결과가 없습니다." : "승인 대기 중인 사용자가 없습니다."}</span>
            </div>
          ) : (
            /* 테이블 데이터 */
            filteredRequests.map((req) => (
              <React.Fragment key={req.pendingAdminId}>
                {/* 체크박스 */}
                <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-16 px-2">
                  <input type="checkbox" checked={selectedIds.includes(req.pendingAdminId)} onChange={(e) => handleCheckboxChange(req.pendingAdminId, e.target.checked)} className="w-4 h-4" />
                </div>
                {/* ID */}
                <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-16 px-2">
                  <span className="font-medium">{req.pendingAdminId}</span>
                </div>
                {/* 부서 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2">{req.dept}</span>
                {/* 이름 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center font-medium px-2">{req.name}</span>
                {/* 이메일 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2">{req.email}</span>
                {/* 전화번호 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2">{req.tel}</span>
                {/* 요청 일시 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center text-sm px-2">{new Date(req.requestedAt).toLocaleString()}</span>
                {/* 승인 버튼 */}
                <div onClick={() => handleApprove(req.pendingAdminId, req.name)} className="flex items-center justify-center text-green-600 border-b border-gray-200 h-16 cursor-pointer hover:bg-green-50 px-2" title="승인">
                  <i className="xi-check text-lg"></i>
                </div>
                {/* 거절 버튼 */}
                <div onClick={() => handleReject(req.pendingAdminId, req.name)} className="flex items-center justify-center text-red-600 border-b border-gray-200 h-16 cursor-pointer hover:bg-red-50 px-2" title="거절">
                  <i className="xi-close text-lg"></i>
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="flex justify-between items-center w-full text-gray-600 text-sm">
        <span>
          총 {signupReqs.count}개의 승인 요청
          {searchTerm && ` (검색 결과: ${filteredRequests.length}개)`}
        </span>
      </div>
    </div>
  );
}

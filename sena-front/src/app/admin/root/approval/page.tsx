"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";

interface SignupRequest {
  dept: string; // 사용자 부서
  email: string; // 사용자 이메일
  name: string; // 사용자 이름
  pendingAdminId: string; // 승인 대기 중인 관리자 ID
  requestedAt: string; // 요청 일시
  tel: string; // 사용자 전화번호
}

interface SignupRequestList {
  count: number; // 승인 대기 중인 사용자 수
  signList: SignupRequest[]; // 승인 대기 중인 사용자 목록
}

export default function ApprovalPage() {
  // 이 페이지는 관리자 전용 페이지로, 토큰 검증은 미들웨어에서 처리됨
  // 따라서 이곳에서는 별도의 인증 로직이 필요 없음
  // 구현 기능 리스트
  // 1. 회원가입 승인 대기 중인 사용자 목록 조회
  // 2. 사용자 승인/거절 기능
  // 3. 검색 및 정렬 기능
  // 4. 일괄 승인/거절 기능

  const [signupReqs, setSignupReqs] = useState<SignupRequestList>({
    count: 0,
    signList: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("requestedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 가입 승인 리스트 제목
  const signupReqTitle = ["선택", "부서", "이메일", "이름", "전화번호", "요청 일시", "승인", "거절"];

  // 승인 대기 중인 사용자 목록을 조회하는 API 호출
  const handleSignupApprove = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/root/signList`, { withCredentials: true });

      setSignupReqs(response.data);
      console.log("승인 대기 중인 사용자 목록:", response.data);
    } catch (error) {
      console.error("승인 요청 중 오류 발생", error);
      alert("승인 요청 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 단일 승인
  const handleApprove = async (pendingAdminId: string, userName?: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/root/signList/approve`, { pendingAdminIds: [pendingAdminId] }, { withCredentials: true });

      if (response.status === 200) {
        alert(`${userName ? `"${userName}"` : "사용자"} 승인이 완료되었습니다.`);
        handleSignupApprove(); // 승인 후 목록 갱신
        setSelectedUsers((prev) => prev.filter((id) => id !== pendingAdminId));
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/root/signList/reject`, { pendingAdminIds: [pendingAdminId] }, { withCredentials: true });

      if (response.status === 200) {
        alert(`${userName ? `"${userName}"` : "사용자"} 거절이 완료되었습니다.`);
        handleSignupApprove(); // 거절 후 목록 갱신
        setSelectedUsers((prev) => prev.filter((id) => id !== pendingAdminId));
      } else {
        alert("사용자 거절에 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 거절 중 오류 발생", error);
      alert("사용자 거절 중 오류가 발생했습니다.");
    }
  };

  // 일괄 승인
  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) {
      alert("승인할 사용자를 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedUsers.length}명의 사용자를 승인하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/root/signList/approve`, { pendingAdminIds: selectedUsers }, { withCredentials: true });

      if (response.status === 200) {
        alert(`${selectedUsers.length}명의 사용자 승인이 완료되었습니다.`);
        handleSignupApprove();
        setSelectedUsers([]);
      } else {
        alert("일괄 승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("일괄 승인 중 오류 발생", error);
      alert("일괄 승인 중 오류가 발생했습니다.");
    }
  };

  // 일괄 거절
  const handleBulkReject = async () => {
    if (selectedUsers.length === 0) {
      alert("거절할 사용자를 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedUsers.length}명의 사용자를 거절하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/root/signList/reject`, { pendingAdminIds: selectedUsers }, { withCredentials: true });

      if (response.status === 200) {
        alert(`${selectedUsers.length}명의 사용자 거절이 완료되었습니다.`);
        handleSignupApprove();
        setSelectedUsers([]);
      } else {
        alert("일괄 거절에 실패했습니다.");
      }
    } catch (error) {
      console.error("일괄 거절 중 오류 발생", error);
      alert("일괄 거절 중 오류가 발생했습니다.");
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredRequests.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredRequests.map((req) => req.pendingAdminId));
    }
  };

  // 개별 선택/해제
  const handleSelectUser = (pendingAdminId: string) => {
    setSelectedUsers((prev) => (prev.includes(pendingAdminId) ? prev.filter((id) => id !== pendingAdminId) : [...prev, pendingAdminId]));
  };

  // 검색 및 정렬 기능
  const filteredRequests = signupReqs.signList
    .filter((req) => req.name.toLowerCase().includes(searchTerm.toLowerCase()) || req.email.toLowerCase().includes(searchTerm.toLowerCase()) || req.dept.toLowerCase().includes(searchTerm.toLowerCase()))
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
        case "dept":
          aValue = a.dept.toLowerCase();
          bValue = b.dept.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
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
    handleSignupApprove();
  }, []); // 컴포넌트가 마운트될 때 승인 대기 중인 사용자 목록을 조회

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4">
      <h1 className="text-black font-bold text-xl">가입 요청</h1>

      {/* 검색창 */}
      <div className="relative w-full">
        <input type="text" className="bg-foreground border border-gray-300 rounded-sm pl-10 p-2 w-[400px]" placeholder="사용자 이름, 이메일 또는 부서를 검색해주세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <option value="dept_asc">부서 오름차순</option>
            <option value="dept_desc">부서 내림차순</option>
          </select>
        </div>

        {/* 일괄 처리 버튼 */}
        <div className="flex gap-2 items-center">
          <span className="text-gray-600 text-sm">{selectedUsers.length > 0 && `${selectedUsers.length}명 선택됨`}</span>
          <button onClick={handleBulkApprove} disabled={selectedUsers.length === 0} className="px-3 py-1 bg-green-500 text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600">
            일괄 승인
          </button>
          <button onClick={handleBulkReject} disabled={selectedUsers.length === 0} className="px-3 py-1 bg-red-500 text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600">
            일괄 거절
          </button>
        </div>
      </div>

      {/* 승인 리스트 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2 overflow-y-auto grid grid-cols-[0.3fr_1fr_1.5fr_1fr_1fr_1fr_0.3fr_0.3fr] grid-rows-12">
        {/* 테이블 헤더 */}
        {signupReqTitle.map((title, index) => (
          <span
            key={index}
            className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 " + (index === 0 || index >= 6 ? "justify-center" : "justify-start") + (index > 0 && index < 6 ? " cursor-pointer hover:bg-gray-50" : "")}
            onClick={() => {
              if (index === 0) {
                handleSelectAll();
              } else if (index === 1) {
                handleSortChange("dept");
              } else if (index === 2) {
                handleSortChange("email");
              } else if (index === 3) {
                handleSortChange("name");
              } else if (index === 5) {
                handleSortChange("requestedAt");
              }
            }}>
            {index === 0 && <input type="checkbox" checked={selectedUsers.length === filteredRequests.length && filteredRequests.length > 0} onChange={handleSelectAll} className="w-4 h-4" />}
            {index !== 0 && title}
            {index > 0 && index < 6 && <i className={`ml-1 text-xs ${sortBy === ["", "dept", "email", "name", "", "requestedAt"][index] ? (sortOrder === "asc" ? "xi-angle-up" : "xi-angle-down") : "xi-angle-up opacity-30"}`}></i>}
          </span>
        ))}

        {/* 로딩 상태 */}
        {isLoading ? (
          <div className="col-span-8 flex items-center justify-center h-20">
            <span className="text-gray-500">로딩 중...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="col-span-8 flex items-center justify-center h-20">
            <span className="text-gray-500">{searchTerm ? "검색 결과가 없습니다." : "승인 대기 중인 사용자가 없습니다."}</span>
          </div>
        ) : (
          /* 테이블 데이터 */
          filteredRequests.map((req, index) => (
            <React.Fragment key={req.pendingAdminId}>
              {/* 체크박스 */}
              <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-12">
                <input type="checkbox" checked={selectedUsers.includes(req.pendingAdminId)} onChange={() => handleSelectUser(req.pendingAdminId)} className="w-4 h-4" />
              </div>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{req.dept}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{req.email}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center font-medium">{req.name}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{req.tel}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center text-sm">{new Date(req.requestedAt).toLocaleString()}</span>

              {/* 승인 버튼 */}
              <div onClick={() => handleApprove(req.pendingAdminId, req.name)} className="flex items-center justify-center text-green-600 border-b border-gray-200 h-12 cursor-pointer hover:bg-green-50" title="승인">
                <i className="xi-check text-lg"></i>
              </div>

              {/* 거절 버튼 */}
              <div onClick={() => handleReject(req.pendingAdminId, req.name)} className="flex items-center justify-center text-red-600 border-b border-gray-200 h-12 cursor-pointer hover:bg-red-50" title="거절">
                <i className="xi-close text-lg"></i>
              </div>
            </React.Fragment>
          ))
        )}
      </div>

      {/* 하단 정보 */}
      <div className="flex justify-between items-center w-full text-gray-600 text-sm">
        <span>
          총 {signupReqs.count}명의 가입 요청
          {searchTerm && ` (검색 결과: ${filteredRequests.length}명)`}
        </span>
        {selectedUsers.length > 0 && (
          <button onClick={() => setSelectedUsers([])} className="text-blue-600 hover:underline">
            선택 해제
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";

interface BlockedIp {
  id: number;
  ip: string;
  reason: string;
  blockedAt: string;
  unblockedAt: string | null;
  isActive: boolean;
  createdBy: string;
  unblockedBy: string | null;
}

interface IpLogsResponse {
  content: BlockedIp[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
}

interface FilterState {
  ip: string;
  from: string;
  to: string;
  active: string;
  page: number;
  size: number;
}

export default function IpLogPage() {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 페이지네이션 정보
  const [pageInfo, setPageInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 30,
  });

  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    ip: "",
    from: "",
    to: "",
    active: "true", // 기본값: 현재 차단 중인 IP만 조회
    page: 0,
    size: 30,
  });

  // 날짜 유효성 검증 오류 상태
  const [dateValidationError, setDateValidationError] = useState("");

  // 날짜 유효성 검증
  const validateDates = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      setDateValidationError("");
      return true;
    }

    // yyyymmdd 형식을 yyyy-mm-dd로 변환하여 Date 객체 생성
    const formatDate = (dateStr: string) => {
      if (dateStr.length === 8) {
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }
      return dateStr;
    };

    const start = new Date(formatDate(startDate));
    const end = new Date(formatDate(endDate));

    if (start > end) {
      setDateValidationError("시작일이 종료일보다 뒤에 있습니다. 날짜를 다시 확인해주세요.");
      return false;
    }

    setDateValidationError("");
    return true;
  };

  // 날짜 변경 핸들러
  const handleDateChange = (field: "from" | "to", value: string) => {
    const newFilters = { ...filters, [field]: formatDateForAPI(value), page: 0 };
    setFilters(newFilters);

    // 두 날짜가 모두 있으면 유효성 검증
    if (newFilters.from && newFilters.to) {
      validateDates(newFilters.from, newFilters.to);
    }
  };

  // 차단된 IP 목록 조회
  const fetchBlockedIps = async () => {
    // 날짜가 모두 입력된 경우에만 유효성 검증
    if (filters.from && filters.to) {
      if (!validateDates(filters.from, filters.to)) {
        return;
      }
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.ip) params.append("ip", filters.ip);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.active !== "all") params.append("active", filters.active);
      params.append("page", filters.page.toString());
      params.append("size", filters.size.toString());

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/traffic/blocked-ips?${params}`, {
        withCredentials: true,
      });

      const data: IpLogsResponse = response.data;
      setBlockedIps(data.content);
      setPageInfo({
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.pageable.pageNumber,
        pageSize: data.pageable.pageSize,
      });
    } catch (error) {
      console.error("차단된 IP 목록 조회 중 오류 발생", error);
      alert("차단된 IP 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // IP 차단 해제
  const handleUnblockIp = async (id: number, ip: string) => {
    if (!confirm(`IP ${ip}의 차단을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/traffic/blocked-ips/${id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        alert(`IP ${ip}의 차단이 해제되었습니다.`);
        fetchBlockedIps(); // 목록 새로고침
      } else {
        alert("IP 차단 해제에 실패했습니다.");
      }
    } catch (error) {
      console.error("IP 차단 해제 중 오류 발생", error);
      alert("IP 차단 해제 중 오류가 발생했습니다.");
    }
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    // 페이지 변경 시에만 자동으로 API 호출
    setTimeout(() => {
      fetchBlockedIps();
    }, 0);
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      ip: "",
      from: "",
      to: "",
      active: "true",
      page: 0,
      size: 30,
    });
    setDateValidationError("");
  };

  // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
  const formatDateForAPI = (dateStr: string) => {
    return dateStr.replace(/-/g, "");
  };

  // 날짜 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
  const formatDateForInput = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  };

  // 날짜 포맷팅
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-black font-bold text-xl">IP 로그 관리</h1>
      </div>

      {/* 필터 섹션 */}
      <div className="w-full bg-gray-50 border border-gray-300 rounded-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* IP 주소 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IP 주소</label>
            <input type="text" className="w-full border border-gray-300 rounded-sm px-3 py-1" placeholder="IP 주소 검색" value={filters.ip} onChange={(e) => setFilters((prev) => ({ ...prev, ip: e.target.value, page: 0 }))} />
          </div>

          {/* 시작일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input type="date" className="w-full border border-gray-300 rounded-sm px-3 py-1" value={formatDateForInput(filters.from)} onChange={(e) => handleDateChange("from", e.target.value)} />
          </div>

          {/* 종료일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input type="date" className="w-full border border-gray-300 rounded-sm px-3 py-1" value={formatDateForInput(filters.to)} onChange={(e) => handleDateChange("to", e.target.value)} />
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">차단 상태</label>
            <select className="w-full border border-gray-300 rounded-sm px-3 py-1" value={filters.active} onChange={(e) => setFilters((prev) => ({ ...prev, active: e.target.value, page: 0 }))}>
              <option value="true">현재 차단 중</option>
              <option value="false">차단 해제됨</option>
              <option value="all">전체</option>
            </select>
          </div>
        </div>

        {/* 날짜 유효성 검증 오류 메시지 */}
        {dateValidationError && (
          <div className="mt-3 col-span-4">
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{dateValidationError}</div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-4">
          <button onClick={fetchBlockedIps} className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600">
            검색
          </button>
          <button onClick={resetFilters} className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600">
            초기화
          </button>
        </div>
      </div>

      {/* IP 목록 */}
      <div className="w-full bg-foreground border border-gray-300 rounded-sm">
        {/* 헤더 */}
        <div className="grid grid-cols-[0.5fr_1.5fr_2fr_1.5fr_1.5fr_1fr_1fr_1fr] font-bold text-gray-700 bg-gray-50">
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">ID</div>
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">IP 주소</div>
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">차단 사유</div>
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">차단일시</div>
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">해제일시</div>
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">상태</div>
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">차단자</div>
          <div className="flex items-center justify-center px-2 h-12 border-b border-gray-300">작업</div>
        </div>

        {/* 데이터 */}
        {isLoading ? (
          <div className="col-span-8 flex items-center justify-center h-20">
            <span className="text-gray-500">로딩 중...</span>
          </div>
        ) : blockedIps.length === 0 ? (
          <div className="col-span-8 flex items-center justify-center h-20">
            <span className="text-gray-500">차단된 IP가 없습니다.</span>
          </div>
        ) : (
          <div className="grid grid-cols-[0.5fr_1.5fr_2fr_1.5fr_1.5fr_1fr_1fr_1fr]">
            {blockedIps.map((ip) => (
              <React.Fragment key={ip.id}>
                {/* ID */}
                <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 text-gray-700">
                  <span className="font-mono text-sm">{ip.id}</span>
                </div>

                {/* IP 주소 */}
                <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 text-gray-700">
                  <span className="font-mono font-medium">{ip.ip}</span>
                </div>

                {/* 차단 사유 */}
                <div className="flex items-center justify-start px-2 h-16 border-b border-gray-200 text-gray-700">
                  <span className="text-sm truncate" title={ip.reason}>
                    {ip.reason}
                  </span>
                </div>

                {/* 차단일시 */}
                <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 text-gray-700">
                  <span className="text-sm">{formatDateTime(ip.blockedAt)}</span>
                </div>

                {/* 해제일시 */}
                <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 text-gray-700">
                  <span className="text-sm">{ip.unblockedAt ? formatDateTime(ip.unblockedAt) : "-"}</span>
                </div>

                {/* 상태 */}
                <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ip.isActive ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{ip.isActive ? "차단중" : "해제됨"}</span>
                </div>

                {/* 차단자 */}
                <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 text-gray-700">
                  <span className="text-sm">{ip.createdBy}</span>
                </div>

                {/* 작업 */}
                <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200">
                  {ip.isActive ? (
                    <button onClick={() => handleUnblockIp(ip.id, ip.ip)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors" title="차단 해제">
                      해제
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => handlePageChange(0)} disabled={pageInfo.currentPage === 0} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            처음
          </button>
          <button onClick={() => handlePageChange(pageInfo.currentPage - 1)} disabled={pageInfo.currentPage === 0} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            이전
          </button>

          <span className="px-3 py-1 text-sm text-gray-700">
            {pageInfo.currentPage + 1} / {pageInfo.totalPages}
            <span className="text-gray-500 ml-2">(총 {pageInfo.totalElements}개)</span>
          </span>

          <button onClick={() => handlePageChange(pageInfo.currentPage + 1)} disabled={pageInfo.currentPage >= pageInfo.totalPages - 1} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            다음
          </button>
          <button onClick={() => handlePageChange(pageInfo.totalPages - 1)} disabled={pageInfo.currentPage >= pageInfo.totalPages - 1} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            마지막
          </button>
        </div>
      )}

      {/* 하단 정보 */}
      <div className="flex justify-between items-center w-full text-gray-600 text-sm">
        <span>
          총 {pageInfo.totalElements}개의 IP
          {filters.active === "true" && " (현재 차단 중)"}
          {filters.active === "false" && " (차단 해제됨)"}
        </span>
      </div>
    </div>
  );
}

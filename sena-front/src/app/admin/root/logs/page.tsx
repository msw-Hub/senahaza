"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";

interface TrafficLog {
  id: number;
  httpMethod: string;
  uri: string;
  queryString: string;
  clientIp: string;
  httpStatus: number;
  businessErrorCode: string | null;
  responseTimeMs: number;
  isAdmin: boolean;
  userId: string;
  dbQueryCount: number;
  createdAt: string;
}

interface TrafficStatistics {
  totalRequestCount: number;
  methodCountMap: Record<string, number>;
  statusCodeGroupMap: Record<string, number>;
  businessErrorTopN: Record<string, number>;
  averageResponseTimeMs: number;
  averageDbQueryCount: number;
  successRate: number;
  failureRate: number;
  userRequestRate: number;
  adminRequestRate: number;
}

interface TopUri {
  uri: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
}

interface LogsResponse {
  content: TrafficLog[];
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
  uri: string;
  startDate: string;
  endDate: string;
  httpMethod: string;
  statusCode: string;
  isAdmin: string;
  errorStatus: string;
  searchWord: string;
  page: number;
  size: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [statistics, setStatistics] = useState<TrafficStatistics | null>(null);
  const [topUris, setTopUris] = useState<TopUri[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "statistics" | "topUris">("logs");

  // 페이지네이션 정보
  const [pageInfo, setPageInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 30,
  });

  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    uri: "",
    startDate: "",
    endDate: "",
    httpMethod: "ALL",
    statusCode: "ALL",
    isAdmin: "ALL",
    errorStatus: "ALL",
    searchWord: "",
    page: 0,
    size: 30,
  });

  // 통계 필터 (별도 관리)
  const [statsFilters, setStatsFilters] = useState({
    startDate: "",
    endDate: "",
    uri: "",
  });

  // Top URIs 필터
  const [topUrisFilters, setTopUrisFilters] = useState({
    startDate: "",
    endDate: "",
    topN: 10,
  });

  // 오늘 날짜를 yyyymmdd 형식으로 가져오기
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10).replace(/-/g, "");
  };

  // 로그 조회
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.uri) params.append("uri", filters.uri);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.httpMethod !== "ALL") params.append("httpMethod", filters.httpMethod);
      if (filters.statusCode !== "ALL") params.append("statusCode", filters.statusCode);
      if (filters.isAdmin !== "ALL") params.append("isAdmin", filters.isAdmin);
      if (filters.errorStatus !== "ALL") params.append("errorStatus", filters.errorStatus);
      if (filters.searchWord) params.append("searchWord", filters.searchWord);
      params.append("page", filters.page.toString());
      params.append("size", filters.size.toString());

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/traffic/logs?${params}`, {
        withCredentials: true,
      });

      const data: LogsResponse = response.data;
      setLogs(data.content);
      setPageInfo({
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.pageable.pageNumber,
        pageSize: data.pageable.pageSize,
      });
    } catch (error) {
      console.error("로그 조회 중 오류 발생", error);
      alert("로그 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 통계 조회
  const fetchStatistics = async () => {
    if (!statsFilters.startDate || !statsFilters.endDate) {
      alert("시작일과 종료일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("startDate", statsFilters.startDate);
      params.append("endDate", statsFilters.endDate);
      if (statsFilters.uri) params.append("uri", statsFilters.uri);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/traffic/statistics?${params}`, {
        withCredentials: true,
      });

      setStatistics(response.data);
    } catch (error) {
      console.error("통계 조회 중 오류 발생", error);
      alert("통계 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Top URIs 조회
  const fetchTopUris = async () => {
    if (!topUrisFilters.startDate || !topUrisFilters.endDate) {
      alert("시작일과 종료일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("startDate", topUrisFilters.startDate);
      params.append("endDate", topUrisFilters.endDate);
      params.append("topN", topUrisFilters.topN.toString());

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/traffic/top-uris?${params}`, {
        withCredentials: true,
      });

      setTopUris(response.data);
    } catch (error) {
      console.error("Top URIs 조회 중 오류 발생", error);
      alert("Top URIs 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    // 페이지 변경 시에만 자동으로 API 호출
    setTimeout(() => {
      fetchLogs();
    }, 0);
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      uri: "",
      startDate: "",
      endDate: "",
      httpMethod: "ALL",
      statusCode: "ALL",
      isAdmin: "ALL",
      errorStatus: "ALL",
      searchWord: "",
      page: 0,
      size: 30,
    });
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

  // HTTP 상태 코드 색상
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-yellow-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-600";
  };

  // HTTP 메서드 색상
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-blue-600 bg-blue-50";
      case "POST":
        return "text-green-600 bg-green-50";
      case "PUT":
        return "text-yellow-600 bg-yellow-50";
      case "PATCH":
        return "text-purple-600 bg-purple-50";
      case "DELETE":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  useEffect(() => {
    // 초기 날짜 설정 (오늘)
    const today = getTodayString();
    setStatsFilters((prev) => ({
      ...prev,
      startDate: today,
      endDate: today,
    }));
    setTopUrisFilters((prev) => ({
      ...prev,
      startDate: today,
      endDate: today,
    }));
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
      <h1 className="text-black font-bold text-xl">로그 관리</h1>

      {/* 탭 메뉴 */}
      <div className="flex border-b border-gray-300 w-full">
        <button className={`px-4 py-2 font-medium ${activeTab === "logs" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setActiveTab("logs")}>
          트래픽 로그
        </button>
        <button className={`px-4 py-2 font-medium ${activeTab === "statistics" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setActiveTab("statistics")}>
          통계
        </button>
        <button className={`px-4 py-2 font-medium ${activeTab === "topUris" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setActiveTab("topUris")}>
          Top URIs
        </button>
      </div>

      {/* 트래픽 로그 탭 */}
      {activeTab === "logs" && (
        <>
          {/* 필터 섹션 */}
          <div className="w-full bg-gray-50 border border-gray-300 rounded-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* URI 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URI</label>
                <input type="text" className="w-full border border-gray-300 rounded-sm px-3 py-1" placeholder="URI 포함 검색" value={filters.uri} onChange={(e) => setFilters((prev) => ({ ...prev, uri: e.target.value, page: 0 }))} />
              </div>

              {/* 시작일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input type="date" className="w-full border border-gray-300 rounded-sm px-3 py-1" value={formatDateForInput(filters.startDate)} onChange={(e) => setFilters((prev) => ({ ...prev, startDate: formatDateForAPI(e.target.value), page: 0 }))} />
              </div>

              {/* 종료일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input type="date" className="w-full border border-gray-300 rounded-sm px-3 py-1" value={formatDateForInput(filters.endDate)} onChange={(e) => setFilters((prev) => ({ ...prev, endDate: formatDateForAPI(e.target.value), page: 0 }))} />
              </div>

              {/* HTTP 메서드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTTP 메서드</label>
                <select className="w-full border border-gray-300 rounded-sm px-3 py-1" value={filters.httpMethod} onChange={(e) => setFilters((prev) => ({ ...prev, httpMethod: e.target.value, page: 0 }))}>
                  <option value="ALL">전체</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* 상태 코드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태 코드</label>
                <select className="w-full border border-gray-300 rounded-sm px-3 py-1" value={filters.statusCode} onChange={(e) => setFilters((prev) => ({ ...prev, statusCode: e.target.value, page: 0 }))}>
                  <option value="ALL">전체</option>
                  <option value="2xx">2xx (성공)</option>
                  <option value="4xx">4xx (클라이언트 오류)</option>
                  <option value="5xx">5xx (서버 오류)</option>
                </select>
              </div>

              {/* 관리자 여부 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">관리자 여부</label>
                <select className="w-full border border-gray-300 rounded-sm px-3 py-1" value={filters.isAdmin} onChange={(e) => setFilters((prev) => ({ ...prev, isAdmin: e.target.value, page: 0 }))}>
                  <option value="ALL">전체</option>
                  <option value="true">관리자</option>
                  <option value="false">일반 사용자</option>
                </select>
              </div>

              {/* 에러 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">에러 상태</label>
                <select className="w-full border border-gray-300 rounded-sm px-3 py-1" value={filters.errorStatus} onChange={(e) => setFilters((prev) => ({ ...prev, errorStatus: e.target.value, page: 0 }))}>
                  <option value="ALL">전체</option>
                  <option value="NORMAL">정상</option>
                  <option value="ERROR">에러</option>
                </select>
              </div>

              {/* 검색어 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">검색어</label>
                <input type="text" className="w-full border border-gray-300 rounded-sm px-3 py-1" placeholder="사용자 ID 또는 에러코드" value={filters.searchWord} onChange={(e) => setFilters((prev) => ({ ...prev, searchWord: e.target.value, page: 0 }))} />
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-4">
              <button onClick={fetchLogs} className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600">
                검색
              </button>
              <button onClick={resetFilters} className="px-4 py-2 bg-gray-500 text-white rounded-sm hover:bg-gray-600">
                초기화
              </button>
            </div>
          </div>

          {/* 로그 리스트 */}
          <div className="w-full bg-foreground border border-gray-300 rounded-sm">
            {/* 헤더 */}
            <div className="grid grid-cols-[0.5fr_0.5fr_2fr_1fr_0.5fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr] border-b border-gray-300 font-bold text-gray-700 h-12">
              <div className="flex items-center justify-center px-2">ID</div>
              <div className="flex items-center justify-center px-2">메서드</div>
              <div className="flex items-center justify-start px-2">URI</div>
              <div className="flex items-center justify-center px-2">IP</div>
              <div className="flex items-center justify-center px-2">상태</div>
              <div className="flex items-center justify-center px-2">응답시간</div>
              <div className="flex items-center justify-center px-2">DB쿼리</div>
              <div className="flex items-center justify-center px-2">관리자</div>
              <div className="flex items-center justify-center px-2">사용자</div>
              <div className="flex items-center justify-center px-2">생성일시</div>
            </div>

            {/* 데이터 */}
            {isLoading ? (
              <div className="col-span-10 flex items-center justify-center h-20">
                <span className="text-gray-500">로딩 중...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="col-span-10 flex items-center justify-center h-20">
                <span className="text-gray-500">조회된 로그가 없습니다.</span>
              </div>
            ) : (
              <div className="grid grid-cols-[0.5fr_0.5fr_2fr_1fr_0.5fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr]">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors">{log.id}</div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(log.httpMethod)}`}>{log.httpMethod}</span>
                    </div>
                    <div className="flex items-center justify-start px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors font-mono text-sm">
                      <span className="truncate" title={log.uri + (log.queryString ? `?${log.queryString}` : "")}>
                        {log.uri}
                        {log.queryString && `?${log.queryString}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors font-mono text-sm">{log.clientIp}</div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors">
                      <span className={`font-medium ${getStatusColor(log.httpStatus)}`}>{log.httpStatus}</span>
                    </div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors">
                      <span className={log.responseTimeMs > 1000 ? "text-red-600 font-medium" : ""}>{log.responseTimeMs}ms</span>
                    </div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors">{log.dbQueryCount}</div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors">
                      <span className={`px-2 py-1 rounded text-xs ${log.isAdmin ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>{log.isAdmin ? "관리자" : "사용자"}</span>
                    </div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors text-sm">{log.userId}</div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 hover:bg-blue-50 transition-colors text-sm">{new Date(log.createdAt).toLocaleString()}</div>
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
        </>
      )}

      {/* 통계 탭 */}
      {activeTab === "statistics" && (
        <>
          {/* 통계 필터 */}
          <div className="flex gap-4 items-center w-full">
            <div className="flex gap-2 items-center">
              <label className="text-gray-700 font-medium">기간:</label>
              <input type="date" value={formatDateForInput(statsFilters.startDate)} onChange={(e) => setStatsFilters((prev) => ({ ...prev, startDate: formatDateForAPI(e.target.value) }))} className="border border-gray-300 rounded-sm px-3 py-2" />
              <span className="text-gray-500">~</span>
              <input type="date" value={formatDateForInput(statsFilters.endDate)} onChange={(e) => setStatsFilters((prev) => ({ ...prev, endDate: formatDateForAPI(e.target.value) }))} className="border border-gray-300 rounded-sm px-3 py-2" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-gray-700 font-medium">URI:</label>
              <input type="text" placeholder="특정 URI 포함 검색" value={statsFilters.uri} onChange={(e) => setStatsFilters((prev) => ({ ...prev, uri: e.target.value }))} className="border border-gray-300 rounded-sm px-3 py-2" />
            </div>
            <button onClick={fetchStatistics} disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 disabled:opacity-50">
              {isLoading ? "조회 중..." : "조회"}
            </button>
          </div>

          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 text-lg">데이터를 불러오는 중...</span>
            </div>
          ) : statistics ? (
            <>
              {/* 주요 지표 카드 */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">총 요청 수</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.totalRequestCount.toLocaleString()}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="xi-chart text-blue-600"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">평균 응답시간</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.averageResponseTimeMs.toFixed(2)}ms</p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="xi-time text-green-600"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">성공률</p>
                      <p className="text-2xl font-bold text-green-600">{statistics.successRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="xi-check text-green-600"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">평균 DB 쿼리</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.averageDbQueryCount.toFixed(2)}</p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <i className="xi-database text-purple-600"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* 데이터 테이블 섹션 */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* HTTP 메서드별 통계 */}
                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP 메서드별 통계</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">메서드</th>
                          <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">요청 수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(statistics.methodCountMap).map(([method, count]) => (
                          <tr key={method} className="border-b border-gray-100">
                            <td className="py-2 px-2">
                              <span className={`px-2 py-1 rounded text-xs ${getMethodColor(method)}`}>{method}</span>
                            </td>
                            <td className="py-2 px-2 text-sm text-gray-600 text-right">{count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 상태 코드별 통계 */}
                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">상태 코드별 통계</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">상태 코드</th>
                          <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">요청 수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(statistics.statusCodeGroupMap).map(([status, count]) => (
                          <tr key={status} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-sm text-gray-900">{status}</td>
                            <td className="py-2 px-2 text-sm text-gray-600 text-right">{count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 사용자 비율 및 비즈니스 에러 */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 사용자 비율 */}
                <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 비율</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">관리자</span>
                      </div>
                      <span className="text-lg font-semibold text-red-600">{statistics.adminRequestRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">일반 사용자</span>
                      </div>
                      <span className="text-lg font-semibold text-blue-600">{statistics.userRequestRate.toFixed(1)}%</span>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${statistics.userRequestRate}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 비즈니스 에러 Top N */}
                {Object.keys(statistics.businessErrorTopN).length > 0 && (
                  <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 비즈니스 에러</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">에러 코드</th>
                            <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">발생 수</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(statistics.businessErrorTopN).map(([error, count]) => (
                            <tr key={error} className="border-b border-gray-100">
                              <td className="py-2 px-2 text-sm text-red-600 truncate max-w-32">{error}</td>
                              <td className="py-2 px-2 text-sm text-gray-600 text-right">{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500">통계를 조회해주세요.</span>
            </div>
          )}
        </>
      )}

      {/* Top URIs 탭 */}
      {activeTab === "topUris" && (
        <>
          {/* Top URIs 필터 */}
          <div className="flex gap-4 items-center w-full">
            <div className="flex gap-2 items-center">
              <label className="text-gray-700 font-medium">기간:</label>
              <input type="date" value={formatDateForInput(topUrisFilters.startDate)} onChange={(e) => setTopUrisFilters((prev) => ({ ...prev, startDate: formatDateForAPI(e.target.value) }))} className="border border-gray-300 rounded-sm px-3 py-2" />
              <span className="text-gray-500">~</span>
              <input type="date" value={formatDateForInput(topUrisFilters.endDate)} onChange={(e) => setTopUrisFilters((prev) => ({ ...prev, endDate: formatDateForAPI(e.target.value) }))} className="border border-gray-300 rounded-sm px-3 py-2" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-gray-700 font-medium">조회 개수:</label>
              <select value={topUrisFilters.topN} onChange={(e) => setTopUrisFilters((prev) => ({ ...prev, topN: parseInt(e.target.value) }))} className="border border-gray-300 rounded-sm px-3 py-2">
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
            </div>
            <button onClick={fetchTopUris} disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 disabled:opacity-50">
              {isLoading ? "조회 중..." : "조회"}
            </button>
          </div>

          {/* Top URIs 결과 */}
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 text-lg">데이터를 불러오는 중...</span>
            </div>
          ) : topUris.length > 0 ? (
            <div className="w-full bg-foreground border border-gray-300 rounded-sm">
              {/* 헤더 그리드 */}
              <div className="grid grid-cols-[0.5fr_3fr_1fr_1fr_1fr] border-b border-gray-300 font-bold text-gray-700 h-12 bg-gray-50">
                <div className="flex items-center justify-center px-2">순위</div>
                <div className="flex items-center justify-start px-2">URI</div>
                <div className="flex items-center justify-center px-2">요청 수</div>
                <div className="flex items-center justify-center px-2">평균 응답시간</div>
                <div className="flex items-center justify-center px-2">에러율</div>
              </div>

              {/* 데이터 그리드 */}
              <div className="grid grid-cols-[0.5fr_3fr_1fr_1fr_1fr]">
                {topUris.map((uri, index) => (
                  <React.Fragment key={uri.uri}>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 group-hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-2">
                        {index < 3 && <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-600"}`}>{index + 1}</div>}
                        {index >= 3 && <span className="text-gray-600 font-medium">{index + 1}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-start px-2 h-16 border-b border-gray-200 group-hover:bg-blue-50 transition-colors">
                      <div className="font-mono text-sm truncate" title={uri.uri}>
                        {uri.uri}
                      </div>
                    </div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 group-hover:bg-blue-50 transition-colors">
                      <span className="font-semibold text-blue-600">{uri.requestCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 group-hover:bg-blue-50 transition-colors">
                      <span className={`font-medium ${uri.averageResponseTime > 1000 ? "text-red-600" : uri.averageResponseTime > 500 ? "text-yellow-600" : "text-green-600"}`}>{uri.averageResponseTime.toFixed(2)}ms</span>
                    </div>
                    <div className="flex items-center justify-center px-2 h-16 border-b border-gray-200 group-hover:bg-blue-50 transition-colors">
                      <span className={`font-medium ${uri.errorRate > 5 ? "text-red-600" : uri.errorRate > 1 ? "text-yellow-600" : "text-green-600"}`}>{uri.errorRate.toFixed(1)}%</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500">Top URIs를 조회해주세요.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

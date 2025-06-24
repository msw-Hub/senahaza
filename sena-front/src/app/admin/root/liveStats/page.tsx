"use client";

import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface LiveStatsData {
  activeUsers: number;
  pageViews: Array<{
    pageScreen: string;
    activeUsers: number;
  }>;
  events: Array<{
    eventName: string;
    eventCount: number;
  }>;
  regions: Array<{
    city: string;
    activeUsers: number;
  }>;
  deviceCategories: Array<{
    deviceCategory: string;
    activeUsers: number;
  }>;
}

export default function LiveStatsPage() {
  const [liveData, setLiveData] = useState<LiveStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLiveStats = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/realtime/overview`, {
        withCredentials: true,
      });

      setLiveData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("실시간 통계 조회 실패:", error);
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveStats();
  }, [fetchLiveStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLiveStats();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLiveStats]);

  const handleRefresh = () => {
    setLoading(true);
    fetchLiveStats();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 이벤트 차트 데이터
  const eventChartData = {
    labels: liveData?.events?.map((event) => event.eventName) || [],
    datasets: [
      {
        label: "이벤트 수",
        data: liveData?.events?.map((event) => event.eventCount) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  // 디바이스 차트 데이터
  const deviceChartData = {
    labels: liveData?.deviceCategories?.map((item) => item.deviceCategory) || [],
    datasets: [
      {
        data: liveData?.deviceCategories?.map((item) => item.activeUsers) || [],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(16, 185, 129, 0.8)", "rgba(245, 158, 11, 0.8)", "rgba(239, 68, 68, 0.8)", "rgba(139, 92, 246, 0.8)"],
        borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(245, 158, 11)", "rgb(239, 68, 68)", "rgb(139, 92, 246)"],
        borderWidth: 1,
      },
    ],
  };

  // 지역 차트 데이터
  const locationChartData = {
    labels: liveData?.regions?.slice(0, 5).map((item) => item.city) || [],
    datasets: [
      {
        label: "활성 사용자",
        data: liveData?.regions?.slice(0, 5).map((item) => item.activeUsers) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading && !liveData) {
    return (
      <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
        <div className="animate-pulse w-full">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">실시간 통계 조회 오류</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button onClick={handleRefresh} className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded">
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
      <h1 className="text-black font-bold text-xl">실시간 통계</h1>

      {/* 헤더 컨트롤 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
        <div>
          <p className="text-sm text-gray-600">마지막 업데이트: {formatTime(lastUpdated)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">자동 새로고침</label>
            <button onClick={() => setAutoRefresh(!autoRefresh)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRefresh ? "bg-blue-600" : "bg-gray-200"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {autoRefresh && (
            <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className="text-sm border border-gray-300 rounded px-2 py-1">
              <option value={60}>1분</option>
              <option value={300}>5분</option>
              <option value={600}>10분</option>
              <option value={1800}>30분</option>
              <option value={3600}>1시간</option>
            </select>
          )}

          <button onClick={handleRefresh} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            {loading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 사용자</p>
              <p className="text-2xl font-bold text-gray-900">{liveData?.activeUsers?.toLocaleString() || 0}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="xi-user text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">페이지 수</p>
              <p className="text-2xl font-bold text-gray-900">{liveData?.pageViews?.length || 0}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <i className="xi-page text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 이벤트</p>
              <p className="text-2xl font-bold text-gray-900">{liveData?.events?.reduce((sum, event) => sum + event.eventCount, 0) || 0}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="xi-chart text-purple-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">상위 지역</p>
              <p className="text-2xl font-bold text-gray-900">{liveData?.regions?.[0]?.city || "N/A"}</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <i className="xi-map text-orange-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 실시간 이벤트 차트 */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 이벤트</h3>
          <div className="h-80">
            <Bar data={eventChartData} options={chartOptions} />
          </div>
        </div>

        {/* 디바이스 분포 차트 */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">디바이스 분포</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={deviceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom" as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* 지역별 사용자 차트 */}
      <div className="w-full bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 활성 사용자</h3>
        <div className="h-80">
          <Bar
            data={locationChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* 데이터 테이블 섹션 */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 페이지 테이블 */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 인기 페이지</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">페이지</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">활성 사용자</th>
                </tr>
              </thead>
              <tbody>
                {liveData?.pageViews?.slice(0, 10).map((page, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm text-gray-900 truncate max-w-32">{page.pageScreen}</td>
                    <td className="py-2 px-2 text-sm text-gray-600 text-right">{page.activeUsers.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 지역별 사용자 테이블 */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 활성 사용자</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">도시</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">활성 사용자</th>
                </tr>
              </thead>
              <tbody>
                {liveData?.regions?.slice(0, 15).map((region, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm text-gray-900">{region.city}</td>
                    <td className="py-2 px-2 text-sm text-gray-600 text-right">{region.activeUsers.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 이벤트 상세 테이블 */}
      <div className="w-full bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 이벤트 상세</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">이벤트명</th>
                <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">발생 수</th>
              </tr>
            </thead>
            <tbody>
              {liveData?.events?.map((event, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-sm text-gray-900">{event.eventName}</td>
                  <td className="py-2 px-2 text-sm text-gray-600 text-right">{event.eventCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 디바이스 상세 테이블 */}
      <div className="w-full bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">디바이스별 활성 사용자</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">디바이스</th>
                <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">활성 사용자</th>
              </tr>
            </thead>
            <tbody>
              {liveData?.deviceCategories?.map((device, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 px-2 text-sm text-gray-900">{device.deviceCategory}</td>
                  <td className="py-2 px-2 text-sm text-gray-600 text-right">{device.activeUsers.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

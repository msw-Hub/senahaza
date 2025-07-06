"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

interface UserMetrics {
  activeUsers: number;
  newUsers: number;
  avgEngagementTime: number;
  eventCount: number;
}

interface PopularPage {
  pageTitle: string;
  pagePath: string;
  views: number;
  activeUsers: number;
  eventCount: number;
}

interface TrafficSource {
  source: string;
  medium: string;
  count: number;
}

interface DailyStats {
  date: string;
  newUsers: number;
  returningUsers: number;
}

interface GeoStats {
  region: string;
  city: string;
  activeUsers: number;
}

interface AnalyticsData {
  userMetrics: UserMetrics;
  popularPages: PopularPage[];
  firstUserSources: TrafficSource[];
  sessionSources: TrafficSource[];
  newVsReturning: {
    dailyStats: DailyStats[];
  };
  geoStats: GeoStats[];
}

export default function StatsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: "2025-06-01",
    end: "2025-06-09",
  });
  const [dateValidationError, setDateValidationError] = useState("");

  // 날짜 유효성 검증
  const validateDates = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      setDateValidationError("");
      return true;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setDateValidationError("시작일이 종료일보다 뒤에 있습니다. 날짜를 다시 확인해주세요.");
      return false;
    }

    setDateValidationError("");
    return true;
  };

  // 날짜 변경 핸들러
  const handleDateChange = (field: "start" | "end", value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);

    // 두 날짜가 모두 있으면 유효성 검증
    if (newDateRange.start && newDateRange.end) {
      validateDates(newDateRange.start, newDateRange.end);
    }
  };

  // 애널리틱스 데이터 조회
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/reports/overview?start=${dateRange.start}&end=${dateRange.end}`, { withCredentials: true });
      setAnalyticsData(response.data);
      console.log("애널리틱스 데이터:", response.data);
    } catch (error) {
      console.error("애널리틱스 데이터 조회 중 오류 발생", error);
      alert("애널리틱스 데이터 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }; // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: (analyticsData?.newVsReturning?.dailyStats?.length || 0) > 30 ? 15 : 20,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  }; // 신규 vs 재방문 사용자 차트 데이터
  const newVsReturningChartData = analyticsData
    ? {
        labels: analyticsData.newVsReturning.dailyStats
          .sort((a, b) => a.date.localeCompare(b.date)) // 날짜순으로 정렬
          .map((stat) => {
            const date = stat.date;
            const year = date.slice(0, 4);
            const month = date.slice(4, 6);
            const day = date.slice(6, 8);

            // 기간이 3개월 이상이면 월/일만 표시, 아니면 전체 날짜 표시
            const totalDays = analyticsData.newVsReturning.dailyStats.length;
            if (totalDays > 90) {
              return `${month}/${day}`;
            } else if (totalDays > 30) {
              return `${month}-${day}`;
            } else {
              return `${year}-${month}-${day}`;
            }
          }),
        datasets: [
          {
            label: "신규 사용자",
            data: analyticsData.newVsReturning.dailyStats.sort((a, b) => a.date.localeCompare(b.date)).map((stat) => stat.newUsers),
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
          {
            label: "재방문 사용자",
            data: analyticsData.newVsReturning.dailyStats.sort((a, b) => a.date.localeCompare(b.date)).map((stat) => stat.returningUsers),
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      }
    : null;

  // 인기 페이지 차트 데이터
  const popularPagesChartData = analyticsData
    ? {
        labels: analyticsData.popularPages.slice(0, 8).map((page) => {
          const title = page.pagePath;
          return title;
        }),
        datasets: [
          {
            label: "페이지 뷰",
            data: analyticsData.popularPages.slice(0, 8).map((page) => page.views),
            backgroundColor: ["rgba(255, 99, 132, 0.6)", "rgba(54, 162, 235, 0.6)", "rgba(255, 205, 86, 0.6)", "rgba(75, 192, 192, 0.6)", "rgba(153, 102, 255, 0.6)", "rgba(255, 159, 64, 0.6)", "rgba(199, 199, 199, 0.6)", "rgba(83, 102, 255, 0.6)"],
            borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 205, 86, 1)", "rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)", "rgba(199, 199, 199, 1)", "rgba(83, 102, 255, 1)"],
            borderWidth: 1,
          },
        ],
      }
    : null;

  // 트래픽 소스 차트 데이터
  const trafficSourceChartData = analyticsData
    ? {
        labels: analyticsData.sessionSources.slice(0, 6).map((source) => {
          if (source.source === "(direct)") return "직접 접속";
          if (source.source === "google") return "구글";
          if (source.source === "naver") return "네이버";
          if (source.source === "inven.co.kr") return "인벤";
          return source.source;
        }),
        datasets: [
          {
            data: analyticsData.sessionSources.slice(0, 6).map((source) => source.count),
            backgroundColor: ["rgba(255, 99, 132, 0.8)", "rgba(54, 162, 235, 0.8)", "rgba(255, 205, 86, 0.8)", "rgba(75, 192, 192, 0.8)", "rgba(153, 102, 255, 0.8)", "rgba(255, 159, 64, 0.8)"],
            borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 205, 86, 1)", "rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)"],
            borderWidth: 2,
          },
        ],
      }
    : null;

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
      <h1 className="text-black font-bold text-xl">통계 관리</h1>

      {/* 날짜 범위 선택 */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <label className="text-gray-700 font-medium">기간:</label>
            <input type="date" value={dateRange.start} onChange={(e) => handleDateChange("start", e.target.value)} className="border border-gray-300 rounded-sm px-3 py-2" />
            <span className="text-gray-500">~</span>
            <input type="date" value={dateRange.end} onChange={(e) => handleDateChange("end", e.target.value)} className="border border-gray-300 rounded-sm px-3 py-2" />
            <button onClick={fetchAnalyticsData} disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 disabled:opacity-50">
              {isLoading ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>
        {/* 날짜 유효성 검증 오류 메시지 */}
        {dateValidationError && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-sm px-3 py-2">
            <i className="xi-error-o mr-1"></i>
            {dateValidationError}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-500 text-lg">데이터를 불러오는 중...</span>
        </div>
      ) : analyticsData ? (
        <>
          {/* 주요 지표 카드 */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.userMetrics.activeUsers.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="xi-user text-blue-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">신규 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.userMetrics.newUsers.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="xi-user-plus text-green-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 참여 시간</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(analyticsData.userMetrics.avgEngagementTime)}초</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="xi-time text-purple-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 이벤트</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.userMetrics.eventCount.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <i className="xi-chart text-orange-600"></i>
                </div>
              </div>
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {" "}
            {/* 신규 vs 재방문 사용자 차트 */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">신규 vs 재방문 사용자</h3>
              {newVsReturningChartData && (
                <div className="h-80">
                  <Line data={newVsReturningChartData} options={chartOptions} />
                </div>
              )}
            </div>
            {/* 트래픽 소스 차트 */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">트래픽 소스</h3>
              {trafficSourceChartData && (
                <div className="h-80 flex items-center justify-center">
                  <Doughnut data={trafficSourceChartData} />
                </div>
              )}
            </div>
          </div>

          {/* 인기 페이지 차트 */}
          <div className="w-full bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 페이지</h3>
            {popularPagesChartData && (
              <div className="h-80">
                <Bar data={popularPagesChartData} options={chartOptions} />
              </div>
            )}
          </div>

          {/* 데이터 테이블 섹션 */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 인기 페이지 테이블 */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 페이지</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">페이지</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">조회수</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">사용자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.popularPages.slice(0, 10).map((page, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-sm text-gray-900 truncate max-w-32">{page.pagePath}</td>
                        <td className="py-2 px-2 text-sm text-gray-600 text-right">{page.views.toLocaleString()}</td>
                        <td className="py-2 px-2 text-sm text-gray-600 text-right">{page.activeUsers.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 지역별 사용자 테이블 */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 사용자</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">지역</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">도시</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">사용자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.geoStats.slice(0, 15).map((geo, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-sm text-gray-900">{geo.region}</td>
                        <td className="py-2 px-2 text-sm text-gray-600">{geo.city}</td>
                        <td className="py-2 px-2 text-sm text-gray-600 text-right">{geo.activeUsers.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 트래픽 소스 상세 테이블 */}
          <div className="w-full bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">트래픽 소스 상세</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">신규 사용자 유입</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">소스</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">매체</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.firstUserSources.map((source, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-2 text-sm text-gray-900">{source.source}</td>
                          <td className="py-2 px-2 text-sm text-gray-600">{source.medium}</td>
                          <td className="py-2 px-2 text-sm text-gray-600 text-right">{source.count.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">세션 소스</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">소스</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-600">매체</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-gray-600">수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.sessionSources.map((source, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-2 text-sm text-gray-900">{source.source}</td>
                          <td className="py-2 px-2 text-sm text-gray-600">{source.medium}</td>
                          <td className="py-2 px-2 text-sm text-gray-600 text-right">{source.count.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-500">데이터를 조회해주세요.</span>
        </div>
      )}
    </div>
  );
}

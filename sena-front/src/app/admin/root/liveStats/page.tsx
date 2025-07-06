"use client";

import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { PageLoading } from "@/components/LoadingSpinner";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Google Maps 타입 정의
declare global {
  interface Window {
    google: typeof google;
  }
}

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
  const [selectedMarker, setSelectedMarker] = useState<{ city: string; activeUsers: number } | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  // Google Maps API 로드 확인
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== "undefined" && window.google && window.google.maps) {
        console.log("Google Maps API already loaded");
        setIsGoogleMapsLoaded(true);
      } else if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        // Google Maps API가 로드되지 않았다면 로드
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log("Google Maps API loaded successfully");
          setIsGoogleMapsLoaded(true);
        };
        script.onerror = (error) => {
          console.error("Failed to load Google Maps API:", error);
        };

        // 이미 같은 스크립트가 있는지 확인
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (!existingScript) {
          document.head.appendChild(script);
          console.log("Loading Google Maps API...");
        } else {
          console.log("Google Maps API script already exists");
          setIsGoogleMapsLoaded(true);
        }
      } else {
        console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found");
      }
    };

    checkGoogleMaps();
  }, []);
  // 한국 주요 도시 좌표 매핑
  const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
    // 영문 도시명 (기본)
    Seoul: { lat: 37.5665, lng: 126.978 },
    Busan: { lat: 35.1796, lng: 129.0756 },
    Daegu: { lat: 35.8714, lng: 128.6014 },
    Incheon: { lat: 37.4563, lng: 126.7052 },
    Gwangju: { lat: 35.1595, lng: 126.8526 },
    Daejeon: { lat: 36.3504, lng: 127.3845 },
    Ulsan: { lat: 35.5384, lng: 129.3114 },
    Sejong: { lat: 36.48, lng: 127.289 },
    Suwon: { lat: 37.2636, lng: 127.0286 },
    Yongin: { lat: 37.2411, lng: 127.1776 },
    Goyang: { lat: 37.6564, lng: 126.8349 },
    Changwon: { lat: 35.2281, lng: 128.6811 },
    Seongnam: { lat: 37.4449, lng: 127.1388 },
    Bucheon: { lat: 37.4989, lng: 126.7831 },
    Ansan: { lat: 37.3236, lng: 126.8219 },
    Hwaseong: { lat: 37.2061, lng: 126.8169 },
    Pohang: { lat: 36.019, lng: 129.3435 },
    Cheongju: { lat: 36.6424, lng: 127.489 },
    Jeonju: { lat: 35.8242, lng: 127.1479 },
    Anyang: { lat: 37.3943, lng: 126.9568 },
    Cheonan: { lat: 36.8151, lng: 127.1139 },
    Namyangju: { lat: 37.6369, lng: 127.2158 },
    Gimpo: { lat: 37.6152, lng: 126.7159 },
    Paju: { lat: 37.7598, lng: 126.7804 },
    Siheung: { lat: 37.3804, lng: 126.8029 },

    // -si 접미사가 있는 도시명
    "Seoul-si": { lat: 37.5665, lng: 126.978 },
    "Busan-si": { lat: 35.1796, lng: 129.0756 },
    "Daegu-si": { lat: 35.8714, lng: 128.6014 },
    "Incheon-si": { lat: 37.4563, lng: 126.7052 },
    "Gwangju-si": { lat: 35.1595, lng: 126.8526 },
    "Daejeon-si": { lat: 36.3504, lng: 127.3845 },
    "Ulsan-si": { lat: 35.5384, lng: 129.3114 },
    "Sejong-si": { lat: 36.48, lng: 127.289 },
    "Suwon-si": { lat: 37.2636, lng: 127.0286 },
    "Yongin-si": { lat: 37.2411, lng: 127.1776 },
    "Goyang-si": { lat: 37.6564, lng: 126.8349 },
    "Changwon-si": { lat: 35.2281, lng: 128.6811 },
    "Seongnam-si": { lat: 37.4449, lng: 127.1388 },
    "Bucheon-si": { lat: 37.4989, lng: 126.7831 },
    "Ansan-si": { lat: 37.3236, lng: 126.8219 },
    "Hwaseong-si": { lat: 37.2061, lng: 126.8169 },
    "Pohang-si": { lat: 36.019, lng: 129.3435 },
    "Cheongju-si": { lat: 36.6424, lng: 127.489 },
    "Jeonju-si": { lat: 35.8242, lng: 127.1479 },
    "Anyang-si": { lat: 37.3943, lng: 126.9568 },
    "Cheonan-si": { lat: 36.8151, lng: 127.1139 },
    "Namyangju-si": { lat: 37.6369, lng: 127.2158 },
    "Gimpo-si": { lat: 37.6152, lng: 126.7159 },
    "Paju-si": { lat: 37.7598, lng: 126.7804 },
    "Siheung-si": { lat: 37.3804, lng: 126.8029 },

    // 한글 도시명
    서울: { lat: 37.5665, lng: 126.978 },
    부산: { lat: 35.1796, lng: 129.0756 },
    대구: { lat: 35.8714, lng: 128.6014 },
    인천: { lat: 37.4563, lng: 126.7052 },
    광주: { lat: 35.1595, lng: 126.8526 },
    대전: { lat: 36.3504, lng: 127.3845 },
    울산: { lat: 35.5384, lng: 129.3114 },
    세종: { lat: 36.48, lng: 127.289 },
    수원: { lat: 37.2636, lng: 127.0286 },
    용인: { lat: 37.2411, lng: 127.1776 },
    고양: { lat: 37.6564, lng: 126.8349 },
    창원: { lat: 35.2281, lng: 128.6811 },
    성남: { lat: 37.4449, lng: 127.1388 },
    부천: { lat: 37.4989, lng: 126.7831 },
    안산: { lat: 37.3236, lng: 126.8219 },
    화성: { lat: 37.2061, lng: 126.8169 },
    포항: { lat: 36.019, lng: 129.3435 },
    청주: { lat: 36.6424, lng: 127.489 },
    전주: { lat: 35.8242, lng: 127.1479 },
    안양: { lat: 37.3943, lng: 126.9568 },
    천안: { lat: 36.8151, lng: 127.1139 },
    남양주: { lat: 37.6369, lng: 127.2158 },
    김포: { lat: 37.6152, lng: 126.7159 },
    파주: { lat: 37.7598, lng: 126.7804 },
    시흥: { lat: 37.3804, lng: 126.8029 },
  };

  // 지도 옵션
  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  const center = {
    lat: 36.5, // 한국 중심
    lng: 127.5,
  };

  const mapOptions = {
    zoom: 7,
    center: center,
    styles: [
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
      },
      {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
      },
    ],
  };
  const fetchLiveStats = useCallback(async () => {
    try {
      setError(null);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/analytics/realtime/overview`, {
        withCredentials: true,
      });
      setLiveData(response.data);
      setLastUpdated(new Date());

      // 디버깅용 로그
      console.log("Live data received:", response.data);
      console.log("Regions data:", response.data?.regions);
    } catch (error) {
      console.error("실시간 통계 조회 실패:", error);

      let errorMessage = "알 수 없는 오류가 발생했습니다.";
      let shouldStopAutoRefresh = false;

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 서버가 응답했지만 오류 상태 코드
          const status = error.response.status;
          const data = error.response.data;

          switch (status) {
            case 401:
              errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
              shouldStopAutoRefresh = true;
              break;
            case 403:
              errorMessage = "접근 권한이 없습니다.";
              shouldStopAutoRefresh = true;
              break;
            case 404:
              errorMessage = "API 엔드포인트를 찾을 수 없습니다.";
              shouldStopAutoRefresh = true;
              break;
            case 500:
              errorMessage = `서버 내부 오류가 발생했습니다. ${data?.message ? `(${data.message})` : "관리자에게 문의해주세요."}`;
              shouldStopAutoRefresh = true; // 500 에러 시 자동 새로고침 중단
              break;
            default:
              errorMessage = `서버 오류 (${status}): ${data?.message || error.message}`;
              if (status >= 500) {
                shouldStopAutoRefresh = true; // 5xx 에러 시 자동 새로고침 중단
              }
          }
        } else if (error.request) {
          // 요청이 전송되었지만 응답을 받지 못함
          errorMessage = "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.";
          shouldStopAutoRefresh = true; // 네트워크 오류 시 자동 새로고침 중단
        } else {
          // 요청 설정 중 오류 발생
          errorMessage = `요청 오류: ${error.message}`;
        }
      }

      // 심각한 오류 시 자동 새로고침 중단
      if (shouldStopAutoRefresh) {
        setAutoRefresh(false);
        errorMessage += " (자동 새로고침이 중단되었습니다)";
      }

      setError(errorMessage);
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
  // 이벤트 차트 데이터 (최소 5개 항목 보장)
  const eventChartData = (() => {
    const events = liveData?.events || [];
    const minItems = 5;

    // 현재 데이터가 최소 개수보다 적으면 빈 항목으로 채움
    const labels = [];
    const data = [];

    // 실제 데이터 추가
    events.forEach((event, index) => {
      if (index < minItems) {
        labels.push(event.eventName);
        data.push(event.eventCount);
      }
    });

    // 부족한 항목을 빈 값으로 채움
    while (labels.length < minItems) {
      labels.push(`이벤트 ${labels.length + 1}`);
      data.push(0);
    }

    return {
      labels,
      datasets: [
        {
          label: "이벤트 수",
          data,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  })();

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
  }; // 지역 차트 데이터 (최소 5개 항목 보장)
  const locationChartData = (() => {
    const regions = liveData?.regions || [];
    const minItems = 5;

    // 현재 데이터가 최소 개수보다 적으면 빈 항목으로 채움
    const labels = [];
    const data = [];

    // 실제 데이터 추가
    regions.forEach((region, index) => {
      if (index < minItems) {
        labels.push(region.city);
        data.push(region.activeUsers);
      }
    });

    // 부족한 항목을 빈 값으로 채움
    while (labels.length < minItems) {
      labels.push(`지역 ${labels.length + 1}`);
      data.push(0);
    }

    return {
      labels,
      datasets: [
        {
          label: "활성 사용자",
          data,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  })();

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
        <PageLoading message="실시간 통계 데이터를 불러오는 중..." />
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
              <div className="mt-3 flex gap-2">
                <button onClick={handleRefresh} className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded">
                  다시 시도
                </button>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
      <h1 className="text-black font-bold text-xl">실시간 통계</h1> {/* 헤더 컨트롤 */}
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
      </div>{" "}
      {/* 지역별 사용자 섹션 */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        {/* 지역별 사용자 지도 */}{" "}
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 지역별 사용자 분포</h3>
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && isGoogleMapsLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={mapOptions.zoom}
              center={mapOptions.center}
              options={{
                styles: mapOptions.styles,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true,
              }}>
              {" "}
              {liveData?.regions?.map((region, index) => {
                // 여러 방법으로 좌표 찾기 시도
                let coordinates = cityCoordinates[region.city];

                if (!coordinates) {
                  // -si 제거해서 찾기
                  const cityWithoutSi = region.city.replace(/-si$/, "");
                  coordinates = cityCoordinates[cityWithoutSi];
                }

                if (!coordinates) {
                  // 공백 제거해서 찾기
                  coordinates = cityCoordinates[region.city.replace(/\s+/g, "")];
                }

                // 디버깅용 로그
                console.log(`Region: ${region.city}, ActiveUsers: ${region.activeUsers}, Coordinates:`, coordinates);

                if (!coordinates) {
                  console.warn(`No coordinates found for city: ${region.city}`);
                  return null;
                }
                return (
                  <Marker
                    key={`marker-${index}-${region.city}`}
                    position={coordinates}
                    onClick={() => setSelectedMarker(region)}
                    title={`${region.city}: ${region.activeUsers}명`}
                    icon={
                      window.google && window.google.maps
                        ? {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: Math.max(8, Math.min(30, region.activeUsers * 2 + 8)),
                            fillColor: "#3B82F6",
                            fillOpacity: 0.7,
                            strokeColor: "#1E40AF",
                            strokeWeight: 2,
                          }
                        : undefined
                    }
                  />
                );
              })}{" "}
              {selectedMarker && (
                <InfoWindow position={cityCoordinates[selectedMarker.city] || cityCoordinates[selectedMarker.city.replace(/-si$/, "")] || cityCoordinates[selectedMarker.city.replace(/\s+/g, "")]} onCloseClick={() => setSelectedMarker(null)}>
                  <div className="p-2">
                    <h4 className="font-semibold text-gray-900">{selectedMarker.city}</h4>
                    <p className="text-sm text-gray-600">활성 사용자: {selectedMarker.activeUsers.toLocaleString()}명</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
              <div className="text-center">
                <i className="xi-map text-4xl text-gray-400 mb-2"></i>
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                  <>
                    <p className="text-gray-500">Google Maps API 키가 필요합니다</p>
                    <p className="text-sm text-gray-400 mt-1">환경 변수에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정해주세요</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500">Google Maps 로딩 중...</p>
                    <div className="mt-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {/* 지역별 사용자 차트 */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 활성 사용자</h3>
          <div className="overflow-x-auto">
            <div style={{ height: Math.max(320, (liveData?.regions?.length || 0) * 40 + 100) + "px", minWidth: Math.max(600, (liveData?.regions?.length || 0) * 80) + "px" }}>
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
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                          size: 12,
                        },
                      },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                  interaction: {
                    intersect: false,
                    mode: "index",
                  },
                }}
              />
            </div>
          </div>
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

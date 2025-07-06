"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PackageModal from "../../components/PackageModal";

interface PackageItem {
  itemId: number;
  itemName: string;
  ruby: number;
  imgUrl: string;
  quantity: number;
}

interface Item {
  itemId: number;
  itemName: string;
  ruby: number;
  img?: string;
  imgUrl?: string;
}

interface Logmessage {
  adminName: string;
  message: string;
  updatedAt: string;
}

interface PackageDetail {
  packageId: number;
  packageName: string;
  totalRuby: number;
  totalCash: number;
  packagePrice: number;
  items: PackageItem[];
  updateLogList: Logmessage[];
  status: "ACTIVE" | "INACTIVE";
}

interface PackageFormData {
  packageName: string;
  packagePrice: string;
  message: string;
  items: { itemId: number; quantity: number }[];
}

export default function PackageDetailPage() {
  const params = useParams();
  const packageId = params.id as string;

  const [packageDetail, setPackageDetail] = useState<PackageDetail | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"detail" | "logs">("detail");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState<PackageFormData>({
    packageName: "",
    packagePrice: "",
    message: "",
    items: [],
  });

  useEffect(() => {
    const fetchPackageDetail = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/packages/${packageId}`, { withCredentials: true });
        setPackageDetail(response.data);
      } catch (error) {
        console.error("패키지 상세 정보 조회 실패:", error);
        setError("패키지 상세 정보를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchItems = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/items`, { withCredentials: true });
        setItems(response.data);
      } catch (error) {
        console.error("아이템 목록 조회 중 오류 발생", error);
      }
    };

    if (packageId) {
      fetchPackageDetail();
      fetchItems();
    }
  }, [packageId]);

  // 패키지 수정
  const handleEditPackage = async () => {
    if (!packageDetail) return;

    if (!formData.packageName.trim()) {
      alert("패키지명을 입력해주세요.");
      return;
    }
    if (!formData.packagePrice || isNaN(Number(formData.packagePrice))) {
      alert("올바른 패키지 가격을 입력해주세요.");
      return;
    }
    if (formData.items.length === 0) {
      alert("최소 1개 이상의 아이템을 추가해주세요.");
      return;
    }
    if (!formData.message.trim()) {
      alert("수정 메시지를 입력해주세요.");
      return;
    }

    setIsUpdating(true);
    try {
      const requestData = {
        packageName: formData.packageName,
        packagePrice: Number(formData.packagePrice),
        message: formData.message,
        items: formData.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      };

      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/editor/packages/${packageDetail.packageId}`, requestData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        alert("패키지가 성공적으로 수정되었습니다.");
        setShowEditModal(false);
        resetForm();
        // 패키지 정보 다시 조회
        const updatedResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/packages/${packageId}`, { withCredentials: true });
        setPackageDetail(updatedResponse.data);
      } else {
        alert("패키지 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("패키지 수정 중 오류 발생", error);
      alert("패키지 수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      packageName: "",
      packagePrice: "",
      message: "",
      items: [],
    });
  };

  // 수정 모달 열기
  const openEditModal = () => {
    if (!packageDetail) return;

    setFormData({
      packageName: packageDetail.packageName,
      packagePrice: packageDetail.packagePrice.toString(),
      message: "",
      items: packageDetail.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
    });
    setShowEditModal(true);
  };

  // 아이템 추가/제거 핸들러
  const handleAddItem = (itemId: number) => {
    const existingItem = formData.items.find((item) => item.itemId === itemId);
    if (existingItem) {
      alert("이미 추가된 아이템입니다.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemId, quantity: 1 }],
    }));
  };

  const handleRemoveItem = (itemId: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.itemId !== itemId),
    }));
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (quantity < 1) return;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.itemId === itemId ? { ...item, quantity } : item)),
    }));
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">패키지 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !packageDetail) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-4">{error || "패키지를 찾을 수 없습니다."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4 overflow-y-scroll">
      {/* 헤더 */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <h1 className="text-black font-bold text-xl">패키지 상세 정보</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${packageDetail.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{packageDetail.status === "ACTIVE" ? "활성" : "비활성"}</span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-4 items-center w-full">
          <button onClick={() => setActiveTab("detail")} className={`px-4 py-2 rounded-sm font-medium text-sm ${activeTab === "detail" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
            패키지 정보
          </button>
          <button onClick={() => setActiveTab("logs")} className={`px-4 py-2 rounded-sm font-medium text-sm ${activeTab === "logs" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
            변경 이력 ({packageDetail?.updateLogList?.length || 0})
          </button>
        </div>
        <button onClick={openEditModal} className="text-nowrap px-4 py-2 rounded-sm font-medium text-sm bg-green-500 text-white hover:bg-green-600 transition-colors">
          패키지 수정
        </button>
      </div>
      {/* 컨텐츠 영역 */}
      {activeTab === "detail" ? (
        <>
          {/* 주요 지표 카드 */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">패키지 ID</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{packageDetail.packageId}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="xi-tag text-blue-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">판매 가격</p>
                  <p className="text-2xl font-bold text-blue-600">{packageDetail.packagePrice.toLocaleString()}원</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="xi-won text-green-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 루비</p>
                  <p className="text-2xl font-bold text-purple-600">{packageDetail.totalRuby.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="xi-gem text-purple-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">실제 값어치</p>
                  <p className="text-2xl font-bold text-orange-600">{packageDetail.totalCash.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <i className="xi-coin text-orange-600"></i>
                </div>
              </div>
            </div>
          </div>

          {/* 패키지 정보와 최근 수정 정보 */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 패키지 기본 정보 */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">패키지명</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{packageDetail.packageName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">아이템 개수</label>
                    <p className="mt-1 text-sm text-gray-900">{packageDetail.items.length}개</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상태</label>
                    <p className="mt-1 text-sm text-gray-900">{packageDetail.status === "ACTIVE" ? "활성" : "비활성"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 수정 정보 */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 수정 정보</h3>
              <div className="space-y-4">
                {packageDetail.updateLogList && packageDetail.updateLogList.length > 0 ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">최종 수정자</label>
                      <p className="mt-1 text-sm text-gray-900">{packageDetail.updateLogList[0].adminName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">최종 수정일</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateTime(packageDetail.updateLogList[0].updatedAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">수정 메시지</label>
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{packageDetail.updateLogList[0].message || "메시지가 없습니다."}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">수정 이력이 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 아이템 구성 */}
          <div className="w-full bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">아이템 구성</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {packageDetail.items.map((item) => (
                <div key={item.itemId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <img src={item.imgUrl} alt={item.itemName} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.itemName}</h4>
                      <p className="text-xs text-gray-500">ID: {item.itemId}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-purple-600 font-medium">{item.ruby.toLocaleString()} 루비</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* 변경 이력 탭 */
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">변경 이력</h3>
            <p className="text-sm text-gray-600 mt-1">총 {packageDetail?.updateLogList?.length || 0}개의 변경 이력</p>
          </div>

          {!packageDetail?.updateLogList || packageDetail.updateLogList.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <p className="text-gray-500">변경 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {packageDetail.updateLogList.map((log, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm text-gray-600 font-medium">{log.adminName}</span>
                        <span className="text-sm text-gray-500">{formatDateTime(log.updatedAt)}</span>
                      </div>
                      <p className="text-gray-900 text-sm">{log.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 수정 모달 */}
      <PackageModal
        showModal={showEditModal}
        editingPackage={packageDetail}
        formData={formData}
        items={items}
        isLoading={isUpdating}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditPackage}
        onFormDataChange={(data) => setFormData({ ...formData, ...data })}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onQuantityChange={handleQuantityChange}
      />
    </div>
  );
}

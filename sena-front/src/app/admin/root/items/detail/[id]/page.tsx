"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ItemModal from "../../components/ItemModal";

interface Logmessage {
  adminName: string;
  message: string;
  updatedAt: string;
}

interface ItemDetail {
  itemId: number;
  itemName: string;
  ruby: number;
  imgUrl: string;
  updateLogList: Logmessage[];
  status: "ACTIVE" | "INACTIVE";
}

interface ItemFormData {
  itemName: string;
  ruby: string;
  message: string;
  file: File | null;
}

export default function ItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;

  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"detail" | "logs">("detail");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState<ItemFormData>({
    itemName: "",
    ruby: "",
    message: "",
    file: null,
  });

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/items/${itemId}`, { withCredentials: true });
        setItemDetail(response.data);
      } catch (error) {
        console.error("아이템 상세 정보 조회 실패:", error);
        setError("아이템 상세 정보를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (itemId) {
      fetchItemDetail();
    }
  }, [itemId]);

  // 아이템 수정
  const handleEditItem = async () => {
    if (!itemDetail) return;

    if (!formData.itemName.trim()) {
      alert("아이템명을 입력해주세요.");
      return;
    }
    if (!formData.ruby || isNaN(Number(formData.ruby))) {
      alert("올바른 루비 값을 입력해주세요.");
      return;
    }
    if (!formData.message.trim()) {
      alert("수정 메시지를 입력해주세요.");
      return;
    }

    setIsUpdating(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("itemName", formData.itemName);
      formDataToSend.append("ruby", formData.ruby);
      formDataToSend.append("message", formData.message);

      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/editor/items/${itemDetail.itemId}`, formDataToSend, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        alert("아이템이 성공적으로 수정되었습니다.");
        setShowEditModal(false);
        resetForm();
        // 아이템 정보 다시 조회
        const updatedResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/items/${itemId}`, { withCredentials: true });
        setItemDetail(updatedResponse.data);
      } else {
        alert("아이템 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("아이템 수정 중 오류 발생", error);
      alert("아이템 수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      itemName: "",
      ruby: "",
      message: "",
      file: null,
    });
  };

  // 수정 모달 열기
  const openEditModal = () => {
    if (!itemDetail) return;

    setFormData({
      itemName: itemDetail.itemName,
      ruby: itemDetail.ruby.toString(),
      message: "",
      file: null,
    });
    setShowEditModal(true);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">아이템 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !itemDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-4">{error || "아이템을 찾을 수 없습니다."}</p>
            <button onClick={() => window.close()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              창 닫기
            </button>
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
          <h1 className="text-black font-bold text-xl">아이템 상세 정보</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${itemDetail.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{itemDetail.status === "ACTIVE" ? "활성" : "비활성"}</span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-4 items-center w-full">
          <button onClick={() => setActiveTab("detail")} className={`px-4 py-2 rounded-sm font-medium text-sm ${activeTab === "detail" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
            아이템 정보
          </button>
          <button onClick={() => setActiveTab("logs")} className={`px-4 py-2 rounded-sm font-medium text-sm ${activeTab === "logs" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
            변경 이력 ({itemDetail?.updateLogList?.length || 0})
          </button>
        </div>
        <button onClick={openEditModal} className="px-4 py-2 bg-green-400 text-white rounded-sm hover:bg-green-600 transition-colors text-nowrap">
          아이템 수정
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      {activeTab === "detail" ? (
        <>
          {/* 메인 아이템 카드 - 이미지 중심 */}
          <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <div className="md:flex">
              {/* 이미지 영역 */}
              <div className="md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-white rounded-xl shadow-lg p-6 inline-block">
                    <img src={itemDetail.imgUrl} alt={itemDetail.itemName} className="w-48 h-48 object-cover rounded-lg mx-auto" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mt-4">{itemDetail.itemName}</h2>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <span className="text-purple-600 font-semibold text-lg">
                      <i className="xi-gem mr-1"></i>
                      {itemDetail.ruby.toLocaleString()} 루비
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${itemDetail.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{itemDetail.status === "ACTIVE" ? "활성" : "비활성"}</span>
                  </div>
                </div>
              </div>

              {/* 정보 영역 */}
              <div className="md:w-1/2 p-8">
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <i className="xi-info-o mr-2 text-blue-600"></i>
                      기본 정보
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">아이템 ID</span>
                        <span className="font-mono font-medium text-gray-900">#{itemDetail.itemId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">루비 값어치</span>
                        <span className="font-medium text-purple-600">{itemDetail.ruby.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">상태</span>
                        <span className="font-medium">{itemDetail.status === "ACTIVE" ? "활성" : "비활성"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 최근 수정 정보 */}
                  {itemDetail.updateLogList && itemDetail.updateLogList.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <i className="xi-time mr-2 text-orange-600"></i>
                        최근 수정 정보
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">수정자</span>
                          <span className="font-medium text-gray-900">{itemDetail.updateLogList[0].adminName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">수정일</span>
                          <span className="font-medium text-gray-900">{formatDateTime(itemDetail.updateLogList[0].updatedAt)}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-600">메시지</span>
                          <span className="font-medium text-gray-900 text-right max-w-[200px] break-words">{itemDetail.updateLogList[0].message || "메시지 없음"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 요약 통계 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <i className="xi-chart-line mr-2 text-green-600"></i>
                      통계
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">총 변경 이력</span>
                        <span className="font-medium text-gray-900">{itemDetail.updateLogList?.length || 0}개</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 변경 이력 탭 */
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <i className="xi-list mr-2 text-blue-600"></i>
                  변경 이력
                </h3>
                <p className="text-sm text-gray-600 mt-1">아이템 수정 기록을 확인할 수 있습니다</p>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">총 {itemDetail?.updateLogList?.length || 0}개</div>
            </div>
          </div>

          {!itemDetail?.updateLogList || itemDetail.updateLogList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-300 text-6xl mb-4">📝</div>
              <h4 className="text-lg font-medium text-gray-500 mb-2">변경 이력이 없습니다</h4>
              <p className="text-gray-400">아직 이 아이템에 대한 수정 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {itemDetail.updateLogList.map((log, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="xi-user text-blue-600 text-sm"></i>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{log.adminName}</span>
                            <span className="text-xs text-gray-500 ml-2">{formatDateTime(log.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="ml-11">
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{log.message || "수정 메시지가 없습니다."}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-4">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 수정 모달 */}
      <ItemModal showModal={showEditModal} editingItem={itemDetail} formData={formData} isLoading={isUpdating} onClose={() => setShowEditModal(false)} onSubmit={handleEditItem} onFormDataChange={(data) => setFormData({ ...formData, ...data })} />
    </div>
  );
}

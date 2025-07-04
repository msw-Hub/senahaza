"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ItemModal from "./components/ItemModal";

interface Item {
  itemId: number;
  itemName: string;
  ruby: number;
  imgUrl: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  lastModifiedMessage: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function ItemManagePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("lastModifiedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const router = useRouter();

  // 폼 데이터
  const [formData, setFormData] = useState({
    itemName: "",
    ruby: "",
    message: "",
    file: null as File | null,
  });
  // 아이템 리스트 테이블 헤더
  const itemTableHeaders = ["ID", "이미지", "아이템명", "루비", "최종 수정자", "최종 수정일", "상태", "수정", "삭제"];

  // 아이템 목록 조회
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/items`, { withCredentials: true });
      setItems(response.data);
      console.log("아이템 목록:", response.data);
    } catch (error) {
      console.error("아이템 목록 조회 중 오류 발생", error);
      alert("아이템 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 아이템 추가
  const handleAddItem = async () => {
    if (!formData.itemName.trim()) {
      alert("아이템명을 입력해주세요.");
      return;
    }
    if (!formData.ruby || isNaN(Number(formData.ruby))) {
      alert("올바른 루비 값을 입력해주세요.");
      return;
    }
    if (!formData.file) {
      alert("이미지 파일을 선택해주세요.");
      return;
    }
    if (!formData.message.trim()) {
      alert("수정 메시지를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("itemName", formData.itemName);
      formDataToSend.append("ruby", formData.ruby);
      formDataToSend.append("message", formData.message);
      formDataToSend.append("file", formData.file);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/editor/items`, formDataToSend, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        alert("아이템이 성공적으로 추가되었습니다.");
        setShowModal(false);
        resetForm();
        fetchItems();
      } else {
        alert("아이템 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("아이템 추가 중 오류 발생", error);
      alert("아이템 추가 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 아이템 수정
  const handleEditItem = async () => {
    if (!editingItem) return;

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

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("itemName", formData.itemName);
      formDataToSend.append("ruby", formData.ruby);
      formDataToSend.append("message", formData.message);
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/editor/items/${editingItem.itemId}`, formDataToSend, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        alert("아이템이 성공적으로 수정되었습니다.");
        setShowModal(false);
        setEditingItem(null);
        resetForm();
        fetchItems();
      } else {
        alert("아이템 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("아이템 수정 중 오류 발생", error);
      alert("아이템 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 상태 토글
  const handleToggleStatus = async (itemId: number, currentStatus: string, itemName: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const actionText = newStatus === "ACTIVE" ? "활성화" : "비활성화";

    if (!confirm(`"${itemName}" 아이템을 ${actionText}하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/editor/items/${itemId}/status`, { status: newStatus }, { withCredentials: true });

      if (response.status === 200) {
        alert(`아이템이 ${actionText}되었습니다.`);
        fetchItems();
      } else {
        alert(`아이템 ${actionText}에 실패했습니다.`);
      }
    } catch (error) {
      console.error(`아이템 ${actionText} 중 오류 발생`, error);
      alert(`아이템 ${actionText} 중 오류가 발생했습니다.`);
    }
  };

  // 아이템 삭제
  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (!confirm(`정말로 "${itemName}" 아이템을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/editor/items/${itemId}`, { withCredentials: true });
      if (response.status === 200) {
        alert("아이템이 삭제되었습니다.");
        fetchItems();
      } else {
        alert("아이템 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("아이템 삭제 중 오류 발생", error);
      alert("아이템 삭제 중 오류가 발생했습니다.");
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
  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      ruby: item.ruby.toString(),
      message: "",
      file: null,
    });
    setShowModal(true);
  };

  // 추가 모달 열기
  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  // 검색 및 정렬 기능
  const filteredItems = items
    .filter((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || item.lastModifiedBy.toLowerCase().includes(searchTerm.toLowerCase()) || item.lastModifiedMessage.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aValue: string | Date | number;
      let bValue: string | Date | number;

      switch (sortBy) {
        case "lastModifiedAt":
          aValue = new Date(a.lastModifiedAt);
          bValue = new Date(b.lastModifiedAt);
          break;
        case "itemName":
          aValue = a.itemName.toLowerCase();
          bValue = b.itemName.toLowerCase();
          break;
        case "ruby":
          aValue = a.ruby;
          bValue = b.ruby;
          break;
        case "lastModifiedBy":
          aValue = a.lastModifiedBy.toLowerCase();
          bValue = b.lastModifiedBy.toLowerCase();
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
    fetchItems();
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4">
      <h1 className="text-black font-bold text-xl">아이템 관리</h1>

      {/* 검색창 */}
      <div className="relative w-full">
        <input type="text" className="bg-foreground border border-gray-300 rounded-sm pl-10 p-2 w-[400px]" placeholder="아이템명, 수정자 또는 메시지를 검색해주세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <option value="lastModifiedAt_desc">최신 수정순</option>
            <option value="lastModifiedAt_asc">오래된 수정순</option>
            <option value="itemName_asc">아이템명 오름차순</option>
            <option value="itemName_desc">아이템명 내림차순</option>
            <option value="ruby_desc">루비 높은순</option>
            <option value="ruby_asc">루비 낮은순</option>
            <option value="lastModifiedBy_asc">수정자 오름차순</option>
            <option value="lastModifiedBy_desc">수정자 내림차순</option>
          </select>
        </div>
        {/* 액션 버튼 */}
        <div className="flex gap-2 items-center">
          <span className="text-gray-600 text-sm">총 {items.length}개의 아이템</span>
          <button onClick={openAddModal} className="text-nowrap px-4 py-2 rounded-sm font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            아이템 추가
          </button>
        </div>
      </div>

      {/* 아이템 리스트 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2">
        <div className="grid grid-cols-[0.3fr_0.5fr_1fr_0.5fr_0.8fr_1fr_0.2fr_0.2fr_0.2fr] overflow-x-auto">
          {/* 테이블 헤더 */}
          {itemTableHeaders.map((title, index) => (
            <span
              key={index}
              className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 px-2 " + (index === 0 || index === 1 || index >= 6 ? "justify-center" : "justify-start") + (index > 1 && index < 6 ? " cursor-pointer hover:bg-gray-50" : "")}
              onClick={() => {
                if (index === 2) {
                  handleSortChange("itemName");
                } else if (index === 3) {
                  handleSortChange("ruby");
                } else if (index === 4) {
                  handleSortChange("lastModifiedBy");
                } else if (index === 5) {
                  handleSortChange("lastModifiedAt");
                }
              }}>
              <div className="flex justify-center items-center gap-1">
                {title}
                {index > 1 && index < 6 && <i className={`ml-1 text-xs ${sortBy === ["", "", "itemName", "ruby", "lastModifiedBy", "lastModifiedAt", ""][index] ? (sortOrder === "asc" ? "xi-angle-up" : "xi-angle-down") : "xi-angle-up opacity-30"}`}></i>}
              </div>
            </span>
          ))}

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="col-span-9 flex items-center justify-center h-20">
              <span className="text-gray-500">로딩 중...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-9 flex items-center justify-center h-20">
              <span className="text-gray-500">{searchTerm ? "검색 결과가 없습니다." : "등록된 아이템이 없습니다."}</span>
            </div>
          ) : (
            /* 테이블 데이터 */
            filteredItems.map((item) => (
              <div key={item.itemId} className="contents group">
                {/* ID */}
                <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-16 px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/items/detail/${item.itemId}`)} title="아이템 상세 정보 보기">
                  <span className="font-medium">{item.itemId}</span>
                </div>
                {/* 이미지 */}
                <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-16 px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/items/detail/${item.itemId}`)} title="아이템 상세 정보 보기">
                  <img src={item.imgUrl} alt={item.itemName} className="w-8 h-8 object-cover rounded" />
                </div>
                {/* 아이템명 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center font-medium px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/items/detail/${item.itemId}`)} title="아이템 상세 정보 보기">
                  {item.itemName}
                </span>
                {/* 루비 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/items/detail/${item.itemId}`)} title="아이템 상세 정보 보기">
                  {item.ruby.toLocaleString()}
                </span>
                {/* 최종 수정자 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/items/detail/${item.itemId}`)} title="아이템 상세 정보 보기">
                  {item.lastModifiedBy}
                </span>
                {/* 최종 수정일 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center text-sm px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/items/detail/${item.itemId}`)} title="아이템 상세 정보 보기">
                  {new Date(item.lastModifiedAt).toLocaleString()}
                </span>
                {/* 상태변경 버튼 */}
                <div
                  onClick={() => handleToggleStatus(item.itemId, item.status, item.itemName)}
                  className={`relative z-10 flex items-center justify-center border-b border-gray-200 h-16 cursor-pointer px-2 transition-colors ${item.status === "ACTIVE" ? "text-green-600 hover:bg-red-50" : "text-red-600 hover:bg-green-50"}`}
                  title={item.status === "ACTIVE" ? "비활성화" : "활성화"}>
                  <i className={item.status === "ACTIVE" ? "xi-toggle-on xi-2x" : "xi-toggle-off xi-2x"}></i>
                </div>
                {/* 수정 버튼 */}
                <div onClick={() => openEditModal(item)} className="relative z-10 flex items-center justify-center text-blue-600 border-b border-gray-200 h-16 cursor-pointer hover:bg-blue-50 px-2 transition-colors" title="수정">
                  <i className="xi-pen text-lg"></i>
                </div>
                {/* 삭제 버튼 */}
                <div onClick={() => handleDeleteItem(item.itemId, item.itemName)} className="relative z-10 flex items-center justify-center text-red-600 border-b border-gray-200 h-16 cursor-pointer hover:bg-red-50 px-2 transition-colors" title="삭제">
                  <i className="xi-trash text-lg"></i>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="flex justify-between items-center w-full text-gray-600 text-sm">
        <span>
          총 {items.length}개의 아이템
          {searchTerm && ` (검색 결과: ${filteredItems.length}개)`}
        </span>
      </div>

      {/* 모달 */}
      <ItemModal showModal={showModal} editingItem={editingItem} formData={formData} isLoading={isLoading} onClose={() => setShowModal(false)} onSubmit={editingItem ? handleEditItem : handleAddItem} onFormDataChange={(data) => setFormData({ ...formData, ...data })} />
    </div>
  );
}

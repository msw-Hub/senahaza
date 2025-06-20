"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";

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
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    itemName: "",
    ruby: "",
    message: "",
    file: null as File | null,
  });

  // 아이템 리스트 테이블 헤더
  const itemTableHeaders = ["선택", "이미지", "아이템명", "루비", "최종 수정자", "최종 수정일", "수정 메시지", "수정", "상태", "삭제"];

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

  // 아이템 상태 변경
  const handleToggleStatus = async (itemId: number, currentStatus: string, itemName: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const statusText = newStatus === "ACTIVE" ? "활성화" : "비활성화";

    if (!confirm(`"${itemName}" 아이템을 ${statusText}하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/editor/items/${itemId}/status`,
        { status: newStatus },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        alert(`"${itemName}" 아이템이 ${statusText}되었습니다.`);
        fetchItems();
      } else {
        alert("아이템 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("아이템 상태 변경 중 오류 발생", error);
      alert("아이템 상태 변경 중 오류가 발생했습니다.");
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
        alert(`"${itemName}" 아이템이 삭제되었습니다.`);
        fetchItems();
        setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      } else {
        alert("아이템 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("아이템 삭제 중 오류 발생", error);
      alert("아이템 삭제 중 오류가 발생했습니다.");
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert("삭제할 아이템을 선택해주세요.");
      return;
    }

    if (!confirm(`선택된 ${selectedItems.length}개의 아이템을 삭제하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    const failedItems: string[] = [];

    try {
      for (const itemId of selectedItems) {
        try {
          const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/editor/items/${itemId}`, { withCredentials: true });

          if (response.status === 200) {
            successCount++;
          } else {
            failCount++;
            const itemName = items.find((item) => item.itemId === itemId)?.itemName || `ID: ${itemId}`;
            failedItems.push(itemName);
          }
        } catch (error) {
          failCount++;
          const itemName = items.find((item) => item.itemId === itemId)?.itemName || `ID: ${itemId}`;
          failedItems.push(itemName);
          console.error(`아이템 ${itemName} 삭제 중 오류:`, error);
        }
      }

      // 결과 메시지 표시
      if (successCount > 0 && failCount === 0) {
        alert(`${successCount}개의 아이템이 삭제되었습니다.`);
      } else if (successCount > 0 && failCount > 0) {
        alert(`${successCount}개 삭제 완료, ${failCount}개 실패\n실패한 아이템: ${failedItems.join(", ")}`);
      } else {
        alert(`모든 삭제 요청이 실패했습니다.\n실패한 아이템: ${failedItems.join(", ")}`);
      }

      fetchItems();
      setSelectedItems([]);
    } catch (error) {
      console.error("일괄 삭제 중 오류 발생", error);
      alert("일괄 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
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

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.itemId));
    }
  };

  // 개별 선택/해제
  const handleSelectItem = (itemId: number) => {
    setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
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
          <span className="text-gray-600 text-sm">{selectedItems.length > 0 && `${selectedItems.length}개 선택됨`}</span>
          <button onClick={openAddModal} className="px-3 py-1 bg-blue-500 text-white rounded-sm hover:bg-blue-600">
            아이템 추가
          </button>
          <button onClick={handleBulkDelete} disabled={selectedItems.length === 0 || isLoading} className="px-3 py-1 bg-red-500 text-white rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600">
            {isLoading ? "처리 중..." : "일괄 삭제"}
          </button>
        </div>
      </div>

      {/* 아이템 리스트 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2 overflow-y-auto grid grid-cols-[0.3fr_0.5fr_1fr_0.5fr_0.8fr_1fr_1.2fr_0.3fr_0.3fr_0.3fr] grid-rows-12">
        {/* 테이블 헤더 */}
        {itemTableHeaders.map((title, index) => (
          <span
            key={index}
            className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 " + (index <= 1 || index >= 7 ? "justify-center" : "justify-start") + (index > 0 && index < 7 ? " cursor-pointer hover:bg-gray-50" : "")}
            onClick={() => {
              if (index === 0) {
                handleSelectAll();
              } else if (index === 2) {
                handleSortChange("itemName");
              } else if (index === 3) {
                handleSortChange("ruby");
              } else if (index === 4) {
                handleSortChange("lastModifiedBy");
              } else if (index === 5) {
                handleSortChange("lastModifiedAt");
              }
            }}>
            {index === 0 && <input type="checkbox" checked={selectedItems.length === filteredItems.length && filteredItems.length > 0} onChange={handleSelectAll} className="w-4 h-4" />}
            {index !== 0 && title}
            {index > 0 && index < 7 && index !== 1 && index !== 6 && <i className={`ml-1 text-xs ${sortBy === ["", "", "itemName", "ruby", "lastModifiedBy", "lastModifiedAt", ""][index] ? (sortOrder === "asc" ? "xi-angle-up" : "xi-angle-down") : "xi-angle-up opacity-30"}`}></i>}
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
            <React.Fragment key={item.itemId}>
              {/* 체크박스 */}
              <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-12">
                <input type="checkbox" checked={selectedItems.includes(item.itemId)} onChange={() => handleSelectItem(item.itemId)} className="w-4 h-4" />
              </div>

              {/* 이미지 */}
              <div className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-12">
                <img src={item.imgUrl} alt={item.itemName} className="w-8 h-8 object-cover rounded" />
              </div>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center font-medium">{item.itemName}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{item.ruby.toLocaleString()}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{item.lastModifiedBy}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center text-sm">{new Date(item.lastModifiedAt).toLocaleString()}</span>

              <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center text-sm truncate" title={item.lastModifiedMessage}>
                {item.lastModifiedMessage}
              </span>

              {/* 수정 버튼 */}
              <div onClick={() => openEditModal(item)} className="flex items-center justify-center text-blue-600 border-b border-gray-200 h-12 cursor-pointer hover:bg-blue-50" title="수정">
                <i className="xi-pen text-lg"></i>
              </div>
              {/* 상태변경 버튼 */}
              <div
                onClick={() => handleToggleStatus(item.itemId, item.status, item.itemName)}
                className={`flex items-center justify-center border-b border-gray-200 h-12 cursor-pointer px-2 ${item.status === "ACTIVE" ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                title={item.status === "ACTIVE" ? "비활성화" : "활성화"}>
                <i className={item.status === "ACTIVE" ? "xi-pause text-lg" : "xi-play text-lg"}></i>
              </div>
              {/* 삭제 버튼 */}
              <div onClick={() => handleDeleteItem(item.itemId, item.itemName)} className="flex items-center justify-center text-red-600 border-b border-gray-200 h-12 cursor-pointer hover:bg-red-50" title="삭제">
                <i className="xi-trash text-lg"></i>
              </div>
            </React.Fragment>
          ))
        )}
      </div>

      {/* 하단 정보 */}
      <div className="flex justify-between items-center w-full text-gray-600 text-sm">
        <span>
          총 {items.length}개의 아이템
          {searchTerm && ` (검색 결과: ${filteredItems.length}개)`}
        </span>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h2 className="text-xl font-bold mb-4">{editingItem ? "아이템 수정" : "아이템 추가"}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이템명</label>
                <input type="text" value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} className="w-full border border-gray-300 rounded-sm px-3 py-2" placeholder="아이템명을 입력하세요" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">루비</label>
                <input type="number" value={formData.ruby} onChange={(e) => setFormData({ ...formData, ruby: e.target.value })} className="w-full border border-gray-300 rounded-sm px-3 py-2" placeholder="루비 값을 입력하세요" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 파일 {editingItem && "(수정 시 선택사항)"}</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} className="w-full border border-gray-300 rounded-sm px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수정 메시지</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full border border-gray-300 rounded-sm px-3 py-2 h-20 resize-none" placeholder="수정 메시지를 입력하세요" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50">
                취소
              </button>
              <button onClick={editingItem ? handleEditItem : handleAddItem} disabled={isLoading} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 disabled:opacity-50">
                {isLoading ? "처리 중..." : editingItem ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

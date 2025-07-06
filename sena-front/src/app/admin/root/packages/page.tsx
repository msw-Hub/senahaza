"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import PackageModal from "./components/PackageModal";
import { TableLoading } from "@/components/LoadingSpinner";

interface Item {
  itemId: number;
  itemName: string;
  ruby: number;
  img?: string;
  imgUrl?: string;
}

interface PackageItem {
  itemId: number;
  itemName: string;
  ruby: number;
  imgUrl: string;
  quantity: number;
}

interface Package {
  packageId: number;
  packageName: string;
  totalRuby: number;
  totalCash: number;
  packagePrice: number;
  items: PackageItem[];
  lastModifiedBy: string;
  lastModifiedAt: string;
  lastModifiedMessage: string;
  status: "ACTIVE" | "INACTIVE";
}

interface PackageFormData {
  packageName: string;
  packagePrice: string;
  message: string;
  items: { itemId: number; quantity: number }[];
}

export default function PackageManagePage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("lastModifiedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const router = useRouter();

  // 폼 데이터
  const [formData, setFormData] = useState<PackageFormData>({
    packageName: "",
    packagePrice: "",
    message: "",
    items: [],
  });

  // 패키지 리스트 테이블 헤더
  const packageTableHeaders = ["ID", "패키지명", "패키지 가격", "총 루비", "최종 수정자", "최종 수정일", "수정 메시지", "상태", "수정", "삭제"];

  // 패키지 목록 조회
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/packages`, { withCredentials: true });
      setPackages(response.data.packages);
      console.log("패키지 목록:", response.data.packages);
    } catch (error) {
      console.error("패키지 목록 조회 중 오류 발생", error);
      alert("패키지 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 아이템 목록 조회
  const fetchItems = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/viewer/items`, { withCredentials: true });
      setItems(response.data);
      console.log("아이템 목록:", response.data);
    } catch (error) {
      console.error("아이템 목록 조회 중 오류 발생", error);
      alert("아이템 목록 조회 중 오류가 발생했습니다.");
    }
  };

  // 패키지 추가
  const handleAddPackage = async () => {
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

    setIsLoading(true);
    try {
      const requestData = {
        packageName: formData.packageName,
        packagePrice: Number(formData.packagePrice),
        message: formData.message,
        items: formData.items,
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/editor/packages`, requestData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 || response.status === 201) {
        alert("패키지가 성공적으로 추가되었습니다.");
        setShowModal(false);
        resetForm();
        fetchPackages();
      } else {
        alert("패키지 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("패키지 추가 중 오류 발생", error);
      alert("패키지 추가 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 패키지 수정
  const handleEditPackage = async () => {
    if (!editingPackage) return;

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

    setIsLoading(true);
    try {
      const requestData = {
        packageName: formData.packageName,
        packagePrice: Number(formData.packagePrice),
        message: formData.message,
        items: [
          ...formData.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
        ],
      };

      const response = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/editor/packages/${editingPackage.packageId}`, requestData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        alert("패키지가 성공적으로 수정되었습니다.");
        setShowModal(false);
        setEditingPackage(null);
        resetForm();
        fetchPackages();
      } else {
        alert("패키지 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("패키지 수정 중 오류 발생", error);
      alert("패키지 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 패키지 상태 변경
  const handleToggleStatus = async (packageId: number, currentStatus: string, packageName: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const statusText = newStatus === "ACTIVE" ? "활성화" : "비활성화";

    if (!confirm(`"${packageName}" 패키지를 ${statusText}하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/editor/packages/${packageId}/status`,
        { status: newStatus },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        alert(`"${packageName}" 패키지가 ${statusText}되었습니다.`);
        fetchPackages();
      } else {
        alert("패키지 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("패키지 상태 변경 중 오류 발생", error);
      alert("패키지 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 패키지 삭제
  const handleDeletePackage = async (packageId: number, packageName: string) => {
    if (!confirm(`정말로 "${packageName}" 패키지를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/editor/packages/${packageId}`, { withCredentials: true });
      if (response.status === 200) {
        alert(`"${packageName}" 패키지가 삭제되었습니다.`);
        fetchPackages();
      } else {
        alert("패키지 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("패키지 삭제 중 오류 발생", error);
      alert("패키지 삭제 중 오류가 발생했습니다.");
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
  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      packageName: pkg.packageName,
      packagePrice: pkg.packagePrice.toString(),
      message: "",
      items: pkg.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
    });
    setShowModal(true);
  };

  // 추가 모달 열기
  const openAddModal = () => {
    setEditingPackage(null);
    resetForm();
    setShowModal(true);
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

  // 검색 및 정렬 기능
  const filteredPackages = packages
    .filter((pkg) => pkg.packageName.toLowerCase().includes(searchTerm.toLowerCase()) || pkg.lastModifiedBy.toLowerCase().includes(searchTerm.toLowerCase()) || pkg.lastModifiedMessage.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aValue: string | Date | number;
      let bValue: string | Date | number;

      switch (sortBy) {
        case "lastModifiedAt":
          aValue = new Date(a.lastModifiedAt);
          bValue = new Date(b.lastModifiedAt);
          break;
        case "packageName":
          aValue = a.packageName.toLowerCase();
          bValue = b.packageName.toLowerCase();
          break;
        case "packagePrice":
          aValue = a.packagePrice;
          bValue = b.packagePrice;
          break;
        case "totalRuby":
          aValue = a.totalRuby;
          bValue = b.totalRuby;
          break;
        case "lastModifiedBy":
          aValue = a.lastModifiedBy.toLowerCase();
          bValue = b.lastModifiedBy.toLowerCase();
          break;
        case "lastModifiedAt":
          aValue = new Date(a.lastModifiedAt);
          bValue = new Date(b.lastModifiedAt);
          break;
        case "lastModifiedMessage":
          aValue = a.lastModifiedMessage.toLowerCase();
          bValue = b.lastModifiedMessage.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
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
    fetchPackages();
    fetchItems();
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4">
      <h1 className="text-black font-bold text-xl">패키지 관리</h1>

      {/* 검색창 */}
      <div className="relative w-full">
        <input type="text" className="bg-foreground border border-gray-300 rounded-sm pl-10 p-2 w-[400px]" placeholder="패키지명, 수정자 또는 메시지를 검색해주세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <option value="packageName_asc">패키지명 오름차순</option>
            <option value="packageName_desc">패키지명 내림차순</option>
            <option value="packagePrice_desc">가격 높은순</option>
            <option value="packagePrice_asc">가격 낮은순</option>
            <option value="totalRuby_desc">총 루비 높은순</option>
            <option value="totalRuby_asc">총 루비 낮은순</option>
            <option value="status_asc">상태별</option>
            <option value="lastModifiedBy_asc">수정자 오름차순</option>
            <option value="lastModifiedBy_desc">수정자 내림차순</option>
          </select>
        </div>
        {/* 액션 버튼 */}
        <div className="flex gap-2 items-center">
          <span className="text-gray-600 text-sm">총 {packages.length}개의 패키지</span>
          <button onClick={openAddModal} className="text-nowrap px-4 py-2 rounded-sm font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            패키지 추가
          </button>
        </div>
      </div>

      {/* 패키지 리스트 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2 ">
        <div className="grid grid-cols-[0.3fr_1.3fr_0.6fr_0.4fr_1fr_0.6fr_1fr_0.2fr_0.2fr_0.2fr] overflow-x-auto">
          {/* 테이블 헤더 */}
          {packageTableHeaders.map((title, index) => (
            <span
              key={index}
              className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 px-2 " + (index === 0 || index >= 7 ? "justify-center" : "justify-start") + (index > 0 && index < 7 ? " cursor-pointer hover:bg-gray-50" : "")}
              onClick={() => {
                if (index === 1) {
                  handleSortChange("packageName");
                } else if (index === 2) {
                  handleSortChange("packagePrice");
                } else if (index === 3) {
                  handleSortChange("totalRuby");
                } else if (index === 4) {
                  handleSortChange("lastModifiedBy");
                } else if (index === 5) {
                  handleSortChange("lastModifiedAt");
                } else if (index === 6) {
                  handleSortChange("lastModifiedMessage");
                }
              }}>
              {" "}
              <div className="flex justify-center items-center gap-1">
                {index !== 0 && title}
                {index > 0 && index < 7 && <i className={`ml-1 text-xs ${sortBy === ["", "packageName", "packagePrice", "totalRuby", "lastModifiedBy", "lastModifiedAt", "lastModifiedMessage", ""][index] ? (sortOrder === "asc" ? "xi-angle-up" : "xi-angle-down") : "xi-angle-up opacity-30"}`}></i>}
                {index === 0 && title}
              </div>
            </span>
          ))}

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="col-span-12">
              <TableLoading rows={5} />
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="col-span-12 flex items-center justify-center h-20">
              <span className="text-gray-500">{searchTerm ? "검색 결과가 없습니다." : "등록된 패키지가 없습니다."}</span>
            </div>
          ) : (
            /* 테이블 데이터 */
            filteredPackages.map((pkg) => (
              <div key={pkg.packageId} className="contents group">
                {/* ID */}
                <div
                  className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-16 px-2 font-mono text-sm cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors"
                  onClick={() => router.push(`/admin/root/packages/detail/${pkg.packageId}`)}
                  title="패키지 상세 보기">
                  {pkg.packageId}
                </div>
                {/* 패키지명 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center font-medium px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/packages/detail/${pkg.packageId}`)} title="패키지 상세 보기">
                  {pkg.packageName}
                </span>
                {/* 패키지 가격 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/packages/detail/${pkg.packageId}`)} title="패키지 상세 보기">
                  {pkg.packagePrice.toLocaleString()}원
                </span>
                {/* 총 루비 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/packages/detail/${pkg.packageId}`)} title="패키지 상세 보기">
                  {pkg.totalRuby.toLocaleString()}
                </span>
                {/* 최종 수정자 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/packages/detail/${pkg.packageId}`)} title="패키지 상세 보기">
                  {pkg.lastModifiedBy}
                </span>
                {/* 최종 수정일 */}
                <span className="text-gray-700 border-b border-gray-200 h-16 flex items-center text-sm px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors" onClick={() => router.push(`/admin/root/packages/detail/${pkg.packageId}`)} title="패키지 상세 보기">
                  {new Date(pkg.lastModifiedAt).toLocaleString()}
                </span>
                {/* 수정 메시지 */}
                <span
                  className="text-gray-700 border-b border-gray-200 h-16 flex items-center text-sm px-2 cursor-pointer group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors truncate"
                  onClick={() => router.push(`/admin/root/packages/detail/${pkg.packageId}`)}
                  title={pkg.lastModifiedMessage || "메시지 없음"}>
                  {pkg.lastModifiedMessage || "메시지 없음"}
                </span>
                {/* 상태변경 버튼 */}
                <div
                  onClick={() => handleToggleStatus(pkg.packageId, pkg.status, pkg.packageName)}
                  className={`relative z-10 flex items-center justify-center border-b border-gray-200 h-16 cursor-pointer px-2 transition-colors ${pkg.status === "ACTIVE" ? "text-green-600 hover:bg-red-50" : "text-red-600 hover:bg-green-50"}`}
                  title={pkg.status === "ACTIVE" ? "비활성화" : "활성화"}>
                  <i className={pkg.status === "ACTIVE" ? "xi-toggle-on xi-2x" : "xi-toggle-off xi-2x"}></i>
                </div>
                {/* 수정 버튼 */}
                <div onClick={() => openEditModal(pkg)} className="relative z-10 flex items-center justify-center text-blue-600 border-b border-gray-200 h-16 cursor-pointer hover:bg-blue-50 px-2 transition-colors" title="수정">
                  <i className="xi-pen text-lg"></i>
                </div>
                {/* 삭제 버튼 */}
                <div onClick={() => handleDeletePackage(pkg.packageId, pkg.packageName)} className="relative z-10 flex items-center justify-center text-red-600 border-b border-gray-200 h-16 cursor-pointer hover:bg-red-50 px-2 transition-colors" title="삭제">
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
          총 {packages.length}개의 패키지
          {searchTerm && ` (검색 결과: ${filteredPackages.length}개)`}
        </span>
      </div>

      {/* 모달 */}
      <PackageModal
        showModal={showModal}
        editingPackage={editingPackage}
        formData={formData}
        items={items}
        isLoading={isLoading}
        onClose={() => setShowModal(false)}
        onSubmit={editingPackage ? handleEditPackage : handleAddPackage}
        onFormDataChange={(data) => setFormData({ ...formData, ...data })}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onQuantityChange={handleQuantityChange}
      />
    </div>
  );
}

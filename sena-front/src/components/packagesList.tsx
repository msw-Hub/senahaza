"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useItemCheckStore } from "@/store/itemCheckList";
import ItemCheckList from "./itemCheckList";

interface Item {
  imgUrl: string; // 아이템 이미지 URL
  itemId: number; // 아이템 ID
  itemName: string; // 아이템 이름
  quantity: number; // 아이템 수량
  ruby: number; // 아이템의 루비 가치
}

interface Package {
  items: Item[]; // 패키지에 포함된 아이템 목록
  packageId: number; // 패키지 ID
  packageName: string; // 패키지 이름
  packagePrice: number; // 패키지 가격
  totalCash: number; // 패키지의 실제 가격(totalRuby*7.5)
  totalRuby: number; // 패키지의 총 루비 가치
  isCustom?: boolean; // 유저 커스텀 패키지 여부
}

interface CustomPackage {
  packageId: number;
  packageName: string;
  packagePrice: number;
  items: { itemId: number; quantity: number }[];
  createdAt: string;
}

interface Packages {
  lastUpdatedAt: string; // 마지막 업데이트 시간
  packages: Package[]; // 패키지 목록
}

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [customPackages, setCustomPackages] = useState<CustomPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);

  // 커스텀 패키지 폼 데이터
  const [customPackageForm, setCustomPackageForm] = useState({
    packageName: "",
    packagePrice: "",
    selectedItems: [] as { itemId: number; quantity: number }[],
  });

  // Zustand store 사용
  const { isItemChecked, getItemRuby } = useItemCheckStore();

  // 패키지 상세 모달 열기
  const openPackageModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  // 패키지 상세 모달 닫기
  const closePackageModal = () => {
    setSelectedPackage(null);
    setIsModalOpen(false);
  };
  // 패키지의 체크된 아이템만 계산하는 함수
  const calculatePackageValue = (pkg: Package) => {
    const checkedItems = pkg.items.filter((item) => isItemChecked(item.itemId));
    const totalRuby = checkedItems.reduce((sum, item) => sum + getItemRuby(item.itemId) * item.quantity, 0);
    const totalCash = totalRuby * 7.5;

    return {
      checkedItems,
      totalRuby,
      totalCash,
      hasCheckedItems: checkedItems.length > 0,
    };
  };

  // 로컬스토리지에서 커스텀 패키지 불러오기
  const loadCustomPackages = () => {
    try {
      const stored = localStorage.getItem("customPackages");
      if (stored) {
        const customPkgs = JSON.parse(stored) as CustomPackage[];
        setCustomPackages(customPkgs);
        return customPkgs;
      }
    } catch (error) {
      console.error("커스텀 패키지 로드 실패:", error);
    }
    return [];
  };

  // 로컬스토리지에 커스텀 패키지 저장
  const saveCustomPackages = (customPkgs: CustomPackage[]) => {
    try {
      localStorage.setItem("customPackages", JSON.stringify(customPkgs));
      setCustomPackages(customPkgs);
    } catch (error) {
      console.error("커스텀 패키지 저장 실패:", error);
    }
  };

  // 커스텀 패키지를 Package 형태로 변환
  const convertCustomPackageToPackage = (customPkg: CustomPackage): Package => {
    const items = customPkg.items.map((item) => {
      const itemInfo = allItems.find((i) => i.itemId === item.itemId);
      return {
        itemId: item.itemId,
        itemName: itemInfo?.itemName || "알 수 없는 아이템",
        quantity: item.quantity,
        ruby: itemInfo?.ruby || 0,
        imgUrl: itemInfo?.imgUrl || "",
      };
    });

    const totalRuby = items.reduce((sum, item) => sum + item.ruby * item.quantity, 0);

    return {
      packageId: customPkg.packageId,
      packageName: customPkg.packageName,
      packagePrice: customPkg.packagePrice,
      items,
      totalRuby,
      totalCash: totalRuby * 7.5,
      isCustom: true,
    };
  };

  // 전체 패키지 목록 (서버 + 커스텀)
  const getAllPackages = (): Package[] => {
    const customAsPackages = customPackages.map(convertCustomPackageToPackage);
    return [...packages, ...customAsPackages];
  };

  // 커스텀 패키지 추가
  const addCustomPackage = () => {
    if (!customPackageForm.packageName.trim()) {
      alert("패키지명을 입력해주세요.");
      return;
    }
    if (!customPackageForm.packagePrice || isNaN(Number(customPackageForm.packagePrice))) {
      alert("올바른 패키지 가격을 입력해주세요.");
      return;
    }
    if (customPackageForm.selectedItems.length === 0) {
      alert("최소 1개 이상의 아이템을 추가해주세요.");
      return;
    }

    const newCustomPackage: CustomPackage = {
      packageId: Date.now(), // 임시 ID (타임스탬프 사용)
      packageName: customPackageForm.packageName,
      packagePrice: Number(customPackageForm.packagePrice),
      items: customPackageForm.selectedItems,
      createdAt: new Date().toISOString(),
    };

    const updatedCustomPackages = [...customPackages, newCustomPackage];
    saveCustomPackages(updatedCustomPackages);

    // 폼 초기화
    setCustomPackageForm({
      packageName: "",
      packagePrice: "",
      selectedItems: [],
    });
    setIsAddModalOpen(false);

    alert("커스텀 패키지가 추가되었습니다!");
  };

  // 커스텀 패키지 삭제
  const deleteCustomPackage = (packageId: number) => {
    if (!confirm("정말로 이 커스텀 패키지를 삭제하시겠습니까?")) {
      return;
    }

    const updatedCustomPackages = customPackages.filter((pkg) => pkg.packageId !== packageId);
    saveCustomPackages(updatedCustomPackages);
    alert("커스텀 패키지가 삭제되었습니다.");
  };

  // 아이템 목록 가져오기
  const getAllItems = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/main/items`);
      setAllItems(response.data);
    } catch (error) {
      console.error("아이템 목록 조회 실패:", error);
    }
  }; // 컴포넌트가 마운트될 때 패키지 목록을 가져옵니다.
  useEffect(() => {
    const initializeData = async () => {
      await getAllItems();
      await getPackagesList();
      loadCustomPackages();
    };
    initializeData();
  }, []);

  // 모달이 열릴 때 ESC 키로 닫기 처리
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        closePackageModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscKey);
      // 모달이 열릴 때 배경 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      // 모달이 닫힐 때 배경 스크롤 복원
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // 배경 클릭으로 모달 닫기
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closePackageModal();
    }
  };

  const getPackagesList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/main/packages`);
      const packagesData: Packages = response.data;
      console.log("패키지 데이터:", packagesData);
      setPackages(packagesData.packages);
    } catch (error) {
      console.error("패키지 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              <div className="mt-4 text-center text-gray-600 font-medium">패키지 목록을 불러오는 중...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full shadow-lg rounded-lg">
      {/* 헤더 섹션 */}
      <div className="flex flex-col h-full items-start justify-center gap-4 p-4 bg-white shadow-lg rounded-lg">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-bold text-gray-800">패키지 목록</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <i className="xi-plus"></i>
            커스텀 패키지 추가
          </button>
        </div>
        {/* 패키지 카드 그리드 - 남은 공간을 모두 사용 */}
        <div className="h-full">
          {getAllPackages().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="xi-package text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">패키지가 없습니다</h3>
              <p className="text-gray-500 text-sm">아직 등록된 패키지가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {getAllPackages().map((pkg, index) => {
                // 체크된 아이템만 계산
                const packageValue = calculatePackageValue(pkg);
                const { checkedItems, totalRuby, totalCash, hasCheckedItems } = packageValue;
                const isCustom = pkg.isCustom;

                return (
                  <div
                    key={`${isCustom ? "custom" : "server"}-${pkg.packageId}`}
                    className={`group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border ${
                      hasCheckedItems ? (isCustom ? "border-purple-200 hover:border-purple-300" : "border-blue-200 hover:border-blue-300") : "border-gray-300 opacity-70 hover:opacity-90"
                    }`}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animation: "fadeInUp 0.4s ease-out forwards",
                    }}>
                    {/* 카드 상단 그라디언트 배경 */}
                    <div className={`h-1.5 ${hasCheckedItems ? (isCustom ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600" : "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500") : "bg-gradient-to-r from-gray-400 to-gray-500"}`}></div>
                    {/* 카드 콘텐츠 */}
                    <div className="p-3 flex flex-col h-full">
                      {/* 패키지 제목 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-col">
                          <h2 className={`text-base font-bold transition-colors duration-300 line-clamp-2 ${hasCheckedItems ? "text-gray-800" : "text-gray-500"}`}>{pkg.packageName}</h2>
                          {/* {isCustom && <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full mt-1 w-fit">커스텀</span>} */}
                        </div>
                        {!hasCheckedItems && <div className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-xs shrink-0 ml-2">미선택</div>}
                        {isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomPackage(pkg.packageId);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full px-1 transition-colors"
                            title="커스텀 패키지 삭제">
                            <i className="xi-close text-sm"></i>
                          </button>
                        )}
                      </div>
                      {/* 간단한 정보 표시 */}
                      <div className="flex flex-col gap-2 flex-1">
                        {/* 패키지 가격 */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-md p-2 border border-indigo-100">
                          <div className="text-indigo-700 text-xs font-medium mb-0.5">패키지 가격</div>
                          <div className="text-indigo-900 text-sm font-bold">
                            {pkg.packagePrice.toLocaleString()}
                            <span className="text-xs font-normal ml-1 text-indigo-600">원</span>
                          </div>
                        </div>
                        {/* 효율성 간단 표시 */}
                        {hasCheckedItems ? (
                          (() => {
                            const efficiency = (totalCash / pkg.packagePrice) * 100;
                            const isProfit = pkg.packagePrice <= totalCash;
                            return (
                              <div className={`rounded-md p-2 border ${isProfit ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>효율성</span>
                                  <span className={`text-sm font-bold ${isProfit ? "text-emerald-800" : "text-rose-800"}`}>{isProfit ? `+${efficiency.toFixed(0)}%` : `-${(100 - efficiency).toFixed(0)}%`}</span>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="bg-gray-50 rounded-md p-2 border border-gray-200">
                            <div className="text-center text-gray-500 text-xs">아이템 선택 필요</div>
                          </div>
                        )}
                        {/* 아이템 개수 및 상세 버튼 */}
                        <div className="flex items-center justify-between pt-2 gap-4">
                          <div className="flex justify-center items-center gap-2 text-xs text-gray-600">
                            {/* <i className="xi-list xi-x"></i> */}
                            <div className="flex flex-col items-start justify-center">
                              {pkg.items.length}개 아이템
                              {hasCheckedItems && <span className="text-blue-600">{checkedItems.length}개 선택</span>}
                            </div>
                          </div>
                          <button onClick={() => openPackageModal(pkg)} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 rounded-md transition-all duration-200">
                            <span>상세보기</span>
                            <i className="xi-angle-right text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* 패키지 상세 모달 */}
      {isModalOpen && selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackgroundClick}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">{selectedPackage.packageName}</h3>
                <button onClick={closePackageModal} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <i className="xi-close text-gray-600"></i>
                </button>
              </div>
            </div>
            {/* 모달 내용 */}
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
              {(() => {
                const packageValue = calculatePackageValue(selectedPackage);
                const { checkedItems, totalRuby, totalCash, hasCheckedItems } = packageValue;

                return (
                  <div className="space-y-4">
                    {/* 가격 정보 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-lg p-3 border border-indigo-200">
                        <div className="text-indigo-700 text-sm font-medium mb-1">패키지 가격</div>
                        <div className="text-indigo-900 text-xl font-bold">
                          {selectedPackage.packagePrice.toLocaleString()}
                          <span className="text-sm font-normal ml-1 text-indigo-700">원</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 rounded-lg p-3 border border-sky-200">
                        <div className="text-sky-700 text-sm font-medium mb-1">실제 값어치</div>
                        <div className="text-sky-900 text-xl font-bold">
                          {totalCash.toLocaleString()}
                          <span className="text-sm font-normal ml-1 text-sky-700">원</span>
                        </div>
                      </div>
                    </div>
                    {/* 효율성 */}
                    {hasCheckedItems ? (
                      (() => {
                        const efficiency = (totalCash / selectedPackage.packagePrice) * 100;
                        const isProfit = selectedPackage.packagePrice <= totalCash;
                        const efficiencyDisplay = isProfit ? `+${efficiency.toFixed(1)}%` : `-${(100 - efficiency).toFixed(1)}%`;
                        return (
                          <div className={`rounded-lg p-3 border ${isProfit ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-emerald-200" : "bg-gradient-to-r from-rose-50 via-red-50 to-pink-50 border-rose-200"}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-medium flex items-center ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
                                <i className={`mr-2 ${isProfit ? "xi-chart-bar text-emerald-600" : "xi-chart-bar-square text-rose-600"}`}></i>
                                패키지 효율성
                              </span>
                              <div className="flex items-center">
                                <span className={`font-bold text-lg ${isProfit ? "text-emerald-800" : "text-rose-800"}`}>{efficiencyDisplay}</span>
                                <i className={`ml-2 ${isProfit ? "xi-trending-up text-emerald-600" : "xi-trending-down text-rose-600"}`}></i>
                              </div>
                            </div>
                            <div className="mt-2 text-sm">
                              <span className={`font-medium ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>{isProfit ? `💰 이득: ${(totalCash - selectedPackage.packagePrice).toLocaleString()}원` : `💸 손해: ${(selectedPackage.packagePrice - totalCash).toLocaleString()}원`}</span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="rounded-lg p-3 border bg-gray-50 border-gray-200">
                        <div className="text-center text-gray-500">체크리스트에서 아이템을 선택해주세요</div>
                      </div>
                    )}{" "}
                    {/* 아이템 목록 */}
                    <div className="flex-1 min-h-0">
                      <h4 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                        <i className="xi-list text-blue-500 mr-2"></i>
                        포함 아이템 ({selectedPackage.items.length}개)
                        {hasCheckedItems && <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{checkedItems.length}개 선택됨</span>}
                      </h4>
                      <div className="space-y-2 overflow-y-auto">
                        {selectedPackage.items.map((item) => {
                          const isChecked = isItemChecked(item.itemId);
                          const currentRuby = getItemRuby(item.itemId);
                          const isCustomPrice = currentRuby !== item.ruby;
                          return (
                            <div key={item.itemId} className={`flex justify-between items-center w-full p-3 rounded-lg transition-all duration-200 ${isChecked ? "bg-blue-50 border-2 border-blue-200" : "bg-gray-50 border border-gray-200 opacity-70"}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isChecked ? "bg-blue-500" : "bg-gray-300"}`}>
                                  <i className={`xi-check text-white text-xs ${isChecked ? "opacity-100" : "opacity-50"}`}></i>
                                </div>
                                {item.imgUrl && (
                                  <div className="relative">
                                    <img src={item.imgUrl} alt={item.itemName} className={`w-12 h-12 object-cover rounded-lg shadow-sm bg-[#777777] transition-all duration-200 ${isChecked ? "scale-105" : "opacity-70"}`} />
                                    <div className={`absolute bottom-0 left-0 right-0 h-4 text-sm flex justify-center items-center text-white rounded-sm ${isChecked ? "bg-blue-600/80" : "bg-black/20"}`}>
                                      <span>{item.quantity}</span>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <div className={`font-medium transition-colors ${isChecked ? "text-blue-800" : "text-gray-600"}`}>{item.itemName}</div>
                                  <div className={`text-sm ${isChecked ? "text-blue-600" : "text-gray-500"}`}>수량: {item.quantity}개</div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className={`flex items-center font-semibold ${isChecked ? "text-purple-600" : "text-gray-500"}`}>
                                  <i className="xi-diamond text-sm mr-1"></i>
                                  <span className="text-nowrap">{(currentRuby * item.quantity).toLocaleString()} 루비</span>
                                  {isCustomPrice && isChecked && <span className="ml-1 text-xs text-orange-500">*</span>}
                                </div>
                                <div className={`text-xs ${isChecked ? "text-purple-500" : "text-gray-400"}`}>
                                  <span className="text-nowrap">개당 {currentRuby.toLocaleString()} 루비</span>
                                  {isCustomPrice && <span className="text-orange-500"> (수정됨)</span>}
                                </div>
                                {isCustomPrice && <div className={`text-xs ${isChecked ? "text-gray-500" : "text-gray-400"} line-through`}>원래: {item.ruby.toLocaleString()}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>{" "}
          </div>
        </div>
      )}
      {/* 커스텀 패키지 추가 모달 */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddModalOpen(false);
            }
          }}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">커스텀 패키지 추가</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <i className="xi-close text-white"></i>
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {/* 패키지명 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">패키지명</label>
                  <input
                    type="text"
                    value={customPackageForm.packageName}
                    onChange={(e) => setCustomPackageForm((prev) => ({ ...prev, packageName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="커스텀 패키지명을 입력하세요"
                  />
                </div>
                {/* 패키지 가격 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">패키지 가격</label>
                  <input
                    type="number"
                    value={customPackageForm.packagePrice}
                    onChange={(e) => setCustomPackageForm((prev) => ({ ...prev, packagePrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="패키지 가격을 입력하세요"
                  />
                </div>{" "}
                {/* 선택된 아이템 목록 */}
                {customPackageForm.selectedItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">선택된 아이템 ({customPackageForm.selectedItems.length}개)</label> {/* 패키지 정보 */}
                      <div className="text-sm bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-gray-600">총 개수: </span>
                            <span className="font-medium text-gray-700">{customPackageForm.selectedItems.reduce((sum, item) => sum + item.quantity, 0)}개</span>
                          </div>
                          <div>
                            <span className="text-gray-600">총 루비: </span>
                            <span className="font-medium text-purple-600">
                              {customPackageForm.selectedItems
                                .reduce((sum, selectedItem) => {
                                  const itemInfo = allItems.find((item) => item.itemId === selectedItem.itemId);
                                  return sum + (itemInfo?.ruby || 0) * selectedItem.quantity;
                                }, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">총 현금: </span>
                            <span className="font-medium text-green-600">
                              {(
                                customPackageForm.selectedItems.reduce((sum, selectedItem) => {
                                  const itemInfo = allItems.find((item) => item.itemId === selectedItem.itemId);
                                  return sum + (itemInfo?.ruby || 0) * selectedItem.quantity;
                                }, 0) * 7.5
                              ).toLocaleString()}
                              원
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {customPackageForm.selectedItems.map((selectedItem) => {
                        const itemInfo = allItems.find((item) => item.itemId === selectedItem.itemId);
                        return (
                          <div key={selectedItem.itemId} className="flex items-center justify-between bg-purple-50 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <img src={itemInfo?.imgUrl} alt={itemInfo?.itemName} className="w-8 h-8 object-cover rounded" />
                              <div>
                                <span className="font-medium">{itemInfo?.itemName}</span>
                                <span className="text-gray-600 text-sm ml-2">({itemInfo?.ruby} 루비)</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setCustomPackageForm((prev) => ({
                                    ...prev,
                                    selectedItems: prev.selectedItems.map((item) => (item.itemId === selectedItem.itemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item)),
                                  }));
                                }}
                                className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                                -
                              </button>
                              <span className="w-8 text-center">{selectedItem.quantity}</span>
                              <button
                                onClick={() => {
                                  setCustomPackageForm((prev) => ({
                                    ...prev,
                                    selectedItems: prev.selectedItems.map((item) => (item.itemId === selectedItem.itemId ? { ...item, quantity: item.quantity + 1 } : item)),
                                  }));
                                }}
                                className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300">
                                +
                              </button>
                              <button
                                onClick={() => {
                                  setCustomPackageForm((prev) => ({
                                    ...prev,
                                    selectedItems: prev.selectedItems.filter((item) => item.itemId !== selectedItem.itemId),
                                  }));
                                }}
                                className="ml-2 text-red-500 hover:text-red-700">
                                <i className="xi-trash"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* 아이템 추가 목록 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">아이템 추가</label>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {allItems
                        .filter((item) => !customPackageForm.selectedItems.some((selected) => selected.itemId === item.itemId))
                        .map((item) => (
                          <div key={item.itemId} className="flex items-center justify-between border border-gray-200 rounded-lg p-2 hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <img src={item.imgUrl} alt={item.itemName} className="w-6 h-6 object-cover rounded" />
                              <span>{item.itemName}</span>
                              <span className="text-gray-600 text-sm">({item.ruby} 루비)</span>
                            </div>
                            <button
                              onClick={() => {
                                setCustomPackageForm((prev) => ({
                                  ...prev,
                                  selectedItems: [...prev.selectedItems, { itemId: item.itemId, quantity: 1 }],
                                }));
                              }}
                              className="px-2 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
                              추가
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>{" "}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  취소
                </button>
                <button onClick={addCustomPackage} className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 커스텀 스크롤바와 애니메이션을 위한 스타일 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 4px;
        }

        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: rgb(243 244 246);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

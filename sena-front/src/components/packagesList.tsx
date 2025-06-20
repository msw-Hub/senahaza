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
}

interface Packages {
  lastUpdatedAt: string; // 마지막 업데이트 시간
  packages: Package[]; // 패키지 목록
}

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Zustand store 사용
  const { isItemChecked, getItemRuby } = useItemCheckStore();

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

  // 컴포넌트가 마운트될 때 패키지 목록을 가져옵니다.
  useEffect(() => {
    getPackagesList();
  }, []);

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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex flex-col mx-auto px-6 py-6 w-full max-w-7xl h-full">
        {/* 아이템 체크리스트 */}
        <div className="mb-6 flex-shrink-0">
          <ItemCheckList />
        </div>
        {/* 헤더 섹션 */}
        <div className="text-center mb-8 flex-shrink-0">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">패키지 목록</h1>
          {/* <p className="text-gray-600 text-lg max-w-2xl mx-auto">다양한 아이템이 포함된 특별 패키지를 만나보세요</p> */}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
        </div>{" "}
        {/* 패키지 카드 그리드 - 남은 공간을 모두 사용 */}
        <div className="flex-1 overflow-auto h-full">
          {packages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="xi-package text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">패키지가 없습니다</h3>
              <p className="text-gray-500">아직 등록된 패키지가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 auto-rows-fr h-full">
              {packages.map((pkg, index) => {
                // 체크된 아이템만 계산
                const packageValue = calculatePackageValue(pkg);
                const { checkedItems, totalRuby, totalCash, hasCheckedItems } = packageValue;
                return (
                  <div
                    key={pkg.packageId}
                    className={`group relative bg-white rounded-2xl shadow-lg transition-all duration-500 overflow-hidden border h-full ${hasCheckedItems ? "border-blue-200" : "border-gray-300 opacity-60"}`}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: "fadeInUp 0.6s ease-out forwards",
                    }}>
                    {/* 카드 상단 그라디언트 배경 */}
                    <div className={`h-2 ${hasCheckedItems ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" : "bg-gradient-to-r from-gray-400 to-gray-500"}`}></div>

                    {/* 카드 콘텐츠 */}
                    <div className="p-6 flex flex-col h-full">
                      {/* 패키지 제목 */}
                      <div className="flex items-start justify-between mb-6">
                        <h2 className={`text-2xl font-bold transition-colors duration-300 ${hasCheckedItems ? "text-gray-800" : "text-gray-500"}`}>{pkg.packageName}</h2>
                        {!hasCheckedItems && <div className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">선택된 아이템 없음</div>}
                      </div>

                      <div className="grid grid-cols-2 gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {/* 가격 정보 */}
                        {/* 패키지 가격 */}
                        <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-xl p-4 border border-indigo-200 shadow-md">
                          <div className="text-indigo-700 text-sm font-medium mb-1 flex items-center">패키지 가격</div>
                          <div className="text-indigo-900 text-xl font-bold">
                            {pkg.packagePrice.toLocaleString()}
                            <span className="text-sm font-normal ml-1 text-indigo-700">원</span>
                          </div>
                        </div>
                        {/* 실제 값어치 (체크된 아이템만) */}
                        <div className="bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 rounded-xl p-4 border border-sky-200 shadow-md">
                          <div className="text-sky-700 text-sm font-medium mb-1 flex items-center">실제 값어치</div>
                          <div className="text-sky-900 text-xl font-bold">
                            {totalCash.toLocaleString()}
                            <span className="text-sm font-normal ml-1 text-sky-700">원</span>
                          </div>
                        </div>

                        {/* 효율성 표시 (체크된 아이템 기준) */}
                        <div className="col-span-2">
                          {(() => {
                            if (!hasCheckedItems) {
                              return (
                                <div className="rounded-xl p-4 border bg-gray-50 border-gray-200">
                                  <div className="text-center text-gray-500">아이템을 선택해주세요</div>
                                </div>
                              );
                            }
                            const efficiency = (totalCash / pkg.packagePrice) * 100;
                            const isProfit = pkg.packagePrice <= totalCash;
                            const efficiencyDisplay = isProfit ? `+${efficiency.toFixed(1)}%` : `-${(100 - efficiency).toFixed(1)}%`;
                            return (
                              <div className={`rounded-xl p-4 border shadow-md ${isProfit ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-emerald-200" : "bg-gradient-to-r from-rose-50 via-red-50 to-pink-50 border-rose-200"}`}>
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
                                <div className="mt-2 text-xs">
                                  <span className={`font-medium ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>{isProfit ? `💰 이득: ${(totalCash - pkg.packagePrice).toLocaleString()}원` : `💸 손해: ${(pkg.packagePrice - totalCash).toLocaleString()}원`}</span>
                                </div>
                              </div>
                            );
                          })()}{" "}
                        </div>
                        {/* 아이템 목록 */}
                        <div className="col-span-2 w-full flex flex-col justify-center gap-2">
                          {pkg.items.map((item) => {
                            const isChecked = isItemChecked(item.itemId);
                            const currentRuby = getItemRuby(item.itemId);
                            const isCustomPrice = currentRuby !== item.ruby;
                            return (
                              <div key={item.itemId} className={`flex justify-between items-center w-full p-3 rounded-xl transition-all duration-200 group/item ${isChecked ? "bg-blue-50 border-2 border-blue-200 shadow-md" : "bg-gray-50 border border-gray-200 opacity-70"}`}>
                                <div className="flex items-center gap-10 w-full">
                                  {/* 체크 상태 표시 아이콘 */}
                                  <div className="flex items-center gap-4 w-full">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isChecked ? "bg-blue-500" : "bg-gray-300"}`}>
                                        <i className={`xi-check text-white text-xs ${isChecked ? "opacity-100" : "opacity-50"}`}></i>
                                      </div>
                                      {item.imgUrl && (
                                        <div className="relative">
                                          <img src={item.imgUrl} alt={item.itemName} className={`w-12 h-12 object-cover rounded-lg shadow-md bg-[#777777] transition-all duration-200 ${isChecked ? "scale-105" : "opacity-70"}`} />
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
                                  </div>
                                  <div className="flex flex-col items-end justify-center">
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
                              </div>
                            );
                          })}
                        </div>
                        {/* <div className="col-span-2 ">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                            <i className="xi-list text-blue-500 mr-2"></i>
                            포함 아이템 ({pkg.items.length}개)
                            {hasCheckedItems && <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{checkedItems.length}개 선택됨</span>}
                          </h3>
                        </div> */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 커스텀 스크롤바와 애니메이션을 위한 스타일 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

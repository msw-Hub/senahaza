"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useItemCheckStore } from "@/store/itemCheckList";

interface Item {
  itemId: number;
  itemName: string;
  ruby: number;
  imgUrl: string;
}

export default function ItemCheckList() {
  const [isLoading, setIsLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");

  // Zustand store 사용
  const { allItems, checkedItems, setAllItems, toggleItem, checkAllItems, uncheckAllItems, isItemChecked, getItemRuby, setCustomPrice, resetCustomPrice, resetAllCustomPrices, customPrices } = useItemCheckStore();

  const getItemCheckList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/main/items`);
      const items: Item[] = response.data;
      setAllItems(items); // Zustand store에 아이템 목록 저장
      console.log("아이템 목록:", items);
    } catch (error) {
      console.error("아이템 체크리스트를 가져오는 중 오류 발생:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getItemCheckList();
  }, []);
  const handleToggleItem = (itemId: number) => {
    toggleItem(itemId);
  };

  const handleEditPrice = (itemId: number) => {
    const currentPrice = getItemRuby(itemId);
    setEditingItemId(itemId);
    setEditingPrice(currentPrice.toString());
  };

  const handleSavePrice = () => {
    if (editingItemId && editingPrice) {
      const newPrice = parseInt(editingPrice);
      if (!isNaN(newPrice) && newPrice >= 0) {
        setCustomPrice(editingItemId, newPrice);
      }
    }
    setEditingItemId(null);
    setEditingPrice("");
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingPrice("");
  };

  const handleResetPrice = (itemId: number) => {
    resetCustomPrice(itemId);
  };

  const handleResetAllPrices = () => {
    resetAllCustomPrices();
  };

  // const checkedItemsList = getCheckedItems();
  // const totalRuby = getTotalRuby();
  // const totalCash = getTotalCash();
  return (
    <div className="h-full">
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">아이템 선택</h2>
            <div className="text-sm text-gray-600">
              {checkedItems.length}/{allItems.length}개 선택됨
            </div>
          </div>
          {/* 컨트롤 버튼 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-full gap-2">
              <button onClick={checkAllItems} className="flex-1 px-3 py-1.5 font-bold bg-green-400 text-white rounded text-sm hover:bg-green-500 transition-colors">
                전체 선택
              </button>
              <button onClick={uncheckAllItems} className="flex-1 px-3 py-1.5 font-bold bg-red-400 text-white rounded text-sm hover:bg-red-500 transition-colors">
                전체 해제
              </button>
              {/* 모든 가격 초기화 버튼 */}
              <button onClick={handleResetAllPrices} className="flex-1 px-3 py-1.5 font-bold bg-orange-400 text-white rounded text-sm hover:bg-orange-500 transition-colors">
                값 초기화
              </button>
            </div>
          </div>
        </div>
        {/* 아이템 목록 */}
        <div className="p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500">로딩 중...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {allItems.map((item) => {
                const isChecked = isItemChecked(item.itemId);
                const currentRuby = getItemRuby(item.itemId);
                const isCustomPrice = customPrices[item.itemId] !== undefined && customPrices[item.itemId] !== item.ruby;
                const isEditing = editingItemId === item.itemId;
                return (
                  <div key={item.itemId} className={`min-w-80 flex items-center gap-3 p-4 border rounded-lg transition-colors ${isChecked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    {/* 체크박스와 이미지 */}
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={isChecked} onChange={() => handleToggleItem(item.itemId)} className="w-4 h-4" />
                      <img src={item.imgUrl} alt={item.itemName} className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                    </div>
                    {/* 아이템 정보 */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.itemName}</div>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <div className="flex items-center justify-between gap-2">
                            <input type="number" value={editingPrice} onChange={(e) => setEditingPrice(e.target.value)} className="w-15 px-2 py-0.5 border rounded text-sm focus:outline-none focus:border-blue-400" placeholder="루비" min="0" />
                            <span className="text-sm text-purple-600 font-medium">루비</span>
                            {/* <div className="flex flex-col items-start justify-center gap-2">
                              <button onClick={handleSavePrice} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors">
                                저장
                              </button>
                              <button onClick={handleCancelEdit} className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors">
                                취소
                              </button>
                            </div> */}
                          </div>
                        ) : (
                          <div className="flex flex-col items-start justify-center">
                            <span className={`text-sm font-medium ${isCustomPrice ? "text-orange-600" : "text-purple-600"}`}>
                              {currentRuby.toLocaleString()} 루비
                              {isCustomPrice && <span className="ml-1 text-xs text-orange-500">(수정됨)</span>}
                            </span>
                            {item.ruby !== currentRuby && <span className="text-xs text-gray-500 line-through">기존: {item.ruby.toLocaleString()}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* 가격 수정 버튼들 */}
                    <div className="flex items-center gap-1">
                      {!isEditing ? (
                        <>
                          <div className="flex flex-col items-start justify-center gap-2">
                            <button onClick={() => handleEditPrice(item.itemId)} className="w-13 px-2 py-1 bg-blue-400 text-white rounded text-xs hover:bg-blue-500 transition-colors" title="가격 수정">
                              수정
                            </button>
                            <button onClick={() => handleResetPrice(item.itemId)} className="w-13 px-2 py-1 bg-orange-400 text-white rounded text-xs hover:bg-orange-500 transition-colors" title="가격 초기화">
                              초기화
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-start justify-center gap-2">
                            <button onClick={handleSavePrice} className="w-13 px-2 py-1 bg-green-400 text-white rounded text-xs hover:bg-green-500 transition-colors" title="가격 저장">
                              저장
                            </button>
                            <button onClick={handleCancelEdit} className="w-13 px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors" title="수정 취소">
                              취소
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

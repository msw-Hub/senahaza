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
  const [itemList, setItemList] = useState<Item[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");

  // Zustand store 사용
  const { allItems, checkedItems, setAllItems, toggleItem, checkAllItems, uncheckAllItems, getCheckedItems, getTotalRuby, getTotalCash, isItemChecked, getItemRuby, setCustomPrice, resetCustomPrice, resetAllCustomPrices, customPrices } = useItemCheckStore();

  const getItemCheckList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/main/items`);
      const items: Item[] = response.data;
      setItemList(items);
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

  const checkedItemsList = getCheckedItems();
  const totalRuby = getTotalRuby();
  const totalCash = getTotalCash();

  return (
    <div className="p-4">
      {" "}
      {/* 메인 버튼 및 정보 표시 */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          아이템 선택 ({checkedItems.length}개)
        </button>

        {/* 모든 가격 초기화 버튼 */}
        {Object.keys(customPrices).length > 0 && (
          <button onClick={handleResetAllPrices} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            모든 가격 초기화 ({Object.keys(customPrices).length}개)
          </button>
        )}

        {/* <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">총 루비:</span>
            <span className="font-bold text-purple-600">{totalRuby.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">실제 값어치:</span>
            <span className="font-bold text-green-600">{totalCash.toLocaleString()}원</span>
          </div>
        </div> */}
      </div>
      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-w-[90vw] max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">아이템 선택</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <i className="xi-close text-xl"></i>
              </button>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <button onClick={checkAllItems} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                  전체 선택
                </button>
                <button onClick={uncheckAllItems} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                  전체 해제
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {checkedItems.length}/{allItems.length}개 선택됨
              </div>
            </div>

            {/* 아이템 목록 */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-gray-500">로딩 중...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {allItems.map((item) => {
                    const isChecked = isItemChecked(item.itemId);
                    const currentRuby = getItemRuby(item.itemId);
                    const isCustomPrice = customPrices[item.itemId] !== undefined;
                    const isEditing = editingItemId === item.itemId;

                    return (
                      <div key={item.itemId} className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${isChecked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        {/* 체크박스와 이미지 */}
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={isChecked} onChange={() => handleToggleItem(item.itemId)} className="w-4 h-4" />
                          <img src={item.imgUrl} alt={item.itemName} className="w-12 h-12 object-cover rounded-lg" />
                        </div>

                        {/* 아이템 정보 */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.itemName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input type="number" value={editingPrice} onChange={(e) => setEditingPrice(e.target.value)} className="w-20 px-2 py-1 border rounded text-sm" placeholder="루비" min="0" />
                                <span className="text-xs text-purple-600">루비</span>
                                <button onClick={handleSavePrice} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">
                                  저장
                                </button>
                                <button onClick={handleCancelEdit} className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600">
                                  취소
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className={`text-sm font-medium ${isCustomPrice ? "text-orange-600" : "text-purple-600"}`}>
                                  {currentRuby.toLocaleString()} 루비
                                  {isCustomPrice && <span className="ml-1 text-xs text-orange-500">(수정됨)</span>}
                                </span>
                                {item.ruby !== currentRuby && <span className="text-xs text-gray-500 line-through">원래: {item.ruby.toLocaleString()}</span>}
                              </>
                            )}
                          </div>
                        </div>

                        {/* 가격 수정 버튼들 */}
                        <div className="flex items-center gap-1">
                          {!isEditing && (
                            <>
                              <button onClick={() => handleEditPrice(item.itemId)} className="p-2 text-blue-500 hover:bg-blue-100 rounded transition-colors" title="가격 수정">
                                <i className="xi-pen text-sm"></i>
                              </button>
                              {isCustomPrice && (
                                <button onClick={() => handleResetPrice(item.itemId)} className="p-2 text-red-500 hover:bg-red-100 rounded transition-colors" title="가격 초기화">
                                  <i className="xi-refresh text-sm"></i>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 하단 정보 */}
            {/* <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>총 루비:</strong> {totalRuby.toLocaleString()}
                  </span>
                  <span>
                    <strong>실제 값어치:</strong> {totalCash.toLocaleString()}원
                  </span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  완료
                </button>
              </div>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}

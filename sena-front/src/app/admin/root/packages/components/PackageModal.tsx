"use client";

import React, { useState } from "react";

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
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  lastModifiedMessage?: string;
  status: "ACTIVE" | "INACTIVE";
}

interface PackageFormData {
  packageName: string;
  packagePrice: string;
  message: string;
  items: { itemId: number; quantity: number }[];
}

interface PackageModalProps {
  showModal: boolean;
  editingPackage: Package | null;
  formData: PackageFormData;
  items: Item[];
  isLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (data: Partial<PackageFormData>) => void;
  onAddItem: (itemId: number) => void;
  onRemoveItem: (itemId: number) => void;
  onQuantityChange: (itemId: number, quantity: number) => void;
}

export default function PackageModal({ showModal, editingPackage, formData, items, isLoading, onClose, onSubmit, onFormDataChange, onAddItem, onRemoveItem, onQuantityChange }: PackageModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!showModal) return null;

  // 예상 총 루비 계산
  const calculateTotalRuby = () => {
    return formData.items.reduce((sum, selectedItem) => {
      const itemInfo = items.find((item) => item.itemId === selectedItem.itemId);
      return sum + (itemInfo?.ruby || 0) * selectedItem.quantity;
    }, 0);
  };

  // 사용 가능한 아이템 필터링 (선택되지 않은 아이템만)
  const availableItems = items.filter((item) => !formData.items.some((selectedItem) => selectedItem.itemId === item.itemId));

  // 검색어로 아이템 필터링
  const filteredItems = availableItems.filter((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-w-[95vw] max-h-[95vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <i className={`mr-2 text-blue-600 ${editingPackage ? "xi-edit" : "xi-plus"}`}></i>
              {editingPackage ? "패키지 수정" : "패키지 추가"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <i className="xi-close text-xl"></i>
            </button>
          </div>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="xi-tag mr-1"></i>
                패키지명
              </label>
              <input type="text" value={formData.packageName} onChange={(e) => onFormDataChange({ packageName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="패키지명을 입력하세요" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="xi-won mr-1"></i>
                패키지 가격
              </label>
              <input type="number" value={formData.packagePrice} onChange={(e) => onFormDataChange({ packagePrice: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="패키지 가격을 입력하세요" />
            </div>
          </div>

          {/* 아이템 구성 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <i className="xi-package mr-1"></i>
              아이템 구성
            </label>

            {/* 선택된 아이템 목록 */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <i className="xi-check-circle mr-2 text-blue-600"></i>
                    선택된 아이템 ({formData.items.length}개)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.items.map((selectedItem) => {
                      const itemInfo = items.find((item) => item.itemId === selectedItem.itemId);
                      return (
                        <div key={selectedItem.itemId} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={itemInfo?.img || itemInfo?.imgUrl} alt={itemInfo?.itemName} className="w-10 h-10 object-cover rounded-lg" />
                              <div>
                                <h5 className="font-medium text-gray-900 text-sm">{itemInfo?.itemName}</h5>
                                <p className="text-xs text-purple-600">{itemInfo?.ruby?.toLocaleString()} 루비</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => onQuantityChange(selectedItem.itemId, selectedItem.quantity - 1)} className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors" disabled={selectedItem.quantity <= 1}>
                                <i className="xi-minus text-xs"></i>
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={selectedItem.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  if (value >= 1) {
                                    onQuantityChange(selectedItem.itemId, value);
                                  }
                                }}
                                className="w-12 h-7 text-center border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button type="button" onClick={() => onQuantityChange(selectedItem.itemId, selectedItem.quantity + 1)} className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                                <i className="xi-plus text-xs"></i>
                              </button>
                              <button type="button" onClick={() => onRemoveItem(selectedItem.itemId)} className="ml-2 w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">
                                <i className="xi-trash text-xs"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 아이템 추가 목록 */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <i className="xi-plus-circle mr-2 text-green-600"></i>
                아이템 추가
              </h4>

              {/* 검색 입력 */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="xi-search text-gray-400"></i>
                  </div>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="아이템명으로 검색..." />
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      <i className="xi-close text-sm"></i>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <p className="text-sm text-gray-500 mt-2">
                    &quot;{searchTerm}&quot; 검색 결과: {filteredItems.length}개
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={item.img || item.imgUrl} alt={item.itemName} className="w-8 h-8 object-cover rounded-lg" />
                        <div>
                          <span className="font-medium text-sm">{item.itemName}</span>
                          <p className="text-xs text-purple-600">{item.ruby?.toLocaleString()} 루비</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => onAddItem(item.itemId)} className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-1">
                        <i className="xi-plus text-xs"></i>
                        추가
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">{searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : "추가할 수 있는 아이템이 없습니다."}</div>
                )}
              </div>
            </div>
          </div>

          {/* 패키지 정보 요약 */}
          {formData.items.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <i className="xi-chart-bar mr-2 text-purple-600"></i>
                패키지 정보 요약
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">총 아이템</p>
                  <p className="text-lg font-bold text-gray-900">{formData.items.reduce((sum, item) => sum + item.quantity, 0)}개</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">아이템 종류</p>
                  <p className="text-lg font-bold text-gray-900">{formData.items.length}종</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">총 루비</p>
                  <p className="text-lg font-bold text-purple-600">{calculateTotalRuby().toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">판매가격</p>
                  <p className="text-lg font-bold text-green-600">{formData.packagePrice ? Number(formData.packagePrice).toLocaleString() : "0"}원</p>
                </div>
              </div>
            </div>
          )}

          {/* 수정 메시지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="xi-message mr-1"></i>
              수정 메시지
            </label>
            <textarea value={formData.message} onChange={(e) => onFormDataChange({ message: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="수정 메시지를 입력하세요" />
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              취소
            </button>
            <button onClick={onSubmit} disabled={isLoading} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <i className="xi-spinner animate-spin mr-2"></i>
                  처리 중...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <i className={`mr-2 ${editingPackage ? "xi-check" : "xi-plus"}`}></i>
                  {editingPackage ? "수정 완료" : "추가 완료"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

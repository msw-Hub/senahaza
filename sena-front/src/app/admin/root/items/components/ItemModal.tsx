"use client";

import React from "react";

interface Item {
  itemId: number;
  itemName: string;
  ruby: number;
  imgUrl: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  lastModifiedMessage?: string;
  status: "ACTIVE" | "INACTIVE";
}

interface ItemFormData {
  itemName: string;
  ruby: string;
  message: string;
  file: File | null;
}

interface ItemModalProps {
  showModal: boolean;
  editingItem: Item | null;
  formData: ItemFormData;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (data: Partial<ItemFormData>) => void;
}

export default function ItemModal({ showModal, editingItem, formData, isLoading, onClose, onSubmit, onFormDataChange }: ItemModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <i className={`mr-2 text-blue-600 ${editingItem ? "xi-edit" : "xi-plus"}`}></i>
              {editingItem ? "아이템 수정" : "아이템 추가"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <i className="xi-close text-xl"></i>
            </button>
          </div>
        </div>

        {/* 모달 컨텐츠 */}
        <div className="p-6 space-y-6">
          {/* 현재 이미지 미리보기 (수정 시에만) */}
          {editingItem && (
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 inline-block">
                <img src={editingItem.imgUrl} alt={editingItem.itemName} className="w-24 h-24 object-cover rounded-lg mx-auto" />
                <p className="text-sm text-gray-600 mt-2">현재 이미지</p>
              </div>
            </div>
          )}

          {/* 폼 필드들 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="xi-tag mr-1"></i>
                아이템명
              </label>
              <input type="text" value={formData.itemName} onChange={(e) => onFormDataChange({ itemName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="아이템명을 입력하세요" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="xi-gem mr-1"></i>
                루비 값어치
              </label>
              <input type="number" value={formData.ruby} onChange={(e) => onFormDataChange({ ruby: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="루비 값을 입력하세요" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="xi-camera mr-1"></i>
                {editingItem ? "새 이미지 업로드" : "이미지 파일"}
              </label>
              <input type="file" accept="image/*" onChange={(e) => onFormDataChange({ file: e.target.files?.[0] || null })} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <p className="text-xs text-gray-500 mt-1">{editingItem ? "선택하지 않으면 기존 이미지가 유지됩니다" : "이미지 파일을 선택해주세요"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="xi-message mr-1"></i>
                수정 메시지
              </label>
              <textarea value={formData.message} onChange={(e) => onFormDataChange({ message: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-3 h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="수정 메시지를 입력하세요" />
            </div>
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
                  <i className={`mr-2 ${editingItem ? "xi-check" : "xi-plus"}`}></i>
                  {editingItem ? "수정 완료" : "추가 완료"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

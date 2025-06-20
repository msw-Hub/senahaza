"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Item {
  itemId: number;
  itemName: string;
  ruby: number;
  imgUrl: string;
}

interface ItemCheckStore {
  // 모든 아이템 목록
  allItems: Item[];
  // 체크된 아이템 ID 목록
  checkedItems: number[];
  // 사용자 정의 가격 (itemId -> 사용자 정의 루비 값)
  customPrices: Record<number, number>;
  // 아이템 목록 설정
  setAllItems: (items: Item[]) => void;
  // 아이템 체크/언체크
  toggleItem: (itemId: number) => void;
  // 모든 아이템 체크
  checkAllItems: () => void;
  // 모든 아이템 언체크
  uncheckAllItems: () => void;
  // 체크된 아이템들만 반환
  getCheckedItems: () => Item[];
  // 체크된 아이템들의 총 루비 계산
  getTotalRuby: () => number;
  // 체크된 아이템들의 실제 값어치 계산 (총루비 * 7.5)
  getTotalCash: () => number;
  // 특정 아이템이 체크되었는지 확인
  isItemChecked: (itemId: number) => boolean;
  // 아이템의 실제 루비 값 반환 (커스텀 가격이 있으면 그것을, 없으면 기본값을)
  getItemRuby: (itemId: number) => number;
  // 아이템의 커스텀 가격 설정
  setCustomPrice: (itemId: number, ruby: number) => void;
  // 특정 아이템의 커스텀 가격 초기화
  resetCustomPrice: (itemId: number) => void;
  // 모든 커스텀 가격 초기화
  resetAllCustomPrices: () => void;
}

export const useItemCheckStore = create<ItemCheckStore>()(
  persist(
    (set, get) => ({
      allItems: [],
      checkedItems: [],
      customPrices: {},

      setAllItems: (items: Item[]) => {
        set({ allItems: items });
      },

      toggleItem: (itemId: number) => {
        set((state) => {
          const isChecked = state.checkedItems.includes(itemId);
          if (isChecked) {
            return {
              checkedItems: state.checkedItems.filter((id) => id !== itemId),
            };
          } else {
            return {
              checkedItems: [...state.checkedItems, itemId],
            };
          }
        });
      },

      checkAllItems: () => {
        const { allItems } = get();
        set({
          checkedItems: allItems.map((item) => item.itemId),
        });
      },

      uncheckAllItems: () => {
        set({ checkedItems: [] });
      },

      getCheckedItems: () => {
        const { allItems, checkedItems } = get();
        return allItems.filter((item) => checkedItems.includes(item.itemId));
      },

      getTotalRuby: () => {
        const { getCheckedItems, getItemRuby } = get();
        const checkedItems = getCheckedItems();
        return checkedItems.reduce((total, item) => total + getItemRuby(item.itemId), 0);
      },

      getTotalCash: () => {
        const totalRuby = get().getTotalRuby();
        return totalRuby * 7.5;
      },

      isItemChecked: (itemId: number) => {
        const { checkedItems } = get();
        return checkedItems.includes(itemId);
      },

      getItemRuby: (itemId: number) => {
        const { allItems, customPrices } = get();
        // 커스텀 가격이 있으면 그것을 사용, 없으면 기본값 사용
        if (customPrices[itemId] !== undefined) {
          return customPrices[itemId];
        }
        const item = allItems.find((item) => item.itemId === itemId);
        return item ? item.ruby : 0;
      },

      setCustomPrice: (itemId: number, ruby: number) => {
        set((state) => ({
          customPrices: {
            ...state.customPrices,
            [itemId]: ruby,
          },
        }));
      },

      resetCustomPrice: (itemId: number) => {
        set((state) => {
          const newCustomPrices = { ...state.customPrices };
          delete newCustomPrices[itemId];
          return {
            customPrices: newCustomPrices,
          };
        });
      },

      resetAllCustomPrices: () => {
        set({ customPrices: {} });
      },
    }),
    {
      name: "item-check-storage", // localStorage 키
      // 필요한 상태만 persist
      partialize: (state) => ({
        checkedItems: state.checkedItems,
        customPrices: state.customPrices,
      }),
    }
  )
);

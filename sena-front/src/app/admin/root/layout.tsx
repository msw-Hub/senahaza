"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRoleStore } from "@/store/role";

interface SideBarMenu {
  name: string;
  url: string;
  path: string;
  rootOnly?: boolean; // ROOT 권한만 접근 가능한 메뉴인지 표시
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { role } = useRoleStore();

  const sideBarMenu: SideBarMenu[] = [
    { name: "아이템 관리", url: "items", path: "/admin/root/items" },
    { name: "패키지 관리", url: "packages", path: "/admin/root/packages" },
    { name: "통계 관리", url: "stats", path: "/admin/root/stats" },
    { name: "실시간 통계 관리", url: "liveStats", path: "/admin/root/liveStats" },
    { name: "로그 관리", url: "logs", path: "/admin/root/logs", rootOnly: true },
    { name: "회원 관리", url: "users", path: "/admin/root/users", rootOnly: true },
    { name: "승인 관리", url: "approve", path: "/admin/root/approve", rootOnly: true },
    { name: "IP 로그 관리", url: "iplog", path: "/admin/root/iplog", rootOnly: true },
  ];

  const pathname = usePathname();

  // ROOT 권한에 따라 메뉴 필터링
  const filteredMenu = sideBarMenu.filter((item) => !item.rootOnly || role === "ROOT");

  return (
    <div className="h-full flex justify-center items-start bg-foreground">
      {/* 왼쪽 사이드 바 메뉴 */}
      <div className="flex flex-col h-full">
        {filteredMenu.map((item) => (
          <React.Fragment key={item.name}>
            <Link href={item.path} className={`px-20 py-3 transition text-nowrap font-medium ${pathname === item.path ? "bg-[#f5f5f5] text-black" : "text-gray-500 hover:bg-[#f5f5f5] hover:text-black"}`}>
              {item.name}
            </Link>
          </React.Fragment>
        ))}
      </div>
      <div className="h-full flex-1 p-8 bg-background">{children}</div>
    </div>
  );
}

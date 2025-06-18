"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface SideBarMenu {
  name: string;
  url: string;
  path: string;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sideBarMenu: SideBarMenu[] = [
    { name: "승인 관리", url: "approve", path: "/admin/root/approve" },
    { name: "회원 관리", url: "users", path: "/admin/root/users" },
    { name: "패키지 관리", url: "packages", path: "/admin/root/packages" },
    { name: "아이템 관리", url: "items", path: "/admin/root/items" },
    { name: "통계 관리", url: "stats", path: "/admin/root/stats" },
  ];

  const pathname = usePathname();

  return (
    <div className="h-full flex justify-center items-start bg-foreground">
      {/* 왼쪽 사이드 바 메뉴 */}
      <div className="flex flex-col h-full">
        {sideBarMenu.map((item) => (
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

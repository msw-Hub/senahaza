import React from "react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({ className = "", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}></div>;
}

// 전체 페이지 로딩 컴포넌트
export function PageLoading({ message = "로딩 중..." }: { message?: string }) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 min-h-[400px]">
      <LoadingSpinner size="lg" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

// 테이블 로딩 컴포넌트
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4 py-3 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}

// 카드 그리드 로딩 컴포넌트
export function CardGridLoading({ cards = 8 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full animate-pulse">
      {[...Array(cards)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
      ))}
    </div>
  );
}

// 차트 로딩 컴포넌트
export function ChartLoading({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`w-full ${height} bg-gray-200 rounded-lg animate-pulse flex items-center justify-center`}>
      <div className="text-gray-400">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}

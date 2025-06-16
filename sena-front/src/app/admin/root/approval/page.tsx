"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";

interface SignupRequest {
  dept: string; // 사용자 부서
  email: string; // 사용자 이메일
  name: string; // 사용자 이름
  pendingAdminId: string; // 승인 대기 중인 관리자 ID
  requestedAt: string; // 요청 일시
  tel: string; // 사용자 전화번호
}

interface SignupRequestList {
  count: number; // 승인 대기 중인 사용자 수
  signList: SignupRequest[]; // 승인 대기 중인 사용자 목록
}

export default function ApprovePage() {
  // 이 페이지는 관리자 전용 페이지로, 토큰 검증은 미들웨어에서 처리됨
  // 따라서 이곳에서는 별도의 인증 로직이 필요 없음
  //구현해야할 기능 리스트
  // 1. 회원가입 승인 대기 중인 사용자 목록 조회
  // 2. 사용자 승인/거절 기능

  const [signupReqs, setSignupReqs] = useState<SignupRequestList>({
    count: 0,
    signList: [],
  });

  //가입 승인 리스트 제목
  const signupReqTitle = ["부서", "이메일", "이름", "전화번호", "요청 일시", "승인", "거절"];

  // 승인 대기 중인 사용자 목록을 조회하는 API 호출
  const handleSignupApprove = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/root/signList`, { withCredentials: true });

      // 승인 대기 중인 사용자 목록을 상태에 저장
      setSignupReqs(response.data);
      console.log("승인 대기 중인 사용자 목록:", response.data);
    } catch (error) {
      console.error("승인 요청 중 오류 발생", error);
      alert("승인 요청 중 오류가 발생했습니다.");
    }
  };

  // 승인
  const handleApprove = async (pendingAdminId: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/root/signList/approve`, { pendingAdminIds: [pendingAdminId] }, { withCredentials: true });
      if (response.status === 200) {
        alert("사용자 승인이 완료되었습니다.");
        handleSignupApprove(); // 승인 후 목록 갱신
      } else {
        alert("사용자 승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 승인 중 오류 발생", error);
      alert("사용자 승인 중 오류가 발생했습니다.");
    }
  };

  // 거절
  const handleReject = async (pendingAdminId: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/root/signList/reject`, { pendingAdminIds: [pendingAdminId] }, { withCredentials: true });
      if (response.status === 200) {
        alert("사용자 거절이 완료되었습니다.");
        handleSignupApprove(); // 거절 후 목록 갱신
      } else {
        alert("사용자 거절에 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 거절 중 오류 발생", error);
      alert("사용자 거절 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    handleSignupApprove();
  }, []); // 컴포넌트가 마운트될 때 승인 대기 중인 사용자 목록을 조회

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-4">
      <h1 className="text-black font-bold text-xl">가입 요청</h1>
      <div className="relative w-full">
        <input type="text" className="bg-foreground border border-gray-300 rounded-sm pl-10 p-2 w-[400px]" placeholder="사용자 이름 또는 아이디를 검색해주세요" />
        <i className="xi-search absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"></i>
      </div>
      {/* 승인 리스트 */}
      <div className="w-full h-full bg-foreground border border-gray-300 rounded-sm px-4 py-2 overflow-y-auto grid grid-cols-[1fr_1fr_1fr_1fr_1fr_0.2fr_0.2fr] grid-rows-12">
        {signupReqTitle.map((title, index) => (
          <span key={index} className={"flex items-center font-bold text-gray-700 border-b border-gray-300 h-12 " + (index === 5 || index === 6 ? "justify-center" : "justify-start")}>
            {title}
          </span>
        ))}
        {signupReqs.signList.map((req, index) => (
          <React.Fragment key={index}>
            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{req.dept}</span>
            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{req.email}</span>
            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{req.name}</span>
            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{req.tel}</span>
            <span className="text-gray-700 border-b border-gray-200 h-12 flex items-center">{new Date(req.requestedAt).toLocaleString()}</span>
            <div onClick={() => handleApprove(req.pendingAdminId)} className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-12">
              <i className="xi-check "></i>
            </div>
            <div onClick={() => handleReject(req.pendingAdminId)} className="flex items-center justify-center text-gray-700 border-b border-gray-200 h-12">
              <i className="xi-close"></i>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

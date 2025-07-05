"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  // 입력 값 변경 핸들러
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // 로그인 요청
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        loginForm,
        { withCredentials: true } // httpOnly 쿠키를 받으려면 필요
      );
      if (response.status === 200) {
        // 토큰을 httpOnly 쿠키로 저장하려면 서버에서 Set-Cookie로 내려줘야 함
        // 프론트엔드에서는 httpOnly 쿠키를 직접 저장/읽을 수 없음
        // 만약 토큰이 response.data.token으로 온다면, httpOnly가 아니라면 localStorage에 저장 가능
        // 하지만 httpOnly라면 아래처럼 안내만 가능
        console.log("로그인 성공", response.data);

        // 예시: httpOnly가 아닌 경우(로컬스토리지 저장)
        // localStorage.setItem("token", response.data.token);

        // 로그인 후 페이지 이동
        router.push("/admin/root/approve"); // 관리자 승인 페이지로 이동
      } else {
        console.error("로그인 실패", response.data);
        alert("로그인에 실패했습니다.");
      }
    } catch (error: unknown) {
      console.error("로그인 에러", error);
      alert("로그인 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">관리자 로그인</h2>
          <p className="mt-2 text-center text-sm text-gray-600">관리자 계정으로 시스템에 접속하세요</p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginForm.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-all"
                placeholder="이메일"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginForm.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 transition-all"
                placeholder="비밀번호"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform">
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              로그인
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin/signup")}
              className="relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
              새 계정 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

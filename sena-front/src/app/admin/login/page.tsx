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
    } catch (error: any) {
      console.error("로그인 에러", error);
      alert("로그인 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-6" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold text-center text-gray-800">관리자 로그인</h2>
        <div>
          <label htmlFor="email" className="block text-gray-700 mb-1">
            이메일
          </label>
          <input type="email" id="email" name="email" value={loginForm.email} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="이메일을 입력하세요" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 mb-1">
            비밀번호
          </label>
          <input type="password" id="password" name="password" value={loginForm.password} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="비밀번호를 입력하세요" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          로그인
        </button>
      </form>
    </div>
  );
}

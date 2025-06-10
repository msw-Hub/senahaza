"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignupForm {
  name: string; //이름
  dept: string; //부서
  email: string; // 이메일
  password: string; // 비밀번호
  passwordConfirm: string; // 비밀번호 확인 (선택)
  tel: string; // 전화번호
}

export default function SignupPage() {
  const router = useRouter();

  const [signupForm, setSignupForm] = useState<SignupForm>({
    name: "",
    dept: "",
    email: "",
    password: "",
    passwordConfirm: "",
    tel: "",
  });

  // 회원가입 폼 변경 핸들러
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    // tel 필드일 경우 -을 자동으로 추가
    if (event.target.name === "tel") {
      const value = event.target.value.replace(/[^0-9]/g, ""); // 숫자만 허용
      const formattedValue = value.length < 4 ? value : value.length < 8 ? value.replace(/(\d{3})(\d{1,4})/, "$1-$2") : value.replace(/(\d{3})(\d{3,4})(\d{1,4})/, "$1-$2-$3"); // 4글자부터 변환
      setSignupForm((prev) => ({
        ...prev,
        tel: formattedValue,
      }));
    } else {
      const { name, value } = event.target;
      setSignupForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    //이름 확인 로직 빈칸만 아니면됨
    if (signupForm.name.trim() === "") {
      alert("이름을 입력해주세요.");
      return;
    }

    // 부서 확인 로직 빈칸만 아니면됨
    if (signupForm.dept.trim() === "") {
      alert("부서를 입력해주세요.");
      return;
    }

    // 이메일 확인 로직
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupForm.email)) {
      alert("유효한 이메일 주소를 입력해주세요.");
      return;
    }

    // 비밀번호 확인 로직 4자리 이상
    if (signupForm.password.length < 8) {
      alert("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    // 비밀번호는 영문, 숫자, 특수문자를 포함한 8~20자리
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
    if (!passwordRegex.test(signupForm.password)) {
      alert("비밀번호는 영문, 숫자, 특수문자를 포함한 8~20자리여야 합니다.");
      return;
    }

    // 비밀번호 confirm 확인 로직
    if (signupForm.password !== signupForm.passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 전화번호 확인 로직
    const telRegex = /^\d{2,3}-\d{3,4}-\d{4}$/; // 000-0000-0000 형식
    if (!telRegex.test(signupForm.tel)) {
      alert("유효한 전화번호를 입력해주세요.");
      return;
    }

    console.log(signupForm);
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
      name: signupForm.name,
      dept: signupForm.dept,
      email: signupForm.email,
      password: signupForm.password,
      tel: signupForm.tel,
    });
    if (response.status === 200) {
      // 회원가입 성공 처리
      alert(response.data.message || "회원가입이 완료되었습니다.");
      router.push("/admin/login");
    } else {
      // 회원가입 실패 처리
      alert(response.data.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-6" onSubmit={handleSignup}>
        <h2 className="text-2xl font-bold text-center text-gray-800">관리자 회원가입</h2>
        <div>
          <label htmlFor="name" className="block text-gray-700 mb-1">
            이름
          </label>
          <input type="text" id="name" name="name" value={signupForm.name} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="이름을 입력하세요" required />
        </div>
        <div>
          <label htmlFor="dept" className="block text-gray-700 mb-1">
            부서
          </label>
          <input type="text" id="dept" name="dept" value={signupForm.dept} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="부서를 입력하세요" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-gray-700 mb-1">
            이메일
          </label>
          <input type="email" id="email" name="email" value={signupForm.email} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="이메일을 입력하세요" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 mb-1">
            비밀번호
          </label>
          <input type="password" id="password" name="password" value={signupForm.password} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="비밀번호를 입력하세요" required />
        </div>
        <div>
          <label htmlFor="passwordConfirm" className="block text-gray-700 mb-1">
            비밀번호 확인
          </label>
          <input type="password" id="passwordConfirm" name="passwordConfirm" value={signupForm.passwordConfirm} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="비밀번호를 다시 입력하세요" required />
        </div>
        <div>
          <label htmlFor="tel" className="block text-gray-700 mb-1">
            전화번호
          </label>
          <input type="tel" id="tel" name="tel" value={signupForm.tel} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="전화번호를 입력하세요" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          회원가입
        </button>
      </form>
    </div>
  );
}

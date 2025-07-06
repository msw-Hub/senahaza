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

  // 비밀번호 유효성 검사 상태
  const [passwordValidation, setPasswordValidation] = useState({
    hasLetter: false,
    hasNumber: false,
    hasSpecial: false,
    hasValidLength: false,
  });

  // 비밀번호 확인 일치 여부
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

  // 비밀번호 표시/숨김 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // 회원가입 폼 변경 핸들러
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    // tel 필드일 경우 -을 자동으로 추가 (00-000-0000 또는 000-0000-0000 형식, 최대 11자리)
    if (name === "tel") {
      const numericValue = value.replace(/[^0-9]/g, ""); // 숫자만 허용

      // 최대 11자리까지만 허용
      const limitedValue = numericValue.slice(0, 11);

      // 자동 포맷팅: 000-0000-0000 또는 00-000-0000 형식
      let formattedValue = limitedValue;

      if (limitedValue.length >= 3) {
        // 첫 3자리 입력
        formattedValue = limitedValue.slice(0, 3);

        if (limitedValue.length >= 4) {
          formattedValue += "-" + limitedValue.slice(3, 7);

          if (limitedValue.length >= 8) {
            formattedValue += "-" + limitedValue.slice(7, 11);
          }
        }
      }

      setSignupForm((prev) => ({
        ...prev,
        tel: formattedValue,
      }));
    } else if (name === "password") {
      // 비밀번호 유효성 검사
      const hasLetter = /[A-Za-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*]/.test(value);
      const hasValidLength = value.length >= 8 && value.length <= 20;

      setPasswordValidation({
        hasLetter,
        hasNumber,
        hasSpecial,
        hasValidLength,
      });

      setSignupForm((prev) => ({
        ...prev,
        [name]: value,
      }));

      // 비밀번호 확인과 일치 여부 확인
      if (signupForm.passwordConfirm) {
        setPasswordMatch(value === signupForm.passwordConfirm);
      }
    } else if (name === "passwordConfirm") {
      setSignupForm((prev) => ({
        ...prev,
        [name]: value,
      }));

      // 비밀번호와 일치 여부 확인
      setPasswordMatch(signupForm.password === value);
    } else {
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

    // 전화번호 확인 로직 (00-000-0000 또는 000-0000-0000 형식)
    const telRegex = /^(\d{2}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4})$/;
    if (!telRegex.test(signupForm.tel)) {
      alert("유효한 전화번호를 입력해주세요. (00-000-0000 또는 000-0000-0000 형식)");
      return;
    }

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
      name: signupForm.name,
      dept: signupForm.dept,
      email: signupForm.email,
      password: signupForm.password,
      tel: signupForm.tel,
    });
    if (response.status === 200) {
      // 회원가입 성공 처리
      alert(response.data.message || "관리자 계정 생성 요청이 접수되었습니다. 승인을 기다려주세요.");
      router.push("/admin/login");
    } else {
      // 회원가입 실패 처리
      alert(response.data.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
    }
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">관리자 회원가입</h2>
          <p className="mt-2 text-center text-sm text-gray-600">새로운 관리자 계정을 생성하세요</p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSignup}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={signupForm.name}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="이름"
                  required
                />
              </div>

              <div>
                <label htmlFor="dept" className="block text-sm font-medium text-gray-700 mb-2">
                  부서
                </label>
                <input
                  type="text"
                  id="dept"
                  name="dept"
                  value={signupForm.dept}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="부서"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={signupForm.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="이메일"
                  required
                />
              </div>

              <div>
                <label htmlFor="tel" className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  id="tel"
                  name="tel"
                  value={signupForm.tel}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="전화번호"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={signupForm.password}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="비밀번호"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {signupForm.password && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center ${passwordValidation.hasValidLength ? "text-green-600" : "text-red-500"}`}>
                      <span className="mr-1">{passwordValidation.hasValidLength ? "✓" : "✗"}</span>
                      8-20자리
                    </div>
                    <div className={`text-xs flex items-center ${passwordValidation.hasLetter ? "text-green-600" : "text-red-500"}`}>
                      <span className="mr-1">{passwordValidation.hasLetter ? "✓" : "✗"}</span>
                      영문 포함
                    </div>
                    <div className={`text-xs flex items-center ${passwordValidation.hasNumber ? "text-green-600" : "text-red-500"}`}>
                      <span className="mr-1">{passwordValidation.hasNumber ? "✓" : "✗"}</span>
                      숫자 포함
                    </div>
                    <div className={`text-xs flex items-center ${passwordValidation.hasSpecial ? "text-green-600" : "text-red-500"}`}>
                      <span className="mr-1">{passwordValidation.hasSpecial ? "✓" : "✗"}</span>
                      특수문자 포함 (!@#$%^&*)
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    id="passwordConfirm"
                    name="passwordConfirm"
                    value={signupForm.passwordConfirm}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="비밀번호 확인"
                    required
                  />
                  <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPasswordConfirm ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {signupForm.passwordConfirm && passwordMatch !== null && (
                  <div className="mt-2">
                    <div className={`text-xs flex items-center ${passwordMatch ? "text-green-600" : "text-red-500"}`}>
                      <span className="mr-1">{passwordMatch ? "✓" : "✗"}</span>
                      {passwordMatch ? "비밀번호가 일치합니다" : "비밀번호가 일치하지 않습니다"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform ">
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </span>
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}

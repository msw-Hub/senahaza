import axios from "axios";

// 에러 메시지 매핑
const ERROR_MESSAGES = {
  VALIDATION_ERROR: "입력 데이터가 올바르지 않습니다.",
  ANALYTICS_ERROR: "분석 데이터 처리 중 오류가 발생했습니다.",
  SAME_ROLE_ERROR: "동일한 권한으로는 변경할 수 없습니다.",
  PENDING_ADMIN_NOT_FOUND: "승인 대기 중인 관리자를 찾을 수 없습니다.",
  INVALID_SORT_FIELD: "잘못된 정렬 필드입니다.",
  PAGE_OUT_OF_RANGE: "페이지 범위를 벗어났습니다.",
  ADMIN_NOT_FOUND: "관리자를 찾을 수 없습니다.",
  INVALID_ADMIN_ROLE: "잘못된 관리자 권한입니다.",
  ADMIN_STATUS_INVALID: "관리자 상태가 유효하지 않습니다.",
  ALREADY_EXISTING_ITEM: "이미 존재하는 아이템입니다.",
  INVALID_FILE: "유효하지 않은 파일입니다.",
  IMAGE_UPLOAD_ERROR: "이미지 업로드 중 오류가 발생했습니다.",
  IMAGE_DELETE_ERROR: "이미지 삭제 중 오류가 발생했습니다.",
  INVALID_STATUS: "유효하지 않은 상태입니다.",
  ITEM_NOT_FOUND: "아이템을 찾을 수 없습니다.",
  PACKAGE_NOT_FOUND: "패키지를 찾을 수 없습니다.",
} as const;

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답이지만 에러 코드가 있는 경우 확인
    const { data } = response;

    if (data && data.errorCode && ERROR_MESSAGES[data.errorCode as keyof typeof ERROR_MESSAGES]) {
      const errorMessage = ERROR_MESSAGES[data.errorCode as keyof typeof ERROR_MESSAGES];

      // 에러 메시지 출력
      alert(errorMessage);

      // 추가적인 서버 메시지가 있다면 콘솔에 출력
      if (data.message) {
        console.error(`[${data.errorCode}] ${data.message}`);
      }

      // 에러로 처리하여 catch 블록으로 보냄
      return Promise.reject({
        response: response,
        isBusinessError: true,
        errorCode: data.errorCode,
        message: data.message,
      });
    }

    // 정상 성공 응답은 그대로 반환
    return response;
  },
  (error) => {
    // 에러 응답 처리
    if (error.response) {
      const { data, status } = error.response;

      // HTTP 403 Forbidden 상태 코드 처리
      if (status === 403) {
        alert("접근 권한이 없습니다.");
        console.error("Access denied (403):", error.response);
        return Promise.reject(error);
      }

      // 서버에서 온 에러 코드 확인 (code 또는 errorCode 둘 다 지원)
      const errorCode = data?.code || data?.errorCode;
      if (errorCode && ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES]) {
        const errorMessage = ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES];

        // 에러 메시지 출력
        alert(errorMessage);

        // 추가적인 서버 메시지가 있다면 콘솔에 출력
        if (data.message) {
          console.error(`[${errorCode}] ${data.message}`);
        }
      } else {
        // 정의되지 않은 에러 코드인 경우 기본 메시지
        const defaultMessage = data?.message || "알 수 없는 오류가 발생했습니다.";
        alert(defaultMessage);
        console.error("Unknown error:", error.response);
      }
    } else if (error.request) {
      // 네트워크 오류
      alert("네트워크 연결을 확인해주세요.");
      console.error("Network error:", error.request);
    } else {
      // 기타 오류
      alert("요청 처리 중 오류가 발생했습니다.");
      console.error("Request error:", error.message);
    }

    // 에러를 다시 throw하여 호출하는 곳에서 catch할 수 있도록 함
    return Promise.reject(error);
  }
);

export default apiClient;

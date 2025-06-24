package org.example.filter;



import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingResponseWrapper;

import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class ResponseCachingFilter implements Filter {
    /**
     * 이 필터는 응답 본문을 캐싱하여 나중에 로그나 다른 용도로 사용할 수 있도록 합니다.
     * ContentCachingResponseWrapper를 사용하여 응답 본문을 캐싱합니다.
     */

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper((HttpServletResponse) response);
        chain.doFilter(request, wrappedResponse);
        wrappedResponse.copyBodyToResponse();
    }
}
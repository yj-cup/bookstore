package com.bookstore.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/** Enforces a session-bound synchronizer token on every state-changing request. */
public final class CsrfFilter implements Filter {
    public static final String SESSION_ATTRIBUTE = "csrfToken";
    public static final String REQUEST_ATTRIBUTE = "csrfToken";
    public static final String HEADER_NAME = "X-CSRF-Token";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (!(request instanceof HttpServletRequest) || !(response instanceof HttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        if (isSafeMethod(httpRequest.getMethod())) {
            String token = getOrCreateToken(httpRequest.getSession(true));
            httpRequest.setAttribute(REQUEST_ATTRIBUTE, token);
            httpResponse.setHeader(HEADER_NAME, token);
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = httpRequest.getSession(false);
        String expected = session == null ? null : (String) session.getAttribute(SESSION_ATTRIBUTE);
        String supplied = httpRequest.getHeader(HEADER_NAME);
        if (supplied == null || supplied.isEmpty()) {
            supplied = httpRequest.getParameter(REQUEST_ATTRIBUTE);
        }

        if (!tokensMatch(expected, supplied)) {
            reject(httpRequest, httpResponse);
            return;
        }

        httpRequest.setAttribute(REQUEST_ATTRIBUTE, expected);
        httpResponse.setHeader(HEADER_NAME, expected);
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {}

    private static boolean isSafeMethod(String method) {
        return "GET".equalsIgnoreCase(method)
                || "HEAD".equalsIgnoreCase(method)
                || "OPTIONS".equalsIgnoreCase(method);
    }

    private static String getOrCreateToken(HttpSession session) {
        synchronized (session) {
            String token = (String) session.getAttribute(SESSION_ATTRIBUTE);
            if (token == null) {
                byte[] bytes = new byte[32];
                RANDOM.nextBytes(bytes);
                token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
                session.setAttribute(SESSION_ATTRIBUTE, token);
            }
            return token;
        }
    }

    private static boolean tokensMatch(String expected, String supplied) {
        if (expected == null || supplied == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8));
    }

    private static void reject(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"CSRF token validation failed\"}");
        } else {
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("CSRF token validation failed");
        }
    }
}
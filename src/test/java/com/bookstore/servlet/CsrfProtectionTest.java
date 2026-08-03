package com.bookstore.servlet;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bookstore.dao.UserDao;
import com.bookstore.entity.User;
import com.bookstore.filter.CsrfFilter;
import java.io.PrintWriter;
import java.io.StringWriter;
import javax.servlet.FilterChain;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CsrfProtectionTest {
    private UserDao userDao;
    private AuthServlet servlet;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private HttpSession session;
    private FilterChain chain;

    @BeforeEach
    void setUp() throws Exception {
        userDao = mock(UserDao.class);
        servlet = new AuthServlet(userDao);
        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        session = mock(HttpSession.class);
        chain = mock(FilterChain.class);

        User admin = new User("a1", "admin", null, "admin", "", "", "", "");
        User target = new User("u1", "victim", null, "user", "", "", "", "");
        when(request.getMethod()).thenReturn("POST");
        when(request.getParameter("action")).thenReturn("deleteUser");
        when(request.getParameter("id")).thenReturn("u1");
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(CsrfFilter.SESSION_ATTRIBUTE)).thenReturn("server-token");
        when(session.getAttribute("currentUser")).thenReturn(admin);
        when(userDao.findById("u1")).thenReturn(target);
        when(userDao.delete("u1")).thenReturn(true);
        when(response.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
    }

    @Test
    void missingTokenIsRejectedBeforeTheDestructiveServlet() throws Exception {
        when(request.getHeader("Accept")).thenReturn("application/json");

        new CsrfFilter().doFilter(request, response, chain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(chain, never()).doFilter(any(ServletRequest.class), any(ServletResponse.class));
        verifyNoInteractions(userDao);
    }

    @Test
    void safeRequestCreatesAReusableSessionToken() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        when(request.getSession(true)).thenReturn(session);
        when(session.getAttribute(CsrfFilter.SESSION_ATTRIBUTE)).thenReturn(null);
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);

        new CsrfFilter().doFilter(request, response, chain);

        verify(session).setAttribute(eq(CsrfFilter.SESSION_ATTRIBUTE), token.capture());
        assertTrue(token.getValue().length() >= 43);
        verify(response).setHeader(CsrfFilter.HEADER_NAME, token.getValue());
        verify(chain).doFilter(request, response);
    }

    @Test
    void matchingSessionTokenPreservesTheLegitimateAdminAction() throws Exception {
        when(request.getHeader(CsrfFilter.HEADER_NAME)).thenReturn("server-token");
        doAnswer(invocation -> {
            servlet.doPost(
                    (HttpServletRequest) invocation.getArgument(0),
                    (HttpServletResponse) invocation.getArgument(1));
            return null;
        }).when(chain).doFilter(any(ServletRequest.class), any(ServletResponse.class));

        new CsrfFilter().doFilter(request, response, chain);

        verify(userDao).delete("u1");
    }

    @Test
    void logoutCannotMutateTheSessionThroughGet() throws Exception {
        when(request.getParameter("action")).thenReturn("logout");

        servlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
        verify(session, never()).invalidate();
    }

    @Test
    void cartMutationCannotUseGetToBypassTheFilter() throws Exception {
        HttpServletRequest cartRequest = mock(HttpServletRequest.class);
        HttpServletResponse cartResponse = mock(HttpServletResponse.class);
        when(cartRequest.getParameter("action")).thenReturn("clear");

        new CartServlet().doGet(cartRequest, cartResponse);

        verify(cartResponse).sendError(
                HttpServletResponse.SC_METHOD_NOT_ALLOWED, "购物车变更只允许使用POST");
    }
}

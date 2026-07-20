package com.bookstore.filter;

import com.bookstore.entity.User;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

public class SecurityFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        HttpSession session = req.getSession(false);

        User currentUser = null;
        if (session != null) {
            currentUser = (User) session.getAttribute("currentUser");
        }

        // 权限判断逻辑：判定会话是否存在且用户角色为超级管理员
        if (currentUser == null) {
            // 未登录，存错误消息后重定向到登录页面
            req.setAttribute("auth_error", "您需要先登录管理员账号才能访问系统后台！");
            req.getRequestDispatcher("/WEB-INF/jsp/login.jsp").forward(req, resp);
        } else if (!"admin".equals(currentUser.getRole())) {
            // 已登录但角色非管理员，重定向回书籍商城首页（使用 redirect 避免 URL 不变）
            resp.sendRedirect(req.getContextPath() + "/books");
        } else {
            // 权限验证通过，予以放行
            chain.doFilter(request, response);
        }
    }

    @Override
    public void destroy() {}
}
package com.bookstore.filter;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class CharacterEncodingFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // 过滤器初始化逻辑
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        // 统一强制设定请求编码格式为 UTF-8，解决中文乱码问题
        req.setCharacterEncoding("UTF-8");
        resp.setCharacterEncoding("UTF-8");

        // 仅对动态请求设置 Content-Type，不覆盖静态资源（.js/.css/.png 等）的 MIME 类型
        String uri = req.getRequestURI();
        if (!uri.matches(".*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$")) {
            resp.setContentType("text/html;charset=UTF-8");
        }

        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // 过滤器销毁逻辑
    }
}
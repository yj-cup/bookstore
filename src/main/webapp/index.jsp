<%-- 
  Bookstore 首页重定向器 
  由于项目基于 MVC 设计，绝对不允许用户在没经过 Controller (Servlet) 的情况下直接浏览 View (JSP)。
  直接跳转至 /books 将触发 BookServlet 执行底层 JDBC 图书数据模型封装。
--%>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    // 重定向至 Servlet 处理映射
    response.sendRedirect(request.getContextPath() + "/books");
%>
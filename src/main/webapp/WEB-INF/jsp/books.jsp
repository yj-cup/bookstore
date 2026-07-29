<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%-- 
  【重要修正】
  标准 JSTL 1.2 引入 URI 必须为 http://java.sun.com/jsp/jstl/core
  千万不能写成含有 "/org/" 路径的错误格式 (例如 http://java.sun.com/jsp/org/jstl/core 会导致无法解析 taglib)
--%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>雅阁馆藏在线书屋 - 主页</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .book-card { transition: all 0.25s ease; border-radius: 12px; }
        .book-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .navbar-brand-custom { font-weight: 800; letter-spacing: 0.5px; }
    </style>
</head>
<body class="bg-light">

    <!-- 顶部状态栏及导航栏 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div class="container">
            <a class="navbar-brand navbar-brand-custom text-info" href="${pageContext.request.contextPath}/books">雅阁特色在线书屋</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link active" href="${pageContext.request.contextPath}/books">前台商城</a>
                    </li>
                    <c:if test="${not empty currentUser}">
                        <li class="nav-item">
                            <a class="nav-link" href="${pageContext.request.contextPath}/order?action=list">我的订单</a>
                        </li>
                    </c:if>
                    <c:if test="${currentUser.role == 'admin'}">
                        <li class="nav-item">
                            <a class="nav-link text-warning fw-bold" href="${pageContext.request.contextPath}/admin/manage/main">管理后台</a>
                        </li>
                    </c:if>
                </ul>
                <div class="d-flex align-items-center text-white">
                    <c:choose>
                        <c:when test="${empty currentUser}">
                            <a href="${pageContext.request.contextPath}/auth?action=loginView" class="btn btn-outline-info btn-sm">登录 / 注册</a>
                        </c:when>
                        <c:otherwise>
                            <span class="me-3 text-white-50">欢迎回来，<b class="text-info">${currentUser.username}</b> ➔</span>
                            <a href="${pageContext.request.contextPath}/cart" class="btn btn-info btn-sm position-relative me-3">
                                购物车
                                <c:if test="${not empty cart}">
                                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        ${fn:length(cart)}
                                    </span>
                                </c:if>
                            </a>
                            <form action="${pageContext.request.contextPath}/auth" method="POST" class="d-inline">
                                <input type="hidden" name="action" value="logout" />
                                <input type="hidden" name="csrfToken" value="${csrfToken}" />
                                <button type="submit" class="btn btn-outline-danger btn-sm">退出</button>
                            </form>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>
        </div>
    </nav>

    <!-- 顶层巨幕 -->
    <div class="bg-dark text-white py-5 mb-4">
        <div class="container">
            <h1 class="display-5 fw-bold">格物致知，雅室墨香</h1>
            <p class="lead text-white-50">基于经典 MVC 设计模式 + JSP / Servlet 自定义表现层 + JDBC 手写事务物理底层</p>
        </div>
    </div>

    <div class="container">
        <!-- 侧边过滤与搜索 -->
        <div class="row">
            <div class="col-md-3">
                <!-- 类别过滤器 -->
                <div class="card mb-4 shadow-sm">
                    <div class="card-header bg-white font-weight-bold">馆藏图书分类</div>
                    <div class="list-group list-group-flush">
                        <a href="${pageContext.request.contextPath}/books?category=ALL" class="list-group-item list-group-item-action ${selectedCategory == 'ALL' ? 'active' : ''}">全部图书</a>
                        <a href="${pageContext.request.contextPath}/books?category=Literature" class="list-group-item list-group-item-action ${selectedCategory == 'Literature' ? 'active' : ''}">文学经典</a>
                        <a href="${pageContext.request.contextPath}/books?category=Science" class="list-group-item list-group-item-action ${selectedCategory == 'Science' ? 'active' : ''}">前沿科学</a>
                        <a href="${pageContext.request.contextPath}/books?category=Technology" class="list-group-item list-group-item-action ${selectedCategory == 'Technology' ? 'active' : ''}">计算机技术</a>
                        <a href="${pageContext.request.contextPath}/books?category=Business" class="list-group-item list-group-item-action ${selectedCategory == 'Business' ? 'active' : ''}">商业财经</a>
                        <a href="${pageContext.request.contextPath}/books?category=Children" class="list-group-item list-group-item-action ${selectedCategory == 'Children' ? 'active' : ''}">儿童文学</a>
                    </div>
                </div>

                <!-- 搜素引擎 -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-white font-weight-bold">全网检索</div>
                    <div class="card-body">
                        <form action="${pageContext.request.contextPath}/books" method="GET">
                            <input type="hidden" name="category" value="${selectedCategory}" />
                            <div class="mb-3">
                                <input type="text" name="keyword" value="${searchQuery}" placeholder="关键字..." class="form-control form-control-sm" />
                            </div>
                            <div class="mb-3">
                                <select name="sortBy" class="form-select form-select-sm">
                                    <option value="DEFAULT" ${sortBy == 'DEFAULT' ? 'selected' : ''}>默认入库推荐</option>
                                    <option value="PRICE_LOW" ${sortBy == 'PRICE_LOW' ? 'selected' : ''}>价格：由低到高</option>
                                    <option value="PRICE_HIGH" ${sortBy == 'PRICE_HIGH' ? 'selected' : ''}>价格：由高到低</option>
                                    <option value="RATING" ${sortBy == 'RATING' ? 'selected' : ''}>评分高优先</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary btn-sm w-full">搜索图书</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- 右侧图书网格列表 -->
            <div class="col-md-9">
                <div class="row g-4">
                    <c:choose>
                        <c:when test="${empty books}">
                            <div class="col-12 text-center py-5 text-muted">
                                <h5>暂无符合当前过滤条件的馆藏图书记录！</h5>
                            </div>
                        </c:when>
                        <c:otherwise>
                            <c:forEach var="book" items="${books}">
                                <div class="col-md-4">
                                    <div class="card h-100 book-card shadow-sm">
                                        <img src="${book.coverImage}" class="card-img-top" style="height: 240px; object-fit: cover;" alt="${book.title}">
                                        <div class="card-body d-flex flex-column justify-content-between">
                                            <div>
                                                <h6 class="card-title text-truncate fw-bold mb-1">《${book.title}》</h6>
                                                <p class="text-muted mb-2 text-xs" style="font-size: 11px;">作者：${book.author} | 分类：${book.category}</p>
                                                <p class="card-text text-muted mb-3" style="font-size: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                                    ${book.description}
                                                </p>
                                            </div>
                                            <div>
                                                <div class="d-flex justify-content-between align-items-center mb-2">
                                                    <span class="text-danger fw-bold fs-5">¥${book.price}</span>
                                                    <span class="badge bg-secondary">在库 ${book.stock} 册</span>
                                                </div>
                                                <c:choose>
                                                    <c:when test="${book.stock > 0}">
                                                        <form action="${pageContext.request.contextPath}/cart" method="POST">
                                                            <input type="hidden" name="action" value="add" />
                                                            <input type="hidden" name="csrfToken" value="${csrfToken}" />
                                                            <input type="hidden" name="bookId" value="${book.id}" />
                                                            <button type="submit" class="btn btn-outline-primary btn-sm w-100">立即购书</button>
                                                        </form>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <button class="btn btn-secondary btn-sm w-100" disabled>无货下架</button>
                                                    </c:otherwise>
                                                </c:choose>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </c:forEach>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-dark text-white-50 py-4 mt-5">
        <div class="container text-center">
            <small>雅阁特色书屋 Java Web 版权所有 © 2026 | MVC 架构仿真教学大纲</small>
        </div>
    </footer>

</body>
</html>

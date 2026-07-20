<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>雅阁书店运营维护中心</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

    <!-- 顶栏 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand text-warning fw-bold" href="#">雅阁书店运营维护中心</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="${pageContext.request.contextPath}/books">返回前台商城</a>
                    </li>
                </ul>
                <div class="text-white">
                    安全登录身份：<span class="text-warning font-weight-bold">超级管理员(admin)</span>
                    <a href="${pageContext.request.contextPath}/auth?action=logout" class="btn btn-outline-danger btn-sm ms-3">退出</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <div class="row">
            <!-- 模块1：图书上架与库存管控 CRUD -->
            <div class="col-md-12 mb-5">
                <div class="card shadow-sm">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 fw-bold">馆藏图书库存运营控制</h5>
                        <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addBookModal">新增上架新图书</button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover align-middle text-xs" style="font-size: 12px;">
                                <thead>
                                    <tr>
                                        <th>图书图片</th>
                                        <th>编号</th>
                                        <th>图书名称</th>
                                        <th>作者</th>
                                        <th>类别</th>
                                        <th>售价</th>
                                        <th>在库余量</th>
                                        <th>书评星级</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <c:forEach var="book" items="${books}">
                                        <tr>
                                            <td>
                                                <img src="${book.coverImage}" style="width: 30px; height: 40px; object-fit: cover;" class="rounded">
                                            </td>
                                            <td class="font-mono text-muted">${book.id}</td>
                                            <td><b>${book.title}</b></td>
                                            <td>${book.author}</td>
                                            <td><span class="badge bg-secondary">${book.category}</span></td>
                                            <td class="text-danger fw-bold">¥${book.price}</td>
                                            <td>
                                                <span class="badge ${book.stock < 10 ? 'bg-danger' : 'bg-success'}">${book.stock} 册</span>
                                            </td>
                                            <td>⭐ ${book.rating}</td>
                                            <td>
                                                <a href="${pageContext.request.contextPath}/admin/manage/deleteBook?id=${book.id}" class="btn btn-outline-danger btn-sm py-0 text-xs" onclick="return confirm('您确认需要立刻物理下架并删除该书籍记录吗？')">删除</a>
                                            </td>
                                        </tr>
                                    </c:forEach>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 模块2：全网会员身份证档案 -->
            <div class="col-md-6 mb-4">
                <div class="card shadow-sm h-100">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-0 fw-bold">会员实名及身份证档案库</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover text-xs align-middle" style="font-size: 12px;">
                                <thead>
                                    <tr>
                                        <th>用户名</th>
                                        <th>身份证</th>
                                        <th>手机</th>
                                        <th>QQ</th>
                                        <th>权限</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <c:forEach var="user" items="${users}">
                                        <tr>
                                            <td><b>${user.username}</b></td>
                                            <td class="font-mono text-muted" style="font-size:11px;">${user.idCard}</td>
                                            <td>${user.phone}</td>
                                            <td>${user.qq}</td>
                                            <td>
                                                <span class="badge ${user.role == 'admin' ? 'bg-danger' : 'bg-info'}">${user.role}</span>
                                            </td>
                                        </tr>
                                    </c:forEach>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 模块3：全网实名交易订单 -->
            <div class="col-md-6 mb-4">
                <div class="card shadow-sm h-100">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-0 fw-bold">全网成交订单及事务物流调度</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover text-xs align-middle" style="font-size: 12px;">
                                <thead>
                                    <tr>
                                        <th>单号</th>
                                        <th>买家</th>
                                        <th>实付金额</th>
                                        <th>物流状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <c:forEach var="order" items="${orders}">
                                        <tr>
                                            <td class="font-mono text-muted" style="font-size: 11px;">${order.id}</td>
                                            <td>${order.receiverName}</td>
                                            <td class="text-danger fw-bold">¥${order.totalAmount}</td>
                                            <td>
                                                <span class="badge ${order.status == 'Pending' ? 'bg-warning text-dark' : order.status == 'Shipped' ? 'bg-primary' : 'bg-success'}">
                                                    ${order.status == 'Pending' ? '待出库' : order.status == 'Shipped' ? '派送中' : '已签收'}
                                                </span>
                                            </td>
                                            <td>
                                                <form action="${pageContext.request.contextPath}/admin/manage/updateOrderStatus" method="POST" class="d-inline">
                                                    <input type="hidden" name="id" value="${order.id}" />
                                                    <select name="status" onchange="this.form.submit()" class="form-select form-select-sm py-0 text-xs d-inline-block" style="width: 80px;">
                                                        <option value="Pending" ${order.status == 'Pending' ? 'selected' : ''}>待发</option>
                                                        <option value="Shipped" ${order.status == 'Shipped' ? 'selected' : ''}>发货</option>
                                                        <option value="Completed" ${order.status == 'Completed' ? 'selected' : ''}>签收</option>
                                                    </select>
                                                </form>
                                            </td>
                                        </tr>
                                    </c:forEach>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 图书添加模态框 (Bootstrap) -->
    <div class="modal fade" id="addBookModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <form action="${pageContext.request.contextPath}/admin/manage/addBook" method="POST">
                    <div class="modal-header">
                        <h5 class="modal-title fw-bold">上架全新馆藏图书</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-xs" style="font-size: 12px;">
                        <div class="mb-3">
                            <label class="form-label">书籍名称</label>
                            <input type="text" name="title" class="form-control" required placeholder="请输入图书名字..." />
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">作者姓名</label>
                                <input type="text" name="author" class="form-control" required placeholder="如 鲁迅" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">图书分类</label>
                                <select name="category" class="form-select">
                                    <option value="Literature">文学经典</option>
                                    <option value="Science">前沿科学</option>
                                    <option value="Technology">计算机技术</option>
                                    <option value="Business">商业财经</option>
                                    <option value="Children">儿童文学</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">单价售价 (¥)</label>
                                <input type="number" step="0.01" name="price" class="form-control" required placeholder="如 59.00" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">在库物理库存量 (本)</label>
                                <input type="number" name="stock" class="form-control" required placeholder="入库本数" />
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">自定义书评星级</label>
                                <input type="number" step="0.1" min="1" max="5" name="rating" class="form-control" value="4.8" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">图书图片链接</label>
                                <input type="text" name="coverImage" class="form-control" placeholder="可留空，默认经典封面..." />
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">图书梗概与内容推荐</label>
                            <textarea name="description" rows="3" class="form-control" placeholder="简短描述图书大纲..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="submit" class="btn btn-primary fw-bold">核对无误，确认上架</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Bootstrap 动态加载 -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>
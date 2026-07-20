<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>我的图书购物车 - 结算</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

    <div class="container py-5">
        <div class="row">
            <!-- 左侧购物车明细 -->
            <div class="col-md-7 mb-4">
                <div class="card shadow-sm border-0 rounded-3">
                    <div class="card-header bg-white py-3">
                        <h5 class="mb-0 fw-bold">我的购物车明细</h5>
                    </div>
                    <div class="card-body">
                        <c:choose>
                            <c:when test="${empty cart}">
                                <div class="text-center py-5 text-muted">
                                    <p>您的购物车现在还是空的，赶紧去商城加购几本书吧！</p>
                                    <a href="${pageContext.request.contextPath}/books" class="btn btn-primary btn-sm">返回商城</a>
                                </div>
                            </c:when>
                            <c:otherwise>
                                <div class="table-responsive">
                                    <table class="table table-align-middle">
                                        <thead>
                                            <tr>
                                                <th>图书封面</th>
                                                <th>书籍名称</th>
                                                <th>成交单价</th>
                                                <th>数量</th>
                                                <th>删除</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <c:forEach var="item" items="${cart}">
                                                <tr>
                                                    <td>
                                                        <img src="${item.bookCover}" style="width: 40px; height: 50px; object-fit: cover;" class="rounded">
                                                    </td>
                                                    <td>${item.bookTitle}</td>
                                                    <td class="text-danger fw-bold">¥${item.bookPrice}</td>
                                                    <td>
                                                        <form action="${pageContext.request.contextPath}/cart" method="POST" style="width: 80px;">
                                                            <input type="hidden" name="action" value="update" />
                                                            <input type="hidden" name="bookId" value="${item.bookId}" />
                                                            <input type="number" name="qty" value="${item.quantity}" min="1" class="form-control form-control-sm text-center" onchange="this.form.submit()" />
                                                        </form>
                                                    </td>
                                                    <td>
                                                        <a href="${pageContext.request.contextPath}/cart?action=remove&bookId=${item.bookId}" class="btn btn-outline-danger btn-sm">移除</a>
                                                    </td>
                                                </tr>
                                            </c:forEach>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-4">
                                    <a href="${pageContext.request.contextPath}/cart?action=clear" class="btn btn-outline-secondary btn-sm">一键清空购物车</a>
                                    <a href="${pageContext.request.contextPath}/books" class="btn btn-outline-primary btn-sm">继续选书</a>
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </div>
                </div>
            </div>

            <!-- 右侧收货人档案及订单创建 -->
            <div class="col-md-5">
                <div class="card shadow-sm border-0 rounded-3 bg-white">
                    <div class="card-header bg-white py-3 border-0">
                        <h5 class="mb-0 fw-bold">极速订单结算</h5>
                    </div>
                    <div class="card-body">
                        <!-- 出错提示区 -->
                        <c:if test="${not empty checkout_error}">
                            <div class="alert alert-danger text-xs py-2">${checkout_error}</div>
                        </c:if>

                        <form action="${pageContext.request.contextPath}/order" method="POST">
                            <div class="mb-3">
                                <label class="form-label text-muted text-xs">实名收货人 <span class="text-danger">*</span></label>
                                <input type="text" name="receiverName" class="form-control form-control-sm" required placeholder="请填写买家收货姓名..." value="${currentUser.username}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted text-xs">11位有效手机号码 <span class="text-danger">*</span></label>
                                <input type="text" name="phone" pattern="^1[3-9]\d{9}$" class="form-control form-control-sm" required placeholder="如 13912345678" value="${currentUser.phone}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted text-xs">联系 QQ <span class="text-muted">(选填)</span></label>
                                <input type="text" name="qq" class="form-control form-control-sm" placeholder="如 348912345" value="${currentUser.qq}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted text-xs">18位实名身份证号 <span class="text-danger">*</span></label>
                                <input type="text" name="idCard" pattern="^\d{17}[0-9Xx]$" class="form-control form-control-sm" required placeholder="18位中国大陆公民身份证" value="${currentUser.idCard}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted text-xs">绑定邮箱</label>
                                <input type="email" name="email" class="form-control form-control-sm" placeholder="如 exam@qq.com" value="${currentUser.email}" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label text-muted text-xs">物流配送收货详细地址 <span class="text-danger">*</span></label>
                                <textarea name="address" rows="3" class="form-control form-control-sm" required placeholder="请填写详细的寝室、家庭或工作收货地址..."></textarea>
                            </div>

                            <hr class="my-4">

                            <!-- 总价计算 -->
                            <c:set var="total" value="0" />
                            <c:forEach var="item" items="${cart}">
                                <c:set var="total" value="${total + item.bookPrice * item.quantity}" />
                            </c:forEach>

                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <span class="fw-bold text-muted">实付款总计:</span>
                                <h3 class="text-danger fw-extrabold mb-0">¥${total}</h3>
                            </div>

                            <c:choose>
                                <c:when test="${empty cart}">
                                    <button class="btn btn-secondary w-100" disabled>购物车空，无法提交</button>
                                </c:when>
                                <c:otherwise>
                                    <button type="submit" class="btn btn-danger btn-lg w-100 fw-bold">核准信息，极速下单</button>
                                </c:otherwise>
                            </c:choose>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
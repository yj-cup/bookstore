<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>我的个人订单历史</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

    <!-- 导航栏 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand text-info" href="${pageContext.request.contextPath}/books">雅阁特色在线书屋</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="${pageContext.request.contextPath}/books">前台商城</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="${pageContext.request.contextPath}/order?action=list">我的订单</a>
                    </li>
                </ul>
                <div class="text-white">
                    买家账号：<span class="text-info font-weight-bold">${currentUser.username}</span>
                </div>
            </div>
        </div>
    </nav>

    <div class="container py-5">
        <h3 class="fw-bold mb-4">我的买家购书订单历史</h3>

        <c:choose>
            <c:when test="${empty orders}">
                <div class="text-center py-5 bg-white rounded-3 shadow-sm">
                    <p class="text-muted">您目前在系统上没有任何图书消费交易！</p>
                    <a href="${pageContext.request.contextPath}/books" class="btn btn-primary btn-sm">立即去买几本书</a>
                </div>
            </c:when>
            <c:otherwise>
                <div class="space-y-4">
                    <c:forEach var="order" items="${orders}">
                        <div class="card mb-4 shadow-sm border-0">
                            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="text-muted">订单号：</span>
                                    <span class="font-mono text-dark fw-bold">${order.id}</span>
                                    <span class="mx-3 text-white-50">|</span>
                                    <span class="text-muted">下单日期：${order.orderTime}</span>
                                </div>
                                <span class="badge ${order.status == 'Pending' ? 'bg-warning text-dark' : order.status == 'Shipped' ? 'bg-primary' : order.status == 'Cancelled' ? 'bg-secondary' : 'bg-success'}">
                                    ${order.status == 'Pending' ? '待发货 (已锁库存)' : order.status == 'Shipped' ? '配送中' : order.status == 'Cancelled' ? '已取消' : '交易完成'}
                                </span>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-8">
                                        <h6 class="fw-bold mb-3">所购图书清单</h6>
                                        <c:forEach var="detail" items="${order.items}">
                                            <div class="d-flex align-items-center gap-3 mb-3 border-bottom pb-2">
                                                <img src="${detail.bookCover}" style="width: 35px; height: 45px; object-fit: cover;" class="rounded shadow-sm">
                                                <div class="flex-grow-1">
                                                    <span class="fw-bold text-xs">《${detail.bookTitle}》</span>
                                                    <span class="text-muted d-block" style="font-size: 11px;">数量：${detail.quantity} 册 | 单价：¥${detail.bookPrice}</span>
                                                </div>
                                                <span class="fw-bold text-dark font-mono">¥${detail.bookPrice * detail.quantity}</span>
                                            </div>
                                        </c:forEach>
                                    </div>
                                    <div class="col-md-4 border-start">
                                        <h6 class="fw-bold mb-3">买家物理收货档案</h6>
                                        <div class="text-muted text-xs" style="font-size: 12px; line-height: 1.8;">
                                            <div>收货姓名：${order.receiverName}</div>
                                            <div>联系电话：${order.phone}</div>
                                            <div>联系QQ：${order.qq}</div>
                                            <div>实名身份证：${order.idCard}</div>
                                            <div>配送地址：<b class="text-dark">${order.shippingAddress}</b></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-white text-end py-3">
                                <span class="text-muted me-3">共 ${fn:length(order.items)} 种书籍</span>
                                实付总金额：<span class="text-danger fw-extrabold fs-4 font-mono">¥${order.totalAmount}</span>
                                <c:if test="${order.status == 'Pending'}">
                                    <button class="btn btn-outline-danger btn-sm ms-3" onclick="cancelOrder('${order.id}')">取消订单</button>
                                </c:if>
                            </div>
                        </div>
                    </c:forEach>
                </div>
            </c:otherwise>
        </c:choose>
    </div>

    <script>
        function cancelOrder(orderId) {
            if (!confirm('确认取消订单 ' + orderId + ' 吗？取消后库存将恢复。')) return;
            var params = new URLSearchParams({ action: 'cancelOrder', id: orderId });
            fetch('${pageContext.request.contextPath}/order', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': '${csrfToken}'
                },
                credentials: 'include',
                body: params.toString()
            }).then(function(res) { return res.json(); })
              .then(function(data) {
                  if (data.success) {
                      alert('订单已取消，库存已恢复');
                      location.reload();
                  } else {
                      alert('取消失败：' + data.message);
                  }
              })
              .catch(function(err) { alert('网络错误，请稍后重试'); });
        }
    </script>

</body>
</html>

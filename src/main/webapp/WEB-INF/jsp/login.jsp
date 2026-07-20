<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>会员登录与注册中心 - 雅阁书屋</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .auth-card { border-radius: 16px; border: none; box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
    </style>
</head>
<body class="bg-light">

    <div class="container py-5">
        <div class="text-center mb-5">
            <h2 class="fw-extrabold text-primary">雅阁特色在线书屋</h2>
            <p class="text-muted">MVC实训课程设计系统 - 用户认证中心</p>
        </div>

        <div class="row justify-content-center">
            <!-- 1. 登录表单 -->
            <div class="col-md-5 mb-4">
                <div class="card auth-card bg-white p-4">
                    <h4 class="fw-bold mb-4">买家 / 管理员登录</h4>
                    
                    <c:if test="${not empty login_error}">
                        <div class="alert alert-danger text-xs py-2">${login_error}</div>
                    </c:if>
                    
                    <form action="${pageContext.request.contextPath}/auth" method="POST">
                        <input type="hidden" name="action" value="login" />
                        <div class="mb-3">
                            <label class="form-label text-muted">账户名</label>
                            <input type="text" name="username" class="form-control" required placeholder="请输入登录账号..." />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted">登录密码</label>
                            <input type="password" name="password" class="form-control" required placeholder="请输入密码..." />
                        </div>
                        <div class="form-check mb-4">
                            <input type="checkbox" class="form-check-input" id="rememberMe">
                            <label class="form-check-label text-xs text-muted" for="rememberMe">记住当前登录状态</label>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 fw-bold">进入书屋</button>
                    </form>

                    <div class="mt-4 p-3 bg-light rounded text-xs border border-dashed text-muted">
                        <b>🔑 答辩测试预置账号：</b><br>
                        - 普通会员：<span class="text-info">zhangsan</span> (密码: 123456)<br>
                        - 管理员：<span class="text-warning font-weight-bold">admin</span> (密码: admin123)
                    </div>
                </div>
            </div>

            <!-- 2. 注册表单 -->
            <div class="col-md-6">
                <div class="card auth-card bg-white p-4">
                    <h4 class="fw-bold mb-4">新会员尊享注册</h4>

                    <c:if test="${not empty register_error}">
                        <div class="alert alert-danger text-xs py-2">${register_error}</div>
                    </c:if>
                    <c:if test="${not empty register_success}">
                        <div class="alert alert-success text-xs py-2">${register_success}</div>
                    </c:if>

                    <form action="${pageContext.request.contextPath}/auth" method="POST">
                        <input type="hidden" name="action" value="register" />
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label text-muted text-xs">用户名 <span class="text-danger">*</span></label>
                                <input type="text" name="username" class="form-control form-control-sm" required minlength="3" placeholder="英文字母/数字起名" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label text-muted text-xs">设定密码 <span class="text-danger">*</span></label>
                                <input type="password" name="password" class="form-control form-control-sm" required minlength="6" placeholder="最少6位字符" />
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label text-muted text-xs">实名身份证号 <span class="text-danger">*</span></label>
                                <input type="text" name="idCard" pattern="(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)" class="form-control form-control-sm" required placeholder="符合中国18位实名身份证" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label text-muted text-xs">联系 QQ <span class="text-muted">(选填)</span></label>
                                <input type="text" name="qq" class="form-control form-control-sm" placeholder="常联QQ" />
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label text-muted text-xs">11位有效手机号 <span class="text-danger">*</span></label>
                                <input type="text" name="phone" pattern="^1[3-9]\d{9}$" class="form-control form-control-sm" required placeholder="如 13912345678" />
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label text-muted text-xs">安全邮箱 <span class="text-danger">*</span></label>
                                <input type="email" name="email" class="form-control form-control-sm" required placeholder="电子邮箱地址" />
                            </div>
                        </div>

                        <button type="submit" class="btn btn-outline-success w-100 fw-bold mt-3">同意协议并提交注册</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
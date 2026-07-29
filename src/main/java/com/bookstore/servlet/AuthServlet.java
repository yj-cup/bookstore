package com.bookstore.servlet;

import com.bookstore.dao.UserDao;
import com.bookstore.entity.User;
import com.bookstore.util.AuthorizationUtil;
import com.bookstore.filter.CsrfFilter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

public class AuthServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final UserDao userDao;

    public AuthServlet() {
        this(new UserDao());
    }

    AuthServlet(UserDao userDao) {
        this.userDao = userDao;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        if ("logout".equals(action)) {
            resp.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            writeJson(resp, "{\"success\":false,\"message\":\"注销只允许使用POST\"}");
        } else if ("csrfToken".equals(action)) {
            String token = (String) req.getAttribute(CsrfFilter.REQUEST_ATTRIBUTE);
            writeJson(resp, "{\"success\":true,\"csrfToken\":\"" + escape(token) + "\"}");
        } else if ("getCurrentUser".equals(action)) {
            // AJAX API: 获取当前登录用户信息
            HttpSession session = req.getSession(false);
            if (session != null) {
                User currentUser = (User) session.getAttribute("currentUser");
                if (currentUser != null) {
                    writeJson(resp, "{\"success\":true,\"user\":" + userToJson(currentUser) + "}");
                } else {
                    writeJson(resp, "{\"success\":false,\"message\":\"未登录\"}");
                }
            } else {
                writeJson(resp, "{\"success\":false,\"message\":\"未登录\"}");
            }
        } else if ("listUsers".equals(action)) {
            if (!AuthorizationUtil.requireAdmin(req, resp)) {
                return;
            }
            handleListUsers(resp);
        } else if ("updateUser".equals(action)
                || "deleteUser".equals(action)
                || "disableUser".equals(action)) {
            resp.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            writeJson(resp, "{\"success\":false,\"message\":\"该操作只允许使用POST\"}");
        } else {
            req.getRequestDispatcher("/WEB-INF/jsp/login.jsp").forward(req, resp);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        if ("login".equals(action)) {
            handleLogin(req, resp);
        } else if ("register".equals(action)) {
            handleRegister(req, resp);
        } else if ("logout".equals(action)) {
            handleLogout(req, resp);
        } else if ("updateUser".equals(action)) {
            if (AuthorizationUtil.requireAdmin(req, resp)) {
                handleUpdateUser(req, resp);
            }
        } else if ("deleteUser".equals(action)) {
            if (AuthorizationUtil.requireAdmin(req, resp)) {
                handleDeleteUser(req, resp);
            }
        } else if ("disableUser".equals(action)) {
            if (AuthorizationUtil.requireAdmin(req, resp)) {
                handleDisableUser(req, resp);
            }
        } else {
            doGet(req, resp);
        }
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        if (isAjax(req)) {
            writeJson(resp, "{\"success\":true,\"message\":\"已注销\"}");
        } else {
            resp.sendRedirect(req.getContextPath() + "/books");
        }
    }

    private void handleListUsers(HttpServletResponse resp) throws IOException {
        List<User> allUsers = userDao.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("{\"success\":true,\"users\":[");
        for (int i = 0; i < allUsers.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(userToJson(allUsers.get(i)));
        }
        sb.append("]}");
        writeJson(resp, sb.toString());
    }

    private void handleUpdateUser(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        String role = req.getParameter("role");
        if (id == null || id.trim().isEmpty()
                || (!"user".equals(role) && !"admin".equals(role))) {
            writeJson(resp, "{\"success\":false,\"message\":\"用户ID或角色不合法\"}");
            return;
        }

        User existing = userDao.findById(id.trim());
        if (existing == null) {
            writeJson(resp, "{\"success\":false,\"message\":\"用户不存在\"}");
            return;
        }

        User updated = new User(
            existing.getId(), existing.getUsername(), null, role,
            valueOrEmpty(req.getParameter("idCard")),
            valueOrEmpty(req.getParameter("qq")),
            valueOrEmpty(req.getParameter("phone")),
            valueOrEmpty(req.getParameter("email"))
        );
        if (userDao.update(updated)) {
            HttpSession session = req.getSession(false);
            User currentUser = session == null ? null : (User) session.getAttribute("currentUser");
            if (currentUser != null && currentUser.getId().equals(updated.getId())) {
                session.setAttribute("currentUser", updated);
            }
            writeJson(resp, "{\"success\":true,\"message\":\"用户更新成功\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"更新失败\"}");
        }
    }

    private void handleDeleteUser(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        User target = id == null ? null : userDao.findById(id.trim());
        if (target == null) {
            writeJson(resp, "{\"success\":false,\"message\":\"用户不存在\"}");
            return;
        }
        if ("admin".equals(target.getRole())) {
            writeJson(resp, "{\"success\":false,\"message\":\"管理员账号不能删除\"}");
            return;
        }
        if (userDao.delete(target.getId())) {
            writeJson(resp, "{\"success\":true,\"message\":\"用户已删除，待处理订单已自动取消\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"删除失败\"}");
        }
    }

    private void handleDisableUser(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String id = req.getParameter("id");
        User target = id == null ? null : userDao.findById(id.trim());
        if (target == null) {
            writeJson(resp, "{\"success\":false,\"message\":\"用户不存在\"}");
            return;
        }
        if ("admin".equals(target.getRole())) {
            writeJson(resp, "{\"success\":false,\"message\":\"管理员账号不能禁用\"}");
            return;
        }
        if (userDao.disableUser(target.getId())) {
            writeJson(resp, "{\"success\":true,\"message\":\"用户已禁用，待处理订单已自动取消\"}");
        } else {
            writeJson(resp, "{\"success\":false,\"message\":\"禁用失败\"}");
        }
    }

    private void handleLogin(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            if (isAjax(req)) {
                writeJson(resp, "{\"success\":false,\"message\":\"用户名或密码不能为空！\"}");
            } else {
                req.setAttribute("login_error", "用户名或密码不能为空！");
                req.getRequestDispatcher("/WEB-INF/jsp/login.jsp").forward(req, resp);
            }
            return;
        }

        User user = userDao.findByUsernameAndPassword(username.trim(), password);
        if (user != null) {
            // 检查用户是否已被禁用
            if ("disabled".equals(user.getRole())) {
                if (isAjax(req)) {
                    writeJson(resp, "{\"success\":false,\"message\":\"该账号已被禁用，无法登录！\"}");
                } else {
                    req.setAttribute("login_error", "该账号已被禁用，无法登录！");
                    req.getRequestDispatcher("/WEB-INF/jsp/login.jsp").forward(req, resp);
                }
                return;
            }
            
            HttpSession session = req.getSession(true);
            session.setAttribute("currentUser", user);
            if (isAjax(req)) {
                writeJson(resp, "{\"success\":true,\"message\":\"登录成功\",\"user\":" + userToJson(user) + "}");
            } else {
                resp.sendRedirect(req.getContextPath() + "/books");
            }
        } else {
            if (isAjax(req)) {
                writeJson(resp, "{\"success\":false,\"message\":\"用户名或密码错误，登录失败！\"}");
            } else {
                req.setAttribute("login_error", "用户名或密码错误，登录失败！");
                req.getRequestDispatcher("/WEB-INF/jsp/login.jsp").forward(req, resp);
            }
        }
    }

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        String idCard = req.getParameter("idCard");
        String qq = req.getParameter("qq");
        String phone = req.getParameter("phone");
        String email = req.getParameter("email");

        // 1. 实训强验证约束条件检查
        if (username == null || username.trim().length() < 3) {
            sendRegisterError(req, resp, "注册失败：用户名必须在3位以上！"); return;
        }
        if (password == null || password.trim().length() < 6) {
            sendRegisterError(req, resp, "注册失败：密码必须在6位以上！"); return;
        }
        if (idCard == null || !idCard.trim().matches("(^\\d{15}$)|(^\\d{18}$)|(^\\d{17}(\\d|X|x)$)")) {
            sendRegisterError(req, resp, "注册失败：身份证格式不正确！"); return;
        }
        if (phone == null || !phone.trim().matches("^1[3-9]\\d{9}$")) {
            sendRegisterError(req, resp, "注册失败：手机格式不正确！"); return;
        }
        if (email == null || !email.trim().matches("^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\\.[a-zA-Z0-9_-]+)+$")) {
            sendRegisterError(req, resp, "注册失败：邮箱地址无效！"); return;
        }

        // 2. 用户唯一性预检测
        if (userDao.findByUsername(username.trim()) != null) {
            sendRegisterError(req, resp, "注册失败：该用户名已被注册占用，请更换用户名！"); return;
        }

        // 3. 构建插入数据库
        User newUser = new User(
            "u_" + UUID.randomUUID().toString().substring(0, 8),
            username.trim(), password, "user",
            idCard.trim(), qq != null ? qq.trim() : "",
            phone.trim(), email.trim()
        );

        if (userDao.insert(newUser)) {
            // 注册成功后自动创建 Session 并登录
            newUser.setPassword(null);
            HttpSession session = req.getSession(true);
            session.setAttribute("currentUser", newUser);
            
            if (isAjax(req)) {
                writeJson(resp, "{\"success\":true,\"message\":\"注册成功！已自动登录。\",\"user\":" + userToJson(newUser) + "}");
            } else {
                req.setAttribute("register_success", "恭喜您，注册成功！已自动登录。");
                resp.sendRedirect(req.getContextPath() + "/books");
            }
        } else {
            sendRegisterError(req, resp, "服务器繁忙，写库失败！");
        }
    }

    // ====== AJAX JSON 辅助方法 ======

    private boolean isAjax(HttpServletRequest req) {
        String accept = req.getHeader("Accept");
        return accept != null && accept.contains("application/json");
    }

    private void writeJson(HttpServletResponse resp, String json) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write(json);
    }

    private void sendRegisterError(HttpServletRequest req, HttpServletResponse resp, String msg) throws ServletException, IOException {
        if (isAjax(req)) {
            writeJson(resp, "{\"success\":false,\"message\":\"" + msg + "\"}");
        } else {
            req.setAttribute("register_error", msg);
            req.getRequestDispatcher("/WEB-INF/jsp/login.jsp").forward(req, resp);
        }
    }

    private String userToJson(User u) {
        return "{" +
            "\"id\":\"" + escape(u.getId()) + "\"," +
            "\"username\":\"" + escape(u.getUsername()) + "\"," +
            "\"role\":\"" + escape(u.getRole()) + "\"," +
            "\"idCard\":\"" + escape(u.getIdCard()) + "\"," +
            "\"qq\":\"" + escape(u.getQq()) + "\"," +
            "\"phone\":\"" + escape(u.getPhone()) + "\"," +
            "\"email\":\"" + escape(u.getEmail()) + "\"" +
            "}";
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

package com.bookstore.util;

import com.bookstore.entity.User;
import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/** Central server-side authorization checks for administrative APIs. */
public final class AuthorizationUtil {
    private AuthorizationUtil() {}

    public static boolean requireAdmin(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        HttpSession session = request.getSession(false);
        User currentUser = session == null ? null : (User) session.getAttribute("currentUser");

        if (currentUser != null && "admin".equals(currentUser.getRole())) {
            return true;
        }

        response.setStatus(currentUser == null
            ? HttpServletResponse.SC_UNAUTHORIZED
            : HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"需要管理员权限\"}");
        return false;
    }
}

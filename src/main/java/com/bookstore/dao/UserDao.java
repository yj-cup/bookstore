package com.bookstore.dao;

import com.bookstore.entity.OrderItem;
import com.bookstore.entity.User;
import com.bookstore.util.DBUtil;
import com.bookstore.util.PasswordUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserDao {
    @FunctionalInterface
    interface ConnectionProvider {
        Connection getConnection() throws SQLException;
    }

    private final ConnectionProvider transactionConnectionProvider;

    public UserDao() {
        this(DBUtil::getConnection);
    }

    UserDao(ConnectionProvider transactionConnectionProvider) {
        this.transactionConnectionProvider = transactionConnectionProvider;
    }

    public User findByUsernameAndPassword(String username, String password) {
        Connection conn = null;
        PreparedStatement stmt = null;
        PreparedStatement upgradeStmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM t_users WHERE username = ?");
            stmt.setString(1, username);
            rs = stmt.executeQuery();
            if (rs.next()) {
                String storedPassword = rs.getString("password");
                if (!PasswordUtil.verify(password, storedPassword)) {
                    return null;
                }

                User user = extractUser(rs);
                if (PasswordUtil.needsUpgrade(storedPassword)) {
                    String upgradedHash = PasswordUtil.hash(password);
                    upgradeStmt = conn.prepareStatement(
                        "UPDATE t_users SET password = ? WHERE id = ? AND password = ?"
                    );
                    upgradeStmt.setString(1, upgradedHash);
                    upgradeStmt.setString(2, user.getId());
                    upgradeStmt.setString(3, storedPassword);
                    upgradeStmt.executeUpdate();
                }
                user.setPassword(null);
                return user;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(upgradeStmt, null);
            DBUtil.close(rs, stmt, conn);
        }
        return null;
    }

    public User findByUsername(String username) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM t_users WHERE username = ?");
            stmt.setString(1, username);
            rs = stmt.executeQuery();
            if (rs.next()) {
                return extractUser(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
        return null;
    }

    public User findById(String id) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM t_users WHERE id = ?");
            stmt.setString(1, id);
            rs = stmt.executeQuery();
            return rs.next() ? extractUser(rs) : null;
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
    }

    public boolean insert(User user) {
        Connection conn = null;
        PreparedStatement stmt = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "INSERT INTO t_users (id, username, password, role, id_card, qq, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, user.getId());
            stmt.setString(2, user.getUsername());
            stmt.setString(3, PasswordUtil.isBcryptHash(user.getPassword())
                ? user.getPassword()
                : PasswordUtil.hash(user.getPassword()));
            stmt.setString(4, user.getRole());
            stmt.setString(5, user.getIdCard());
            stmt.setString(6, user.getQq());
            stmt.setString(7, user.getPhone());
            stmt.setString(8, user.getEmail());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        } finally {
            DBUtil.close(stmt, conn);
        }
    }

    public List<User> findAll() {
        List<User> list = new ArrayList<>();
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            // 过滤掉已被禁用的用户（role != 'disabled'）
            stmt = conn.prepareStatement("SELECT * FROM t_users WHERE role != 'disabled' ORDER BY username ASC");
            rs = stmt.executeQuery();
            while (rs.next()) {
                list.add(extractUser(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DBUtil.close(rs, stmt, conn);
        }
        return list;
    }

    public boolean update(User user) {
        Connection conn = null;
        PreparedStatement stmt = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "UPDATE t_users SET role=?, id_card=?, qq=?, phone=?, email=? WHERE id=?";
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, user.getRole());
            stmt.setString(2, user.getIdCard());
            stmt.setString(3, user.getQq());
            stmt.setString(4, user.getPhone());
            stmt.setString(5, user.getEmail());
            stmt.setString(6, user.getId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        } finally {
            DBUtil.close(stmt, conn);
        }
    }

    public boolean delete(String id) {
        Connection conn = null;
        PreparedStatement userStmt = null;
        try {
            conn = transactionConnectionProvider.getConnection();
            conn.setAutoCommit(false);

            cancelPendingOrdersForUser(conn, id);
            userStmt = conn.prepareStatement("DELETE FROM t_users WHERE id = ?");
            userStmt.setString(1, id);
            boolean result = userStmt.executeUpdate() > 0;
            if (!result) {
                conn.rollback();
                return false;
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return false;
        } finally {
            closeQuietly(userStmt);
            closeQuietly(conn);
        }
    }

    /**
     * 禁用用户（软删除）- 推荐做法
     * 将用户状态标记为禁用，并释放用户名等唯一约束，允许重新注册
     */
    public boolean disableUser(String id) {
        Connection conn = null;
        PreparedStatement userStmt = null;
        try {
            conn = transactionConnectionProvider.getConnection();
            conn.setAutoCommit(false);

            cancelPendingOrdersForUser(conn, id);
            userStmt = conn.prepareStatement(
                "UPDATE t_users SET username = CONCAT('disabled_', username, '_', id), "
                    + "password = ?, role = 'disabled' WHERE id = ?"
            );
            userStmt.setString(1, PasswordUtil.hash(UUID.randomUUID().toString()));
            userStmt.setString(2, id);
            boolean result = userStmt.executeUpdate() > 0;
            if (!result) {
                conn.rollback();
                return false;
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return false;
        } finally {
            closeQuietly(userStmt);
            closeQuietly(conn);
        }
    }

    private int cancelPendingOrdersForUser(Connection conn, String userId) throws SQLException {
        List<String> pendingOrderIds = new ArrayList<>();
        try (PreparedStatement orderQuery = conn.prepareStatement(
                "SELECT id FROM t_orders WHERE user_id = ? AND status = 'Pending' FOR UPDATE")) {
            orderQuery.setString(1, userId);
            try (ResultSet rs = orderQuery.executeQuery()) {
                while (rs.next()) {
                    pendingOrderIds.add(rs.getString("id"));
                }
            }
        }

        int cancelled = 0;
        for (String orderId : pendingOrderIds) {
            try (PreparedStatement itemQuery = conn.prepareStatement(
                    "SELECT book_id, quantity FROM t_order_items WHERE order_id = ?");
                 PreparedStatement restoreStock = conn.prepareStatement(
                    "UPDATE t_books SET stock = stock + ? WHERE id = ?")) {
                itemQuery.setString(1, orderId);
                try (ResultSet itemRs = itemQuery.executeQuery()) {
                    while (itemRs.next()) {
                        restoreStock.setInt(1, itemRs.getInt("quantity"));
                        restoreStock.setString(2, itemRs.getString("book_id"));
                        restoreStock.executeUpdate();
                    }
                }
            }

            try (PreparedStatement updateOrder = conn.prepareStatement(
                    "UPDATE t_orders SET status = 'Cancelled' "
                        + "WHERE id = ? AND status = 'Pending'")) {
                updateOrder.setString(1, orderId);
                if (updateOrder.executeUpdate() != 1) {
                    throw new SQLException("订单状态并发变化，取消事务已回滚: " + orderId);
                }
                cancelled++;
            }
        }
        return cancelled;
    }

    private void closeQuietly(AutoCloseable resource) {
        if (resource == null) {
            return;
        }
        try {
            resource.close();
        } catch (Exception closeError) {
            closeError.printStackTrace();
        }
    }

    private User extractUser(ResultSet rs) throws SQLException {
        return new User(
            rs.getString("id"),
            rs.getString("username"),
            rs.getString("password"),
            rs.getString("role"),
            rs.getString("id_card"),
            rs.getString("qq"),
            rs.getString("phone"),
            rs.getString("email")
        );
    }
}

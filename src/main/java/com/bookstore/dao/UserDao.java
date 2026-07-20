package com.bookstore.dao;

import com.bookstore.entity.OrderItem;
import com.bookstore.entity.User;
import com.bookstore.util.DBUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class UserDao {

    public User findByUsernameAndPassword(String username, String password) {
        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            stmt = conn.prepareStatement("SELECT * FROM t_users WHERE username = ? AND password = ?");
            stmt.setString(1, username);
            stmt.setString(2, password);
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

    public boolean insert(User user) {
        Connection conn = null;
        PreparedStatement stmt = null;
        try {
            conn = DBUtil.getConnection();
            String sql = "INSERT INTO t_users (id, username, password, role, id_card, qq, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, user.getId());
            stmt.setString(2, user.getUsername());
            stmt.setString(3, user.getPassword());
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
            String sql = "UPDATE t_users SET password=?, role=?, id_card=?, qq=?, phone=?, email=? WHERE id=?";
            stmt = conn.prepareStatement(sql);
            stmt.setString(1, user.getPassword());
            stmt.setString(2, user.getRole());
            stmt.setString(3, user.getIdCard());
            stmt.setString(4, user.getQq());
            stmt.setString(5, user.getPhone());
            stmt.setString(6, user.getEmail());
            stmt.setString(7, user.getId());
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
        PreparedStatement orderStmt = null;
        PreparedStatement checkOrderStmt = null;
        PreparedStatement itemQueryStmt = null;
        PreparedStatement restoreStmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            // 开启事务
            conn.setAutoCommit(false);
            
            // 1. 先查询该用户有多少待处理订单
            checkOrderStmt = conn.prepareStatement("SELECT id FROM t_orders WHERE user_id = ? AND status = 'Pending'");
            checkOrderStmt.setString(1, id);
            rs = checkOrderStmt.executeQuery();
            
            List<String> pendingOrderIds = new ArrayList<>();
            while (rs.next()) {
                pendingOrderIds.add(rs.getString("id"));
            }
            rs.close();
            checkOrderStmt.close();
            
            System.out.println("[删除用户] 用户ID: " + id + ", 待处理订单数: " + pendingOrderIds.size());
            
            // 2. 恢复每个待处理订单中书籍的库存
            String restoreStockSql = "UPDATE t_books SET stock = stock + ? WHERE id = ?";
            restoreStmt = conn.prepareStatement(restoreStockSql);
            
            String itemQuerySql = "SELECT book_id, quantity FROM t_order_items WHERE order_id = ?";
            itemQueryStmt = conn.prepareStatement(itemQuerySql);
            
            for (String orderId : pendingOrderIds) {
                itemQueryStmt.setString(1, orderId);
                ResultSet itemRs = itemQueryStmt.executeQuery();
                while (itemRs.next()) {
                    restoreStmt.setInt(1, itemRs.getInt("quantity"));
                    restoreStmt.setString(2, itemRs.getString("book_id"));
                    restoreStmt.executeUpdate();
                }
                itemRs.close();
            }
            restoreStmt.close();
            itemQueryStmt.close();
            
            // 3. 将该用户的待处理订单标记为已取消
            orderStmt = conn.prepareStatement("UPDATE t_orders SET status = 'Cancelled' WHERE user_id = ? AND status = 'Pending'");
            orderStmt.setString(1, id);
            int updatedOrders = orderStmt.executeUpdate();
            
            System.out.println("[删除用户] 已取消订单数: " + updatedOrders + ", 已恢复对应书籍库存");
            
            // 4. 真正从数据库删除用户
            userStmt = conn.prepareStatement("DELETE FROM t_users WHERE id = ?");
            userStmt.setString(1, id);
            boolean result = userStmt.executeUpdate() > 0;
            
            conn.commit();
            return result;
        } catch (SQLException e) {
            e.printStackTrace();
            // 回滚事务
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return false;
        } finally {
            DBUtil.close(userStmt, conn);
            DBUtil.close(orderStmt, null);
            DBUtil.close(checkOrderStmt, null);
            DBUtil.close(itemQueryStmt, null);
            DBUtil.close(restoreStmt, null);
        }
    }

    /**
     * 禁用用户（软删除）- 推荐做法
     * 将用户状态标记为禁用，并释放用户名等唯一约束，允许重新注册
     */
    public boolean disableUser(String id) {
        Connection conn = null;
        PreparedStatement userStmt = null;
        PreparedStatement orderStmt = null;
        PreparedStatement checkOrderStmt = null;
        PreparedStatement itemQueryStmt = null;
        PreparedStatement restoreStmt = null;
        ResultSet rs = null;
        try {
            conn = DBUtil.getConnection();
            // 开启事务
            conn.setAutoCommit(false);
            
            // 1. 先查询该用户有多少待处理订单
            checkOrderStmt = conn.prepareStatement("SELECT id FROM t_orders WHERE user_id = ? AND status = 'Pending'");
            checkOrderStmt.setString(1, id);
            rs = checkOrderStmt.executeQuery();
            
            List<String> pendingOrderIds = new ArrayList<>();
            while (rs.next()) {
                pendingOrderIds.add(rs.getString("id"));
            }
            rs.close();
            checkOrderStmt.close();
            
            System.out.println("[禁用用户] 用户ID: " + id + ", 待处理订单数: " + pendingOrderIds.size());
            
            // 2. 恢复每个待处理订单中书籍的库存
            String restoreStockSql = "UPDATE t_books SET stock = stock + ? WHERE id = ?";
            restoreStmt = conn.prepareStatement(restoreStockSql);
            
            String itemQuerySql = "SELECT book_id, quantity FROM t_order_items WHERE order_id = ?";
            itemQueryStmt = conn.prepareStatement(itemQuerySql);
            
            for (String orderId : pendingOrderIds) {
                itemQueryStmt.setString(1, orderId);
                ResultSet itemRs = itemQueryStmt.executeQuery();
                while (itemRs.next()) {
                    restoreStmt.setInt(1, itemRs.getInt("quantity"));
                    restoreStmt.setString(2, itemRs.getString("book_id"));
                    restoreStmt.executeUpdate();
                }
                itemRs.close();
            }
            restoreStmt.close();
            itemQueryStmt.close();
            
            // 3. 将该用户的待处理订单标记为已取消
            orderStmt = conn.prepareStatement("UPDATE t_orders SET status = 'Cancelled' WHERE user_id = ? AND status = 'Pending'");
            orderStmt.setString(1, id);
            int updatedOrders = orderStmt.executeUpdate();
            
            System.out.println("[禁用用户] 已取消订单数: " + updatedOrders + ", 已恢复对应书籍库存");
            
            // 4. 将用户标记为禁用，并释放用户名唯一约束
            // 方法：将 username 修改为 "disabled_{原username}_{id}"，这样既保留了信息，又释放了原用户名
            userStmt = conn.prepareStatement("UPDATE t_users SET username = CONCAT('disabled_', username, '_', id), password = '', role = 'disabled' WHERE id = ?");
            userStmt.setString(1, id);
            boolean result = userStmt.executeUpdate() > 0;
            
            conn.commit();
            return result;
        } catch (SQLException e) {
            e.printStackTrace();
            // 回滚事务
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            return false;
        } finally {
            DBUtil.close(userStmt, conn);
            DBUtil.close(orderStmt, null);
            DBUtil.close(checkOrderStmt, null);
            DBUtil.close(itemQueryStmt, null);
            DBUtil.close(restoreStmt, null);
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
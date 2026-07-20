package com.bookstore.util;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;

public class DBUtil {
    private static Properties props = new Properties();

    static {
        try (InputStream in = DBUtil.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in == null) {
                throw new RuntimeException("未能在类路径 resources 下找到 db.properties 配置文件！");
            }
            props.load(in);
            
            // 支持通过环境变量覆盖数据库配置（适用于 Docker 部署）
            String dbHost = System.getenv("DB_HOST");
            String dbPort = System.getenv("DB_PORT");
            String dbName = System.getenv("DB_NAME");
            String dbUsername = System.getenv("DB_USERNAME");
            String dbPassword = System.getenv("DB_PASSWORD");
            
            if (dbHost != null && dbPort != null && dbName != null) {
                // 如果环境变量存在，则覆盖配置文件中的设置
                String url = String.format("jdbc:mysql://%s:%s/%s?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf-8&allowPublicKeyRetrieval=true",
                    dbHost, dbPort, dbName);
                props.setProperty("jdbc.url", url);
            }
            if (dbUsername != null) {
                props.setProperty("jdbc.username", dbUsername);
            }
            if (dbPassword != null) {
                props.setProperty("jdbc.password", dbPassword);
            }
            
            // 强行加载 MySQL 驱动
            Class.forName(props.getProperty("jdbc.driver"));
        } catch (Exception e) {
            e.printStackTrace();
            throw new ExceptionInInitializerError("数据库驱动初始化失败: " + e.getMessage());
        }
    }

    /**
     * 获取数据库物理物理连接
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(
            props.getProperty("jdbc.url"),
            props.getProperty("jdbc.username"),
            props.getProperty("jdbc.password")
        );
    }

    /**
     * 优雅关闭 JDBC 物理释放集
     */
    public static void close(ResultSet rs, Statement stmt, Connection conn) {
        try {
            if (rs != null) rs.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        try {
            if (stmt != null) stmt.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        try {
            if (conn != null) conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void close(Statement stmt, Connection conn) {
        close(null, stmt, conn);
    }
}
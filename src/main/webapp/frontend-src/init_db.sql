-- =====================================================================
-- 网上书店系统 (Online Bookstore) - 数据库初始化脚本 (MySQL 8.0+)
-- 100% 契合当前 Java MVC 版本中 DBUtil、DAO 和实体类定义的表结构
-- =====================================================================

-- 1. 创建并使用数据库
CREATE DATABASE IF NOT EXISTS `db_bookstore` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `db_bookstore`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_books (图书信息表)
-- ----------------------------
DROP TABLE IF EXISTS `t_books`;
CREATE TABLE `t_books` (
  `id` varchar(50) NOT NULL COMMENT '图书主键ID',
  `title` varchar(255) NOT NULL COMMENT '图书名称',
  `author` varchar(255) NOT NULL COMMENT '作者名称',
  `category` varchar(100) NOT NULL COMMENT '所属分类',
  `price` decimal(10,2) NOT NULL COMMENT '图书价格',
  `stock` int NOT NULL COMMENT '物理库存',
  `description` text COMMENT '图书详细描述',
  `cover_image` varchar(512) DEFAULT NULL COMMENT '图书封面图片URL链接',
  `rating` decimal(3,1) DEFAULT '0.0' COMMENT '图书星级评分',
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_books_price` CHECK (`price` >= 0),
  CONSTRAINT `chk_books_stock` CHECK (`stock` >= 0),
  CONSTRAINT `chk_books_rating` CHECK (`rating` >= 0 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书明细主表';

-- ----------------------------
-- Table structure for t_users (系统用户表)
-- ----------------------------
DROP TABLE IF EXISTS `t_users`;
CREATE TABLE `t_users` (
  `id` varchar(50) NOT NULL COMMENT '用户ID',
  `username` varchar(100) NOT NULL COMMENT '登录账户名',
  `password` varchar(255) NOT NULL COMMENT '登录密码',
  `role` varchar(20) NOT NULL DEFAULT 'user' COMMENT '用户角色: user代表普通买家, admin代表后台管理员',
  `id_card` varchar(18) DEFAULT NULL COMMENT '实名注册身份证号',
  `qq` varchar(20) DEFAULT NULL COMMENT '用户QQ联络号',
  `phone` varchar(20) DEFAULT NULL COMMENT '用户移动电话号码',
  `email` varchar(100) DEFAULT NULL COMMENT '电子邮件地址',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  CONSTRAINT `chk_users_role` CHECK (`role` IN ('user', 'admin', 'disabled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户账号信息表';

-- ----------------------------
-- Table structure for t_orders (订单主表)
-- ----------------------------
DROP TABLE IF EXISTS `t_orders`;
CREATE TABLE `t_orders` (
  `id` varchar(50) NOT NULL COMMENT '订单编号ID',
  `user_id` varchar(50) NOT NULL COMMENT '关联买家账户ID',
  `total_amount` decimal(10,2) NOT NULL COMMENT '订单成交总金额',
  `status` varchar(20) NOT NULL DEFAULT 'Pending' COMMENT '订单流转状态: Pending-待发货, Shipped-已发货, Completed-已完成, Cancelled-已取消',
  `id_card` varchar(18) DEFAULT NULL COMMENT '收货身份证号验证',
  `receiver_name` varchar(100) DEFAULT NULL COMMENT '收件人真实姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '收件人联系电话',
  `qq` varchar(20) DEFAULT NULL COMMENT '收件人QQ号',
  `email` varchar(100) DEFAULT NULL COMMENT '收件人电子邮箱',
  `address` varchar(512) DEFAULT NULL COMMENT '收货详细物理地址',
  `order_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建订单日期时间戳',
  PRIMARY KEY (`id`),
  KEY `idx_orders_user_time` (`user_id`, `order_time`),
  CONSTRAINT `chk_orders_total` CHECK (`total_amount` >= 0),
  CONSTRAINT `chk_orders_status` CHECK (`status` IN ('Pending', 'Shipped', 'Completed', 'Cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单事务主表';

-- ----------------------------
-- Table structure for t_order_items (订单明细多对一从表)
-- ----------------------------
DROP TABLE IF EXISTS `t_order_items`;
CREATE TABLE `t_order_items` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '明细主键自增',
  `order_id` varchar(50) NOT NULL COMMENT '关联父订单编号ID',
  `book_id` varchar(50) NOT NULL COMMENT '所购图书ID',
  `book_title` varchar(255) NOT NULL COMMENT '交易发生时图书瞬时名称',
  `book_cover` varchar(512) DEFAULT NULL COMMENT '交易发生时图书封面图链接',
  `book_price` decimal(10,2) NOT NULL COMMENT '交易成交单价',
  `quantity` int NOT NULL COMMENT '购买成交数量',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_book` (`order_id`, `book_id`),
  KEY `idx_order_items_book` (`book_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `t_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_order_items_price` CHECK (`book_price` >= 0),
  CONSTRAINT `chk_order_items_quantity` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单商品详情细表';

SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- 数据填充 (DML) - 插入基础初始化种子数据
-- =====================================================================

-- 不提供默认账户。先通过页面注册普通账户，再由数据库管理员将目标账户角色改为 admin。

-- 3. 插入初始图书数据
-- 与 React 页面中渲染的图片及价格细节100%同步
INSERT INTO `t_books` (`id`, `title`, `author`, `category`, `price`, `stock`, `description`, `cover_image`, `rating`) VALUES 
('b1', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Literature', 45.00, 12, 'A portrait of the Jazz Age in all its decadence and excess, exploring themes of wealth, love, and the American Dream.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600', 4.8),
('b2', 'Brief Answers to the Big Questions', 'Stephen Hawking', 'Science', 68.00, 8, 'Stephen Hawking’s final book, offering his personal views on the greatest challenges and mysteries facing human civilization.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600', 4.9),
('b3', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Technology', 128.00, 15, 'A must-read for any software engineer. It describes the principles, patterns, and practices of writing clean, maintainable code.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600', 4.7),
('b4', 'Principles: Life and Work', 'Ray Dalio', 'Business', 89.00, 20, 'Ray Dalio, one of the world’s most successful investors and entrepreneurs, shares the unconventional principles that he’s developed.', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600', 4.6),
('b5', 'The Little Prince', 'Antoine de Saint-Exupéry', 'Children', 32.00, 35, 'A beautiful fable about a young prince who visits various planets in space, addressing themes of loneliness, friendship, love, and loss.', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600', 4.9),
('b6', 'Introduction to Algorithms (Fourth Edition)', 'Thomas H. Cormen', 'Technology', 189.00, 5, 'The standard reference for algorithms globally. Deeply covers sorting, data structures, graph algorithms, and complexity theory.', 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=600', 4.8),
('b7', 'Cosmos', 'Carl Sagan', 'Science', 59.00, 10, 'A classic science book that explores fifteen billion years of cosmic evolution and the development of science and civilization.', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600', 4.9),
('b8', 'Thinking, Fast and Slow', 'Daniel Kahneman', 'Business', 72.00, 18, 'Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.', 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600', 4.5);

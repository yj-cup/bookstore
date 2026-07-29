# Bookstore 在线书城

基于 Java Servlet、JSP、MySQL 和 React 的在线书城课程项目。

## 主要功能

- 用户注册、登录、图书浏览和搜索
- 购物车、下单、库存扣减和订单取消
- 管理员维护图书、用户和订单
- Maven 构建 React 前端并打包为 WAR

## 技术栈

- Java 8、Servlet 4、JSP、Tomcat 9
- MySQL 8、JDBC、Maven
- React 19、TypeScript、Vite
- Docker Compose

## 安全设计

- 管理接口在服务端校验管理员 Session，前端显示状态不作为授权依据。
- 下单接口只接收图书 ID 和正整数数量，标题、封面、价格及总额均从数据库重新计算。
- 密码使用 bcrypt；旧数据库中的明文密码会在首次成功登录后自动升级。
- 取消订单使用行锁，并在同一事务和数据库连接中恢复库存，重复或并发取消只恢复一次。
- 初始化脚本不创建默认账户，避免公开的默认管理员凭据。

## 本地构建

要求：JDK 8、Maven 3.9、Node.js 20+、npm，以及 MySQL 8 或 Docker。

```powershell
Copy-Item src/main/resources/db.properties.example src/main/resources/db.properties
# 修改 db.properties 中的数据库连接和密码
mvn clean package
```

生成的 WAR 位于 `target/bookstore.war`。

## Docker 启动

```powershell
$env:MYSQL_ROOT_PASSWORD = '请设置强密码'
docker compose up --build
```

首次启动后先在页面注册普通账户，再由数据库管理员执行：

```sql
UPDATE t_users SET role = 'admin' WHERE username = '你的用户名';
```

不要把 `.env`、`db.properties`、数据库导出或真实个人信息提交到仓库。

## 验证

```powershell
mvn test
```

该命令会执行 `npm ci`、TypeScript/Vite 生产构建、Java 单元测试和并发库存恢复测试。

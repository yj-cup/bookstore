export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  coverImage: string;
  rating: number;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'user' | 'admin' | 'disabled';
  idCard: string;
  qq: string;
  phone: string;
  email: string;
  registeredAt: string;
}

export interface CartItem {
  bookId: string;
  book: Book;
  quantity: number;
}

export interface OrderDetails {
  idCard: string;
  qq: string;
  phone: string;
  email: string;
  shippingAddress: string;
  receiverName: string;
}

export interface Order {
  id: string;
  userId: string;
  username: string;
  userRole?: string; // 用户角色状态，用于判断是否已被禁用
  details: OrderDetails;
  items: CartItem[];
  totalAmount: number;
  status: 'Pending' | 'Shipped' | 'Completed' | 'Cancelled';
  orderTime: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'JDBC' | 'FILTER' | 'SERVLET' | 'JSP';
  message: string;
  query?: string;
}

export type Category = 'Literature' | 'Science' | 'Technology' | 'Business' | 'Children';

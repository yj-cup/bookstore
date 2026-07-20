import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trash2, ShoppingBag, CreditCard, ChevronRight, CheckCircle, 
  AlertCircle, ShieldCheck, User, MapPin, Phone, MessageSquare, Mail 
} from 'lucide-react';
import { CartItem, User as UserType, Order, OrderDetails } from '../types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateCartQty: (bookId: string, qty: number) => void;
  removeCartItem: (bookId: string) => void;
  clearCart: () => void;
  currentUser: UserType | null;
  submitOrder: (details: OrderDetails) => void;
  addLog: (type: 'JDBC' | 'FILTER' | 'SERVLET' | 'JSP', message: string, query?: string) => void;
  openAuthModal: () => void;
}

export default function CartModal({
  isOpen,
  onClose,
  cart,
  updateCartQty,
  removeCartItem,
  clearCart,
  currentUser,
  submitOrder,
  addLog,
  openAuthModal
}: CartModalProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  const [receiverName, setReceiverName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [qq, setQq] = useState('');
  const [idCard, setIdCard] = useState('');
  
  // Validation error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Populate shipping form with current user details if logged in
  useEffect(() => {
    if (currentUser) {
      setReceiverName(currentUser.username);
      setPhone(currentUser.phone);
      setEmail(currentUser.email);
      setQq(currentUser.qq);
      setIdCard(currentUser.idCard);
    }
  }, [currentUser, isOpen]);

  const totalPrice = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  // Regex rules
  const REGEX_RULES = {
    idCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
    qq: /^[1-9][0-9]{4,10}$/,
    phone: /^1[3-9]\d{9}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  };

  const validateField = (name: string, value: string) => {
    if (!value.trim()) return '该字段必填';
    
    if (name in REGEX_RULES) {
      const regex = REGEX_RULES[name as keyof typeof REGEX_RULES];
      if (!regex.test(value)) {
        if (name === 'idCard') return '无效的15或18位身份证格式';
        if (name === 'qq') return '5-11位QQ号且不能0开头';
        if (name === 'phone') return '11位有效手机号码格式';
        if (name === 'email') return '有效的电子邮箱格式';
      }
    }
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleInputChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleGoToShipping = () => {
    if (!currentUser) {
      addLog('FILTER', 'SecurityFilter: 检测到未登录的结账动作，已拦截并弹出登录界面');
      openAuthModal();
      return;
    }
    addLog('SERVLET', 'CartServlet: 转换视图至结账表单。JSP 正在装载 Shipping Form...');
    setCheckoutStep('shipping');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Final checks
    const newErrors: Record<string, string> = {};
    newErrors.receiverName = validateField('receiverName', receiverName);
    newErrors.shippingAddress = validateField('shippingAddress', shippingAddress);
    newErrors.phone = validateField('phone', phone);
    newErrors.email = validateField('email', email);
    newErrors.qq = validateField('qq', qq);
    newErrors.idCard = validateField('idCard', idCard);

    // Clean empty errors
    Object.keys(newErrors).forEach(k => {
      if (!newErrors[k]) delete newErrors[k];
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addLog('SERVLET', 'OrderServlet: 订单提报失败 - 前端正则拦截校验未通过');
      return;
    }

    // Submit order through parent controller
    submitOrder({
      idCard,
      qq,
      phone,
      email,
      shippingAddress,
      receiverName
    });

    setCheckoutStep('success');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Animated backdrop with elegant blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
          />
      
      {/* Drawer Container */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200/60 dark:border-slate-700/40"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {checkoutStep === 'cart' && '我的购物车'}
              {checkoutStep === 'shipping' && '结算与提报订单'}
              {checkoutStep === 'success' && '订单提报成功'}
            </h3>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold px-2 py-0.5 rounded-full">
              {checkoutStep === 'cart' ? cart.length : '1'}件商品
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {checkoutStep === 'cart' && (
            <div className="h-full flex flex-col justify-between">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-5">
                  <div className="h-20 w-20 bg-slate-50 dark:bg-slate-950/60 rounded-full flex items-center justify-center shadow-inner">
                    <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-base">购物车空空如也</h4>
                    <p className="text-xs text-slate-400 mt-1.5">快去浏览图书添加心仪好书吧！</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {/* Cart Actions */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">管理购买明细</span>
                    <button
                      onClick={() => {
                        clearCart();
                        addLog('SERVLET', 'CartServlet: 触发清空购物车动作，回收购物车 JavaBean 实体');
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>清空购物车</span>
                    </button>
                  </div>

                  {/* Cart Item Row List */}
                  <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.bookId}
                        className="flex gap-4 p-3 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-700/60 transition-all duration-200"
                      >
                        <img 
                          src={item.book.coverImage} 
                          alt={item.book.title} 
                          className="h-16 w-12 object-cover rounded shadow-sm shrink-0 bg-slate-100"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {item.book.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              作者: {item.book.author}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1.5">
                            {/* Quantity Editor */}
                            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-xs overflow-hidden">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateCartQty(item.bookId, item.quantity - 1);
                                    addLog('SERVLET', `CartServlet: 减少购买数量 -> ${item.book.title} x ${item.quantity - 1}`);
                                  } else {
                                    removeCartItem(item.bookId);
                                    addLog('SERVLET', `CartServlet: 移除商品 -> ${item.book.title}`);
                                  }
                                }}
                                className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold"
                              >
                                -
                              </button>
                              <span className="px-2.5 py-0.5 text-center font-mono font-medium text-slate-800 dark:text-slate-200">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  if (item.quantity < item.book.stock) {
                                    updateCartQty(item.bookId, item.quantity + 1);
                                    addLog('SERVLET', `CartServlet: 增加购买数量 -> ${item.book.title} x ${item.quantity + 1}`);
                                  } else {
                                    addLog('SERVLET', `CartServlet: 购买量已达到图书 [${item.book.title}] 最大库存!`);
                                  }
                                }}
                                className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-rose-500">
                                ¥{(item.book.price * item.quantity).toFixed(2)}
                              </span>
                              <button
                                onClick={() => {
                                  removeCartItem(item.bookId);
                                  addLog('SERVLET', `CartServlet: 彻底删除商品 -> ${item.book.title}`);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {checkoutStep === 'shipping' && (
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-400 flex gap-2">
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-indigo-500" />
                <div>
                  <span className="font-semibold block mb-0.5">安全信息自动装载</span>
                  已自动检测并填入您在<b>用户注册模块</b>填入的个人信息。所有修改将在提交订单时进行严格的正则法则匹配验证。
                </div>
              </div>

              {/* Recipient Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  收货人姓名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="请输入收货人真实姓名"
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 input-focus"
                  />
                </div>
              </div>

              {/* ID Card (Required Regex match!) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex justify-between">
                  <span>身份证号码 (提报必备)</span>
                  <span className="text-[10px] font-mono text-indigo-500 font-semibold">[ID Regex]</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={idCard}
                    onChange={(e) => handleInputChange('idCard', e.target.value, setIdCard)}
                    onBlur={(e) => handleBlur('idCard', e.target.value)}
                    placeholder="输入收货人身份证"
                    className={`w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      touched.idCard && errors.idCard ? 'border-rose-400' : touched.idCard && !errors.idCard ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {touched.idCard && errors.idCard && (
                  <p className="mt-1 text-[10px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.idCard}
                  </p>
                )}
              </div>

              {/* QQ Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex justify-between">
                  <span>联系 QQ</span>
                  <span className="text-[10px] font-mono text-indigo-500 font-semibold">[QQ Regex]</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={qq}
                    onChange={(e) => handleInputChange('qq', e.target.value, setQq)}
                    onBlur={(e) => handleBlur('qq', e.target.value)}
                    placeholder="收货人联系QQ"
                    className={`w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      touched.qq && errors.qq ? 'border-rose-400' : touched.qq && !errors.qq ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                </div>
                {touched.qq && errors.qq && (
                  <p className="mt-1 text-[10px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.qq}
                  </p>
                )}
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex justify-between">
                    <span>联系电话</span>
                    <span className="text-[10px] font-mono text-indigo-500 font-semibold">[Phone Regex]</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => handleInputChange('phone', e.target.value, setPhone)}
                      onBlur={(e) => handleBlur('phone', e.target.value)}
                      placeholder="收货手机号码"
                      className={`w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        touched.phone && errors.phone ? 'border-rose-400' : touched.phone && !errors.phone ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                  </div>
                  {touched.phone && errors.phone && (
                    <p className="mt-1 text-[10px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex justify-between">
                    <span>电子邮箱</span>
                    <span className="text-[10px] font-mono text-indigo-500 font-semibold">[Mail Regex]</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleInputChange('email', e.target.value, setEmail)}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      placeholder="联系邮箱地址"
                      className={`w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        touched.email && errors.email ? 'border-rose-400' : touched.email && !errors.email ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-[10px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  详细收货地址
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="请输入省、市、区及详细街道门牌号信息"
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 input-focus"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/10 active:scale-[0.98] transition-all btn-gradient btn-gradient-emerald"
              >
                确认提交订单 (进行 JDBC 多表事务写入)
              </button>
            </form>
          )}

          {checkoutStep === 'success' && (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-5 animate-fade-in-up">
              <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="h-12 w-12" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xl">订单生成成功</h4>
                <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                  系统已执行多条并发 SQL 写入，自动锁定了图书库存。您现在可以切换至「订单历史」或「后台管理面板」查看订单处理进程。
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full text-left space-y-1 text-[11px] font-mono text-slate-500">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span>执行数据库事务追踪</span>
                  <span className="text-emerald-500 font-bold">COMMIT SUCCESS ✓</span>
                </div>
                <div>INSERT INTO t_orders ...</div>
                <div>INSERT INTO t_order_items ...</div>
                <div>UPDATE t_books SET stock = stock - ? ...</div>
              </div>

              <button
                onClick={() => {
                  setCheckoutStep('cart');
                  onClose();
                }}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 active:scale-95 transition-all btn-gradient btn-gradient-indigo"
              >
                我知道了
              </button>
            </div>
          )}
        </div>

        {/* Footer with Calculations */}
        {checkoutStep !== 'success' && cart.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>商品小计</span>
                <span className="font-mono">¥{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>运费</span>
                <span className="text-emerald-500">免运费 (课程优惠)</span>
              </div>
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2.5 flex justify-between text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-200">应付合计</span>
                <span className="font-mono font-bold text-rose-500 text-base">¥{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              <button
                onClick={handleGoToShipping}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all btn-gradient btn-gradient-indigo"
              >
                <span>下一步：填写收货信息</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setCheckoutStep('cart')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all"
              >
                返回购物车明细
              </button>
            )}
          </div>
        )}
      </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

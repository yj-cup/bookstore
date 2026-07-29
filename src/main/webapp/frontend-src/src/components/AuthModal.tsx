import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, User as UserIcon, Lock, Mail, Phone, Hash, 
  MessageSquare, CheckCircle, AlertCircle, Info, ShieldAlert 
} from 'lucide-react';
import { User, LogEntry } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  addLog: (type: 'JDBC' | 'FILTER' | 'SERVLET' | 'JSP', message: string, query?: string) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  addLog, 
  users, 
  setUsers 
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idCard, setIdCard] = useState('');
  const [qq, setQq] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Regular Expressions
  const REGEX_RULES = {
    username: {
      regex: /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,16}$/,
      desc: '3-16位字母/数字/下划线/中文',
      errorMsg: '用户名必须为3-16位字母、数字、下划线或中文'
    },
    idCard: {
      regex: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
      desc: '15或18位中国身份证格式',
      errorMsg: '请输入正确的15或18位身份证格式'
    },
    qq: {
      regex: /^[1-9][0-9]{4,10}$/,
      desc: '5-11位纯数字（首位不为0）',
      errorMsg: '请输入正确的5-11位QQ号格式'
    },
    phone: {
      regex: /^1[3-9]\d{9}$/,
      desc: '11位中国手机号格式',
      errorMsg: '请输入正确的11位手机号码'
    },
    email: {
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      desc: '标准的Email电子邮箱格式',
      errorMsg: '请输入有效的电子邮箱地址'
    }
  };

  // Perform single field validation
  const validateField = (name: string, value: string) => {
    if (!value) return '该项不能为空';
    
    if (name in REGEX_RULES) {
      const rule = REGEX_RULES[name as keyof typeof REGEX_RULES];
      if (!rule.regex.test(value)) {
        return rule.errorMsg;
      }
    }

    if (name === 'password' && value.length < 6) {
      return '密码长度不能少于6位';
    }

    if (name === 'confirmPassword' && value !== password) {
      return '两次输入的密码不一致';
    }

    return '';
  };

  // Perform full form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    newErrors.username = validateField('username', username);
    newErrors.password = validateField('password', password);
    
    if (!isLogin) {
      newErrors.confirmPassword = validateField('confirmPassword', confirmPassword);
      newErrors.idCard = validateField('idCard', idCard);
      newErrors.qq = validateField('qq', qq);
      newErrors.phone = validateField('phone', phone);
      newErrors.email = validateField('email', email);
    }

    // Filter empty errors
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Trigger field validation on input or blur
  const handleInputChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // API helper
  const apiBase = '/bookstore/auth';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    addLog('FILTER', `SecurityFilter: 拦截并解析到请求 /auth?isLogin=${isLogin}&admin=${isAdminMode}`);

    if (isLogin) {
      if (isAdminMode) {
        // Admin Login - 调用后端 API
        addLog('JDBC', '查询管理员登录凭证', `SELECT * FROM t_users WHERE username='${username}' AND password='***' AND role='admin'`);
        try {
          const params = new URLSearchParams({ action: 'login', username, password });
          const res = await fetch(`${apiBase}?action=login`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include',
            body: params.toString()
          });
          const data = await res.json();
          if (data.success && data.user.role === 'admin') {
            const u = data.user;
            const adminUser: User = {
              id: u.id, username: u.username, role: u.role,
              idCard: u.idCard, qq: u.qq, phone: u.phone, email: u.email,
              registeredAt: new Date().toISOString()
            };
            addLog('SERVLET', `AuthServlet: 管理员 [${username}] 鉴权成功，建立 Session 会话`);
            // 同步用户列表
            const listRes = await fetch(`${apiBase}?action=listUsers`, {
              headers: { 'Accept': 'application/json' }, credentials: 'include'
            });
            const listData = await listRes.json();
            if (listData.success) {
              setUsers(listData.users.map((x: any) => ({
                id: x.id, username: x.username, role: x.role,
                idCard: x.idCard, qq: x.qq, phone: x.phone, email: x.email,
                registeredAt: ''
              })));
            }
            onAuthSuccess(adminUser);
            onClose();
          } else {
            setErrors({ submit: data.user && data.user.role !== 'admin' ? '该账号不是管理员，无权登录后台' : (data.message || '管理员用户名或密码错误') });
            addLog('SERVLET', `AuthServlet: 管理员登录失败 - ${data.message || '权限不足'}`);
          }
        } catch (err) {
          setErrors({ submit: '网络错误，无法连接后端服务器' });
          addLog('SERVLET', `AuthServlet: 请求后端失败 - ${err}`);
        }
      } else {
        // Regular User Login - 调用后端 API
        addLog('JDBC', '查询用户登录凭证', `SELECT * FROM t_users WHERE username='${username}' AND password='***'`);
        try {
          const params = new URLSearchParams({ action: 'login', username, password });
          const res = await fetch(`${apiBase}?action=login`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include',
            body: params.toString()
          });
          const data = await res.json();
          if (data.success) {
            const u = data.user;
            const loginUser: User = {
              id: u.id, username: u.username, role: u.role,
              idCard: u.idCard, qq: u.qq, phone: u.phone, email: u.email,
              registeredAt: new Date().toISOString()
            };
            addLog('SERVLET', `AuthServlet: 用户 [${username}] 登录成功，角色：${u.role}`);
            const listRes = await fetch(`${apiBase}?action=listUsers`, {
              headers: { 'Accept': 'application/json' }, credentials: 'include'
            });
            const listData = await listRes.json();
            if (listData.success) {
              setUsers(listData.users.map((x: any) => ({
                id: x.id, username: x.username, role: x.role,
                idCard: x.idCard, qq: x.qq, phone: x.phone, email: x.email,
                registeredAt: ''
              })));
            }
            onAuthSuccess(loginUser);
            onClose();
          } else {
            setErrors({ submit: data.message || '登录失败' });
            addLog('SERVLET', `AuthServlet: 用户 [${username}] 登录失败：${data.message}`);
          }
        } catch (err) {
          setErrors({ submit: '网络错误，无法连接后端服务器' });
          addLog('SERVLET', `AuthServlet: 请求后端失败 - ${err}`);
        }
      }
    } else {
      // Handle Registration - 先前端校验，再调用后端 API
      const isFormValid = validateForm();
      if (!isFormValid) {
        addLog('SERVLET', 'AuthServlet: 前端表单校验未通过，拦截本次提交');
        return;
      }

      addLog('SERVLET', `AuthServlet: 用户 [${username}] 数据通过前端 Regex 验证，发送注册请求...`);
      addLog('JDBC', '将新用户写入数据库 t_users',
        `INSERT INTO t_users (id, username, password, role, id_card, qq, phone, email) VALUES ('...', '${username}', '<bcrypt-hash>', 'user', '${idCard}', '${qq}', '${phone}', '${email}')`
      );

      try {
        const params = new URLSearchParams({
          action: 'register', username, password, idCard, qq, phone, email
        });
        const res = await fetch(`${apiBase}?action=register`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
          credentials: 'include',
          body: params.toString()
        });
        const data = await res.json();
        if (data.success) {
          addLog('SERVLET', `AuthServlet: 用户 [${username}] 注册成功，已写入 MySQL 数据库`);
          // 同步用户列表
          const listRes = await fetch(`${apiBase}?action=listUsers`, {
            headers: { 'Accept': 'application/json' }, credentials: 'include'
          });
          const listData = await listRes.json();
          if (listData.success) {
            setUsers(listData.users.map((x: any) => ({
              id: x.id, username: x.username, role: x.role,
              idCard: x.idCard, qq: x.qq, phone: x.phone, email: x.email,
              registeredAt: ''
            })));
          }
          // 自动登录
          const u = data.user;
          const newUser: User = {
            id: u.id, username: u.username, role: u.role,
            idCard: u.idCard, qq: u.qq, phone: u.phone, email: u.email,
            registeredAt: new Date().toISOString()
          };
          onAuthSuccess(newUser);
          onClose();
        } else {
          setErrors({ submit: data.message || '注册失败' });
          addLog('SERVLET', `AuthServlet: 注册失败 - ${data.message}`);
        }
      } catch (err) {
        setErrors({ submit: '网络错误，无法连接后端服务器' });
        addLog('SERVLET', `AuthServlet: 请求后端失败 - ${err}`);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Animated glass backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-lg cursor-pointer"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col md:flex-row max-w-4xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
          >
            {/* Left Side: Standard Validation Explanation Panel */}
            <div className="md:w-80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 shrink-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
                    <Shield className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-bold text-sm tracking-wide uppercase">Regex 校验引擎</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  根据课程设计规范，系统前台采用标准正则表达式对核心字段（QQ、电话、身份证、邮箱）进行<b className="text-indigo-600 dark:text-indigo-400">实时状态机匹配</b>。
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    { label: '身份证 (15/18位)', regex: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.toString() },
                    { label: 'QQ 号 (5-11位)', regex: /^[1-9][0-9]{4,10}$/.toString() },
                    { label: '手机号码 (11位)', regex: /^1[3-9]\d{9}$/.toString() },
                    { label: '电子邮箱', regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.toString() }
                  ].map(item => (
                    <div key={item.label} className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span className="text-[8px] font-mono text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">Regex</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1 break-all opacity-70">
                        /.../
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Side: Form Inputs */}
            <div className="flex-1 p-8 flex flex-col justify-between bg-white dark:bg-slate-900">
              <div>
                {/* Modal Header Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {isLogin ? (isAdminMode ? '管理员系统安全登录' : '欢迎回来在线书城') : '创建新书友账号'}
                    </h3>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Selector: User Login vs Admin Login vs Register */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-6 text-xs">
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setIsAdminMode(false);
                      setErrors({});
                    }}
                    className={`flex-1 py-2.5 text-center rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                      isLogin && !isAdminMode
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    用户登录
                  </button>

                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setIsAdminMode(true);
                      setErrors({});
                    }}
                    className={`flex-1 py-2.5 text-center rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                      isLogin && isAdminMode
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      管理员登录
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setIsAdminMode(false);
                      setErrors({});
                    }}
                    className={`flex-1 py-2.5 text-center rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                      !isLogin
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    新用户注册
                  </button>
                </div>

                {/* Error Message Alert */}
                {errors.submit && (
                  <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs flex items-start gap-2 animate-pulse">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span className="font-medium">{errors.submit}</span>
                  </div>
                )}

                {/* Input Form Body */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      用户名
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => handleInputChange('username', e.target.value, setUsername)}
                        onBlur={(e) => handleBlur('username', e.target.value)}
                        placeholder="请输入登录用户名"
                        className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all input-focus ${
                          touched.username && errors.username 
                            ? 'border-rose-400 focus:border-rose-500' 
                            : touched.username && !errors.username
                              ? 'border-emerald-400 focus:border-emerald-500'
                              : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                        }`}
                      />
                      {touched.username && !errors.username && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    {touched.username && errors.username && (
                      <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.username}
                      </p>
                    )}
                    {!isLogin && (
                      <p className="mt-1 text-[10px] text-slate-400 italic">
                        要求: {REGEX_RULES.username.desc}
                      </p>
                    )}
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        登录密码
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => handleInputChange('password', e.target.value, setPassword)}
                          onBlur={(e) => handleBlur('password', e.target.value)}
                          placeholder="设置密码"
                          className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all input-focus ${
                            touched.password && errors.password 
                              ? 'border-rose-400 focus:border-rose-500' 
                              : touched.password && !errors.password
                                ? 'border-emerald-400 focus:border-emerald-500'
                                : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      {touched.password && errors.password && (
                        <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.password}
                        </p>
                      )}
                    </div>

                    {!isLogin && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          确认密码
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value, setConfirmPassword)}
                            onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                            placeholder="再次输入密码"
                            className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all input-focus ${
                              touched.confirmPassword && errors.confirmPassword 
                                ? 'border-rose-400 focus:border-rose-500' 
                                : touched.confirmPassword && !errors.confirmPassword
                                  ? 'border-emerald-400 focus:border-emerald-500'
                                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                            }`}
                          />
                        </div>
                        {touched.confirmPassword && errors.confirmPassword && (
                          <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Registration Specific Fields: ID, QQ, Phone, Email */}
                  {!isLogin && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* ID Card & QQ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            身份证号码
                          </label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={idCard}
                              onChange={(e) => handleInputChange('idCard', e.target.value, setIdCard)}
                              onBlur={(e) => handleBlur('idCard', e.target.value)}
                              placeholder="请输入真实身份证"
                              className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all input-focus ${
                                touched.idCard && errors.idCard 
                                  ? 'border-rose-400 focus:border-rose-500' 
                                  : touched.idCard && !errors.idCard
                                    ? 'border-emerald-400 focus:border-emerald-500'
                                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                              }`}
                            />
                            {touched.idCard && !errors.idCard && (
                              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          {touched.idCard && errors.idCard && (
                            <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errors.idCard}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            QQ 号码
                          </label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={qq}
                              onChange={(e) => handleInputChange('qq', e.target.value, setQq)}
                              onBlur={(e) => handleBlur('qq', e.target.value)}
                              placeholder="请输入常用的QQ号"
                              className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all input-focus ${
                                touched.qq && errors.qq 
                                  ? 'border-rose-400 focus:border-rose-500' 
                                  : touched.qq && !errors.qq
                                    ? 'border-emerald-400 focus:border-emerald-500'
                                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                              }`}
                            />
                            {touched.qq && !errors.qq && (
                              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          {touched.qq && errors.qq && (
                            <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errors.qq}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Phone & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            联系电话
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={phone}
                              onChange={(e) => handleInputChange('phone', e.target.value, setPhone)}
                              onBlur={(e) => handleBlur('phone', e.target.value)}
                              placeholder="11位手机号码"
                              className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all input-focus ${
                                touched.phone && errors.phone 
                                  ? 'border-rose-400 focus:border-rose-500' 
                                  : touched.phone && !errors.phone
                                    ? 'border-emerald-400 focus:border-emerald-500'
                                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                              }`}
                            />
                            {touched.phone && !errors.phone && (
                              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          {touched.phone && errors.phone && (
                            <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errors.phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            电子邮箱
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => handleInputChange('email', e.target.value, setEmail)}
                              onBlur={(e) => handleBlur('email', e.target.value)}
                              placeholder="yourname@example.com"
                              className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all input-focus ${
                                touched.email && errors.email 
                                  ? 'border-rose-400 focus:border-rose-500' 
                                  : touched.email && !errors.email
                                    ? 'border-emerald-400 focus:border-emerald-500'
                                    : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                              }`}
                            />
                            {touched.email && !errors.email && (
                              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          {touched.email && errors.email && (
                            <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <button
                    type="submit"
                    className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-2 btn-gradient btn-gradient-indigo"
                  >
                    {isLogin 
                      ? (isAdminMode ? '安全鉴权登录 (Admin)' : '安全验证登录 (User)') 
                      : '提交 Regex 注册信息'
                    }
                  </button>
                </form>
              </div>

              <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <Info className="h-3 w-3" />
                <span>用户数据已连接 MySQL 数据库，注册和登录数据持久化存储</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

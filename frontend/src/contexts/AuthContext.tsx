import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

// 用户类型
export interface User {
  code: string;
  department_id: number;
  token?: string;
  expiresAt?: number; // token过期时间戳
}

// 管理员类型
export interface Admin {
  id: number;
  token: string;
  name: string;
  expiresAt?: number; // token过期时间戳
}

// 认证上下文类型
interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  setUser: (user: User | null) => void;
  setAdmin: (admin: Admin | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  checkTokenExpiry: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [admin, setAdminState] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // 登出函数
  const logout = useCallback(() => {
    setUserState(null);
    setAdminState(null);
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
  }, []);

  // 检查token是否过期
  const checkTokenExpiry = useCallback((): boolean => {
    const now = Date.now();
    
    // 检查用户token
    if (user?.expiresAt && now > user.expiresAt) {
      message.warning('登录已过期，请重新登录');
      logout();
      return true;
    }
    
    // 检查管理员token
    if (admin?.expiresAt && now > admin.expiresAt) {
      message.warning('管理员登录已过期，请重新登录');
      logout();
      return true;
    }
    
    return false;
  }, [user, admin, logout]);

  // 设置axios拦截器处理401错误
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // 在请求前检查token是否过期
        if (checkTokenExpiry()) {
          return Promise.reject(new Error('Token expired'));
        }
        // 自动加上用户token
        if (user?.token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        // 自动加上管理员token
        if (admin?.token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${admin.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          logout();
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && !currentPath.startsWith('/admin')) {
            message.error('登录已过期，请重新登录');
            window.location.href = '/login';
          } else if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
            message.error('登录已过期，请重新登录');
            window.location.href = '/admin/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // 清理拦截器
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [user, admin, checkTokenExpiry, logout]);

  // 定期检查token过期（每分钟检查一次）
  useEffect(() => {
    const interval = setInterval(() => {
      checkTokenExpiry();
    }, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, [user, admin, checkTokenExpiry]);

  // 从本地存储加载状态
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdmin = localStorage.getItem('admin');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // 检查用户token是否过期
        if (parsedUser.expiresAt && Date.now() > parsedUser.expiresAt) {
          localStorage.removeItem('user');
          message.warning('登录已过期，请重新登录');
        } else {
          setUserState(parsedUser);
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    
    if (savedAdmin) {
      try {
        const parsedAdmin = JSON.parse(savedAdmin);
        // 检查管理员token是否过期
        if (parsedAdmin.expiresAt && Date.now() > parsedAdmin.expiresAt) {
          localStorage.removeItem('admin');
          message.warning('管理员登录已过期，请重新登录');
        } else {
          setAdminState(parsedAdmin);
        }
      } catch (error) {
        localStorage.removeItem('admin');
      }
    }
    
    setLoading(false);
  }, []);

  // 设置用户状态并保存到本地存储
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      // 如果没有设置过期时间，默认2小时后过期
      const userWithExpiry = {
        ...newUser,
        expiresAt: newUser.expiresAt || (Date.now() + 2 * 60 * 60 * 1000) // 2小时
      };
      localStorage.setItem('user', JSON.stringify(userWithExpiry));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  // 设置管理员状态并保存到本地存储
  const setAdmin = useCallback((newAdmin: Admin | null) => {
    setAdminState(newAdmin);
    if (newAdmin) {
      // 如果没有设置过期时间，默认2小时后过期
      const adminWithExpiry = {
        ...newAdmin,
        expiresAt: newAdmin.expiresAt || (Date.now() + 2 * 60 * 60 * 1000) // 2小时
      };
      localStorage.setItem('admin', JSON.stringify(adminWithExpiry));
    } else {
      localStorage.removeItem('admin');
    }
  }, []);



  const isAuthenticated = !!(user || admin);

  const value: AuthContextType = {
    user,
    admin,
    setUser,
    setAdmin,
    logout,
    isAuthenticated,
    loading,
    checkTokenExpiry,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
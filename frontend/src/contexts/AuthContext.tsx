import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 用户类型
export interface User {
  code: string;
  department_id: number;
}

// 管理员类型
export interface Admin {
  token: string;
  name: string;
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

  // 从本地存储加载状态
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdmin = localStorage.getItem('admin');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUserState(parsedUser);
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    
    if (savedAdmin) {
      try {
        const parsedAdmin = JSON.parse(savedAdmin);
        setAdminState(parsedAdmin);
      } catch (error) {
        localStorage.removeItem('admin');
      }
    }
    
    setLoading(false);
  }, []);

  // 设置用户状态并保存到本地存储
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  // 设置管理员状态并保存到本地存储
  const setAdmin = (newAdmin: Admin | null) => {
    setAdminState(newAdmin);
    if (newAdmin) {
      localStorage.setItem('admin', JSON.stringify(newAdmin));
    } else {
      localStorage.removeItem('admin');
    }
  };

  // 登出函数
  const logout = () => {
    setUser(null);
    setAdmin(null);
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
  };

  const isAuthenticated = !!(user || admin);

  const value: AuthContextType = {
    user,
    admin,
    setUser,
    setAdmin,
    logout,
    isAuthenticated,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
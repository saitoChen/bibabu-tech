'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    // 登录页面不需要校验
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }

    const storedKey = localStorage.getItem('auth_key');
    const storedExpires = localStorage.getItem('auth_expires');

    if (!storedKey) {
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsLoading(false);
      router.push('/login');
      return;
    }

    // 检查本地存储的过期时间
    if (storedExpires) {
      const expiresAt = new Date(storedExpires);
      if (expiresAt <= new Date()) {
        localStorage.removeItem('auth_key');
        localStorage.removeItem('auth_expires');
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        router.push('/login');
        return;
      }
    }

    // 永久密钥直接通过，不需要验证
    if (storedKey === 'bibabuno1') {
      setIsAuthenticated(true);
      setIsAdmin(true);
      setIsLoading(false);
      return;
    }

    // 向服务器验证密钥
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: storedKey }),
      });

      const result = await response.json();

      if (result.valid) {
        // 更新过期时间
        if (result.expiresAt) {
          localStorage.setItem('auth_expires', result.expiresAt);
        }
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('auth_key');
        localStorage.removeItem('auth_expires');
        setIsAuthenticated(false);
        router.push('/login');
      }
    } catch {
      // 网络错误时，如果本地未过期则允许访问
      if (storedExpires && new Date(storedExpires) > new Date()) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  // 轮询检查密钥是否被刷新（每30秒）
  useEffect(() => {
    if (!isAuthenticated || pathname === '/login') return;

    const interval = setInterval(async () => {
      const storedKey = localStorage.getItem('auth_key');
      if (!storedKey || storedKey === 'bibabuno1') return;

      try {
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: storedKey }),
        });
        const result = await response.json();

        if (!result.valid) {
          localStorage.removeItem('auth_key');
          localStorage.removeItem('auth_expires');
          setIsAuthenticated(false);
          setIsAdmin(false);
          router.push('/login');
        }
      } catch {
        // 网络错误忽略
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, pathname, router]);

  // SSR 阶段返回一致的初始状态，避免 hydration mismatch
  if (!mounted) {
    return { isAuthenticated: false, isLoading: true, isAdmin: false };
  }

  return { isAuthenticated, isLoading, isAdmin };
}

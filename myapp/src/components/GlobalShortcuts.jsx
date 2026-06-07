import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SHORTCUTS = {
  d: '/define/chart-of-products',
  a: '/page/chart-of-accounts',
  p: '/page/purchase',
  s: '/page/sale',
  r: '/page/cash-receipt',
  t: '/page/cash-payment',
  h: '/page/product-history',
};

export default function GlobalShortcuts() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const handler = (e) => {
      if (!e.ctrlKey || e.altKey || e.metaKey) return;

      const path = SHORTCUTS[e.key.toLowerCase()];
      if (!path) return;

      e.preventDefault();
      navigate(path);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, isAuthenticated]);

  return null;
}

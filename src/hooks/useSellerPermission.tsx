import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SellerPermission {
  canSell: boolean;
  loading: boolean;
  role: 'admin' | 'seller' | 'user' | null;
}

export const useSellerPermission = (): SellerPermission => {
  const { user, loading: authLoading } = useAuth();
  const [canSell, setCanSell] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'seller' | 'user' | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      // Auth가 아직 로딩 중이면 대기
      if (authLoading) {
        return;
      }
      
      if (!user) {
        setCanSell(false);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, can_sell')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error checking seller permission:', error);
          setCanSell(false);
          setRole(null);
        } else if (data && data.length > 0) {
          // 여러 개의 행이 있을 경우, admin 역할을 우선시하고 가장 높은 권한 사용
          const adminRole = data.find(r => r.role === 'admin');
          const sellerRole = data.find(r => r.role === 'seller');
          const userRole = data.find(r => r.role === 'user');
          
          const activeRole = adminRole || sellerRole || userRole || data[0];
          
          setRole(activeRole.role);
          // can_sell 필드가 있으면 그 값을 사용, 없으면 role 기반으로 판단
          const hasPermission = activeRole.can_sell ?? (activeRole.role === 'admin' || activeRole.role === 'seller');
          setCanSell(hasPermission);
        } else {
          setCanSell(false);
          setRole('user');
        }
      } catch (error) {
        console.error('Error checking seller permission:', error);
        setCanSell(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, authLoading]);

  return { canSell, loading, role };
};
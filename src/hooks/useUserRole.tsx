import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'seller' | 'user';

interface UserRoleData {
  role: UserRole | null;
  loading: boolean;
  canSellPaidPrompts: boolean; // seller 또는 admin인 경우 true
  isAdmin: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      // Auth가 아직 로딩 중이면 대기
      if (authLoading) {
        return;
      }
      
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error checking user role:', error);
          // 에러 시 기본값은 user
          setRole('user');
        } else if (data && data.length > 0) {
          // 여러 개의 행이 있을 경우, 가장 높은 권한 사용
          const roles = data.map(r => r.role);
          if (roles.includes('admin')) {
            setRole('admin');
          } else if (roles.includes('seller')) {
            setRole('seller');
          } else {
            setRole('user');
          }
        } else {
          // user_roles에 레코드가 없으면 기본 user
          setRole('user');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, authLoading]);

  return { 
    role, 
    loading,
    canSellPaidPrompts: role === 'seller' || role === 'admin',
    isAdmin: role === 'admin'
  };
};
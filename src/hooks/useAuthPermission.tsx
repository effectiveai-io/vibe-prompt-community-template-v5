import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthPermission {
  role: 'admin' | 'seller' | 'user' | null;
  canSell: boolean;
  loading: boolean;
}

export const useAuthPermission = (): AuthPermission => {
  const { user, session } = useAuth();
  const [role, setRole] = useState<'admin' | 'seller' | 'user' | null>(null);
  const [canSell, setCanSell] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user || !session) {
        setRole(null);
        setCanSell(false);
        setLoading(false);
        return;
      }

      try {
        // JWT 토큰에서 직접 권한 정보 읽기
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser?.app_metadata) {
          const appMetadata = authUser.app_metadata;
          setRole(appMetadata.role || 'user');
          setCanSell(appMetadata.can_sell === true);
        } else {
          // app_metadata가 없으면 기본값
          setRole('user');
          setCanSell(false);
        }
      } catch (error) {
        console.error('Error checking auth permission:', error);
        setRole('user');
        setCanSell(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, session]);

  return { role, canSell, loading };
};
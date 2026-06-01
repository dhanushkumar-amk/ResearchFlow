import { useAuth as useGlobalAuth } from '../lib/AuthContext';

export default function useAuth() {
  const { user, token, loading } = useGlobalAuth();
  return {
    isAuthenticated: !!user,
    user,
    token,
    loading
  };
}

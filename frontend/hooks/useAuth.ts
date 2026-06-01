import { useAuth as useGlobalAuth } from '../lib/AuthContext';

export default function useAuth() {
  const context = useGlobalAuth();
  return {
    ...context,
    isAuthenticated: !!context.user,
  };
}

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Global variable to share navigation state on client side
let navigationState: any = null;

export function useNavigate() {
  const router = useRouter();
  
  return (path: string, options?: { state?: any }) => {
    if (options && options.state) {
      navigationState = options.state;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('rf_nav_state', JSON.stringify(options.state));
        } catch (err) {
          console.error('Failed to save navigation state to sessionStorage', err);
        }
      }
    } else {
      navigationState = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('rf_nav_state');
      }
    }
    router.push(path);
  };
}

export function useLocation() {
  const [state, setState] = useState<any>(() => {
    if (navigationState) return navigationState;
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('rf_nav_state');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Sync state if it updates or on mount
  useEffect(() => {
    if (navigationState) {
      setState(navigationState);
    } else if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('rf_nav_state');
        if (stored) {
          setState(JSON.parse(stored));
        }
      } catch {}
    }
  }, []);

  return { state };
}

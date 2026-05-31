'use client';

import { useEffect } from 'react';

export default function ErrorSuppressor() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || '');
      const stack = event.reason?.stack || '';
      
      // Check if the rejection comes from the MetaMask extension
      if (
        reason.includes('MetaMask') || 
        reason.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        stack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      const filename = event.filename || '';
      const stack = event.error?.stack || '';

      // Check if the error comes from the MetaMask extension
      if (
        message.includes('MetaMask') ||
        filename.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        stack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    // Use capturing phase (true) to catch and suppress the event before Next.js listeners handle it
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null;
}

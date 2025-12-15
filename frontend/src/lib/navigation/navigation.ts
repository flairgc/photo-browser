import { useSyncExternalStore } from 'react';


export function getCurrentPath() {
  return decodeURIComponent(
    window.location.pathname.replace(/^\/+/, ''),
  );
}

export function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

export function usePathname() {
  return useSyncExternalStore(
    subscribe,
    getCurrentPath,
  );
}

export function navigate(path: string) {
  window.history.pushState(null, '', '/' + encodeURIComponent(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
}
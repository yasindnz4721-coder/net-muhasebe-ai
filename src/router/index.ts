import { useEffect } from 'react';
import { useRoutes, useNavigate } from 'react-router-dom';
import routes from './config';

let navigateResolver: ((navigate: ReturnType<typeof useNavigate>) => void) | null = null;

declare global {
  interface Window {
    REACT_APP_NAVIGATE?: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<ReturnType<typeof useNavigate>>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    if (navigateResolver) {
      navigateResolver(navigate);
    }
  }, [navigate]);

  const element = useRoutes(routes);

  return element;
}

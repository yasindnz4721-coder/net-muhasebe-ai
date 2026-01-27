import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { ProfileProvider } from './contexts/ProfileContext';

function App() {
  return (
    <BrowserRouter basename="/">
      <ProfileProvider>
        <AppRoutes />
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;

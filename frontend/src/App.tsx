import { useSelector } from 'react-redux';
import { Container, CssBaseline } from '@mui/material';
import { AddCryptoForm } from './components/AddCryptoForm';
import { PortfolioTable } from './components/PortfolioTable';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Header } from './components/Header';
import { AlertMessage } from './components/AlertMessage';
import { useState, useEffect } from 'react';
import type { RootState } from './store/store';

function App() {
  const { token, error } = useSelector((state: RootState) => state.auth);
  const [isLogin, setIsLogin] = useState(true);

  // Check authentication status on mount and token change
  useEffect(() => {
    if (!token) {
      // If no token, show login page
      setIsLogin(true);
    }
  }, [token]);

  const handleSwitchToRegister = () => setIsLogin(false);
  const handleSwitchToLogin = () => setIsLogin(true);

  // If not authenticated, show login/register forms
  if (!token) {
    return (
      <>
        <CssBaseline />
        {isLogin ? (
          <LoginForm onSwitchToRegister={handleSwitchToRegister} />
        ) : (
          <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
        )}
        {error && <AlertMessage message={error} onClose={() => {}} />}
      </>
    );
  }

  // If authenticated, show main application
  return (
    <>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <AddCryptoForm />
        <PortfolioTable />
      </Container>
    </>
  );
}

export default App;

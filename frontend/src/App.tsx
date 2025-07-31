import { useSelector } from 'react-redux';
import { Container, CssBaseline, Box, CircularProgress } from '@mui/material';
import { AddCryptoForm } from './components/AddCryptoForm';
import { PortfolioTable } from './components/PortfolioTable';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Header } from './components/Header';
import { AlertMessage } from './components/AlertMessage';
import { PriceAlerts } from './components/PriceAlerts';
import { KafkaTest } from './components/KafkaTest';
import { useState, useEffect } from 'react';
import type { RootState } from './store/store';

function App() {
  const { token, user, error, loading } = useSelector((state: RootState) => state.auth);
  const [isLogin, setIsLogin] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Add a small delay to prevent flash of login screen
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsInitialized(true);
    };
    initAuth();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (!token || !user) {
      setIsLogin(true);
    }
  }, [token, user]);

  const handleSwitchToRegister = () => setIsLogin(false);
  const handleSwitchToLogin = () => setIsLogin(true);

  // Show loading spinner while initializing
  if (!isInitialized || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

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
      <PriceAlerts />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <AddCryptoForm />
        <PortfolioTable />
        <KafkaTest />
      </Container>
    </>
  );
}

export default App;

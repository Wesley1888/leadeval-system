import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import TokenExpiryHandler from './components/TokenExpiryHandler';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TokenExpiryHandler>
          <AppRoutes />
        </TokenExpiryHandler>
      </AuthProvider>
    </Router>
  );
}

export default App;

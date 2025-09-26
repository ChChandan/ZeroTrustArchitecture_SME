import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import keycloak from './keycloak';

// Debug component to show current state
const DebugInfo = ({ isAuthenticated, user, keycloakState, error }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed top-0 right-0 bg-black text-white p-4 text-xs max-w-sm z-50" hidden>
      <h4>Debug Info:</h4>
      <div>Authenticated: {isAuthenticated ? 'YES' : 'NO'}</div>
      <div>Keycloak Ready: {keycloakState}</div>
      <div>User: {user ? user.name : 'None'}</div>
      <div>Token: {keycloak.token ? 'Present' : 'None'}</div>
      <div>URL: {window.location.pathname}</div>
      <div>Error: {error || 'None'}</div>
      <div>Keycloak Authenticated: {keycloak.authenticated ? 'YES' : 'NO'}</div>
    </div>
  );
};

// Simple Login Page
const LoginPage = ({ keycloakError, onManualCheck }) => {
  const [isLogging, setIsLogging] = useState(false);

  const handleLogin = () => {
    console.log('=== LOGIN BUTTON CLICKED ===');
    console.log('Current URL:', window.location.href);
    console.log('Keycloak authenticated before login:', keycloak.authenticated);
    
    setIsLogging(true);
    
    keycloak.login({
      redirectUri: window.location.origin + '/dashboard'
    }).catch(error => {
      console.error('Login failed:', error);
      setIsLogging(false);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">BusinessPro</h2>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>
        
        {keycloakError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">{keycloakError}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isLogging}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLogging ? 'Redirecting to Keycloak...' : 'Sign in with Keycloak'}
          </button>
          
          <button
            onClick={onManualCheck}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
          hidden>
            Check Auth Status
          </button>
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded" hidden>
          <div>Keycloak URL: {keycloak.authServerUrl || 'Not set'}</div>
          <div>Realm: {keycloak.realm || 'Not set'}</div>
          <div>Client ID: {keycloak.clientId || 'Not set'}</div>
          <div>Current Keycloak State: {keycloak.authenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        </div>
      </div>
    </div>
  );
};

// Dashboard wrapper
const DashboardPage = ({ user }) => {
  const handleLogout = () => {
    console.log('=== LOGOUT CLICKED ===');
    keycloak.logout({
      redirectUri: window.location.origin
    });
  };

  return (
    <Dashboard
      isAuthenticated={true}
      user={user}
      onLogout={handleLogout}
      keycloak={keycloak}
    />
  );
};

// Main App
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keycloakState, setKeycloakState] = useState('initializing');

  // Manual auth check function
  const checkAuthStatus = () => {
    console.log('=== MANUAL AUTH CHECK ===');
    console.log('Keycloak authenticated:', keycloak.authenticated);
    console.log('Keycloak token:', keycloak.token ? 'Present' : 'None');
    console.log('Keycloak token parsed:', keycloak.tokenParsed);
    console.log('Current state - isAuthenticated:', isAuthenticated);
    console.log('Current user:', user);
    
    if (keycloak.authenticated && !isAuthenticated) {
      console.log('Keycloak says authenticated but app state says not - fixing...');
      setIsAuthenticated(true);
      loadUserData();
    }
  };

  // Load user data
  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      const profile = await keycloak.loadUserProfile();
      const userData = {
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username || 'User',
        email: profile.email,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        roles: keycloak.realmAccess?.roles || []
      };
      console.log('User data loaded:', userData);
      setUser(userData);
      return userData;
    } catch (profileError) {
      console.warn('Profile loading failed, using token data:', profileError);
      const tokenParsed = keycloak.tokenParsed;
      const userData = {
        name: tokenParsed?.name || tokenParsed?.preferred_username || 'User',
        email: tokenParsed?.email || '',
        username: tokenParsed?.preferred_username || '',
        firstName: tokenParsed?.given_name || '',
        lastName: tokenParsed?.family_name || '',
        roles: keycloak.realmAccess?.roles || []
      };
      console.log('Fallback user data:', userData);
      setUser(userData);
      return userData;
    }
  };

  // Initialize Keycloak
  useEffect(() => {
    console.log('=== INITIALIZING KEYCLOAK ===');
    console.log('Current URL:', window.location.href);
    console.log('URL has code param:', window.location.search.includes('code='));
    
    const initKeycloak = async () => {
      try {
        setKeycloakState('connecting');
        
        // Check if this is a callback from Keycloak (has 'code' parameter)
        const urlParams = new URLSearchParams(window.location.search);
        const isCallback = urlParams.has('code') && urlParams.has('state');
        
        console.log('Is callback URL:', isCallback);
        
        const initOptions = {
          onLoad: isCallback ? 'login-required' : 'check-sso',
          checkLoginIframe: false,
          pkceMethod: 'S256'
        };
        
        console.log('Keycloak init options:', initOptions);
        
        const authenticated = await keycloak.init(initOptions);
        
        console.log('=== KEYCLOAK INIT COMPLETE ===');
        console.log('Authenticated:', authenticated);
        console.log('Token present:', !!keycloak.token);
        console.log('Token parsed:', keycloak.tokenParsed);
        
        setKeycloakState('ready');
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          console.log('User is authenticated, loading profile...');
          await loadUserData();
          
          // If we're on login page and authenticated, redirect to dashboard
          if (window.location.pathname === '/login' || window.location.pathname === '/') {
            console.log('Authenticated user on login page, redirecting to dashboard');
            window.location.replace('/dashboard');
            return;
          }
        } else {
          console.log('User not authenticated');
          // If we're trying to access dashboard but not authenticated, redirect to login
          if (window.location.pathname === '/dashboard') {
            console.log('Unauthenticated user on dashboard, redirecting to login');
            window.location.replace('/login');
            return;
          }
        }
        
      } catch (initError) {
        console.error('=== KEYCLOAK INIT FAILED ===');
        console.error('Error:', initError);
        setKeycloakState('error');
        //setError(initError.message || 'Keycloak initialization failed');
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  // Set up Keycloak event listeners
  useEffect(() => {
    console.log('Setting up Keycloak event listeners...');
    
    keycloak.onAuthSuccess = () => {
      console.log('=== AUTH SUCCESS EVENT ===');
      setError(null);
      setIsAuthenticated(true);
      loadUserData().then(() => {
        // Redirect to dashboard after successful auth
        if (window.location.pathname !== '/dashboard') {
          console.log('Auth success, redirecting to dashboard');
          window.location.replace('/dashboard');
        }
      });
    };

    keycloak.onAuthError = (errorData) => {
      console.error('=== AUTH ERROR EVENT ===');
      console.error('Error:', errorData);
      setError('Authentication failed');
      setIsAuthenticated(false);
      setUser(null);
    };

    keycloak.onAuthLogout = () => {
      console.log('=== AUTH LOGOUT EVENT ===');
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    };

    keycloak.onTokenExpired = () => {
      console.log('=== TOKEN EXPIRED EVENT ===');
      keycloak.updateToken(30).catch(() => {
        console.log('Token refresh failed, logging out');
        setIsAuthenticated(false);
        setUser(null);
      });
    };

    return () => {
      keycloak.onAuthSuccess = null;
      keycloak.onAuthError = null;
      keycloak.onAuthLogout = null;
      keycloak.onTokenExpired = null;
    };
  }, []);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing authentication...</p>
          <p className="text-sm text-gray-500 mt-2">State: {keycloakState}</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error && keycloakState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Authentication Service Error
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50" >
        <DebugInfo 
          isAuthenticated={isAuthenticated}
          user={user}
          keycloakState={keycloakState}
          error={error}
        />
        
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> :
                <LoginPage 
                  keycloakError={error} 
                  onManualCheck={checkAuthStatus}
                />
            }
          />
          
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? 
                <DashboardPage user={user} /> :
                <Navigate to="/login" replace />
            }
          />
          
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            }
          />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
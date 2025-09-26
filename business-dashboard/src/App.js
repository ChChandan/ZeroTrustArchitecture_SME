import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import keycloak from './keycloak';

// Login Page Component
const LoginPage = ({ onLogin, keycloakError }) => {
  const navigate = useNavigate();
  
  const handleLogin = () => {
    // Redirect to Keycloak login - it will come back to the current URL
    keycloak.login({
      redirectUri: window.location.origin + window.location.pathname
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-indigo-600">
            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            BusinessPro Dashboard
          </p>
        </div>
        
        {keycloakError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="text-sm">Authentication Error: {keycloakError}</p>
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          <button
            onClick={handleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </span>
            Sign in with Keycloak
          </button>
          
          <div className="text-center text-xs text-gray-500">
            Secure authentication powered by Keycloak
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Page Component
const DashboardPage = ({ user, keycloakInstance }) => {
  const handleLogout = () => {
    keycloakInstance.logout({
      redirectUri: window.location.origin + '/login'
    });
  };

  return (
    <Dashboard
      isAuthenticated={true}
      user={user}
      onLogout={handleLogout}
      keycloak={keycloakInstance}
    />
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated, isLoading }) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Auth Handler Component - processes authentication state changes
const AuthHandler = ({ 
  isAuthenticated, 
  isLoading, 
  onAuthStateChange 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If we just got authenticated and we're on login page, redirect to dashboard
    if (isAuthenticated && !isLoading && location.pathname === '/login') {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
    
    // If not authenticated and trying to access protected route, redirect to login
    if (!isAuthenticated && !isLoading && location.pathname === '/dashboard') {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  return null; // This component doesn't render anything
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keycloakError, setKeycloakError] = useState(null);
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);

  // Function to load user profile
  const loadUserProfile = async () => {
    try {
      const profile = await keycloak.loadUserProfile();
      return {
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username,
        email: profile.email,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        roles: keycloak.realmAccess?.roles || [],
        token: keycloak.token,
        refreshToken: keycloak.refreshToken
      };
    } catch (profileError) {
      console.warn('Could not load user profile, using token data:', profileError);
      const tokenParsed = keycloak.tokenParsed;
      return {
        name: tokenParsed?.name || tokenParsed?.preferred_username || 'User',
        email: tokenParsed?.email || '',
        username: tokenParsed?.preferred_username || '',
        firstName: tokenParsed?.given_name || '',
        lastName: tokenParsed?.family_name || '',
        roles: keycloak.realmAccess?.roles || [],
        token: keycloak.token,
        refreshToken: keycloak.refreshToken
      };
    }
  };

  // Initialize Keycloak
  useEffect(() => {
    const initKeycloak = async () => {
      try {
        console.log('Initializing Keycloak...');
        
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          pkceMethod: 'S256',
          checkLoginIframe: false,
          // This is crucial - it handles the callback properly
          flow: 'standard'
        });

        console.log('Keycloak initialized. Authenticated:', authenticated);
        setKeycloakInitialized(true);
        setIsAuthenticated(authenticated);

        if (authenticated) {
          console.log('User is authenticated, loading profile...');
          const userData = await loadUserProfile();
          setUser(userData);
          console.log('User profile loaded:', userData);
        } else {
          console.log('User not authenticated');
        }

      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        //setKeycloakError(error.message || 'Authentication service unavailable');
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  // Setup Keycloak event listeners
  useEffect(() => {
    if (!keycloakInitialized) return;

    console.log('Setting up Keycloak event listeners...');

    // Token expired - try to refresh
    keycloak.onTokenExpired = () => {
      console.log('Token expired, attempting refresh...');
      keycloak.updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            console.log('Token refreshed successfully');
            setUser(prev => prev ? {
              ...prev,
              token: keycloak.token,
              refreshToken: keycloak.refreshToken
            } : null);
          }
        })
        .catch((error) => {
          console.error('Token refresh failed:', error);
          handleLogout();
        });
    };

    // Authentication success
    keycloak.onAuthSuccess = async () => {
      console.log('Authentication successful');
      setKeycloakError(null);
      setIsAuthenticated(true);
      
      // Load user profile after successful authentication
      try {
        const userData = await loadUserProfile();
        setUser(userData);
        console.log('User profile loaded after auth success:', userData);
      } catch (error) {
        console.error('Failed to load user profile after auth success:', error);
      }
    };

    // Authentication error
    keycloak.onAuthError = (error) => {
      console.error('Authentication error:', error);
      setKeycloakError('Authentication failed. Please try again.');
      setIsAuthenticated(false);
      setUser(null);
    };

    // Logout
    keycloak.onAuthLogout = () => {
      console.log('User logged out');
      handleLogout();
    };

    // Authentication refresh success
    keycloak.onAuthRefreshSuccess = () => {
      console.log('Token refresh successful');
    };

    // Authentication refresh error
    keycloak.onAuthRefreshError = () => {
      console.log('Token refresh failed');
      handleLogout();
    };

    // Cleanup function
    return () => {
      keycloak.onTokenExpired = null;
      keycloak.onAuthSuccess = null;
      keycloak.onAuthError = null;
      keycloak.onAuthLogout = null;
      keycloak.onAuthRefreshSuccess = null;
      keycloak.onAuthRefreshError = null;
    };
  }, [keycloakInitialized]);

  // Handle logout
  const handleLogout = () => {
    console.log('Handling logout...');
    setIsAuthenticated(false);
    setUser(null);
    setKeycloakError(null);
  };

  // Handle authentication state changes
  const handleAuthStateChange = (authenticated, userData) => {
    setIsAuthenticated(authenticated);
    setUser(userData);
  };

  // Show loading spinner while initializing Keycloak
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Show error screen if Keycloak failed to initialize
  if (keycloakError && !keycloakInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Authentication Service Error
            </h3>
            <p className="text-red-600 mb-4">{keycloakError}</p>
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
      <div className="min-h-screen bg-gray-50">
        <AuthHandler 
          isAuthenticated={isAuthenticated}
          isLoading={loading}
          onAuthStateChange={handleAuthStateChange}
        />
        
        <Routes>
          {/* Login Route */}
          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={() => {}}
                keycloakError={keycloakError}
              />
            }
          />
          
          {/* Dashboard Route - Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoading={loading}
              >
                <DashboardPage
                  user={user}
                  keycloakInstance={keycloak}
                />
              </ProtectedRoute>
            }
          />
          
          {/* Default Route - Redirect based on auth status */}
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            }
          />
          
          {/* Catch all other routes */}
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
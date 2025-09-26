// src/keycloak.js
import Keycloak from 'keycloak-js';

// Debug function to log configuration
const logConfig = (config) => {
  console.log('=== KEYCLOAK CONFIGURATION ===');
  console.log('URL:', config.url);
  console.log('Realm:', config.realm);
  console.log('Client ID:', config.clientId);
  console.log('================================');
};

// Keycloak configuration
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080/',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'SME',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'front-end',
};

// Log the configuration in development
if (process.env.NODE_ENV === 'development') {
  logConfig(keycloakConfig);
}

// Validate configuration
if (!keycloakConfig.url || !keycloakConfig.realm || !keycloakConfig.clientId) {
  console.error('=== KEYCLOAK CONFIG ERROR ===');
  console.error('Missing required Keycloak configuration:');
  console.error('URL:', keycloakConfig.url);
  console.error('Realm:', keycloakConfig.realm);
  console.error('Client ID:', keycloakConfig.clientId);
  console.error('Check your .env file or keycloak.js configuration');
  console.error('================================');
}

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Enable logging in development
if (process.env.NODE_ENV === 'development') {
  keycloak.enableLogging = true;
}

export default keycloak;
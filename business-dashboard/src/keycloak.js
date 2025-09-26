// src/keycloak.js
import Keycloak from 'keycloak-js';

// Keycloak configuration - replace with your actual Keycloak server details
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080/',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'SME',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'front-end',
};

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Enable Keycloak logs in development
if (process.env.NODE_ENV === 'development') {
  keycloak.enableLogging = true;
}

export default keycloak;
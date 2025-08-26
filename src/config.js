// Configuración centralizada para la aplicación

// URL base para las peticiones a la API
// Selección automática: relativo en Vercel/CRA, localhost en desarrollo si querés forzar
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocalhost ? 'http://localhost:3001' : (process.env.REACT_APP_API_BASE_URL || '/api');

// Configuración para la paginación
const PAGINATION_DEFAULT_LIMIT = 50;

// Exportar la configuración
export {
  API_BASE_URL,
  PAGINATION_DEFAULT_LIMIT
};
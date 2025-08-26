// Configuración centralizada para la aplicación

// URL base para las peticiones a la API
// Selección automática según entorno: localhost en desarrollo, EC2 en producción
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocalhost
  ? 'http://localhost:3001'
  : 'http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001';

// Configuración para la paginación
const PAGINATION_DEFAULT_LIMIT = 50;

// Exportar la configuración
export {
  API_BASE_URL,
  PAGINATION_DEFAULT_LIMIT
};
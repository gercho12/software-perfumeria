// Configuración centralizada para la aplicación

// URL base para las peticiones a la API
// En desarrollo, usamos rutas relativas para evitar problemas de CORS
// En producción, podríamos usar la URL completa del servidor
const API_BASE_URL = 'http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001';

// Configuración para la paginación
const PAGINATION_DEFAULT_LIMIT = 50;

// Exportar la configuración
export {
  API_BASE_URL,
  PAGINATION_DEFAULT_LIMIT
};
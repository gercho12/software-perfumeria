# Sistema de Gestión para Perfumería

Sistema completo de gestión empresarial desarrollado con **React.js** y **Node.js** para agilizar el proceso de ventas e inventario de una perfumería, reemplazando el sistema manual de planillas de papel.

## 🚀 Características Principales

### 📦 Gestión de Inventario
- **CRUD completo** de productos con búsqueda en tiempo real
- **Búsqueda automática** por nombre o código de barras
- **Edición inline** de productos existentes
- **Control de stock** con incremento/decremento rápido
- **Paginación inteligente** para grandes volúmenes de datos
- **Búsqueda automática** de información de productos usando Google Custom Search API

### 🛒 Sistema de Ventas
- **Detección automática** de códigos de barras escaneados
- **Creación automática** de ventas al primer escaneo
- **Agregado automático** de productos a la venta activa
- **Modal automático** para productos no encontrados en la base de datos
- **Búsqueda automática** de información del producto al crear desde ventas
- **Gestión de cantidades** con controles intuitivos
- **Historial completo** de ventas realizadas
- **Analíticas en tiempo real** (total ventas, ingresos, promedios, etc.)

### 🔍 Búsqueda Inteligente de Productos
- **Integración con Google Custom Search API** para obtener información automática
- **Web scraping** de precios desde URLs de productos
- **Normalización inteligente** de precios en formato argentino
- **Detección automática** de metadatos estructurados
- **Fallback a regex** para extracción de precios

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19** con hooks modernos
- **CSS personalizado** con diseño responsive
- **Componentes modulares** y reutilizables
- **Gestión de estado** con useState y useEffect

### Backend
- **Node.js** con Express
- **MySQL** como base de datos principal
- **Web scraping** con Cheerio y Axios
- **API RESTful** completa
- **CORS** habilitado para desarrollo

### APIs Externas
- **Google Custom Search API** para búsqueda de productos
- **Web scraping** para extracción de precios

## 📁 Estructura del Proyecto

```
software-perfumeria/
├── src/
│   ├── components/
│   │   ├── Inventario.jsx          # Gestión completa de inventario
│   │   ├── NuevoProducto.jsx       # Creación de productos con búsqueda automática
│   │   ├── RegistroVentas.jsx      # Sistema completo de ventas
│   │   ├── Navbar.jsx              # Navegación principal
│   │   └── Pagination.jsx          # Componente de paginación
│   ├── backend/
│   │   ├── index.js                # Servidor Express con todas las APIs
│   │   └── package.json            # Dependencias del backend
│   ├── App.js                      # Componente principal de la aplicación
│   └── index.js                    # Punto de entrada
├── package.json                    # Dependencias del frontend
└── ecosystem.config.js             # Configuración PM2 para producción
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 16+ 
- MySQL 8.0+
- Cuenta de Google Cloud Platform (para Custom Search API)

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd software-perfumeria
```

### 2. Instalar dependencias del frontend
```bash
npm install
```

### 3. Instalar dependencias del backend
```bash
cd src/backend
npm install
cd ../..
```

### 4. Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:
```env
# Base de datos MySQL
DB_HOST=tu-host-mysql
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=perfumeria
DB_PORT=3306

# Google Custom Search API
GOOGLE_API_KEY=tu-api-key
CUSTOM_SEARCH_ENGINE_ID=tu-search-engine-id
```

### 5. Configurar base de datos
```sql
CREATE DATABASE perfumeria;
USE perfumeria;

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 6. Ejecutar la aplicación

#### Desarrollo (ambos servicios simultáneamente)
```bash
npm run dev
```

#### Producción
```bash
# Frontend
npm start

# Backend (en otra terminal)
cd src/backend
npm start
```

## 📱 Funcionalidades del Sistema

### 🔍 Inventario
- **Búsqueda en tiempo real** con debounce de 300ms
- **Paginación** de 20 productos por página
- **Edición inline** de nombre, precio, stock y código
- **Control de stock** con botones +/- para ajustes rápidos
- **Validación** de datos antes de guardar
- **Mensajes de error** claros y específicos

### 🛒 Ventas
- **Campo de código de barras** siempre enfocado para escaneo rápido
- **Detección automática** de productos existentes
- **Creación automática** de productos no encontrados
- **Búsqueda automática** de información del producto
- **Gestión de cantidades** con controles intuitivos
- **Cálculo automático** de subtotales y totales
- **Historial persistente** de ventas realizadas
- **Estadísticas en tiempo real** de rendimiento

### 🔧 Nuevo Producto
- **Búsqueda automática** por código de barras
- **Integración con Google** para obtener información
- **Web scraping** de precios desde URLs
- **Validación** de datos antes de crear
- **Normalización** de precios en formato argentino

## 🌐 APIs Disponibles

### Productos
- `GET /api/products` - Listar productos con paginación y búsqueda
- `POST /api/products` - Crear nuevo producto
- `PUT /api/products/:id` - Actualizar producto existente
- `DELETE /api/products/:id` - Eliminar producto

### Búsqueda de Precios
- `POST /api/scrape-price` - Extraer precio desde URL de producto

## 🎨 Características de Diseño

### UI/UX
- **Diseño responsive** que funciona en todos los dispositivos
- **Colores consistentes** con la identidad visual de la empresa
- **Animaciones sutiles** para mejor experiencia de usuario
- **Iconografía clara** y fácil de entender
- **Espaciado consistente** siguiendo principios de diseño

### Accesibilidad
- **Navegación por teclado** completa
- **Contraste adecuado** para legibilidad
- **Etiquetas descriptivas** en todos los campos
- **Mensajes de error** claros y específicos

## 🔒 Seguridad

- **Validación** de datos en frontend y backend
- **Sanitización** de inputs para prevenir inyección SQL
- **CORS configurado** para desarrollo seguro
- **Manejo de errores** robusto en todas las operaciones

## 📊 Rendimiento

- **Debounce** en búsquedas para reducir llamadas a la API
- **Paginación** para manejar grandes volúmenes de datos
- **Lazy loading** de componentes cuando sea necesario
- **Optimización** de consultas SQL con índices apropiados

## 🚀 Despliegue

### Con PM2 (Recomendado)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Manual
```bash
# Frontend
npm run build
# Servir archivos estáticos desde /build

# Backend
cd src/backend
npm start
```

## 🔧 Configuración de Producción

### Variables de Entorno
```env
NODE_ENV=production
PORT=3001
DB_HOST=tu-host-produccion
DB_USER=tu-usuario-produccion
DB_PASSWORD=tu-password-produccion
```

### Base de Datos
- Usar MySQL en producción con configuración optimizada
- Configurar backups automáticos
- Monitorear performance con herramientas nativas de MySQL

## 📈 Monitoreo y Mantenimiento

### Logs
- Logs de aplicación en consola
- Logs de errores con stack traces completos
- Logs de operaciones críticas (crear/editar/eliminar productos)

### Métricas
- Tiempo de respuesta de APIs
- Uso de memoria y CPU
- Número de productos en inventario
- Volumen de ventas diarias

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o consultas sobre el sistema:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo
- Revisar la documentación técnica

## 🔮 Roadmap Futuro

- [ ] **Sistema de usuarios** con roles y permisos
- [ ] **Reportes avanzados** con gráficos y exportación
- [ ] **Integración con sistemas de pago** (MercadoPago, etc.)
- [ ] **App móvil** para Android/iOS
- [ ] **Sincronización en la nube** para múltiples sucursales
- [ ] **Sistema de alertas** para stock bajo
- [ ] **Integración con proveedores** para reposición automática

---

**Desarrollado con ❤️ para agilizar la gestión de perfumerías**

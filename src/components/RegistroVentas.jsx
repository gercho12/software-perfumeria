import React, { useState, useEffect, useRef } from 'react';
import NuevoProducto from "./NuevoProducto";
import "./RegistroVentas.css";

export default function RegistroVentas() {
  // Estados principales
  const [ventaActiva, setVentaActiva] = useState(null);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [productosVenta, setProductosVenta] = useState([]);
  const [ventasHistorial, setVentasHistorial] = useState([]);
  const [showModalProducto, setShowModalProducto] = useState(false);
  const [codigoParaCrear, setCodigoParaCrear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtroTiempo, setFiltroTiempo] = useState('dia'); // día, semana, mes, año
  
  // Referencias
  const codigoInputRef = useRef(null);

  // Configuración de la API
  const API_BASE = 'http://3.21.46.19:3001';

  // Efecto para enfocar el input de código de barras cuando se abre la sección
  useEffect(() => {
    if (codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
    // Cargar historial de ventas al abrir la sección
    cargarHistorialVentas();
  }, []);

  // Función para cargar el historial de ventas desde la base de datos
  const cargarHistorialVentas = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/ventas`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVentasHistorial(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError("Error al cargar historial de ventas: " + error.message);
    }
  };

  // Función para procesar código de barras escaneado
  const procesarCodigoBarras = async (codigo) => {
    if (!codigo.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Buscar producto en la base de datos
      const response = await fetch(`${API_BASE}/api/products?search=${codigo}&limit=1`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        // Producto encontrado - agregar a la venta
        const producto = data.products[0];
        agregarProductoAVenta(producto);
        setCodigoBarras(""); // Limpiar input
        // Enfocar input para siguiente escaneo
        if (codigoInputRef.current) {
          codigoInputRef.current.focus();
        }
      } else {
        // Producto no encontrado - abrir modal para crear
        setCodigoParaCrear(codigo);
        setShowModalProducto(true);
      }
    } catch (error) {
      setError("Error al buscar producto: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para agregar producto a la venta activa
  const agregarProductoAVenta = (producto) => {
    if (!ventaActiva) {
      // Crear nueva venta si no hay una activa
      const nuevaVenta = {
        id: Date.now(),
        fecha: new Date(),
        productos: [],
        total: 0,
        estado: 'activa'
      };
      setVentaActiva(nuevaVenta);
    }

    // Verificar si el producto ya está en la venta
    const productoExistente = productosVenta.find(p => p.id === producto.id);
    
    if (productoExistente) {
      // Incrementar cantidad
      setProductosVenta(prev => prev.map(p => 
        p.id === producto.id 
          ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio }
          : p
      ));
    } else {
      // Agregar nuevo producto
      const nuevoProducto = {
        ...producto,
        cantidad: 1,
        subtotal: producto.precio
      };
      setProductosVenta(prev => [...prev, nuevoProducto]);
    }
  };

  // Función para actualizar cantidad de producto
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      // Remover producto si cantidad es 0 o menor
      setProductosVenta(prev => prev.filter(p => p.id !== productoId));
    } else {
      setProductosVenta(prev => prev.map(p => 
        p.id === productoId 
          ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio }
          : p
      ));
    }
  };

  // Función para actualizar precio de producto durante la venta
  const actualizarPrecio = (productoId, nuevoPrecio) => {
    if (nuevoPrecio <= 0) return;
    
    setProductosVenta(prev => prev.map(p => 
      p.id === productoId 
        ? { ...p, precio: nuevoPrecio, subtotal: p.cantidad * nuevoPrecio }
        : p
    ));
  };

  // Función para finalizar venta y guardarla en la base de datos
  const finalizarVenta = async () => {
    if (!ventaActiva || productosVenta.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const ventaData = {
        productos: productosVenta,
        total: productosVenta.reduce((sum, p) => sum + p.subtotal, 0)
      };

      // Guardar venta en la base de datos
      const response = await fetch(`${API_BASE}/api/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Agregar al historial local
      const ventaFinalizada = {
        ...ventaActiva,
        id: result.ventaId,
        productos: [...productosVenta],
        total: ventaData.total,
        estado: 'finalizada',
        fechaFinalizacion: new Date()
      };

      setVentasHistorial(prev => [ventaFinalizada, ...prev]);
      
      // Limpiar venta activa
      setVentaActiva(null);
      setProductosVenta([]);
      setCodigoBarras("");
      
      // Enfocar input para nueva venta
      if (codigoInputRef.current) {
        codigoInputRef.current.focus();
      }

      // Recargar historial desde la base de datos
      await cargarHistorialVentas();

    } catch (error) {
      setError("Error al finalizar venta: " + error.message);
      console.error('Error finalizando venta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cancelar venta
  const cancelarVenta = () => {
    setVentaActiva(null);
    setProductosVenta([]);
    setCodigoBarras("");
    if (codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  };

  // Función para eliminar venta del historial (desde la base de datos)
  const eliminarVenta = async (ventaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/ventas/${ventaId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remover del historial local
      setVentasHistorial(prev => prev.filter(v => v.id !== ventaId));
      
      // Recargar historial desde la base de datos
      await cargarHistorialVentas();

    } catch (error) {
      setError("Error al eliminar venta: " + error.message);
      console.error('Error eliminando venta:', error);
    }
  };

  // Función para cerrar modal y refrescar productos
  const cerrarModalProducto = () => {
    setShowModalProducto(false);
    setCodigoParaCrear("");
    // Refrescar productos para incluir el nuevo creado
    if (codigoParaCrear) {
      procesarCodigoBarras(codigoParaCrear);
    }
  };

  // Función para manejar teclas (Enter para finalizar venta)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (ventaActiva && productosVenta.length > 0) {
        // Si hay una venta activa, finalizarla con Enter
        finalizarVenta();
      } else if (codigoBarras.trim()) {
        // Si no hay venta activa, procesar el código escaneado
        procesarCodigoBarras(codigoBarras);
      }
    }
  };

  // Calcular total de la venta
  const totalVenta = productosVenta.reduce((sum, p) => sum + p.subtotal, 0);

  // Función para obtener ventas filtradas por tiempo
  const obtenerVentasFiltradas = () => {
    const ahora = new Date();
    let fechaLimite = new Date();

    switch (filtroTiempo) {
      case 'dia':
        fechaLimite.setDate(ahora.getDate() - 1);
        break;
      case 'semana':
        fechaLimite.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        fechaLimite.setMonth(ahora.getMonth() - 1);
        break;
      case 'año':
        fechaLimite.setFullYear(ahora.getFullYear() - 1);
        break;
      default:
        fechaLimite = new Date(0); // Desde el inicio
    }

    return ventasHistorial.filter(venta => 
      new Date(venta.fecha) >= fechaLimite
    );
  };

  // Estadísticas del historial filtrado
  const ventasFiltradas = obtenerVentasFiltradas();
  const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
  const estadisticas = {
    totalVentas: ventasFiltradas.length,
    totalIngresos: totalIngresos,
    promedioVenta: ventasFiltradas.length > 0 
      ? totalIngresos / ventasFiltradas.length 
      : 0,
    ventaMasAlta: ventasFiltradas.length > 0 
      ? Math.max(...ventasFiltradas.map(v => parseFloat(v.total) || 0)) 
      : 0
  };

  return (
    <div className="ventas-container">
      {/* Header de la sección */}
      <div className="ventas-header">
        <h2 className="ventas-title">Registro de Ventas</h2>
        <div className="ventas-status">
          {ventaActiva ? (
            <span className="status-activa">Venta Activa #{ventaActiva.id}</span>
          ) : (
            <span className="status-inactiva">Sin Venta Activa</span>
          )}
        </div>
      </div>

      {/* Campo de código de barras principal */}
      <div className="codigo-barras-section">
        <div className="input-group">
          <input
            ref={codigoInputRef}
            type="text"
            placeholder="Escanee o ingrese código de barras..."
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            onKeyPress={handleKeyPress}
            className="codigo-input"
            disabled={isLoading}
          />
          <button
            onClick={() => procesarCodigoBarras(codigoBarras)}
            disabled={!codigoBarras.trim() || isLoading}
            className="procesar-btn"
          >
            {isLoading ? "Procesando..." : "Procesar"}
          </button>
        </div>
        <div className="instrucciones">
          <p>💡 <strong>Instrucciones:</strong> Simplemente escanee productos para comenzar la venta. Presione <strong>Enter</strong> para finalizar.</p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* Productos de la venta activa */}
      {productosVenta.length > 0 && (
        <div className="venta-activa-section">
          <div className="section-header">
            <h3>Productos en Venta</h3>
            <div className="venta-actions">
              <button onClick={cancelarVenta} className="btn-cancelar">
                Cancelar Venta
              </button>
              <button onClick={finalizarVenta} className="btn-finalizar" disabled={isLoading}>
                {isLoading ? "Guardando..." : `Finalizar Venta ($${totalVenta.toFixed(2)})`}
              </button>
            </div>
          </div>
          
          <div className="productos-lista">
            {productosVenta.map((producto) => (
              <div key={producto.id} className="producto-item">
                <div className="producto-info">
                  <span className="producto-nombre">{producto.descripcion}</span>
                  <div className="producto-precio-editable">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={producto.precio.toFixed(2)}
                      onChange={(e) => actualizarPrecio(producto.id, parseFloat(e.target.value) || 0)}
                      className="precio-input"
                      min="0"
                    />
                  </div>
                </div>
                <div className="producto-cantidad">
                  <button
                    onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)}
                    className="btn-cantidad"
                  >
                    -
                  </button>
                  <span className="cantidad-valor">{producto.cantidad}</span>
                  <button
                    onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                    className="btn-cantidad"
                  >
                    +
                  </button>
                </div>
                <div className="producto-subtotal">
                  ${producto.subtotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="venta-total">
            <strong>Total: ${totalVenta.toFixed(2)}</strong>
          </div>
        </div>
      )}

      {/* Estadísticas y Historial */}
      <div className="estadisticas-section">
        <div className="stats-header">
          <h3>Estadísticas</h3>
          <div className="filtro-tiempo">
            <label>Período:</label>
            <select 
              value={filtroTiempo} 
              onChange={(e) => setFiltroTiempo(e.target.value)}
              className="filtro-select"
            >
              <option value="dia">Último Día</option>
              <option value="semana">Última Semana</option>
              <option value="mes">Último Mes</option>
              <option value="año">Último Año</option>
            </select>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Ventas</h4>
            <span className="stat-value">{estadisticas.totalVentas}</span>
          </div>
          <div className="stat-card">
            <h4>Ingresos Totales</h4>
            <span className="stat-value">${estadisticas.totalIngresos.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <h4>Promedio por Venta</h4>
            <span className="stat-value">${estadisticas.promedioVenta.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <h4>Venta Más Alta</h4>
            <span className="stat-value">${estadisticas.ventaMasAlta.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Historial de ventas */}
      {ventasHistorial.length > 0 && (
        <div className="historial-section">
          <h3>Historial de Ventas</h3>
          <div className="historial-lista">
            {ventasHistorial.slice(0, 10).map((venta) => (
              <div key={venta.id} className="historial-item">
                <div className="historial-header">
                  <span className="venta-id">Venta #{venta.id}</span>
                  <span className="venta-fecha">
                    {new Date(venta.fecha).toLocaleDateString('es-ES')} - {new Date(venta.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                  <div className="historial-actions">
                    <span className="venta-total">${(parseFloat(venta.total) || 0).toFixed(2)}</span>
                    <button
                      onClick={() => eliminarVenta(venta.id)}
                      className="btn-eliminar-venta"
                      title="Eliminar venta"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="historial-productos">
                  {venta.productos.map((producto, index) => (
                    <span key={index} className="producto-mini">
                      {producto.descripcion} x{producto.cantidad} (${(parseFloat(producto.precio) || 0).toFixed(2)})
                    </span>
                  ))}
                </div>
                <div className="historial-footer">
                  <span className="productos-count">{venta.productos.length} productos</span>
                  <span className="venta-hora">
                    Finalizada: {new Date(venta.fechaFinalizacion || venta.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para crear producto usando el componente existente */}
      {showModalProducto && (
        <div className="modal-overlay" onClick={cerrarModalProducto}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={cerrarModalProducto}>&times;</span>
            <NuevoProducto 
              onClose={cerrarModalProducto} 
              codigoPreestablecido={codigoParaCrear}
            />
          </div>
        </div>
      )}
    </div>
  );
}

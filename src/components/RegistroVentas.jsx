import React, { useEffect, useRef, useState } from 'react';
import "./RegistroVentas.css"
import { API_BASE_URL } from '../config';
import NuevoProducto from './NuevoProducto';

export default function RegistroVentas() {
  const [codigoBarras, setCodigoBarras] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [carrito, setCarrito] = useState([]); // {productoId, descripcion, codigo, precio, cantidad}
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualMode, setManualMode] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);

  // Enfocar el input siempre para scanner
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    cargarVentasRecientes();
  }, []);

  const cargarVentasRecientes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sales/recent?limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVentasRecientes(data);
    } catch (e) {
      console.error('Error cargando ventas recientes', e);
    }
  };

  const buscarProductoPorCodigo = async (codigo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/by-barcode/${encodeURIComponent(codigo)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const p = await res.json();
      return p;
    } catch (e) {
      console.error('Error buscando producto por código', e);
      return null;
    }
  };

  const agregarAlCarrito = (producto, qty) => {
    setCarrito((prev) => {
      const idx = prev.findIndex(i => i.productoId === producto.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + qty };
        return updated;
      }
      return [...prev, { productoId: producto.id, descripcion: producto.descripcion, codigo: producto.codigo, precio: producto.precio, cantidad: qty }];
    });
  };

  const handleAgregar = async () => {
    const codigo = codigoBarras.trim();
    const qty = Math.max(1, parseInt(cantidad, 10) || 1);
    if (!codigo) return;
    const producto = await buscarProductoPorCodigo(codigo);
    if (!producto) {
      // Abrir modal para crear producto nuevo con el código precargado
      setShowNuevoProducto(true);
      return;
    }
    agregarAlCarrito(producto, qty);
    setCodigoBarras("");
    setCantidad("1");
    if (inputRef.current) inputRef.current.focus();
  };

  const simularEscaneo = async () => {
    await handleAgregar();
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(carrito.filter(i => i.productoId !== productoId));
  };

  const cambiarCantidad = (productoId, nuevaCantidad) => {
    const qty = Math.max(1, parseInt(nuevaCantidad, 10) || 1);
    setCarrito(prev => prev.map(i => i.productoId === productoId ? { ...i, cantidad: qty } : i));
  };

  const totalVenta = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const registrarVenta = async () => {
    if (carrito.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad })) })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      await res.json();
      setCarrito([]);
      await cargarVentasRecientes();
    } catch (e) {
      alert(`Error al registrar venta: ${e.message}`);
    } finally {
      setIsSubmitting(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAgregar();
    }
  };

  // Manual mode search
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const term = searchTerm.trim();
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/search?term=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Error buscando productos', e);
      }
    };
    run();
    return () => controller.abort();
  }, [searchTerm]);

  return (
    <div className="containerPrincipal">
      {/* Formulario de escaneo */}
      <div className="form">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={manualMode} onChange={(e) => setManualMode(e.target.checked)} />
            Modo manual
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={compactView} onChange={(e) => setCompactView(e.target.checked)} />
            Vista compacta
          </label>
        </div>
        <div className="formGroup">
          <label htmlFor="codigoBarras" className="label">Código de Barras</label>
          <input
            id="codigoBarras"
            type="text"
            ref={inputRef}
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escanee o ingrese el código de barras"
            className="input"
            autoComplete="off"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="cantidad" className="label">Cantidad</label>
          <input
            id="cantidad"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            min="1"
            className="input"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleAgregar} className="addButton">Agregar</button>
          <button onClick={simularEscaneo} className="addButton" title="Usar sin escáner">Simular escaneo</button>
        </div>
      </div>

      {manualMode && (
        <div className="tableContainer" style={{ marginTop: 12 }}>
          <div className="formGroup">
            <label htmlFor="buscar" className="label">Buscar producto (manual)</label>
            <input
              id="buscar"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre o código"
              className="input"
            />
          </div>
          {searchResults.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(p => (
                  <tr key={p.id}>
                    <td>{p.descripcion}</td>
                    <td>{p.codigo}</td>
                    <td>${Number(p.precio).toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td>
                      <button onClick={() => agregarAlCarrito(p, Math.max(1, parseInt(cantidad, 10) || 1))} className="addButton">Agregar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Carrito actual */}
      {carrito.length > 0 && (
        <>
          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item) => (
                  <tr key={item.productoId}>
                    <td>{item.descripcion}</td>
                    <td>{item.codigo}</td>
                    <td>
                      <input
                        type="number"
                        value={item.cantidad}
                        min="1"
                        className="input"
                        onChange={(e) => cambiarCantidad(item.productoId, e.target.value)}
                        style={{ width: compactView ? '56px' : '80px' }}
                      />
                    </td>
                    <td>${Number(item.precio).toFixed(2)}</td>
                    <td>${(Number(item.precio) * item.cantidad).toFixed(2)}</td>
                    <td>
                      <button onClick={() => eliminarDelCarrito(item.productoId)} className="deleteButton">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary">
            <div className="total">Total: ${totalVenta.toFixed(2)}</div>
            <button onClick={registrarVenta} className="registerButton" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Venta'}
            </button>
          </div>
        </>
      )}

      {/* Ventas recientes */}
      <div className="tableContainer" style={{ marginTop: '24px' }}>
        <h3>Ventas recientes</h3>
        {ventasRecientes.length === 0 ? (
          <div>No hay ventas aún.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Total</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {ventasRecientes.map(v => (
                <tr key={v.id}>
                  <td>{new Date(v.fecha).toLocaleString()}</td>
                  <td>${Number(v.total).toFixed(2)}</td>
                  <td>
                    {(v.detalles || []).map(d => `${d.descripcion} x${d.cantidad}`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para nuevo producto si no existe */}
      {showNuevoProducto && (
        <div id="myModal" className={`modal show`}>
          <div className="modal-content">
            <span className="modal-close" onClick={() => setShowNuevoProducto(false)}>&times;</span>
            <NuevoProducto onClose={() => setShowNuevoProducto(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

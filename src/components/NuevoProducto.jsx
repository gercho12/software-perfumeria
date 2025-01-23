import React, { useState } from 'react';
import "./NuevoProducto.css";

export default function NuevoProducto({ onClose }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: nombre, precio: parseFloat(precio), stock: parseInt(stock), codigo: codigoBarras }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNombre("");
      setPrecio("");
      setStock("");
      setCodigoBarras("");
    } catch (error) {
      setError("Error adding product: " + error.message);
      console.error(error);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div className="container">
    {/* <button onClick={onClose} className="closeButton">X</button>  */}


      <h2 className="title">Agregar Nuevo Producto</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="formGroup">
          <label htmlFor="nombre" className="label">
            Nombre del Producto
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="input"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="precio" className="label">
            Precio
          </label>
          <input
            id="precio"
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
            className="input"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="stock" className="label">
            Stock Inicial
          </label>
          <input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            className="input"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="codigoBarras" className="label">
            Código de Barras
          </label>
          <input
            id="codigoBarras"
            type="text"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            required
            className="input"
          />
        </div>
        <button type="submit" className="submitButton">
          Agregar Producto
        </button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import "./RegistroVentas.css"

export default function RegistroVentas() {
  // Estados para el código de barras y cantidad
  const [codigoBarras, setCodigoBarras] = useState("");
  const [cantidad, setCantidad] = useState("1");
  // Estado para la lista de productos en la venta actual
  const [productosVenta, setProductosVenta] = useState([]);

  // Simulación de búsqueda de producto por código de barras
  const buscarProducto = (codigo) => {
    const productos = [
      { codigoBarras: "123456789", nombre: "Desodorante Axe", precio: 5.99 },
      { codigoBarras: "987654321", nombre: "Pañales Huggies", precio: 15.99 },
      { codigoBarras: "456789123", nombre: "Pintalabios MAC", precio: 20.99 },
    ];
    return productos.find((p) => p.codigoBarras === codigo);
  };

  // Función para agregar un producto a la venta
  const agregarProducto = () => {
    const producto = buscarProducto(codigoBarras);
    if (producto) {
      setProductosVenta([...productosVenta, { ...producto, cantidad: Number.parseInt(cantidad) }]);
      setCodigoBarras("");
      setCantidad("1");
    } else {
      alert("Producto no encontrado");
    }
  };

  // Función para eliminar un producto de la venta
  const eliminarProducto = (index) => {
    setProductosVenta(productosVenta.filter((_, i) => i !== index));
  };

  // Función para calcular el total de la venta
  const calcularTotal = () => {
    return productosVenta.reduce((total, producto) => total + producto.precio * producto.cantidad, 0);
  };

  // Función para registrar la venta
  const registrarVenta = () => {
    console.log("Venta registrada:", productosVenta);
    setProductosVenta([]);
  };

  return (
    <div className="containerPrincipal">
     {/* Formulario para agregar productos */}
      <div className="form">
        <div className="formGroup">
          <label htmlFor="codigoBarras" className="label">
            Código de Barras
          </label>
          <input
            id="codigoBarras"
            type="text"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            placeholder="Escanee o ingrese el código de barras"
            className="input"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="cantidad" className="label">
            Cantidad
          </label>
          <input
            id="cantidad"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            min="1"
            className="input"
          />
        </div>
        <button onClick={agregarProducto} className="addButton">
          Agregar
        </button>
      </div>
      {/* Tabla de productos en la venta actual */}
      {productosVenta.length > 0 && (
        <>
          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productosVenta.map((producto, index) => (
                  <tr key={index}>
                    <td>{producto.nombre}</td>
                    <td>{producto.cantidad}</td>
                    <td>${producto.precio.toFixed(2)}</td>
                    <td>${(producto.precio * producto.cantidad).toFixed(2)}</td>
                    <td>
                      <button onClick={() => eliminarProducto(index)} className="deleteButton">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Resumen y botón para registrar la venta */}
          <div className="summary">
            <div className="total">Total: ${calcularTotal().toFixed(2)}</div>
            <button onClick={registrarVenta} className="registerButton">
              Registrar Venta
            </button>
          </div>
        </>
      )}
    </div>
  );
}

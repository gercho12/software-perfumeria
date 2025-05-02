import React, { useState, useEffect } from 'react';
import "./Inventario.css";
import NuevoProducto from "./NuevoProducto"
import Navbar from "./Navbar"

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false); // Nuevo estado


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        setError("Error fetching products: " + error.message);
        console.error(error);
      } finally {
      }
    };
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      setError("Error fetching products: " + error.message);
      console.error(error);
    } finally {
    }
  };



  const filteredProductos = productos.filter(
    (producto) =>
      producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
producto.codigo?.toString().includes(searchTerm)
  );

  const startEditing = (producto) => {
    setEditingProduct({ ...producto });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
  };

      const handleEditChange = (e) => {
        if (editingProduct) {
          const value = e.target.name === "stock" ? 
            (e.target.value === "" ? 0 : parseFloat(e.target.value)) : 
            e.target.value;
  
          setEditingProduct({
            ...editingProduct,
            [e.target.name]: value,
          });
        }
      };
  

  const updateStock = async (producto, newStock) => {
    try {
      const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products/${producto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...producto, stock: newStock }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setProductos(productos.map((p) => (p.id === producto.id ? { ...p, stock: newStock } : p)));
    } catch (err) {
      setError("Error updating stock: " + err.message);
      console.error(err);
    }
  };

  const incrementStock = (producto) => {
    updateStock(producto, producto.stock + 1);
  };

  const decrementStock = (producto) => {
    updateStock(producto, Math.max(0, producto.stock - 1));
  };


  const saveEdit = async () => {
    if (editingProduct) {
      try {
        const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProduct),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Saving product:", editingProduct);
        const updatedProduct = await response.json();
        console.log("Updated product response:", updatedProduct);
        setProductos(productos.map((p) => (p.id === editingProduct.id ? updatedProduct : p)));
        setEditingProduct(null);
        fetchProducts();
      } catch (err) {
        setError("Error saving edits: " + err.message);
        console.error(err);
      }
    }
  };

  const eliminarProducto = async () => {
    if (editingProduct) {
      try {
        const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products/${editingProduct.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProduct),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setEditingProduct(null);
        fetchProducts();
      } catch (err) {
        setError("Error saving edits: " + err.message);
        console.error(err);
      }
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }


  function cerrarModal() {
    try {
      setShowForm(false)
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  }
  
  return (
    <div className="containerPrincipal">
      {/* Barra de búsqueda */}
      <div className="searchBar">
        <input
          type="text"
          placeholder="Buscar por nombre o código de barras"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="searchInput"
        />
        <button className='creacionProducto' onClick={() => setShowForm(true)}>Nuevo producto +</button> {/* Modificación: agrega onClick */}
        </div>


      <div className="tableContainer">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Código de Barras</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProductos.map((producto) => (
              <>
              <tr key={producto.id} className='productoItem' >
                <td>
                  {editingProduct && editingProduct.id === producto.id ? (
                    <input
                      name="descripcion"
                      value={editingProduct.descripcion}
                      onChange={handleEditChange}
                      className="editInput"
                    />
                  ) : (
                    producto.descripcion
                  )}
                </td>
                <td>
                  {editingProduct && editingProduct.id === producto.id ? (
                    <input
                      name="precio"
                      type="number"
                      value={editingProduct.precio}
                      onChange={handleEditChange}
                      className="editInput"
                    />
                  ) : (
                    `$${producto.precio.toFixed(2)}`
                  )}
                </td>
                <td className='stockInput'>
                  <button onClick={() => decrementStock(producto)}>-</button>
                  <input
                    name="stock"
                    type="number"
                    value={producto.stock}
                    onChange={(e) => {
                      const newStock = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                      if (!isNaN(newStock)) {  // Check for valid number
                        setProductos(productos.map((p) =>
                          p.id === producto.id ? { ...p, stock: newStock } : p
                        ));
                      }
                    }}
                    onBlur={() => {
                      const newStock = parseInt(producto.stock, 10);
                      if (isNaN(newStock) || newStock === 0) {
                        updateStock(producto, 0);
                      } else {
                        updateStock(producto, newStock);
                      }
                    }}
                    className="editInput"
                  />
                  <button onClick={() => incrementStock(producto)}>+</button>
                </td>
                <td>
                  {editingProduct && editingProduct.id === producto.id ? (
                    <input
                      name="codigo"
                      type='number'
                      value={editingProduct.codigo}
                      onChange={handleEditChange}
                      className="editInput"
                    />
                  ) : (
                    producto.codigo
                  )}
                </td>
                <td>
                  {editingProduct && editingProduct.id === producto.id ? (
                    <>
                      <button onClick={saveEdit} className="saveButton">
                        Guardar
                      </button>
                      <button onClick={eliminarProducto} className="eliminarProducto">
                        Eliminar
                      </button>
                      {/* <button onClick={cancelEdit} className="cancelButton">
                        Cancelar
                      </button> */}
                    </>
                  ) : (
                    <button onClick={() => startEditing(producto)} className="editButton">
                      Editar
                    </button>
                  )}
                </td>

              </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
      <div id="myModal" className={`modal ${showForm ? 'show' : ''}`}>
        <div className="modal-content">
          <span className="modal-close" onClick={() => cerrarModal()}>&times;</span>
          <NuevoProducto onClose={() => cerrarModal()} />
        </div>
      </div>
    </div>
  );
}


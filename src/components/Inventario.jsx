import React, { useState, useEffect, useCallback } from 'react';
import "./Inventario.css";
import NuevoProducto from "./NuevoProducto"
import Navbar from "./Navbar"
import Pagination from "./Pagination" // Assuming you create this component

const ITEMS_PER_PAGE = 20;

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const fetchProducts = useCallback(async () => {
    try {
      const url = new URL('http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products');
      url.searchParams.append('page', currentPage);
      url.searchParams.append('limit', ITEMS_PER_PAGE);
      if (debouncedSearchTerm) {
        url.searchParams.append('search', debouncedSearchTerm);
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProductos(data.products);
      setTotalProducts(data.total);
    } catch (error) {
      setError("Error fetching products: " + error.message);
      console.error(error);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

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
      const updatedProduct = await response.json();
      setProductos(productos.map((p) => (p.id === producto.id ? updatedProduct : p)));
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
        const updatedProduct = await response.json();
        setProductos(productos.map((p) => (p.id === editingProduct.id ? updatedProduct : p)));
        setEditingProduct(null);
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
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setEditingProduct(null);
        fetchProducts(); // Refetch products after deletion
      } catch (err) {
        setError("Error deleting product: " + err.message);
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
      <div className="searchBar">
        <input
          type="text"
          placeholder="Buscar por nombre o código de barras"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="searchInput"
        />
        <button className='creacionProducto' onClick={() => setShowForm(true)}>Nuevo producto +</button>
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
            {productos.map((producto) => (
              <tr key={producto.id} className='productoItem'>
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
                    value={
                      editingProduct && editingProduct.id === producto.id
                        ? editingProduct.stock
                        : producto.stock
                    }
                    onChange={(e) => {
                      const newStock = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                      if (!isNaN(newStock)) {
                        setProductos(productos.map((p) =>
                          p.id === producto.id ? { ...p, stock: newStock } : p
                        ));
                      }
                    }}
                    onBlur={(e) => {
                      const newStock = parseInt(e.target.value, 10);
                      updateStock(producto, isNaN(newStock) || newStock < 0 ? 0 : newStock);
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
                      <button onClick={cancelEdit} className="cancelButton">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEditing(producto)} className="editButton">
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={totalProducts}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <div id="myModal" className={`modal ${showForm ? 'show' : ''}`}>
        <div className="modal-content">
          <span className="modal-close" onClick={() => cerrarModal()}>&times;</span>
          <NuevoProducto onClose={() => cerrarModal()} />
        </div>
      </div>
    </div>
  );
}

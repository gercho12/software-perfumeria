import React, { useState, useEffect } from 'react';
import "./Inventario.css";
import NuevoProducto from "./NuevoProducto"
import Navbar from "./Navbar"

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [searchMode, setSearchMode] = useState(false);

  // Efecto para cargar productos al iniciar o cambiar de página
  useEffect(() => {
    if (searchTerm.trim() === '') {
      fetchProducts(pagination.page, pagination.limit);
      setSearchMode(false);
    } else {
      searchProducts(searchTerm);
      setSearchMode(true);
    }
  }, [pagination.page, searchTerm]);

  // Función para obtener productos paginados
  const fetchProducts = async (page, limit) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProductos(data.products);
      setPagination(data.pagination);
    } catch (error) {
      setError("Error fetching products: " + error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para buscar productos
  const searchProducts = async (term) => {
    if (term.trim() === '') {
      fetchProducts(1, pagination.limit);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products/search?term=${encodeURIComponent(term)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProductos(data);
      setSearchMode(true);
    } catch (error) {
      setError("Error searching products: " + error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador para cambio en la búsqueda con debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si el campo de búsqueda está vacío, volver a la paginación normal
    if (value.trim() === '') {
      setSearchMode(false);
      fetchProducts(1, pagination.limit);
    }
  };

  // Función para cambiar de página
  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({...pagination, page: newPage});
    }
  };


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
      // Actualizar localmente primero para una experiencia más fluida
      setProductos(productos.map((p) => (p.id === producto.id ? { ...p, stock: newStock } : p)));
      
      const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products/${producto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...producto, stock: newStock }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // No es necesario recargar toda la página después de actualizar el stock
      // Esto mejora la experiencia del usuario al evitar parpadeos innecesarios
    } catch (err) {
      setError("Error updating stock: " + err.message);
      console.error(err);
      
      // En caso de error, revertir el cambio local
      if (searchMode) {
        searchProducts(searchTerm);
      } else {
        fetchProducts(pagination.page, pagination.limit);
      }
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
        setIsLoading(true);
        const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProduct),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Saving product:", editingProduct);
        
        // Actualizar la lista actual si estamos en modo búsqueda
        if (searchMode) {
          searchProducts(searchTerm);
        } else {
          // Si estamos en modo paginación, recargar la página actual
          fetchProducts(pagination.page, pagination.limit);
        }
        
        setEditingProduct(null);
      } catch (err) {
        setError("Error saving edits: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const eliminarProducto = async () => {
    if (editingProduct) {
      try {
        setIsLoading(true);
        const response = await fetch(`http://ec2-18-119-112-192.us-east-2.compute.amazonaws.com:3001/api/products/${editingProduct.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        setEditingProduct(null);
        
        // Actualizar la lista actual si estamos en modo búsqueda
        if (searchMode) {
          searchProducts(searchTerm);
        } else {
          // Si estamos en modo paginación, recargar la página actual
          // Si eliminamos el último elemento de la página, ir a la página anterior
          const newPage = productos.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
          fetchProducts(newPage, pagination.limit);
        }
      } catch (err) {
        setError("Error deleting product: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }


  function cerrarModal() {
    try {
      setShowForm(false);
      
      // Actualizar la lista según el modo actual
      if (searchMode && searchTerm.trim() !== '') {
        searchProducts(searchTerm);
      } else {
        // Si estamos en la primera página o en modo búsqueda sin término, ir a la primera página
        // para mostrar el nuevo producto
        fetchProducts(1, pagination.limit);
        setPagination({...pagination, page: 1});
      }
    } catch (error) {
      console.error(error);
      setError("Error al cerrar el formulario: " + error.message);
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
          onChange={handleSearchChange}
          className="searchInput"
        />
        <button className='creacionProducto' onClick={() => setShowForm(true)}>Nuevo producto +</button>
      </div>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="loadingIndicator">
          <p>Cargando productos...</p>
        </div>
      )}

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
            {productos.length === 0 && !isLoading ? (
              <tr>
                <td colSpan="5" className="noProductsMessage">
                  {searchMode ? "No se encontraron productos que coincidan con la búsqueda" : "No hay productos disponibles"}
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <React.Fragment key={producto.id}>
                <tr className='productoItem' >
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
              </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación - Solo mostrar si no estamos en modo búsqueda */}
      {!searchMode && pagination.totalPages > 1 && (
        <div className="paginationControls">
          <button 
            onClick={() => changePage(1)} 
            disabled={pagination.page === 1 || isLoading}
            className="paginationButton"
          >
            &laquo; Primera
          </button>
          <button 
            onClick={() => changePage(pagination.page - 1)} 
            disabled={pagination.page === 1 || isLoading}
            className="paginationButton"
          >
            &lt; Anterior
          </button>
          <span className="paginationInfo">
            Página {pagination.page} de {pagination.totalPages} ({pagination.total} productos)
          </span>
          <button 
            onClick={() => changePage(pagination.page + 1)} 
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="paginationButton"
          >
            Siguiente &gt;
          </button>
          <button 
            onClick={() => changePage(pagination.totalPages)} 
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="paginationButton"
          >
            Última &raquo;
          </button>
        </div>
      )}

      {/* Modal para nuevo producto */}
      <div id="myModal" className={`modal ${showForm ? 'show' : ''}`}>
        <div className="modal-content">
          <span className="modal-close" onClick={() => cerrarModal()}>&times;</span>
          <NuevoProducto onClose={() => cerrarModal()} />
        </div>
      </div>
    </div>
  );
}


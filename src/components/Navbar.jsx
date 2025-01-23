import React from 'react';
import "./Navbar.css"

export default function Navbar({ activeTab, setActiveTab }) {
  return (


<div className='switch'>

<h2 className={`${activeTab === 'inventario' ? 'selected' : ""}`}
onClick={() => setActiveTab("inventario")}
>Inventario</h2>

<h2 
className={`${activeTab === 'registro-ventas' ? 'selected' : ""}`}
onClick={() => setActiveTab("registro-ventas")}
>Registro de ventas</h2>

</div>

  );
}

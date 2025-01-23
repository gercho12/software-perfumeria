import React, { useState } from 'react';
import Navbar from "./components/Navbar"
import Inventario from "./components/Inventario"
import NuevoProducto from "./components/NuevoProducto"
import RegistroVentas from "./components/RegistroVentas"
import "./page.css"

export default function Home() {
  // Estado para controlar la pestaña activa y la visibilidad del tutorial
  const [activeTab, setActiveTab] = useState("inventario")
  const [showTutorial, setShowTutorial] = useState(true)

  return (
    <div className="container">
      {/* Título principal de la aplicación */}

      {/* Barra de navegación */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenido principal */}
      <main className="main">
        {activeTab === "inventario" && <Inventario />}
        {activeTab === "nuevo-producto" && <NuevoProducto />}
        {activeTab === "registro-ventas" && <RegistroVentas />}
      </main>

      {/* Tutorial interactivo */}
      {/* {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />} */}
    </div>
  )
}
// </create_file>

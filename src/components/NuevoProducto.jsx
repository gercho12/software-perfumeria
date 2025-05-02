import React, { useState } from 'react';
import { Search } from 'lucide-react'; // Importar ícono de lupa
import "./NuevoProducto.css";

// --- IMPORTANTE --- 
// Reemplaza con tu API Key y Custom Search Engine ID de Google
const GOOGLE_API_KEY = 'AIzaSyC9rDZbs1jco5Yl8pMPy5gXcXmAmg_qVfw'; 
const CUSTOM_SEARCH_ENGINE_ID = 'f0edc0e41779c491c';

export default function NuevoProducto({ onClose }) { 
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [error, setError] = useState(null); // Error general del formulario
  const [searchError, setSearchError] = useState(null); // Error específico de la búsqueda
  const [isLoading, setIsLoading] = useState(false); // Estado de carga para la búsqueda

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://ec2-18-216-138-198.us-east-2.compute.amazonaws.com:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: nombre, precio: parseFloat(precio), stock: parseInt(stock), codigo: codigoBarras }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Limpiar formulario después de éxito
      setNombre("");
      setPrecio("");
      setStock("");
      setCodigoBarras("");
      setError(null); // Limpiar error general si hubo éxito
    } catch (error) {
      setError("Error adding product: " + error.message);
      console.error(error);
    }
  };

  const handleSearchProduct = async () => {
    if (!codigoBarras) {
      setSearchError("Por favor, ingrese un código de barras.");
      return;
    }
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'TU_API_KEY_AQUI' || !CUSTOM_SEARCH_ENGINE_ID || CUSTOM_SEARCH_ENGINE_ID === 'TU_CX_ID_AQUI') {
        setSearchError("API Key o CX ID no configurados.");
        console.error("Error: Google API Key o Custom Search Engine ID no están configurados en NuevoProducto.jsx");
        return;
    }

    setIsLoading(true);
    setSearchError(null);
    setError(null); // Limpiar error general al iniciar búsqueda

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(codigoBarras)}`;

    try {
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("--- Datos recibidos de la API ---", JSON.stringify(data, null, 2)); // Log completo de la respuesta

      if (data.items && data.items.length > 0) {
        let extractedName = "Nombre no encontrado";
        let priceResult1 = null;
        let priceResult2 = null;
        let priceResult3 = null;

        console.log(`--- Procesando hasta 3 resultados ---`);
        const resultsToProcess = data.items.slice(0, 3);

        for (const [index, item] of resultsToProcess.entries()) {
          console.log(`\n--- Resultado #${index + 1} ---`);
          console.log("Item:", JSON.stringify(item, null, 2));

          // Extraer nombre del primer resultado como principal
          if (index === 0 && (item.title || item.snippet)) {
            extractedName = item.title || item.snippet;
            console.log(`Nombre extraído (resultado 1): ${extractedName}`);
          }

          // --- Función interna para extraer y validar precio de un item ---
          const extractPriceFromItem = (currentItem) => {
            let priceFound = null;
            let priceSource = "none"; // Para rastrear de dónde vino el precio

            // --- Helper function for normalization ---
            const normalizePrice = (priceStr) => {
                if (!priceStr) return null;
                let cleaned = String(priceStr).trim();

                // Remove currency symbols etc., keep digits, dot, comma
                cleaned = cleaned.replace(/[^\d.,]/g, '');

                // Find last separator
                const lastDot = cleaned.lastIndexOf('.');
                const lastComma = cleaned.lastIndexOf(',');

                // Remove all separators except the last one
                let finalStr = "";
                for (let i = 0; i < cleaned.length; i++) {
                    const char = cleaned[i];
                    if (/\d/.test(char)) {
                        finalStr += char;
                    } else if (char === '.' && i === lastDot && lastDot > lastComma) {
                        finalStr += '.'; // Keep last dot if it's the true last separator
                    } else if (char === ',' && i === lastComma && lastComma > lastDot) {
                        finalStr += ','; // Keep last comma if it's the true last separator
                    } else if (char === '.' && i === lastDot && lastComma === -1) {
                         finalStr += '.'; // Keep dot if it's the only separator type
                    } else if (char === ',' && i === lastComma && lastDot === -1) {
                         finalStr += ','; // Keep comma if it's the only separator type
                    }
                    // Otherwise, discard the separator (it's a thousand separator)
                }

                // Replace last comma with dot if it exists
                finalStr = finalStr.replace(',', '.');

                const numericPrice = parseFloat(finalStr);

                console.log(`Original: "${priceStr}", Cleaned: "${cleaned}", FinalStr: "${finalStr}", Parsed: ${numericPrice}`);

                // Keep validation range, allow slightly lower prices like 0.50
                if (!isNaN(numericPrice) && numericPrice > 0 && numericPrice < 1000000) { 
                    return numericPrice;
                }
                return null; // Return null if invalid or out of range
            };

            // 1. Buscar en datos estructurados (pagemap) - PRIORIDAD ALTA
            console.log("Buscando precio en datos estructurados (pagemap)...");
            if (currentItem.pagemap) {
              const offer = currentItem.pagemap.offer?.[0];
              const product = currentItem.pagemap.product?.[0];
              const metatags = currentItem.pagemap.metatags?.[0];
              const listitem = currentItem.pagemap.listitem?.[0]; // Añadir búsqueda en listitem

              // Intentar extraer de las fuentes más comunes primero
              if (offer?.price) { priceFound = offer.price; priceSource = "pagemap.offer.price"; }
              else if (product?.offers?.[0]?.price) { priceFound = product.offers[0].price; priceSource = "pagemap.product.offers.price"; }
              else if (metatags?.['product:price:amount']) { priceFound = metatags['product:price:amount']; priceSource = "metatags.product:price:amount"; }
              else if (metatags?.['og:price:amount']) { priceFound = metatags['og:price:amount']; priceSource = "metatags.og:price:amount"; }
              else if (listitem?.item?.offers?.price) { priceFound = listitem.item.offers.price; priceSource = "pagemap.listitem.item.offers.price"; } // Nuevo chequeo
              // Añadir más chequeos si se identifican otros patrones comunes en pagemap
            }

            if (priceFound) {
                console.log(`Precio encontrado en datos estructurados (${priceSource}): ${priceFound}`);
                // Validar y normalizar precio estructurado usando la nueva función
                const numericPrice = normalizePrice(priceFound);
                if (numericPrice) { // Check if normalization returned a valid number
                    console.log(`Precio estructurado validado: ${numericPrice}`);
                    return numericPrice; // Devolver inmediatamente si se encuentra y valida
                } else {
                    console.log(`Precio estructurado inválido o fuera de rango: ${priceFound}. Continuando búsqueda...`);
                    priceFound = null; // Resetear si no es válido
                }
            } else {
                console.log("No se encontró precio válido en datos estructurados conocidos.");
            }

            // 2. Si no se encontró en datos estructurados, buscar con Regex en title y snippet - PRIORIDAD BAJA
            console.log("Buscando precio con Regex en title y snippet...");
            const textToSearch = `${currentItem.title || ''} ${currentItem.snippet || ''}`.toLowerCase();
            // Regex mejorada: busca símbolo de moneda opcional, luego números con separadores, opcionalmente seguido por '€', '$', 'usd', 'eur'
            // Evita números que parezcan parte de códigos (ej: 123456) o cantidades simples (ej: 'pack 6')
            const priceRegex = /(?:[$€£]|usd|eur)?\s?(\d{1,3}(?:[,.]\d{3})*(?:[.,]\d{1,2})|\d+(?:[.,]\d{1,2})?)\s?(?:[$€£]|usd|eur)?/gi;
            const potentialPrices = [];
            let match;

            while ((match = priceRegex.exec(textToSearch)) !== null) {
                // Normalize the full matched string using the helper function
                const numericPrice = normalizePrice(match[0]);

                if (numericPrice) { // Check if normalization returned a valid number
                    // --- Lógica de contexto para descartar falsos positivos --- 
                    const matchIndex = match.index;
                    const matchEndIndex = matchIndex + match[0].length;
                    const charsBefore = 15, charsAfter = 15;
                    const contextBefore = textToSearch.substring(Math.max(0, matchIndex - charsBefore), matchIndex).trim();
                    const contextAfter = textToSearch.substring(matchEndIndex, Math.min(textToSearch.length, matchEndIndex + charsAfter)).trim();
                    const fullContext = `${contextBefore} ${match[0]} ${contextAfter}`;

                    // Descartar si parece parte de un código, ID, año, cantidad grande, etc.
                    const isLikelyCode = /(\d{4,}|isbn|ref|id|codigo|ean|año|modelo)/i.test(fullContext);
                    // --- Refined Quantity/Volume Check --- 
                    // Use the raw matched number group for quantity checks if needed, or adapt
                    const numStr = match[1].replace('.', '\\.'); // Escaped number string from regex group 1
                    const isPrecededByX = new RegExp(`\\bx\\s*${numStr}\\b`, 'i').test(fullContext);
                    const isFollowedByUnit = new RegExp(`\\b${numStr}\\s*(ml|l|kg|g|gr|cm|mm|uds|unidades|pack|litros|gramos)\\b`, 'i').test(fullContext);
                    const isPrecededByKeyword = new RegExp(`\\b(pack|uds|unidades|cantidad|stock|volumen|contenido|cont\\.? net\\.?|peso)\\s*:?\\s*${numStr}\\b`, 'i').test(fullContext);
                    // Consider also NUMBER x NUMBER pattern (e.g., 10 x 5)
                    const isNumberXNumber = new RegExp(`\\b${numStr}\\s*x\\s*\\d+\\b`, 'i').test(fullContext);

                    const isLikelyQuantityOrVolume = isPrecededByX || isFollowedByUnit || isPrecededByKeyword || isNumberXNumber;

                    // Validar contexto ANTES de añadir a la lista
                    if (isLikelyCode || isLikelyQuantityOrVolume) {
                        console.log(`Precio Regex descartado: ${numericPrice} (Código/Cantidad/Volumen) (Contexto: ${fullContext})`);
                    } else {
                        console.log(`Precio Regex candidato válido: ${numericPrice} (Contexto: ${fullContext})`);
                        potentialPrices.push(numericPrice); // Añadir solo si NO es código/cantidad/volumen
                    }
                } else {
                  // Price was invalid after normalization or out of range, ignore
                  // console.log(`Precio Regex inválido o fuera de rango: ${match[0]}`);
                }
            }

            if (potentialPrices.length > 0) {
                // Si hay múltiples precios candidatos, tomaremos el PRIMERO que pasó los filtros.
                priceFound = potentialPrices[0];
                priceSource = "regex";
                console.log(`Precio Regex seleccionado (primer válido): ${priceFound}`);
                return priceFound; // Devolver el primer precio válido encontrado por Regex
            } else {
                console.log("No se encontró precio válido con Regex.");
            }

            return null; // No se encontró precio válido ni en datos estructurados ni con Regex
          };
          // --- Fin función interna ---

          // Extraer precio para el item actual
          const currentPrice = extractPriceFromItem(item);

          // Asignar a la variable correspondiente
          if (index === 0) priceResult1 = currentPrice;
          else if (index === 1) priceResult2 = currentPrice;
          else if (index === 2) priceResult3 = currentPrice;
        }

        console.log("\n--- Fin del procesamiento de resultados ---");
        console.log(`Precios encontrados: R1=${priceResult1}, R2=${priceResult2}, R3=${priceResult3}`);

        // --- Lógica de decisión del precio final --- 
        let finalPrice = null;
        const validPrices = [priceResult1, priceResult2, priceResult3].filter(p => p !== null && p > 0);
        console.log("Precios válidos encontrados:", validPrices);

        if (validPrices.length === 0) {
            console.log("No se encontró ningún precio válido en los resultados de Google. Intentando scraping...");
            // --- INICIO: Lógica de scraping --- 
            if (data.items && data.items[0]?.link) {
                const pageUrl = data.items[0].link;
                console.log(`Intentando extraer precio desde la URL: ${pageUrl}`);
                try {
                    // **NOTA:** Este endpoint '/api/scrape-price' debe ser implementado en tu backend.
                    // Debe aceptar una URL en el cuerpo (ej: { url: pageUrl })
                    // y devolver el precio encontrado (ej: { price: 19.99 }) o un error.
                    const scrapeResponse = await fetch('http://ec2-18-216-138-198.us-east-2.compute.amazonaws.com:3001/api/scrape-price', { // Asegúrate que la URL del backend sea correcta
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: pageUrl })
                    });
                    if (!scrapeResponse.ok) {
                        throw new Error(`Error en scraping: ${scrapeResponse.status} ${scrapeResponse.statusText}`);
                    }
                    const scrapeData = await scrapeResponse.json();
                    if (scrapeData.price !== null && !isNaN(parseFloat(scrapeData.price)) && parseFloat(scrapeData.price) > 0) {
                        finalPrice = parseFloat(scrapeData.price);
                        console.log(`Precio final obtenido por scraping: ${finalPrice}`);
                    } else {
                        console.log("Scraping no devolvió un precio válido.");
                        finalPrice = null; // Mantener null si el scraping falla o no devuelve precio
                    }
                } catch (scrapeError) {
                    console.error("Error durante el scraping:", scrapeError);
                    setSearchError(`Error al intentar obtener precio de la página: ${scrapeError.message}`);
                    finalPrice = null; // Mantener null si hay error
                }
            } else {
                console.log("No hay URL válida en el primer resultado para intentar scraping.");
                finalPrice = null;
            }
            // --- FIN: Lógica de scraping ---
        } else if (validPrices.length === 1) {
            finalPrice = validPrices[0];
            console.log(`Precio final: Único precio válido encontrado: ${finalPrice}`);
        } else {
            // Si hay múltiples precios, intentar encontrar consenso
            validPrices.sort((a, b) => a - b); // Ordenar precios
            const medianPrice = validPrices[Math.floor(validPrices.length / 2)];
            const averagePrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;

            // Lógica simple: usar la mediana como estimación robusta
            finalPrice = medianPrice;
            console.log(`Precio final: Mediana de los precios válidos (${validPrices.join(', ')}): ${finalPrice}`);

            // Podrías añadir lógica más compleja aquí si es necesario:
            // - Calcular desviación estándar y descartar outliers
            // - Usar el promedio si los precios son muy cercanos
            // - Priorizar el precio del primer resultado si hay mucha dispersión
        }

        // Actualizar estado con nombre y precio final
        setNombre(extractedName);
        setPrecio(finalPrice !== null ? finalPrice.toFixed(2) : ""); // Formatear a 2 decimales si existe

      } else {
        setSearchError("No se encontraron resultados para este código de barras.");
        setNombre(""); // Limpiar nombre si no hay resultados
        setPrecio(""); // Limpiar precio si no hay resultados
      }
    } catch (error) {
      console.error("Error al buscar producto:", error);
      setSearchError("Error al conectar con el servicio de búsqueda. Intente de nuevo.");
    } finally {
      setIsLoading(false);
      console.log("--- Búsqueda finalizada --- \n");
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }
  return (
    <div className="container">
    {/* <button onClick={onClose} className="closeButton">X</button>  */}

      <h2 className="title">Agregar Nuevo Producto</h2>
      {/* Mostrar error general del formulario si existe */}
      {error && <div className="errorMessage">Error: {error}</div>}
      {/* Mostrar error de búsqueda si existe */}
      {searchError && <div className="errorMessage searchError">{searchError}</div>}

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
          <div className="inputWithButton">
            <input
              id="codigoBarras"
              type="text"
              value={codigoBarras}
              onChange={(e) => {
                setCodigoBarras(e.target.value);
                if (searchError) setSearchError(null); // Limpiar error al escribir
              }}
              required
              className="input"
              placeholder="Ingrese o escanee el código"
            />
            <button 
              type="button" 
              onClick={handleSearchProduct} 
              className="searchButton" 
              disabled={isLoading || !codigoBarras} // Deshabilitar si está cargando o no hay código
              title="Buscar producto por código de barras"
            >
              {isLoading ? (
                <div className="spinner"></div> // Indicador de carga
              ) : (
                <Search size={20} /> // Ícono de lupa
              )}
            </button>
          </div>
        </div>
        <button type="submit" className="submitButton">
          Agregar Producto
        </button>
      </form>
    </div>
  );
}

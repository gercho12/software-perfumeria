const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3001; // Choose an available port
require('dotenv').config();
const cors = require('cors');
app.use(cors()); // Permite solicitudes desde cualquier origen (para desarrollo)

// Root route handler
app.get('/', (req, res) => {
    res.json({ message: 'Backend API is running' });
});

const pool = mysql.createPool({
    host: 'mysql-176259-0.cloudclusters.net',
    user: 'admin', // Replace with your username
    password: 'vo3XfST8', // Replace with your password
    database: 'perfumeria',
    port: 19902,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificar la conexión a la base de datos al iniciar
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
})();

app.use(express.json()); // Needed to parse JSON in POST requests

// Ensure sales tables exist (simple bootstrap)
(async () => {
  try {
    await pool.execute(`CREATE TABLE IF NOT EXISTS ventas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total DECIMAL(10,2) NOT NULL
    )`);
    await pool.execute(`CREATE TABLE IF NOT EXISTS venta_detalles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venta_id INT NOT NULL,
      producto_id INT NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      codigo VARCHAR(255),
      cantidad INT NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
    )`);
    // Index for barcode lookups
    await pool.execute(`CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo)`);
  } catch (e) {
    console.error('Error ensuring sales tables:', e.message);
  }
})();

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    // Implementación de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Número de productos por página
    const offset = (page - 1) * limit;
    
    // Consulta para obtener productos paginados (interpolar enteros validados para evitar errores con LIMIT/OFFSET parametrizados)
    const [rows] = await pool.query(`SELECT * FROM productos ORDER BY descripcion ASC LIMIT ${limit} OFFSET ${offset}`);
    
    // Consulta para obtener el total de productos
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM productos');
    const totalProducts = countResult[0].total;
    
    // Verificar que rows sea un array válido
    if (!Array.isArray(rows)) {
      console.error('Error: rows is not an array', rows);
      return res.status(500).json({ error: 'Data format error' });
    }
    
    // Enviar respuesta con metadatos de paginación
    res.json({
      products: rows,
      pagination: {
        total: totalProducts,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalProducts / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/search
app.get('/api/products/search', async (req, res) => {
  try {
    const searchTerm = req.query.term || '';
    const [rows] = await pool.execute(
      'SELECT * FROM productos WHERE descripcion LIKE ? OR codigo LIKE ?', 
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    
    // Verificar que rows sea un array válido
    if (!Array.isArray(rows)) {
      console.error('Error: search results is not an array', rows);
      return res.status(500).json({ error: 'Data format error' });
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// POST /api/products (create new product)
app.post('/api/products', async (req, res) => {
  try {
    const { descripcion, precio, stock, codigo } = req.body;
    await pool.execute(
      'INSERT INTO productos (descripcion, precio, stock, codigo) VALUES (?, ?, ?, ?)',
      [descripcion, parseFloat(precio), parseInt(stock), codigo]
    );
    res.status(201).json({ message: 'Product created' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

//PUT /api/products/:id (Update product)
app.put('/api/products/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { descripcion, precio, stock, codigo } = req.body;
      await pool.execute(
          'UPDATE productos SET descripcion = ?, precio = ?, stock = ?, codigo = ? WHERE id = ?',
          [descripcion, parseFloat(precio), parseInt(stock), codigo, id]
      );
      res.status(200).json({ message: 'Product updated' });
  } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
  }
});


// DELETE /api/products/:id (Delete product) - Add this for completeness
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM productos WHERE id = ?', [id]);
        res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// POST /api/scrape-price (Scrape price from URL)
const axios = require('axios');
const cheerio = require('cheerio');

app.post('/api/scrape-price', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Scraping price from: ${url}`);

    try {
        // Fetch HTML content
        const { data: html } = await axios.get(url, {
            headers: {
                // Simulate a browser user agent to avoid simple blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            },
            timeout: 10000 // 10 seconds timeout
        });

        // Load HTML into Cheerio
        const $ = cheerio.load(html);

        let price = null;
        let found = false;

        // --- Helper function for normalization (Improved) ---
        const normalizePrice = (priceStr) => {
            if (!priceStr) return null;
            let cleaned = String(priceStr).trim();

            // Eliminar símbolos no numéricos excepto puntos y comas
            cleaned = cleaned.replace(/[^\d.,]/g, '');

            // Detectar si es formato argentino (coma decimal y punto miles)
            // Considerar que en Argentina el punto es separador de miles y la coma decimal
            const isArgentineFormat = cleaned.includes('.') && 
                                   cleaned.includes(',') && 
                                   cleaned.indexOf('.') < cleaned.indexOf(',');

            if (isArgentineFormat) {
                // Eliminar puntos (separadores de miles) y convertir coma decimal a punto
                cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
            } else if (cleaned.includes(',')) {
                // Si solo hay comas, asumir que es decimal
                cleaned = cleaned.replace(/,/g, '.');
            }

            // Manejar casos como '20.890' que debería ser 20890
            if (cleaned.includes('.') && cleaned.split('.')[1].length >= 3) {
                cleaned = cleaned.replace('.', '');
            }

            const numericValue = parseFloat(cleaned);

            console.log(`[Scraper AR] Original: "${priceStr}", Transformado: "${cleaned}", Valor: ${numericValue}`);

            return numericValue > 0 && numericValue < 1000000 ? numericValue : null;
        };

        // --- Basic Price Scraping Logic --- 
        // This is a simplified example and might need adjustments per target site
        // 1. Look for common price elements/attributes
        const priceSelectors = [
            '[itemprop="price"]',
            '.price',
            '.Price',
            '.precio',
            '#price',
            '#precio',
            '[class*="price"]',
            '[id*="price"]',
            'span[class*="amount"]',
            'div[class*="price"]'
            // Add more specific selectors based on common e-commerce platforms if needed
        ];

        for (const selector of priceSelectors) {
            $(selector).each((i, el) => {
                const priceText = $(el).text().trim() || $(el).attr('content'); // Check text content and 'content' attribute
                if (priceText) {
                    // Basic cleaning and validation using the helper function
                    const numericPrice = normalizePrice(priceText);
                    if (numericPrice) { // Check if normalization returned a valid number
                        console.log(`Price found with selector '${selector}': ${numericPrice}`);
                        price = numericPrice;
                        found = true;
                        return false; // Stop searching once a valid price is found
                    }
                }
            });
            if (found) break;
        }

        // 2. If not found, try regex on the whole body (less reliable)
        if (!found) {
            console.log("Price not found with common selectors, trying regex on body...");
            const bodyText = $('body').text();
            // Regex to find potential price strings (more lenient)
            const priceRegex = /(?:[$€£]|USD|EUR)?\s?([\d.,]+(?:[.,]\d+)?)\s?(?:[$€£]|USD|EUR)?/gi;
            let match;
            while ((match = priceRegex.exec(bodyText)) !== null) {
                 // Normalize the potential price string using the helper function
                 const numericPrice = normalizePrice(match[0]); // Pass the full match
                 if (numericPrice) {
                    console.log(`Price found with regex: ${numericPrice}`);
                    price = numericPrice;
                    found = true;
                    break; // Stop after first valid regex match
                 }
            }
        }

        if (found) {
            res.json({ price: price });
        } else {
            console.log("Could not extract price from the page.");
            res.status(404).json({ error: 'Could not extract price from the page' });
        }

    } catch (error) {
        console.error('Error scraping price:', error.message);
        // Handle different error types
        if (error.response) {
            // Request made and server responded with a status code outside 2xx range
            console.error('Error status:', error.response.status);
            console.error('Error data:', error.response.data);
            res.status(500).json({ error: `Failed to fetch URL (Status: ${error.response.status})` });
        } else if (error.request) {
            // Request was made but no response received
            console.error('Error request:', error.request);
            res.status(500).json({ error: 'No response received from URL' });
        } else if (error.code === 'ECONNABORTED') {
             console.error('Request timed out');
             res.status(500).json({ error: 'Request timed out while fetching URL' });
        } else {
            // Something else happened
            res.status(500).json({ error: 'An error occurred during scraping' });
        }
    }
});

// GET /api/products/by-barcode/:codigo
app.get('/api/products/by-barcode/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [rows] = await pool.execute('SELECT * FROM productos WHERE codigo = ? LIMIT 1', [codigo]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    res.status(500).json({ error: 'Failed to fetch product by barcode' });
  }
});

// POST /api/sales  { items: [{ productoId, cantidad }] }
app.post('/api/sales', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items requeridos' });
    }

    await connection.beginTransaction();

    // Load products and validate stock
    const productIds = items.map(i => i.productoId);
    const [products] = await connection.query(`SELECT * FROM productos WHERE id IN (${productIds.map(() => '?').join(',')})`, productIds);
    const idToProduct = new Map(products.map(p => [p.id, p]));

    let total = 0;
    const lineItems = [];
    for (const item of items) {
      const product = idToProduct.get(item.productoId);
      if (!product) throw new Error(`Producto ${item.productoId} no existe`);
      const qty = parseInt(item.cantidad, 10) || 0;
      if (qty <= 0) throw new Error('Cantidad inválida');
      if (product.stock < qty) throw new Error(`Stock insuficiente para ${product.descripcion}`);
      const subtotal = Number(product.precio) * qty;
      total += subtotal;
      lineItems.push({
        producto_id: product.id,
        descripcion: product.descripcion,
        codigo: product.codigo,
        cantidad: qty,
        precio: Number(product.precio),
        subtotal
      });
    }

    // Create sale
    const [saleResult] = await connection.execute('INSERT INTO ventas (total) VALUES (?)', [total]);
    const ventaId = saleResult.insertId;

    // Insert details and update stock
    for (const li of lineItems) {
      await connection.execute(
        'INSERT INTO venta_detalles (venta_id, producto_id, descripcion, codigo, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ventaId, li.producto_id, li.descripcion, li.codigo, li.cantidad, li.precio, li.subtotal]
      );
      await connection.execute('UPDATE productos SET stock = stock - ? WHERE id = ?', [li.cantidad, li.producto_id]);
    }

    await connection.commit();
    res.status(201).json({ id: ventaId, total, items: lineItems });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating sale:', error);
    res.status(400).json({ error: error.message || 'Failed to create sale' });
  } finally {
    connection.release();
  }
});

// GET /api/sales/recent?limit=20
app.get('/api/sales/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const [ventas] = await pool.query(`SELECT * FROM ventas ORDER BY fecha DESC LIMIT ${limit}`);
    const ventaIds = ventas.map(v => v.id);
    let detalles = [];
    if (ventaIds.length > 0) {
      const [rows] = await pool.query(`SELECT * FROM venta_detalles WHERE venta_id IN (${ventaIds.map(() => '?').join(',')})`, ventaIds);
      detalles = rows;
    }
    const detallesByVenta = detalles.reduce((acc, d) => {
      (acc[d.venta_id] = acc[d.venta_id] || []).push(d);
      return acc;
    }, {});
    const result = ventas.map(v => ({ ...v, detalles: detallesByVenta[v.id] || [] }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    res.status(500).json({ error: 'Failed to fetch recent sales' });
  }
});


app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

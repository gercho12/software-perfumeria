const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3001;
require('dotenv').config();
const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
    res.json({ message: 'Backend API is running' });
});

const pool = mysql.createPool({
    host: 'mysql-176259-0.cloudclusters.net',
    user: 'admin',
    password: 'vo3XfST8',
    database: 'perfumeria',
    port: 19902
});

app.use(express.json());

// GET /api/products - CORRECTED for Pagination and Search
app.get('/api/products', async (req, res) => {
  try {
    // Ensure parameters are integers for security and correctness
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';

    // Offset must also be an integer
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (search) {
      // The '?' placeholders are for search values only
      whereClause = 'WHERE descripcion LIKE ? OR codigo LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    // --- Get Total Count for Pagination (this part was already correct) ---
    const countSql = `SELECT COUNT(*) as total FROM productos ${whereClause}`;
    const [countRows] = await pool.execute(countSql, params);
    const totalProducts = countRows[0].total;

    // --- Get Paginated Products ---
    // CORRECTED: LIMIT and OFFSET are injected directly into the string.
    // This is safe because we have sanitized them with parseInt().
    const productsSql = `
      SELECT * FROM productos 
      ${whereClause} 
      ORDER BY descripcion ASC 
      LIMIT ${limit} OFFSET ${offset}`;
    
    // The `params` array now correctly matches the number of '?' in the SQL string.
    const [productRows] = await pool.execute(productsSql, params);

    res.json({
      products: productRows,
      total: totalProducts,
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
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
      const [result] = await pool.execute(
          'UPDATE productos SET descripcion = ?, precio = ?, stock = ?, codigo = ? WHERE id = ?',
          [descripcion, parseFloat(precio), parseInt(stock), codigo, id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      // Return the updated product data
      const [updatedProduct] = await pool.execute('SELECT * FROM productos WHERE id = ?', [id]);
      res.status(200).json(updatedProduct[0]);
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


app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

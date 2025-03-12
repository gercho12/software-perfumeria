const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3001; // Choose an available port
require('dotenv').config();
const cors = require('cors');
// Configure CORS with specific options
app.use(cors({
  origin: '*', // In production, replace with specific origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// Root route handler
app.get('/', (req, res) => {
    res.json({ message: 'Backend API is running' });
});

const pool = mysql.createPool({
    host: 'mysql-176259-0.cloudclusters.net',
    user: 'admin', // Replace with your username
    password: 'vo3XfST8', // Replace with your password
    database: 'perfumeria',
    port: 19902
});

app.use(express.json()); // Needed to parse JSON in POST requests

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM productos');
    res.json(rows);
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


app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server listening on all interfaces, port ${port}`);
});

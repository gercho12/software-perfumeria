const { getPool } = require('../_db');

module.exports = async (req, res) => {
  const pool = getPool();
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const [rows] = await pool.query(`SELECT * FROM productos ORDER BY descripcion ASC LIMIT ${limit} OFFSET ${offset}`);
      const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM productos');
      const totalProducts = countResult[0].total;
      res.status(200).json({
        products: rows,
        pagination: { total: totalProducts, page, limit, totalPages: Math.ceil(totalProducts / limit) }
      });
    } catch (e) {
      console.error('GET /api/products error:', e);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else if (req.method === 'POST') {
    try {
      const { descripcion, precio, stock, codigo } = req.body || {};
      if (!descripcion || precio == null || stock == null || !codigo) {
        return res.status(400).json({ error: 'Campos requeridos: descripcion, precio, stock, codigo' });
      }
      await pool.execute(
        'INSERT INTO productos (descripcion, precio, stock, codigo) VALUES (?, ?, ?, ?)',
        [descripcion, parseFloat(precio), parseInt(stock), codigo]
      );
      res.status(201).json({ message: 'Product created' });
    } catch (e) {
      console.error('POST /api/products error:', e);
      res.status(500).json({ error: 'Failed to create product' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

 
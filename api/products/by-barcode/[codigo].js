const { getPool } = require('../../_db');

module.exports = async (req, res) => {
  const pool = getPool();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { codigo } = req.query;
    const [rows] = await pool.execute('SELECT * FROM productos WHERE codigo = ? LIMIT 1', [codigo]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(200).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch product by barcode' });
  }
};



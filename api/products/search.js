const { getPool } = require('../_db');

module.exports = async (req, res) => {
  const pool = getPool();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const searchTerm = req.query.term || '';
    const [rows] = await pool.execute(
      'SELECT * FROM productos WHERE descripcion LIKE ? OR codigo LIKE ?',
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to search products' });
  }
};



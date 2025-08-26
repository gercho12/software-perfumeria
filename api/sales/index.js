const { getPool } = require('../_db');

module.exports = async (req, res) => {
  const pool = getPool();
  if (req.method === 'POST') {
    const connection = await pool.getConnection();
    try {
      const { items } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items requeridos' });
      }

      await connection.beginTransaction();
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

      const [saleResult] = await connection.execute('INSERT INTO ventas (total) VALUES (?)', [total]);
      const ventaId = saleResult.insertId;

      for (const li of lineItems) {
        await connection.execute(
          'INSERT INTO venta_detalles (venta_id, producto_id, descripcion, codigo, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [ventaId, li.producto_id, li.descripcion, li.codigo, li.cantidad, li.precio, li.subtotal]
        );
        await connection.execute('UPDATE productos SET stock = stock - ? WHERE id = ?', [li.cantidad, li.producto_id]);
      }

      await connection.commit();
      res.status(201).json({ id: ventaId, total, items: lineItems });
    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(400).json({ error: e.message || 'Failed to create sale' });
    } finally {
      connection.release();
    }
  } else if (req.method === 'GET') {
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
      res.status(200).json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch recent sales' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};



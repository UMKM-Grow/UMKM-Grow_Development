const path = require('path');
process.chdir(path.join(__dirname));
const { Product, ProductVariant, sequelize } = require('./models');
(async () => {
  try {
    await sequelize.authenticate();
    const prods = await Product.findAll({
      where: { branch_id: 2 },
      include: [{ model: ProductVariant, as: 'variants' }],
      limit: 20,
    });
    console.log(JSON.stringify(
      prods.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stok: p.stok,
        variants: p.variants.map(v => ({ id: v.id, stock: v.stock }))
      })), null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
})();
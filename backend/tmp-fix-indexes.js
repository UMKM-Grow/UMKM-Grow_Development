const path = require('path');
const fs = require('fs');
process.chdir(path.join(__dirname));
const { sequelize } = require('./models');
(async () => {
  try {
    await sequelize.authenticate();
    const [indexes] = await sequelize.query('SHOW INDEX FROM products');
    const skuIndexes = indexes.filter((i) => i.Key_name.startsWith('sku'));
    for (const idx of skuIndexes) {
      if (idx.Key_name === 'products_branch_sku_unique') continue;
      console.log('dropping', idx.Key_name);
      await sequelize.query(`ALTER TABLE products DROP INDEX \`${idx.Key_name}\``);
    }
    console.log('creating composite unique index on branch_id and sku');
    await sequelize.query('ALTER TABLE products ADD UNIQUE INDEX `products_branch_sku_unique` (`branch_id`,`sku`)');
    console.log('done');
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
})();
// Ensure we are using the mock DB before anything else
process.env.USE_MOCK_DB = 'true';

const BaseRepository = require('../src/repositories/BaseRepository');
const { query } = require('../src/database/connection');

describe('BaseRepository', () => {
  let repository;
  const tableName = 'shops';

  beforeEach(() => {
    repository = new BaseRepository(tableName);
  });

  test('should find by id', async () => {
    const shopData = { shop_domain: 'test.myshopify.com', access_token: 'token', scope: 'read_orders' };
    const result = await repository.create(shopData);
    const id = result.insertId || result;

    const shop = await repository.findById(id);
    expect(shop).toBeDefined();
    expect(shop.shop_domain).toBe(shopData.shop_domain);
  });

  test('should find one by criteria', async () => {
    const shopData = { shop_domain: 'findone.myshopify.com', access_token: 'token', scope: 'read_orders' };
    await repository.create(shopData);

    const shop = await repository.findOne({ shop_domain: 'findone.myshopify.com' });
    expect(shop).toBeDefined();
    expect(shop.shop_domain).toBe(shopData.shop_domain);
  });

  test('should return null if not found', async () => {
    const shop = await repository.findById(999);
    expect(shop).toBeNull();
  });
});

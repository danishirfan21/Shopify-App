// Ensure we are using the mock DB before anything else
process.env.USE_MOCK_DB = 'true';

const ShopRepository = require('../src/repositories/ShopRepository');

describe('ShopRepository', () => {
  test('should create and find shop by domain', async () => {
    const shopData = {
      shop_domain: 'repo-test.myshopify.com',
      access_token: 'test-token',
      scope: 'read_orders',
      is_active: true
    };

    await ShopRepository.createShop(shopData);
    const shop = await ShopRepository.findByDomain('repo-test.myshopify.com');

    expect(shop).toBeDefined();
    expect(shop.shop_domain).toBe(shopData.shop_domain);
    // Token should be decrypted (ShopRepository handle encryption/decryption)
    expect(shop.access_token).toBe(shopData.access_token);
  });
});

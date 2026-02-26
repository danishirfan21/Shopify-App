/**
 * Mock Database Connection
 * Provides an in-memory database mock for demo and testing purposes
 */

const createLogger = require('../utils/logger');
const logger = createLogger('MockDatabase');

// In-memory data store
const store = {
  shops: [],
  orders: [],
  customers: [],
  line_items: [],
  sync_logs: [],
  webhook_events: []
};

let nextIds = {
  shops: 1,
  orders: 1,
  customers: 1,
  line_items: 1,
  sync_logs: 1,
  webhook_events: 1
};

async function mockQuery(sql, params = []) {
  const sqlTrimmed = sql.trim().replace(/\s+/g, ' ');
  const sqlUpper = sqlTrimmed.toUpperCase();

  // 1. INSERT
  if (sqlUpper.startsWith('INSERT INTO')) {
    const tableNameMatch = sql.match(/INSERT INTO\s+(\w+)/i);
    const tableName = tableNameMatch[1].toLowerCase();

    const fieldsMatch = sql.match(/\((.*?)\)/);
    const fields = fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim()) : [];

    const record = {};
    fields.forEach((field, index) => {
      record[field] = params[index];
    });

    if (!record.id) {
      record.id = nextIds[tableName]++;
    }

    if (sqlUpper.includes('ON DUPLICATE KEY UPDATE')) {
      const existing = store[tableName].find(r =>
        (tableName === 'shops' && r.shop_domain === record.shop_domain) ||
        (tableName === 'orders' && r.shopify_order_id === record.shopify_order_id)
      );
      if (existing) {
        Object.assign(existing, record);
        return [{ affectedRows: 1, insertId: existing.id }];
      }
    }

    if (!store[tableName]) store[tableName] = [];
    store[tableName].push(record);
    return [{ affectedRows: 1, insertId: record.id }];
  }

  // 2. SELECT
  if (sqlUpper.startsWith('SELECT')) {
    if (sqlUpper === 'SELECT 1') return [[{ '1': 1 }]];

    const tableNameMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableNameMatch) return [[]];
    const tableName = tableNameMatch[1].toLowerCase();
    let results = [...(store[tableName] || [])];

    if (sqlUpper.includes('WHERE')) {
      if (sql.includes('shop_domain = ?')) results = results.filter(r => r.shop_domain === params[0]);
      else if (sql.includes('id = ?')) results = results.filter(r => r.id == params[0]);
      else if (sql.includes('shop_id = ?')) {
        const shopIdIndex = sql.split('?').length - 1 - (sql.split('?').length - 1 - sql.substring(0, sql.indexOf('shop_id')).split('?').length);
        // Extremely crude: assume first param is shop_id if it's there
        results = results.filter(r => r.shop_id == params[0]);
      }
    }

    if (sqlUpper.includes('COUNT(*) AS TOTAL') || sqlUpper.includes('COUNT(*) AS total')) {
      if (!sqlUpper.includes('GROUP BY')) return [[{ total: results.length }]];
    }

    if (sqlUpper.includes('SUM(') || sqlUpper.includes('GROUP BY')) {
      const revenue = results.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
      return [[{
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer_sale',
        order_count: results.length,
        total_revenue: revenue,
        revenue: revenue,
        average_order_value: results.length ? revenue / results.length : 0,
        title: 'Demo Product',
        total_quantity: 10
      }]];
    }

    return [results];
  }

  // 3. UPDATE / DELETE
  return [{ affectedRows: 1 }];
}

module.exports = {
  query: async (sql, params) => {
    const results = await mockQuery(sql, params);
    return results[0] || results;
  },
  getPool: async () => ({
    execute: mockQuery,
    getConnection: async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      execute: mockQuery
    }),
    end: async () => {}
  }),
  beginTransaction: async () => ({
    execute: mockQuery,
    commit: async () => {},
    rollback: async () => {},
    release: () => {}
  }),
  commit: async () => {},
  rollback: async () => {},
  closePool: async () => {},
  healthCheck: async () => true,
};

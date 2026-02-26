/**
 * Base Repository
 * Provides common database operations for all entities
 */

const { query } = require('../database/connection');
const { DatabaseError } = require('../utils/errors');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * Find single record by criteria
   */
  async findOne(criteria) {
    const { sql, params } = this._buildWhereClause(criteria);
    const fullSql = `SELECT * FROM ${this.tableName} ${sql} LIMIT 1`;
    const results = await query(fullSql, params);
    return results[0] || null;
  }

  /**
   * Find all records matching criteria
   */
  async findAll(criteria = {}, options = {}) {
    const { sql: whereSql, params } = this._buildWhereClause(criteria);

    let sql = `SELECT * FROM ${this.tableName} ${whereSql}`;

    // Add ordering
    if (options.orderBy) {
      const direction = options.orderDirection || 'ASC';
      sql += ` ORDER BY ${options.orderBy} ${direction}`;
    }

    // Add pagination
    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit, 10)}`;
      if (options.offset) {
        sql += ` OFFSET ${parseInt(options.offset, 10)}`;
      }
    }

    return await query(sql, params);
  }

  /**
   * Count records matching criteria
   */
  async count(criteria = {}) {
    const { sql, params } = this._buildWhereClause(criteria);
    const fullSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${sql}`;
    const results = await query(fullSql, params);
    return results[0].total;
  }

  /**
   * Create new record
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    const result = await query(sql, values);
    return result.insertId;
  }

  /**
   * Update record by ID
   */
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);

    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

    const result = await query(sql, [...values, id]);
    return result.affectedRows > 0;
  }

  /**
   * Delete record by ID
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Upsert (insert or update)
   * Uses INSERT ... ON DUPLICATE KEY UPDATE
   */
  async upsert(data, uniqueFields) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    // Build update clause (all fields except unique keys)
    const updateFields = fields.filter((f) => !uniqueFields.includes(f));
    const updateClause = updateFields
      .map((field) => `${field} = VALUES(${field})`)
      .join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updateClause}
    `;

    const result = await query(sql, values);
    return result.insertId || result.affectedRows;
  }

  /**
   * Builds WHERE clause from criteria object
   * @private
   */
  _buildWhereClause(criteria) {
    if (Object.keys(criteria).length === 0) {
      return { sql: '', params: [] };
    }

    const conditions = [];
    const params = [];

    for (const [field, value] of Object.entries(criteria)) {
      if (value === null) {
        conditions.push(`${field} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${field} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${field} = ?`);
        params.push(value);
      }
    }

    return {
      sql: `WHERE ${conditions.join(' AND ')}`,
      params,
    };
  }
}

module.exports = BaseRepository;

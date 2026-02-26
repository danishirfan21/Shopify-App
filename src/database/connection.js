/**
 * MySQL Connection Pool
 * Singleton connection pool for database access
 */

const mysql = require('mysql2/promise');
const databaseConfig = require('../config/database');
const createLogger = require('../utils/logger');
const { DatabaseError } = require('../utils/errors');
const mockConnection = require('./mockConnection');

const logger = createLogger('Database');

// Check if we should use mock database
const useMock = process.env.USE_MOCK_DB === 'true';

if (useMock) {
  logger.info('Using in-memory mock database');
  module.exports = mockConnection;
} else {
  let pool = null;

  /**
   * Creates and returns MySQL connection pool
   * @returns {Promise<Pool>} MySQL connection pool
   */
  async function getPool() {
    if (pool) {
      return pool;
    }

    try {
      pool = mysql.createPool(databaseConfig);

      // Test connection
      const connection = await pool.getConnection();
      logger.info('Database connection established successfully', {
        host: databaseConfig.host,
        database: databaseConfig.database,
      });
      connection.release();

      // Handle pool errors
      pool.on('error', (err) => {
        logger.error('Unexpected database pool error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          logger.error('Database connection was lost, recreating pool');
          pool = null;
        }
      });

      return pool;
    } catch (error) {
      logger.error('Failed to create database pool', error);
      throw new DatabaseError('Failed to connect to database', error);
    }
  }

  /**
   * Executes a query with automatic connection management
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async function query(sql, params = []) {
    const pool = await getPool();

    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (error) {
      logger.error('Database query failed', {
        error: error.message,
        sql: sql.substring(0, 100), // Log first 100 chars
      });
      throw new DatabaseError(`Query failed: ${error.message}`, error);
    }
  }

  /**
   * Begins a transaction
   * @returns {Promise<Connection>} Database connection with active transaction
   */
  async function beginTransaction() {
    const pool = await getPool();
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  /**
   * Commits a transaction
   * @param {Connection} connection - Database connection
   */
  async function commit(connection) {
    try {
      await connection.commit();
    } finally {
      connection.release();
    }
  }

  /**
   * Rolls back a transaction
   * @param {Connection} connection - Database connection
   */
  async function rollback(connection) {
    try {
      await connection.rollback();
    } finally {
      connection.release();
    }
  }

  /**
   * Closes all connections in the pool
   * @returns {Promise<void>}
   */
  async function closePool() {
    if (pool) {
      await pool.end();
      pool = null;
      logger.info('Database pool closed');
    }
  }

  /**
   * Checks if database connection is healthy
   * @returns {Promise<boolean>}
   */
  async function healthCheck() {
    try {
      await query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }

  module.exports = {
    getPool,
    query,
    beginTransaction,
    commit,
    rollback,
    closePool,
    healthCheck,
  };
}

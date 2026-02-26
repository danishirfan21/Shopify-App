/**
 * Database Migration Script
 * Runs SQL migration files in order
 */

const fs = require('fs').promises;
const path = require('path');
const { query, closePool } = require('../src/database/connection');
const createLogger = require('../src/utils/logger');

const logger = createLogger('Migration');

const MIGRATIONS_DIR = path.join(__dirname, '../src/database/migrations');

/**
 * Gets list of migration files sorted by number
 */
async function getMigrationFiles() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files
    .filter((file) => file.endsWith('.sql'))
    .sort(); // Files are numbered, so sorting works
}

/**
 * Runs a single migration file
 */
async function runMigration(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = await fs.readFile(filepath, 'utf8');

  logger.info(`Running migration: ${filename}`);

  try {
    // Split by semicolon to handle multiple statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await query(statement);
    }

    logger.info(`✓ Migration completed: ${filename}`);
    return true;
  } catch (error) {
    logger.error(`✗ Migration failed: ${filename}`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    logger.info('Starting database migrations...');

    const files = await getMigrationFiles();
    logger.info(`Found ${files.length} migration(s)`);

    for (const file of files) {
      await runMigration(file);
    }

    logger.info('✓ All migrations completed successfully');
  } catch (error) {
    logger.error('Migration process failed', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

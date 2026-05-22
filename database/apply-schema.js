const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

try {
  require('../backend/node_modules/dotenv').config({
    path: path.join(__dirname, '../backend/.env'),
    override: false,
  });
} catch (error) {
  // dotenv is optional here; Railway/production normally provides process.env directly.
}

const { pool, config } = require('../backend/src/config');

const schemaPath = path.join(__dirname, 'schema.sql');

const splitSqlStatements = (sql) => {
  const statements = [];
  const lines = sql.split(/\r?\n/);

  let buffer = [];
  let inBlockComment = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith('/*')) {
      inBlockComment = true;
    }

    if (!inBlockComment && line.startsWith('--')) {
      continue;
    }

    if (inBlockComment) {
      if (line.endsWith('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    buffer.push(rawLine);

    if (line.endsWith(';')) {
      const statement = buffer.join('\n').trim().replace(/;$/, '');
      if (statement) {
        statements.push(statement);
      }
      buffer = [];
    }
  }

  const trailing = buffer.join('\n').trim();
  if (trailing) {
    statements.push(trailing.replace(/;$/, ''));
  }

  return statements;
};

async function main() {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((name) => !config[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required DB environment variables: ${missing.join(', ')}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = splitSqlStatements(schemaSql);

  console.log(`Applying ${statements.length} SQL statements to ${config.DB_NAME}...`);

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log('Schema applied successfully.');
}

main()
  .catch((error) => {
    console.error('Schema bootstrap failed:');
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch (error) {
      // Ignore shutdown errors.
    }
  });
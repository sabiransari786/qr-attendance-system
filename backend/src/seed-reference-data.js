const fs = require('fs');
const path = require('path');
const { pool } = require('./config');

const seedFilePath = path.join(__dirname, '../../database/seed_production.sql');

const splitSqlStatements = (sql) => {
  const statements = [];
  const lines = sql.split(/\r?\n/);

  let buffer = [];
  let inBlockComment = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

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
      if (statement) statements.push(statement);
      buffer = [];
    }
  }

  const trailing = buffer.join('\n').trim();
  if (trailing) statements.push(trailing.replace(/;$/, ''));

  return statements;
};

async function seedReferenceData() {
  try {
    if (!fs.existsSync(seedFilePath)) {
      console.warn('⚠️  Reference seed file not found:', seedFilePath);
      return;
    }

    const seedSql = fs.readFileSync(seedFilePath, 'utf8');
    const statements = splitSqlStatements(seedSql)
      .map((statement) => statement.replace(/^INSERT\s+INTO\s+courses/i, 'INSERT IGNORE INTO courses'));

    let executed = 0;
    for (const statement of statements) {
      await pool.query(statement);
      executed += 1;
    }

    console.log(`🌱 Reference data seed complete (${executed} statements).`);
  } catch (error) {
    console.error('⚠️  Reference data seed skipped:', error.message);
  }
}

module.exports = seedReferenceData;
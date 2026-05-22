const mysql = require('mysql2/promise');

const sourceConfig = {
  host: process.env.SOURCE_DB_HOST,
  port: parseInt(process.env.SOURCE_DB_PORT, 10) || 3306,
  user: process.env.SOURCE_DB_USER,
  password: process.env.SOURCE_DB_PASSWORD,
  database: process.env.SOURCE_DB_NAME,
  multipleStatements: true,
};

const targetConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

const requiredEnv = [
  'SOURCE_DB_HOST',
  'SOURCE_DB_USER',
  'SOURCE_DB_PASSWORD',
  'SOURCE_DB_NAME',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
];

const chunkRows = (rows, size) => {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
};

const formatCount = (count) => count.toLocaleString('en-US');

const preferredOrder = [
  'users',
  'departments',
  'courses',
  'sessions',
  'attendance',
  'course_enrollment',
  'attendance_request',
  'otp_verification',
  'activity_logs',
  'approved_users',
  'manual_attendance_request',
];

const sortTables = (tables) => {
  return [...tables].sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left);
    const rightIndex = preferredOrder.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }

    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;

    return leftIndex - rightIndex;
  });
};

async function main() {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const source = await mysql.createConnection(sourceConfig);
  const target = await mysql.createConnection(targetConfig);

  try {
    const [tableRows] = await source.query(
      `SELECT TABLE_NAME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [sourceConfig.database]
    );

    const tables = sortTables(tableRows.map((row) => row.TABLE_NAME));

    if (tables.length === 0) {
      console.log('No source tables found. Nothing to copy.');
      return;
    }

    console.log(`Found ${tables.length} tables in ${sourceConfig.database}`);
    console.log(`Copying to ${targetConfig.database}...\n`);

    await target.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of [...tables].reverse()) {
      await target.query(`DELETE FROM \`${tableName}\``);
    }

    for (const tableName of tables) {
      console.log(`→ ${tableName}`);

      const [rows] = await source.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length === 0) {
        console.log('   0 rows');
        continue;
      }

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const columnSql = columns.map((column) => `\`${column}\``).join(', ');
      const batches = chunkRows(rows, 500);

      for (const batch of batches) {
        const values = batch.map((row) => columns.map((column) => row[column]));
        await target.query(
          `INSERT INTO \`${tableName}\` (${columnSql}) VALUES ${batch.map(() => `(${placeholders})`).join(', ')}`,
          values.flat()
        );
      }

      console.log(`   ${formatCount(rows.length)} rows copied`);
    }

    await target.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\nClone completed successfully.');
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error('Database clone failed:');
  console.error(error.message);
  process.exit(1);
});
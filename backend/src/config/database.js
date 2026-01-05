/**
 * Database Configuration File (database.js)
 * 
 * Ye file MySQL database connection setup handle karti hai
 * Connection Pool use karte hain - single connection nahi
 * Production-ready approach hai - multiple requests simultaneously handle kar sakte hain
 */

// ============================================================================
// STEP 1: MySQL2 Library Import Kar Rahe Hain
// ============================================================================

// mysql2 library import - MySQL database se connect karne ke liye
// mysql2 mysql ka improved version hai - promises aur async/await support deta hai
// createPool() function se connection pool banata hai - multiple connections manage karta hai
const mysql = require('mysql2/promise');

// ============================================================================
// STEP 2: Database Connection Pool Configuration
// ============================================================================

// Connection Pool kya hai?
// - Pool ek collection hai pre-established database connections ka
// - Single connection ki jagah multiple connections ready rakhte hain
// - Jab query aati hai, pool se ek connection borrow karte hain, use karke wapas return kar dete hain
// - Kyun zaroori hai? Multiple users simultaneously database access karenge - single connection se bottleneck hoga

// Connection Pool create kar rahe hain - ye pool configuration object leta hai
// createPool() function automatically multiple connections manage karta hai
const pool = mysql.createPool({
  // Database server ka host address (usually 'localhost' ya IP address)
  // process.env se environment variable read kar rahe hain - .env file mein define hoga
  // Hardcode nahi kar rahe security ke liye - production mein alag database ho sakti hai
  host: process.env.DB_HOST || 'localhost',

  // Database server ka port number (MySQL default port 3306 hai)
  // parseInt() se string ko number mein convert kar rahe hain
  port: parseInt(process.env.DB_PORT, 10) || 3306,

  // Database user name - .env file mein define karna zaroori hai
  // Root user use nahi karte production mein - separate user bana kar limited permissions dete hain
  user: process.env.DB_USER,

  // Database user ka password - .env file mein define karna zaroori hai
  // Kabhi bhi hardcode nahi karna - security risk hai
  password: process.env.DB_PASSWORD,

  // Database ka naam - .env file mein define karna zaroori hai
  // Ye woh database hai jisme hamare tables honge (users, sessions, attendance, etc.)
  database: process.env.DB_NAME,

  // Connection Pool Settings:
  
  // waitForConnections: true - agar sab connections busy hain, to naye request wait karengi
  // false hone par error throw kar dega - true better hai production ke liye
  waitForConnections: true,

  // connectionLimit: Maximum kitne connections pool mein rakh sakte hain
  // Zyada connections = zyada memory use, kam connections = slow performance
  // 10 connections usually sufficient hai small-medium applications ke liye
  // Production mein server capacity ke hisab se adjust karna chahiye
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,

  // queueLimit: Maximum kitne requests wait queue mein rakh sakte hain
  // Agar queueLimit cross ho jaye to error throw hoga
  // 0 means unlimited queue - production mein limit set karna better hai
  queueLimit: 0,

  // enableKeepAlive: true - connection ko alive rakhta hai, timeout nahi hone deta
  // MySQL server connections timeout kar deti hai inactivity se - ye prevent karta hai
  enableKeepAlive: true,

  // keepAliveInitialDelay: Keep-alive packet bhejne mein initial delay (milliseconds)
  // 0 means immediately start keep-alive
  keepAliveInitialDelay: 0
});

// ============================================================================
// STEP 3: Database Connection Test Function
// ============================================================================

/**
 * connectDatabase() Function
 * 
 * Ye function application start hone pe call hoti hai
 * Database connection establish karti hai aur success/failure log karti hai
 * 
 * Kyun app start pe? 
 * - Routes se pehle database ready honi chahiye
 * - Agar database connect nahi hui to application ka kaam nahi chalega
 * - Early failure detection - pehle hi pata chal jayega ki database issue hai
 * - Production mein monitoring tools ko pata chal jayega ki app properly start nahi hua
 * 
 * Kaise app.js se connect hota hai?
 * - app.js file mein ye line hai: const { connectDatabase } = require('./config/database');
 * - app.js mein connectDatabase() function call hoti hai routes se pehle
 * - Is tarah app start pe hi database connection ready ho jati hai
 */
const connectDatabase = async () => {
  try {
    // Pool se ek test connection get kar rahe hain
    // getConnection() pool se ek connection borrow karta hai
    // Test query execute karke connection verify kar rahe hain
    const connection = await pool.getConnection();

    // Simple query execute kar rahe hain - MySQL version check karne ke liye
    // SELECT 1 simple query hai jo database connection test karti hai
    await connection.query('SELECT 1');

    // Connection successfully use ho gayi - ab wapas pool mein release kar rahe hain
    // Release karna zaroori hai - warna pool mein connections khatam ho jayengi
    connection.release();

    // Success message log kar rahe hain
    // Console mein green color ka message dikhayega (agar terminal support karta hai)
    console.log('\x1b[32m%s\x1b[0m', '✓ Database connected successfully');
    console.log(`  Database: ${process.env.DB_NAME || 'Not specified'}`);
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Port: ${process.env.DB_PORT || 3306}`);

  } catch (error) {
    // Agar database connection fail ho gayi to error catch hoga

    // Error details console mein print kar rahe hain - debugging ke liye helpful
    console.error('\x1b[31m%s\x1b[0m', '✗ Database connection failed!');
    console.error('Error details:', error.message);

    // Common errors ki suggestions de rahe hain
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPossible reasons:');
      console.error('  1. MySQL server is not running');
      console.error('  2. Wrong host or port in .env file');
      console.error('  3. Firewall blocking the connection');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nPossible reasons:');
      console.error('  1. Wrong username or password in .env file');
      console.error('  2. User does not have permission to access database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\nPossible reasons:');
      console.error('  1. Database does not exist');
      console.error('  2. Wrong database name in .env file');
    } else if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('\nPossible reasons:');
      console.error('  1. Missing environment variables in .env file');
      console.error('  2. Required variables: DB_USER, DB_PASSWORD, DB_NAME');
    }

    // Process exit kar rahe hain - application start nahi karna chahiye agar database connect nahi hui
    // Exit code 1 means error - monitoring tools ko pata chal jayega ki app crash ho gaya
    // Graceful exit - error log karne ke baad clean exit
    console.error('\nExiting application...');
    process.exit(1);
  }
};

// ============================================================================
// STEP 4: Export Pool Aur connectDatabase Function
// ============================================================================

// Pool ko export kar rahe hain - services aur models mein use hoga queries execute karne ke liye
// Services folder mein pool.getConnection() call karke queries execute karenge
// Pool export karna zaroori hai - har query ke liye pool access chahiye

// connectDatabase function ko export kar rahe hain - app.js mein call hoga
// app.js file mein: connectDatabase() call karke database connection initialize karenge

module.exports = {
  pool,              // Connection pool - queries execute karne ke liye
  connectDatabase    // Connection initialization function - app start pe call hoga
};

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
//
// 1. Environment Variables Required in .env file:
//    - DB_HOST (default: localhost)
//    - DB_PORT (default: 3306)
//    - DB_USER (required)
//    - DB_PASSWORD (required)
//    - DB_NAME (required)
//    - DB_CONNECTION_LIMIT (optional, default: 10)
//
// 2. Connection Pool Usage:
//    - Services mein: const { pool } = require('../config/database');
//    - Query execute: const [results] = await pool.query('SELECT * FROM users');
//
// 3. App.js Integration:
//    - app.js mein: const { connectDatabase } = require('./config/database');
//    - Routes se pehle: connectDatabase();
//
// 4. Why Connection Pool?
//    - Multiple requests handle karne ke liye
//    - Better performance - connections reuse hote hain
//    - Resource management - connections automatically manage hoti hain
//
// 5. Error Handling:
//    - Connection fail hone par process exit hoga
//    - Application start nahi hogi agar database connect nahi hui
//    - Production mein monitoring tools error detect kar sakte hain
//
// ============================================================================


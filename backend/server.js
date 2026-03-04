/**
 * Server Entry Point (server.js)
 * 
 * Ye file hamare backend application ka main entry point hai - yahan se server start hota hai
 * Clean Architecture ke according: app.js mein application setup hota hai, server.js mein server start hota hai
 * Isse testing aur deployment mein flexibility milti hai - app instance ko bina server start kiye import kar sakte hain
 */

// ============================================================================
// STEP 1: Express App Import Kar Rahe Hain
// ============================================================================

// app.js se Express app instance import kar rahe hain
// Kyun? - app.js mein saare routes, middlewares, aur configurations already setup ho chuki hain
// server.js ka kaam sirf app instance ko lena aur server start karna hai - separation of concerns follow karte hue
// Relative path: backend/server.js → backend/src/app.js
console.log("🔥 SERVER.JS FILE EXECUTING 🔥");
const app = require('./src/app');

// ============================================================================
// STEP 2: PORT Environment Variable Define Kar Rahe Hain
// ============================================================================

const PORT = process.env.PORT || 5000;

// ============================================================================
// STEP 3: HTTP Server Start Kar Rahe Hain
// ============================================================================

const os = require('os');
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const server = app.listen(PORT, '0.0.0.0', async () => {
  const localIP = getLocalIP();
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIP}:${PORT}`);
  console.log(`✅ API Health Check: http://localhost:${PORT}/api/health`);

  // ============================================================================
  // SEED DEMO USERS — Deployment ke baad bhi demo data available rahega
  // ============================================================================
  const seedDemoUsers = require('./src/seed-demo-users');
  await seedDemoUsers();

  // ============================================================================
  // AUTO SESSION CLOSE — Orphan Sessions Fix
  // ============================================================================
  // Jo sessions bahut purani ho gayi hain (end_time nikal gaya) unhe auto-close karo
  // Ye every 10 minutes chalega
  const { pool } = require('./src/config');

  const autoCloseSessions = async () => {
    try {
      const [result] = await pool.query(
        `UPDATE sessions 
         SET status = 'closed', updated_at = NOW()
         WHERE status = 'active' 
           AND end_time IS NOT NULL 
           AND end_time < NOW()`
      );
      if (result.affectedRows > 0) {
        console.log(`🔄 Auto-closed ${result.affectedRows} expired session(s)`);
      }
    } catch (err) {
      console.error('Auto session close error:', err.message);
    }
  };

  // Pehle immediately run karo (orphan sessions clean karo on startup)
  autoCloseSessions();
  // Phir har 10 minute pe run karo
  const autoCloseInterval = setInterval(autoCloseSessions, 10 * 60 * 1000);

  // ============================================================================
  // GRACEFUL SHUTDOWN — Clean exit on SIGTERM/SIGINT
  // ============================================================================
  const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    clearInterval(autoCloseInterval);
    server.close(async () => {
      try {
        await pool.end();
        console.log('✅ Database pool closed.');
      } catch (err) {
        console.error('❌ Error closing database pool:', err.message);
      }
      console.log('👋 Server shut down complete.');
      process.exit(0);
    });
    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
});

// ============================================================================
// NOTES:
// ============================================================================
// 
// 1. server.js ka role: Server start karna, business logic yahan nahi aata
// 2. app.js ka role: Express app configure karna (routes, middleware, database)
// 3. Separation: app.js se app import karke server.js mein start karte hain - isse testing easy hota hai
// 4. PORT: Environment variable se lete hain - production aur development ke liye flexible
// 5. Production Best Practice: process.env.PORT use karna zaroori hai - hosting platforms automatically set karte hain
// 
// ============================================================================
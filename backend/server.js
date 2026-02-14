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

// PORT environment variable se le rahe hain, nahi mila to default 5000 use hoga
// Kyun environment variable? - Production mein hosting platform (Heroku, AWS, etc.) apna PORT provide karta hai
// Development mein .env file se PORT load hota hai (dotenv app.js mein already configured hai)
// Fallback value (5000) development ke liye default port hai - agar .env mein PORT define nahi kiya to ye use hoga
const PORT = process.env.PORT || 5000;

// ============================================================================
// STEP 3: HTTP Server Start Kar Rahe Hain
// ============================================================================

// app.listen() se HTTP server start hota hai - ye Express ka built-in method hai
// PORT pe server listen karega - incoming requests accept karega
// Callback function execute hota hai jab server successfully start ho jata hai
// Production-ready: NODE_ENV check karke environment-specific message dikha rahe hain
// 0.0.0.0 se bind karke network se bhi accessible ho jayega
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

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIP}:${PORT}`);
  console.log(`✅ API Health Check: http://localhost:${PORT}/api/health`);
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
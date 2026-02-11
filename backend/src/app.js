/**
 * Main Application File (app.js)
 * 
 * Ye file hamare Express application ka central hub hai - yahan sab kuch connect hota hai
 * Clean Architecture follow karte hue, ye file sirf configuration aur setup handle karti hai
 * Actual server start karna alag file (server.js) mein hoga - isse testing aur flexibility milti hai
 */

// ============================================================================
// STEP 1: Core Libraries Import Kar Rahe Hain
// ============================================================================

// Express import - ye hamara main web framework hai, HTTP requests handle karne ke liye
// Express ko import karne se humein app instance banane ka method milta hai
const express = require('express');

// dotenv import - environment variables ko .env file se load karne ke liye
// Security ke liye zaroori: database passwords, API keys, port numbers .env mein rakhte hain
// Production aur development ke liye alag-alag configurations easily manage kar sakte hain
require('dotenv').config();

// CORS import - Cross-Origin Resource Sharing enable karne ke liye
// Frontend (React) alag port/domain pe chal raha hoga, iske bina browser requests block kar dega
// Ye middleware frontend se backend ko requests karne ki permission deta hai
const cors = require('cors');

// Morgan import (optional) - HTTP request logging ke liye
// Development mein helpful hota hai - console mein har request ki details dikh jati hain
// Production mein bhi enable kar sakte hain logging ke liye
const morgan = require('morgan');

// ============================================================================
// STEP 2: Database Connection Import
// ============================================================================

// Database connection config ko import kar rahe hain
// Database connection app start hone se pehle initialize hona chahiye taaki routes se pehle ready ho
// config/database.js file mein MySQL connection setup hoga
const { connectDatabase } = require('./config/database');

// ============================================================================
// STEP 3: Route Files Import Kar Rahe Hain
// ============================================================================

// Routes folder se different route modules import kar rahe hain
// Har route file apne related endpoints define karti hai (e.g., /api/auth, /api/session)
// Routes → Controllers → Services → Database - ye hamara request flow hai
const authRoutes = require('./routes/auth/auth.routes');
const sessionRoutes = require('./routes/session/session');
const attendanceRoutes = require('./routes/attendance/attendance');
// QR request routes - QR code generation aur validation ke liye
const qrRequestRoutes = require('./routes/qr-request/qr-request.routes');
// OTP routes - Password reset OTP functionality ke liye
const otpRoutes = require('./routes/otp/otp.routes');


// ============================================================================
// STEP 4: Error Handling Middleware Import
// ============================================================================

// Global error handler middleware import kar rahe hain
// Ye middleware sab routes ke baad use hota hai - koi bhi error catch karne ke liye
// middleware/error.middleware.js file mein error handling logic hoga
const { errorHandler } = require('./middleware/error.middleware');

// ============================================================================
// STEP 5: Express App Instance Create Kar Rahe Hain
// ============================================================================

// express() function call se ek app instance create hota hai
// Ye instance hamara main application object hai - ispe saare routes aur middleware mount honge
// Single instance maintain karna best practice hai - multiple instances se confusion hota hai
const app = express();

// ============================================================================
// STEP 6: Global Middlewares Setup Kar Rahe Hain
// ============================================================================

// Middleware kya hai? - Ye functions hote hain jo request aur response ke beech mein execute hote hain
// Request aane se pehle aur response jaane se pehle inki processing hoti hai
// Global middleware sab routes pe automatically apply hota hai

// CORS middleware - Cross-Origin requests allow karne ke liye
// Frontend (React) alag port pe chalega (e.g., localhost:3000), backend alag (e.g., localhost:5000)
// Browser security ke wajah se alag origins se requests block ho sakte hain
// CORS middleware headers add karke frontend ko backend access karne ki permission deta hai
app.use(cors());

// express.json() middleware - JSON request body ko parse karne ke liye
// Frontend se JSON data aata hai (e.g., login credentials) - ye middleware use parse karke req.body mein daalta hai
// Bina iske req.body undefined rahega - isliye zaroori hai
app.use(express.json());

// express.urlencoded() middleware - URL-encoded data ko parse karne ke liye
// Form submissions mein URL-encoded format hota hai (e.g., email=user@example.com&password=123)
// Ye middleware is format ko parse karke req.body mein object banata hai
// extended: true ka matlab hai ki nested objects bhi parse ho sakte hain
app.use(express.urlencoded({ extended: true }));

// Morgan middleware - HTTP request logging ke liye (development mein helpful)
// Console mein har request ki details dikh jayengi: method (GET/POST), URL, status code, response time
// 'dev' format simple aur readable output deta hai
// Production mein 'combined' ya 'tiny' format use kar sakte hain
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================================
// STEP 7: Database Connection Initialize Kar Rahe Hain
// ============================================================================

// Database connection app start hone se pehle initialize karni chahiye
// Kyun zaroori hai? - Routes se pehle database ready honi chahiye, warna queries fail ho jayengi
// connectDatabase() function config/database.js file se aata hai - ye MySQL connection establish karta hai
// Error handling connectDatabase() function ke andar hi hogi - yahan bas call karte hain
connectDatabase();

// ============================================================================
// STEP 8: Health Check Route - Application Status Check Karne Ke Liye
// ============================================================================

// Health check route - ye route check karti hai ki application properly chal raha hai ya nahi
// Production mein zaroori hai - monitoring tools (e.g., Uptime Robot) is endpoint ko check karte hain
// Agar application down hai ya database connect nahi hai, to status code se pata chal jayega
// Frontend bhi application start karte time is route ko check kar sakta hai
app.get('/api/health', (req, res) => {
  // Simple JSON response return kar rahe hain - status: 'ok' means sab kuch theek hai
  res.status(200).json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// STEP 9: Main API Routes Connect Kar Rahe Hain
// ============================================================================

// Routes ko mount kar rahe hain - har route file apne endpoints define karti hai
// Route structure: /api/{resource} (e.g., /api/auth, /api/session, /api/attendance)
// Request flow samjho:
// 1. Frontend se request aata hai → /api/auth/login (POST request)
// 2. authRoutes middleware catch karta hai (kyunki /api/auth se start hota hai)
// 3. routes/auth.routes.js file mein specific route handler hai → login controller call hota hai
// 4. controllers/auth.controller.js mein login function execute hota hai
// 5. Controller authService.login() call karta hai (business logic service mein hai)
// 6. services/auth.service.js database query execute karta hai
// 7. Response wapas controller → route → frontend ko jaata hai

// Authentication routes - login, logout, getCurrentUser, register jaisi endpoints
// Example endpoints: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
app.use('/api/auth', authRoutes);

// Session routes - QR code sessions create, update, delete karne ke liye
// Example endpoints: POST /api/session, GET /api/session/:id, PUT /api/session/:id
app.use('/api/session', sessionRoutes);

// Attendance routes - attendance mark karne, view karne ke liye
// Example endpoints: POST /api/attendance, GET /api/attendance, GET /api/attendance/:id
app.use('/api/attendance', attendanceRoutes);
// QR request routes - QR code generation aur validation ke liye
// Example endpoints: POST /api/qr-request/generate, POST /api/qr-request/validate
app.use('/api/qr-request', qrRequestRoutes);
// OTP routes - Password reset OTP functionality ke liye
// Example endpoints: POST /api/otp/send, POST /api/otp/verify, POST /api/otp/reset-password
app.use('/api/otp', otpRoutes);


// ============================================================================
// STEP 10: 404 Handler - Unknown Routes Ke Liye
// ============================================================================

// 404 handler - agar koi route match nahi karti to ye middleware execute hota hai
// Kyun zaroori hai? - User galat URL pe request kare to proper error message mile
// Bina iske Express default 404 HTML page dikhata hai - JSON response better hai API ke liye
// Ye middleware sab routes ke BAAD likhna zaroori hai - Express routes top-to-bottom check karta hai
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'The requested endpoint does not exist'
  });
});

// ============================================================================
// STEP 11: Global Error Handling Middleware
// ============================================================================

// Global error handler - ye middleware sab routes aur controllers se aane wali errors catch karta hai
// Kyun zaroori hai? - Har controller mein try-catch likhne se accha centralized error handling
// Controllers se error throw hone par (next(error) call karne se) ye middleware automatically execute hota hai
// Error handler proper status codes, error messages, aur logging handle karta hai
// Ye middleware SABSE LAST mein aana chahiye - Express middlewares sequential execute hote hain
app.use(errorHandler);

// ============================================================================
// STEP 12: Export Express App Instance
// ============================================================================

// App instance ko export kar rahe hain - server.js file mein isko import karke server start karenge
// Kyun separate rakha? - Clean architecture ke liye:
// 1. Testing mein app instance ko import karke test kar sakte hain (bina server start kiye)
// 2. Server start logic alag file mein hota hai - code organization better hota hai
// 3. Multiple servers (HTTP, HTTPS) easily configure kar sakte hain
// 4. App configuration aur server startup logic separate rehte hain - maintainability better

module.exports = app;

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
// 
// 1. Server start karna: server.js file mein app.listen() call hoga
// 2. Request Flow: Frontend → Route → Controller → Service → Database → Service → Controller → Frontend
// 3. Middleware Order Matters: Global middlewares pehle, routes beech mein, error handler last
// 4. Database Connection: App start se pehle initialize honi chahiye
// 5. Environment Variables: .env file mein PORT, DB_HOST, DB_USER, etc. define karni chahiye
// 6. Error Handling: Try-catch controllers mein, global handler sab errors catch karta hai
// 
// ============================================================================


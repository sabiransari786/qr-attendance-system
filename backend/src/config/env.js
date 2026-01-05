/**
 * Environment Variables Configuration File (env.js)
 * 
 * Ye file application ke saare environment variables ko centralize karti hai
 * Ek jagah se sab configuration values manage karte hain - maintainability better hoti hai
 * Process.env se directly access karne ki jagah is file ko use karte hain
 */

// ============================================================================
// KYUN YE FILE ZAROORI HAI? (Why This File is Important)
// ============================================================================

/**
 * Environment Variables Kya Hain?
 * - Environment variables application ke configuration values hote hain
 * - Database credentials, API keys, port numbers, etc. - ye sab sensitive data hai
 * - Code mein hardcode nahi karte security aur flexibility ke liye
 * - Different environments (development, production) ke liye alag values use hote hain
 * 
 * .env File Kyun Use Karte Hain?
 * - .env file mein environment variables store karte hain
 * - Git ignore hoti hai - sensitive data GitHub pe nahi jata
 * - Team members apni local .env file bana sakte hain
 * - Production mein server environment variables set karte hain (not .env file)
 * 
 * Directly process.env Use Karna Kyun Bad Practice Hai?
 * - Code duplication - har file mein process.env.DB_HOST, process.env.PORT likhna padega
 * - Typos se bugs - process.env.DB_HST (typo) undefined return karega, error detect mushkil
 * - Default values har jagah define karna padega - code messy ho jayega
 * - Type conversion issues - process.env se string aata hai, number chahiye to parseInt() har jagah
 * - Validation missing - agar required variable missing hai to error dheere pata chalega
 * - No centralization - sab configuration values kahan use ho rahi hain, track karna mushkil
 * 
 * Ye File Kaise Help Karti Hai?
 * - Single source of truth - sab configuration ek jagah se aati hai
 * - Type safety - strings ko numbers mein convert kar dete hain yahan
 * - Default values - safe defaults set kar sakte hain development ke liye
 * - Validation - required variables check kar sakte hain
 * - Easy refactoring - variable name change karna ho to sirf yahan change karo
 * - Better IDE support - autocomplete aur type checking better hoti hai
 * - Development vs Production - easily different values handle kar sakte hain
 */

// ============================================================================
// ENVIRONMENT CONFIGURATION OBJECT
// ============================================================================

/**
 * Config object - sab environment variables ko structured format mein export karta hai
 * Har file mein is object ko import karke use karenge - process.env directly nahi
 * 
 * Usage Example:
 * const config = require('./config/env');
 * const port = config.PORT; // process.env.PORT nahi
 */

const config = {
  // ============================================================================
  // SERVER CONFIGURATION
  // ============================================================================

  // Node.js environment mode - 'development', 'production', ya 'test'
  // Development mein detailed errors dikhte hain, production mein minimal
  // process.env.NODE_ENV se aata hai, default 'development' hai
  // Production mein set karna zaroori hai - performance optimizations ke liye
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Server port number - application isi port pe listen karega
  // Default 5000 development ke liye - production mein alag port set karna chahiye
  // parseInt() se string ko number mein convert kar rahe hain - process.env se string aata hai
  // Port number har environment mein alag ho sakta hai - flexibility ke liye
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // ============================================================================
  // DATABASE CONFIGURATION
  // ============================================================================

  // Database host address - MySQL server ka address
  // Development mein usually 'localhost', production mein actual IP ya domain
  // Default 'localhost' development ke liye safe hai
  DB_HOST: process.env.DB_HOST || 'localhost',

  // Database port number - MySQL default port 3306 hai
  // ParseInt() se string ko number mein convert kar rahe hain
  // Default 3306 MySQL standard port hai - usually change nahi karna padta
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,

  // Database user name - MySQL user jo database access kar sakta hai
  // Required field hai - default nahi de sakte security ke liye
  // Production mein separate user banate hain limited permissions ke saath
  DB_USER: process.env.DB_USER,

  // Database password - MySQL user ka password
  // Required field hai - default nahi de sakte security ke liye
  // .env file mein define karna zaroori hai - hardcode kabhi nahi karna
  DB_PASSWORD: process.env.DB_PASSWORD,

  // Database name - MySQL database ka naam jisme tables honge
  // Required field hai - application ka data isi database mein store hoga
  // Development aur production mein alag database names use karte hain
  DB_NAME: process.env.DB_NAME,

  // Database connection pool limit - maximum kitne connections pool mein rakh sakte hain
  // Default 10 connections - small-medium applications ke liye sufficient
  // Production mein server capacity ke hisab se adjust karna chahiye
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
};

// ============================================================================
// VALIDATION (Optional but Recommended)
// ============================================================================

/**
 * Required Variables Validation
 * 
 * Production mein required variables check karte hain - missing ho to error throw karte hain
 * Development mein bhi check karna better hai - early error detection
 * 
 * Note: Ye validation optional hai - agar aap chahte hain ki missing variables se app crash ho
 * to is validation ko enable kar sakte hain
 */

// Required variables ki list - in values hone zaroori hain
const requiredVariables = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];

// Check kar rahe hain ki required variables present hain ya nahi
// Production environment mein validation strict honi chahiye
if (config.NODE_ENV === 'production') {
  const missingVariables = requiredVariables.filter(variable => {
    // process.env se direct check kar rahe hain - config object mein undefined ho sakta hai
    return !process.env[variable];
  });

  // Agar koi required variable missing hai to error throw karte hain
  if (missingVariables.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '✗ Missing required environment variables:');
    missingVariables.forEach(variable => {
      console.error(`  - ${variable}`);
    });
    console.error('\nPlease set these variables in your environment or .env file\n');
    // Process exit kar rahe hain - application start nahi karna chahiye agar config missing hai
    process.exit(1);
  }
}

// ============================================================================
// EXPORT CONFIGURATION OBJECT
// ============================================================================

/**
 * Config object ko export kar rahe hain
 * 
 * Usage in other files:
 * const config = require('./config/env');
 * 
 * Examples:
 * - const port = config.PORT;
 * - const dbHost = config.DB_HOST;
 * - if (config.NODE_ENV === 'development') { ... }
 * 
 * Benefits:
 * - Single import - ek bar import karo, sab values available
 * - Type safety - numbers already converted ho chuke hain
 * - Default values - missing variables ke liye safe defaults milte hain
 * - Centralized - sab configuration ek jagah se manage hoti hai
 */

module.exports = config;

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
//
// 1. .env File Structure (.env file mein ye variables define karni chahiye):
//    PORT=5000
//    NODE_ENV=development
//    DB_HOST=localhost
//    DB_PORT=3306
//    DB_USER=your_db_user
//    DB_PASSWORD=your_db_password
//    DB_NAME=attendance_tracker
//    DB_CONNECTION_LIMIT=10
//
// 2. Production Environment:
//    - Production mein .env file use nahi karte usually
//    - Server environment variables directly set karte hain
//    - Heroku, AWS, etc. platforms environment variables set karne ka option dete hain
//
// 3. Development Environment:
//    - .env file root directory mein create karni chahiye
//    - dotenv package automatically .env file ko load kar deta hai
//    - .env file git ignore hoti hai - GitHub pe commit nahi hoti
//
// 4. Usage Best Practices:
//    - Har file mein: const config = require('./config/env');
//    - process.env directly use mat karo - config object use karo
//    - Type conversion already ho chuka hai - direct use kar sakte hain
//
// 5. Security:
//    - Kabhi bhi .env file ko git commit mat karo
//    - Production credentials alag rakho
//    - Team members ko .env.example file provide karo (without actual values)
//
// ============================================================================


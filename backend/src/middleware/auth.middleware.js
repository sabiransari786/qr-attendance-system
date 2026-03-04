/**
 * Authentication Middleware (auth.middleware.js)
 *
 * Ye middleware har protected route ke beech mein gatekeeper ki tarah kaam karega.
 * Iska kaam hai:
 *  - Request ke Authorization header se JWT (JSON Web Token) read karna
 *  - Token ka format validate karna ("Bearer <token>")
 *  - Token verify karke user ka data decode karna
 *  - Verified user ko `req.user` pe attach karna taaki aage ke layers (controllers/services)
 *    is user information ko use kar sakein
 *
 * IMPORTANT:
 *  - Ye middleware sirf authentication handle karega (user ki identity verify karega)
 *  - Authorization / business logic (kaun kya kar sakta hai) services/controllers mein hoga
 */

const jwt = require('jsonwebtoken');

/**
 * Express Middleware: JWT Authentication
 *
 * Signature: (req, res, next)
 *  - req: Incoming HTTP request
 *  - res: HTTP response object
 *  - next: Next middleware/handler ko call karne ke liye function
 *
 * Ye middleware async ka use nahi kar raha directly, kyunki `jwt.verify` ko hum
 * sync mode mein use kar rahe hain. Agar aap chaho to isse promisify karke
 * async/await bhi use kar sakte ho, lekin yahan simple aur reliable implementation rakha hai.
 */
const authMiddleware = (req, res, next) => {
  try {
    // =========================================================================
    // 1. Authorization Header Validate Karna
    // =========================================================================
    //
    // HTTP Authorization header ka structure:
    //  - Format: "Authorization: Bearer <JWT_TOKEN>"
    //  - "Bearer" ek scheme hai jo batata hai ki ye bearer token based auth hai
    //    - Bearer token ka matlab: Jiske paas bhi ye token hai, woh as a "bearer"
    //      is token ke basis par authenticated mana jaata hai.
    //      Isliye token ko secret rakhna bahut important hai.
    //
    // Example:
    //  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
    //
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // Agar Authorization header hi nahi mila, to client ne token bheja hi nahi
    //  - Ye case me hum 401 Unauthorized return karenge
    //  - 401 ka matlab: "User authenticated nahi hai / credentials missing/invalid"
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing. Please login and provide a valid Bearer token.'
      });
    }

    // =========================================================================
    // 2. Bearer Token Format Validate Karna
    // =========================================================================
    //
    // Hum expect kar rahe hain ki header ka format ho:
    //  - "Bearer <token>"
    // Yahan:
    //  - "Bearer" = keyword (case-insensitive ideally, lekin yahan hum strict check kar rahe)
    //  - "<token>" = actual JWT string
    //
    const parts = authHeader.split(' ');

    // Header correctly do parts ka hona chahiye: ["Bearer", "<token>"]
    if (parts.length !== 2) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Authorization header format. Expected: Bearer <token>.'
      });
    }

    const [scheme, token] = parts;

    // Scheme "Bearer" hi hona chahiye
    if (scheme !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Authorization scheme must be Bearer.'
      });
    }

    // Token empty nahi hona chahiye
    if (!token || token.trim().length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Bearer token is missing. Please provide a valid token.'
      });
    }

    // =========================================================================
    // 3. JWT Secret Validate Karna
    // =========================================================================
    //
    // JWT ko sign aur verify karne ke liye secret key use hoti hai.
    //  - Ye secret `process.env.JWT_SECRET` mein store honi chahiye
    //  - Agar ye secret hi missing hai, to ye server configuration issue hai,
    //    isliye is case ko hum 500 Internal Server Error treat karenge
    //
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      // Ye developer / DevOps ka issue hai, isliye 500 (server error) dena sahi hai
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured on the server.'
      });
    }

    // =========================================================================
    // 4. JWT Verify & Decode Karna
    // =========================================================================
    //
    // JWT ka role kya hai?
    //  - JWT ek secure token format hai jo teen parts mein divide hota hai:
    //      1. Header  (algorithm & type)
    //      2. Payload (user data / claims)
    //      3. Signature (header + payload ko secret se sign kiya hua hash)
    //  - Jab user login hota hai, server user ka data (e.g. id, role) JWT payload
    //    mein encode karta hai aur secret se sign karta hai.
    //  - Client har request ke saath ye token bhejta hai, aur server signature verify
    //    karke check karta hai ki:
    //      - Token tamper nahi hua
    //      - Token expire nahi hua
    //
    // Token verify kaise hota hai?
    //  - `jwt.verify(token, secret)`:
    //      - Signature ko secret ke saath re-calculate karke match karta hai
    //      - Agar token valid hai aur expire nahi hua, to decoded payload return karta hai
    //      - Agar token invalid/expired hai, to error throw karta hai
    //
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      // Yahan hum specific JWT errors handle karenge taaki sahi HTTP status code bhej sakein

      // Token expire ho chuka hai:
      //  - Ye case mein hum 403 Forbidden denge
      //  - Reason: User ka token pehle valid tha, lekin ab expire ho gaya hai,
      //    isliye access "forbidden" hai jab tak user naya token nahi le aata.
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({
          success: false,
          message: 'Token has expired. Please login again to get a new token.'
        });
      }

      // Invalid token (signature mismatch, malformed token, etc.):
      //  - Ye case mein hum 401 Unauthorized denge
      //  - Reason: Client ne galat / tampered token bheja hai.
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please provide a valid JWT.'
        });
      }

      // Kisi aur unknown JWT related error ke liye generic 401 bhej denge
      return res.status(401).json({
        success: false,
        message: 'Failed to authenticate token.'
      });
    }

    // =========================================================================
    // 5. req.user Pe Authenticated User Attach Karna
    // =========================================================================
    //
    // JWT payload mein generally user ka essential data hota hai:
    //  - e.g. { id: '123', role: 'student', email: 'abc@example.com', ... }
    //
    // Hum decoded payload ko `req.user` pe attach karte hain:
    //  - Ye step isliye important hai kyunki:
    //      1. Controllers / services ko har baar token manually decode nahi karna pade
    //      2. Har protected route easily authenticated user ka data access kar sakta hai
    //         e.g. `req.user.id`, `req.user.role`
    //      3. Future authorization checks (jaise role-based access) req.user se hi honge
    //
    // SECURITY NOTE:
    //  - Yahan hum assume kar rahe hain ki token ka payload safe hai kyunki signature verify ho chuka hai.
    //  - Phir bhi sensitive data (password, etc.) token mein store nahi karna chahiye.
    //
    req.user = decoded;

    // =========================================================================
    // 6. Next Middleware / Controller Ko Call Karna
    // =========================================================================
    //
    // Agar hum yahan tak aa gaye hain, iska matlab:
    //  - Authorization header present tha
    //  - Bearer token format correct tha
    //  - Token valid tha (signature & expiry check pass)
    //  - req.user set ho chuka hai
    //
    // Ab hum request ko next middleware / route handler ko forward kar sakte hain.
    //
    return next();
  } catch (error) {
    // =========================================================================
    // 7. Global Error Handling (Fail-safe)
    // =========================================================================
    //
    // Ye catch block sirf unexpected errors ke liye hai:
    //  - e.g. koi runtime error, environment issue, etc.
    //
    // Aise cases mein hum 500 Internal Server Error return karenge:
    //  - Ye batata hai ki server side pe koi problem aayi hai.
    //
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      // Production-ready systems mein detailed error client ko nahi bhejna chahiye.
      // Lekin development mein debugging ke liye useful ho sakta hai.
      // Aap isko environment ke hisaab se conditionally bhi send kar sakte ho.
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================================================
// ROLE-BASED ACCESS GUARDS
// =============================================================================

/**
 * Allow only users whose role === 'faculty'.
 * Must be used AFTER authMiddleware so req.user is set.
 */
const requireFaculty = (req, res, next) => {
  if (!req.user || req.user.role !== 'faculty') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only faculty members can perform this action.'
    });
  }
  next();
};

/**
 * Allow only users whose role === 'student'.
 * Must be used AFTER authMiddleware so req.user is set.
 */
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only students can perform this action.'
    });
  }
  next();
};

/**
 * Allow only users whose role === 'admin'.
 * Must be used AFTER authMiddleware so req.user is set.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can perform this action.'
    });
  }
  next();
};

module.exports = authMiddleware;
module.exports.requireFaculty = requireFaculty;
module.exports.requireStudent = requireStudent;
module.exports.requireAdmin   = requireAdmin;
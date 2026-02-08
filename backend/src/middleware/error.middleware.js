/**
 * Global Error Handling Middleware (error.middleware.js)
 *
 * Ye middleware poore application ke liye CENTRAL error handler hai.
 *
 * Global error middleware kya hota hai?
 *  - Express mein jab bhi kisi route/controller/service/middleware mein error throw hota hai
 *    (e.g. `throw new Error()` ya `next(error)`), wo end mein isi middleware tak bubble ho kar aata hai.
 *  - Ye ek centralized jagah hai jahan hum:
 *      - Different types of errors ko identify karte hain
 *      - Unke liye proper HTTP status codes set karte hain
 *      - consistent JSON error response bhejte hain
 *
 * Ye middleware last me kyu aata hai?
 *  - Express request-response cycle mein middlewares order-wise execute hote hain.
 *  - Saare routes, controllers, aur normal middlewares ke baad hi
 *    ye error-handling middleware register kiya jata hai.
 *  - Iska reason ye hai ki:
 *      - Koi bhi upar ke layer mein error aaye to wo `next(error)` ke through
 *        last error handler tak pahunch sake.
 *      - Agar error handler beech mein hoga to kuch errors us tak pahunch hi nahi paayenge.
 *
 * Express Error Handling Middleware Signature:
 *  - Normal middleware: (req, res, next)
 *  - Error middleware:  (err, req, res, next)
 *  - Signature mein 4 parameters hone chahiye tabhi Express ise error handler samjhega.
 */

const errorMiddleware = (err, req, res, next) => {
    // ===========================================================================
    // 1. Defensive Programming: Fallback Error Object
    // ===========================================================================
    //
    // Kabhi-kabhi unexpected situations mein `err` null/undefined bhi aa sakta hai
    // (ya koi strange value ho sakti hai).
    // Defensive programming ka matlab hai:
    //  - Hum aise cases ke liye bhi ready rahein
    //  - Server kabhi crash/terminate na ho
    //
    const safeError = err || {};
  
    // ===========================================================================
    // 2. err Object me kya-kya hota hai?
    // ===========================================================================
    //
    // Typical Error object properties:
    //  - message     : Human readable error message (e.g. "User not found")
    //  - name        : Error type (e.g. "Error", "ValidationError", "JsonWebTokenError")
    //  - stack       : Stack trace (development/debugging ke liye useful)
    //
    // Custom application errors additional properties:
    //  - statusCode  : HTTP status code (e.g. 400, 401, 403, 404, 500)
    //  - code        : Custom error code (e.g. "VALIDATION_ERROR", "AUTH_ERROR")
    //  - details     : Extra data / validation errors ka array/object
    //
    // Validation libraries (e.g. Joi, Mongoose) bhi custom structure use kar sakte hain.
    //
  
    // ---------------------------------------------------------------------------
    // 2.a. Base Status Code & Message Extract Karna
    // ---------------------------------------------------------------------------
    //
    // statusCode ka role:
    //  - Client ko batata hai ki error ka type kya hai:
    //      400: Bad Request          (client ne galat data bheja)
    //      401: Unauthorized         (login / token issue)
    //      403: Forbidden            (access allowed nahi)
    //      404: Not Found            (resource exist nahi karta)
    //      500: Internal Server Error (server ke andar kuch galat hua)
    //
    // Controllers/services custom errors throw kar sakte hain:
    //  - e.g. `throw { statusCode: 400, message: 'Invalid input' }`
    //
    let statusCode =
      safeError.statusCode ||
      safeError.status || // kuch libraries `status` property use karti hain
      500; // default fallback: internal server error
  
    let message =
      safeError.message ||
      'Something went wrong. Please try again later.';
  
    // ===========================================================================
    // 3. Specific Error Types Identify Karna
    // ===========================================================================
    //
    // Yahan hum common error types ke liye specific handling kar rahe hain
    // taaki proper HTTP status code set ho sake.
    //
  
    // ---------------------------------------------------------------------------
    // 3.a. Validation Errors (Bad Request - 400)
    // ---------------------------------------------------------------------------
    //
    // Possibilities:
    //  - Mongoose ValidationError (err.name === 'ValidationError')
    //  - Custom validation error (err.code === 'VALIDATION_ERROR')
    //
    if (
      safeError.name === 'ValidationError' ||
      safeError.code === 'VALIDATION_ERROR'
    ) {
      statusCode = 400;
  
      // Agar detailed validation errors available hain to unko human readable
      // message mein convert karne ki koshish karenge.
      if (safeError.errors && typeof safeError.errors === 'object') {
        // Example: Mongoose ValidationError ke errors object se messages collect karna
        const fieldErrors = Object.values(safeError.errors)
          .map((e) => e.message)
          .filter(Boolean);
  
        if (fieldErrors.length > 0) {
          message = fieldErrors.join(', ');
        } else {
          // Agar specific messages nahi mile to generic message
          message = message || 'Validation failed for the provided data.';
        }
      } else if (safeError.details && Array.isArray(safeError.details)) {
        // Example: Joi validation ke details array se messages nikalna
        const detailMessages = safeError.details
          .map((d) => d.message)
          .filter(Boolean);
  
        if (detailMessages.length > 0) {
          message = detailMessages.join(', ');
        }
      } else {
        // Generic fallback validation message
        message = message || 'Invalid request data.';
      }
    }
  
    // ---------------------------------------------------------------------------
    // 3.b. Authentication / Authorization Errors (401 / 403)
    // ---------------------------------------------------------------------------
    //
    // Authentication (401 Unauthorized):
    //  - User properly authenticated nahi hai (login nahi kiya ya token invalid hai)
    //
    // Authorization (403 Forbidden):
    //  - User authenticated hai, lekin uske paas required permissions/role nahi hai.
    //
    if (
      safeError.name === 'JsonWebTokenError' ||
      safeError.code === 'AUTH_ERROR' ||
      statusCode === 401
    ) {
      statusCode = 401;
      message =
        message ||
        'Authentication failed. Please login and provide valid credentials.';
    }
  
    if (
      safeError.name === 'TokenExpiredError' ||
      safeError.code === 'FORBIDDEN' ||
      statusCode === 403
    ) {
      statusCode = 403;
      message =
        message ||
        'Access forbidden. You do not have permission to perform this action.';
    }
  
    // ---------------------------------------------------------------------------
    // 3.c. Not Found Errors (404)
    // ---------------------------------------------------------------------------
    //
    // Kai baar controllers/services 404 throw karte hain:
    //  - e.g. `throw { statusCode: 404, message: 'User not found' }`
    // Yahan hum sirf ensure kar rahe hain ki message friendly ho.
    //
    if (statusCode === 404) {
      message = message || 'Resource not found.';
    }
  
    // ---------------------------------------------------------------------------
    // 3.d. Default / Unknown Server Errors (500)
    // ---------------------------------------------------------------------------
    //
    // Agar koi specific type match nahi hua (ya statusCode missing tha)
    // to hum 500 Internal Server Error assume karenge.
    //
    if (
      statusCode < 400 || // agar kisi ne galti se 2xx/3xx set kar diya
      statusCode > 599    // invalid range
    ) {
      statusCode = 500;
    }
  
    if (statusCode === 500 && !message) {
      message = 'Internal server error. Please try again later.';
    }
  
    // ===========================================================================
    // 4. Production vs Development Error Response Difference
    // ===========================================================================
    //
    // Production environment:
    //  - Users ko sirf necessary information dikhani chahiye
    //  - Detailed stack traces / internal details leak nahi karne chahiye
    //
    // Development environment:
    //  - Developers ko debugging ke liye zyada information useful hoti hai
    //  - Isliye hum stack trace, error name, original error object ke parts bhej sakte hain
    //
    // Hum `process.env.NODE_ENV` ka use karenge:
    //  - 'production'    -> minimal safe response
    //  - 'development'   -> detailed debug info
    //  - koi aur / undefined -> development jaisa treat kar sakte hain (optional)
    //
    const isProduction = process.env.NODE_ENV === 'production';
  
    // Base response structure (requirement ke hisaab se):
    const errorResponse = {
      success: false,
      message: message
    };
  
    // Sirf development mein debug information add karenge
    if (!isProduction) {
      // Ye debug info diploma-level student ko bhi samajh mein aayegi ki:
      //  - Kaunse type ka error tha (name)
      //  - HTTP status code kya gaya
      //  - Stack trace se pata chalega error kahaan se originate hua
      errorResponse.debug = {
        name: safeError.name || 'Error',
        statusCode,
        // Original error ka code agar present ho to:
        code: safeError.code,
        // Stack trace: sirf string hogi; agar available nahi hai to undefined rehne do
        stack: safeError.stack,
        // Extra details agar developer ne provide ki hain:
        details: safeError.details || safeError.errors || undefined
      };
    }
  
    // ===========================================================================
    // 5. Never Crash the Server & Headers Already Sent Check
    // ===========================================================================
    //
    // Kabhi-kabhi aisa hota hai ki:
    //  - Response headers already send ho chuke hote hain
    //  - Uske baad error throw ho jata hai
    //
    // Aise case mein dobara res.status().json() call karna allowed nahi hota,
    // warna Express warning dega.
    //
    // Isliye defensive check karte hain:
    //
    if (res.headersSent) {
      // Agar headers already send ho chuke hain, to hum next error handler ko
      // call kar dete hain (ya Express ka default handler handle karega).
      return next(err);
    }
  
    // Optional: Server-side logging (console.error) - external logging library use nahi kar rahe.
    // Ye sirf server console mein dikhai dega, client ko nahi.
    if (!isProduction) {
      // Development mein detailed logging useful hai
      // eslint-disable-next-line no-console
      console.error('Global Error Middleware:', {
        message: safeError.message,
        name: safeError.name,
        statusCode,
        stack: safeError.stack
      });
    }
  
    // ===========================================================================
    // 6. Final JSON Error Response
    // ===========================================================================
    //
    // Yahan hum client ko consistent JSON structure bhej rahe hain:
    //  {
    //    success: false,
    //    message: "Human readable error message",
    //    debug: { ... } // sirf development mein
    //  }
    //
    return res.status(statusCode).json(errorResponse);
  };
  
  module.exports = { errorHandler: errorMiddleware };
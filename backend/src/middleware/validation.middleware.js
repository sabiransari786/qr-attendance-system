/**
 * Request Validation Middleware (validation.middleware.js)
 *
 * Ye middleware har incoming HTTP request ke data ko validate karega
 *  - Validation ka role: Ensure karega ki controller / service tak sirf clean,
 *    expected format wala data hi पहुंचे.
 *  - Isse:
 *      - Bugs kam hote hain
 *      - Security improve hoti hai (unexpected / malicious input filter ho jata hai)
 *      - Controllers simple aur business logic-focused rehte hain
 *
 * Layered Architecture mein position:
 *  routes → middleware (yahi file) → controllers → services → models
 *
 * Important Concepts:
 *  - req.body  : Request body data (mostly POST/PUT/PATCH ke liye, JSON payload)
 *  - req.params: URL path parameters (e.g. /users/:id -> req.params.id)
 *  - req.query : URL ke ? ke baad wale query parameters (e.g. ?page=1&limit=10)
 *
 * Early validation kyu important hai?
 *  - Agar hum galat / missing data ko controller tak pahunchne se pehle hi
 *    reject kar dein, to:
 *      - Business logic simple rehta hai
 *      - Error handling consistent rehti hai
 *      - Database level par unnecessary queries avoid ho jati hain
 *      - Performance better hoti hai
 *
 * Usage Example (routes mein):
 *
 *  const validate = require('./middleware/validation.middleware');
 *
 *  router.post(
 *    '/login',
 *    validate({
 *      body: {
 *        email:    { required: true, type: 'email' },
 *        password: { required: true, type: 'string', minLength: 6 }
 *      }
 *    }),
 *    authController.login
 *  );
 *
 * Error Response Format (consistent across app):
 *  {
 *    success: false,
 *    message: "Validation failed",
 *    errors: [
 *      { field: "email", message: "Email is required" },
 *      { field: "password", message: "Password must be at least 6 characters long" }
 *    ]
 *  }
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Basic email validation regex:
 *  - Ye simple level ka regex hai jo basic email format check karta hai:
 *      - kuch characters @ kuch characters . kuch characters
 *  - Production apps mein advanced validation bhi ho sakti hai,
 *    lekin backend level pe basic format check kaafi hota hai.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether a value is considered "present" for required validation.
 *
 * Required check ka logic:
 *  - null or undefined => NOT present
 *  - Empty string ("") => NOT present
 *  - Baaki values present maane jayenge (0, false, etc. allowed hain)
 */
const isValuePresent = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim().length === 0) return false;
  return true;
};

/**
 * Type checking helper:
 *  - Allowed types: 'string', 'number', 'boolean', 'email'
 *  - 'email' ko internally string + email regex ke saath validate kiya jayega
 */
const isTypeValid = (value, expectedType) => {
  if (!isValuePresent(value)) return true; // Agar value hi nahi (aur required nahi hai) to type check skip

  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      // Note: req.query/params hamesha string aate hain, lekin
      // agar expectedType 'number' hai to hum check kar sakte hain
      // ki kya yeh numeric string hai jo number me convert ho sakta hai.
      if (typeof value === 'number') return true;
      if (typeof value === 'string') return !Number.isNaN(Number(value));
      return false;
    case 'boolean':
      // Boolean ke liye:
      //  - actual boolean (true/false)
      //  - string 'true' / 'false' bhi allow kar sakte hain (optional decision)
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === 'false';
      }
      return false;
    case 'email':
      return typeof value === 'string' && EMAIL_REGEX.test(value);
    default:
      // Agar unknown type diya gaya ho to hum type check skip kar denge
      // (defensive approach - middleware crash nahi hona chahiye)
      return true;
  }
};

/**
 * String length validation helper:
 *  - Sirf string type ke liye minLength / maxLength apply honge
 */
const validateStringLength = (value, rules) => {
  if (!isValuePresent(value)) return { valid: true };

  if (typeof value !== 'string') {
    // Agar string nahi hai to yeh kaam type check ka hai,
    // length validation yahan silent rahega (main error type check se aayega).
    return { valid: true };
  }

  const { minLength, maxLength } = rules;
  const length = value.trim().length;

  if (typeof minLength === 'number' && length < minLength) {
    return {
      valid: false,
      message: `Must be at least ${minLength} characters long`
    };
  }

  if (typeof maxLength === 'number' && length > maxLength) {
    return {
      valid: false,
      message: `Must be at most ${maxLength} characters long`
    };
  }

  return { valid: true };
};

// ============================================================================
// Main Validation Middleware Factory
// ============================================================================

/**
 * validate(schema)
 *
 * Ye ek HIGHER-ORDER function hai jo:
 *  - Schema ko input leta hai (rules jo routes se pass honge)
 *  - Ek Express middleware function return karta hai
 *
 * Schema structure example:
 *  {
 *    body: {
 *      email:    { required: true, type: 'email' },
 *      password: { required: true, type: 'string', minLength: 6 }
 *    },
 *    params: {
 *      userId: { required: true, type: 'string' }
 *    },
 *    query: {
 *      page:  { required: false, type: 'number' },
 *      limit: { required: false, type: 'number' }
 *    }
 *  }
 *
 * Iska benefit:
 *  - Middleware generic aur reusable ho jata hai
 *  - Har route apna custom validation schema define kar sakta hai
 */
const validate = (schema = {}) => {
  /**
   * Actual Express middleware: (req, res, next)
   *
   * Yahi function har request pe execute hoga.
   * Ye:
   *  - req.body / req.params / req.query ko schema ke against validate karega
   *  - Agar errors mile to 400 response bhejega
   *  - Agar sab sahi ho to next() call karega
   */
  return (req, res, next) => {
    // Defensive programming: Agar schema missing/invalid ho,
    // to request ko bina validation ke aage allow kar do.
    if (!schema || typeof schema !== 'object') {
      return next();
    }

    const errors = [];

    /**
     * Internal helper: given ek source (body/params/query) ka data aur schema,
     * usko validate karo aur errors array mein push karo.
     *
     * - sourceName: 'body' | 'params' | 'query' (sirf error messages aur logging ke liye)
     * - data: actual object (req[sourceName])
     * - rules: schema[sourceName]
     */
    const validateSource = (sourceName, data, rules) => {
      if (!rules || typeof rules !== 'object') return;

      // Unknown fields ko ignore karna hai:
      //  - Iska matlab: sirf un fields ko validate karo jo schema mein defined hain.
      Object.keys(rules).forEach((fieldName) => {
        const fieldRules = rules[fieldName] || {};

        // Unknown / invalid rule object ko skip kar do (defensive)
        if (typeof fieldRules !== 'object') return;

        const value = data ? data[fieldName] : undefined;

        // -------------------------------
        // 1. Required Field Validation
        // -------------------------------
        if (fieldRules.required && !isValuePresent(value)) {
          // Field required hai lekin value missing/empty hai
          errors.push({
            field: fieldName,
            message: `${capitalize(fieldName)} is required`
          });
          return; // is field ke liye aage ke checks skip
        }

        // Agar value present hi nahi hai aur required bhi nahi tha,
        // to type/minLength/maxLength jaise checks skip kar sakte hain.
        if (!isValuePresent(value)) {
          return;
        }

        // -------------------------------
        // 2. Type Validation
        // -------------------------------
        if (fieldRules.type && !isTypeValid(value, fieldRules.type)) {
          let typeMessage;

          switch (fieldRules.type) {
            case 'string':
              typeMessage = `${capitalize(fieldName)} must be a string`;
              break;
            case 'number':
              typeMessage = `${capitalize(fieldName)} must be a valid number`;
              break;
            case 'boolean':
              typeMessage = `${capitalize(
                fieldName
              )} must be a boolean (true/false)`;
              break;
            case 'email':
              typeMessage = `${capitalize(fieldName)} must be a valid email address`;
              break;
            default:
              typeMessage = `${capitalize(fieldName)} is invalid`;
          }

          errors.push({
            field: fieldName,
            message: typeMessage
          });

          // Type incorrect hai to length validation ka koi meaning nahi,
          // isliye yahin return kar dete hain.
          return;
        }

        // -------------------------------
        // 3. String Length Validation
        // -------------------------------
        const lengthValidation = validateStringLength(value, fieldRules);
        if (!lengthValidation.valid) {
          errors.push({
            field: fieldName,
            message: `${capitalize(fieldName)} ${lengthValidation.message}`
          });
        }
      });
    };

    try {
      // schema.body ke rules ko req.body pe apply karo
      validateSource('body', req.body, schema.body);

      // schema.params ke rules ko req.params pe apply karo
      validateSource('params', req.params, schema.params);

      // schema.query ke rules ko req.query pe apply karo
      validateSource('query', req.query, schema.query);
    } catch (validationError) {
      // Agar hamare validation logic me hi koi unexpected error aa jaye,
      // to hum server crash nahi hone denge.
      // Instead, generic 400 Bad Request bhejenge.
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'general',
            message: 'Invalid request data format'
          }
        ]
      });
    }

    // Agar koi validation error collect hua hai to 400 response bhejo
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Agar sab validation pass ho gaya to request ko aage controller tak allow karo
    return next();
  };
};

/**
 * Utility: Capitalize first letter for better error messages
 *  - e.g. "email" -> "Email"
 */
const capitalize = (str) => {
  if (typeof str !== 'string' || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

module.exports = validate;
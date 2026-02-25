/**
 * =============================================================================
 * FAULT ISOLATION MIDDLEWARE — HFR8
 * =============================================================================
 *
 * HFR8 Requirement:
 *   "Ek admin service ka failure doosre services ko affect na kare."
 *   (One admin service failure should not bring down other services)
 *
 * Problem Without This:
 *   Agar admin panel mein "Activity Logs" service crash kare toh pura
 *   admin router down ho sakta hai — reports, user management, dashboards
 *   — sab ek saath band ho jaayenge.
 *
 * Solution:
 *   `withFaultIsolation` ek higher-order function hai jo kisi bhi route
 *   handler ko wrap karta hai. Agar wrapped handler error throw kare toh:
 *   - Sirf us ek service ka 503 response aata hai
 *   - Error console mein log hota hai (debugging ke liye)
 *   - Baaki saare admin routes normally kaam karte rehte hain
 *
 * Usage:
 *   const { withFaultIsolation } = require('./fault-isolation.middleware');
 *
 *   // Without fault isolation (risky)
 *   router.get('/logs', getLogs);
 *
 *   // With fault isolation (HFR8 compliant)
 *   router.get('/logs',     withFaultIsolation('Activity Logs',    getLogs));
 *   router.get('/reports',  withFaultIsolation('Reports',          getReports));
 *   router.get('/users',    withFaultIsolation('User Management',  getUsers));
 *
 * =============================================================================
 */

/**
 * Wrap a route handler in an independent try-catch boundary.
 *
 * @param {string}   serviceName  - Human-readable name shown in error response & logs
 * @param {Function} handler      - Express route handler (req, res, next) => {}
 * @returns {Function}             Wrapped handler with fault isolation
 */
const withFaultIsolation = (serviceName, handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        // Error ko console mein log karo — debug ke liye zaroori hai
        console.error(
            `[FaultIsolation] Service "${serviceName}" failed at ${req.method} ${req.originalUrl}:`,
            error.message
        );

        // Agar response pehle se send ho chuka hai toh kuch mat karo
        if (res.headersSent) {
            return;
        }

        // Sirf is ek service ka 503 response bhejo — doosre services unaffected rahenge
        return res.status(503).json({
            success: false,
            message: `The "${serviceName}" service is temporarily unavailable. Please try again later.`,
            service: serviceName,
            otherServicesStatus: 'operational'
        });
    }
};

/**
 * Middleware factory for creating fault-isolated router-level error boundaries.
 *
 * Use yeh tab karo jab poore router ko fault-isolate karna ho, na ki
 * individual routes ko.
 *
 * @param {string} moduleName - Module ka naam (e.g., 'Admin Report Module')
 * @returns {Function} Express error middleware
 *
 * Usage in router:
 *   const { moduleFaultBoundary } = require('./fault-isolation.middleware');
 *   router.use(moduleFaultBoundary('Admin Report Module'));
 */
const moduleFaultBoundary = (moduleName) => (err, req, res, next) => {
    // Agar response pehle se send ho chuka hai toh next pe pass karo
    if (res.headersSent) {
        return next(err);
    }

    // Agar error ka statusCode < 500 hai (jaise 400, 401, 403, 404) toh
    // ye known business errors hain — crash nahi, isliye next() pe pass karo
    // taaki global error handler properly handle kare
    const statusCode = err.statusCode || err.status || 500;
    if (statusCode < 500) {
        return next(err);
    }

    console.error(
        `[FaultIsolation] Module "${moduleName}" error at ${req.method} ${req.originalUrl}:`,
        err.message
    );

    return res.status(503).json({
        success: false,
        message: `The "${moduleName}" module encountered an error. Other admin modules remain operational.`,
        module: moduleName,
        otherServicesStatus: 'operational'
    });
};

module.exports = {
    withFaultIsolation,
    moduleFaultBoundary
};

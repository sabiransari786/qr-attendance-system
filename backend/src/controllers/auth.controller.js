/**
 * Authentication Controller
 * 
 * This controller handles HTTP request/response logic for authentication operations.
 * It does NOT contain database queries or business logic - those are handled by the auth service.
 * 
 * Responsibilities:
 * - Validate incoming request data
 * - Call appropriate service functions
 * - Handle errors and return appropriate HTTP status codes
 * - Format and send JSON responses
 */

const authService = require('../services/auth.service');

/**
 * Login Controller
 * 
 * Handles user login requests:
 * 1. Validates that email and password are provided
 * 2. Calls the auth service to verify credentials
 * 3. Returns JWT token and user role on success
 * 4. Returns appropriate error messages on failure
 * 
 * @param {Object} req - Express request object containing email and password in body
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const login = async (req, res) => {
  try {
    // Extract email and password from request body
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        errors: {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
    }

    // Call the auth service to verify credentials and get user data
    // The service handles password verification and JWT token generation
    const result = await authService.login(email, password);

    // If login is successful, return JWT token and user information
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role // student, faculty, or admin
        }
      }
    });

  } catch (error) {
    // Handle authentication errors (invalid credentials, user not found, etc.)
    // The service throws errors with appropriate messages
    if (error.message === 'Invalid credentials' || error.message === 'User not found') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Handle any other unexpected errors
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout Controller
 * 
 * Handles user logout requests:
 * Since we're using stateless JWT tokens, logout is handled on the client side
 * by removing the token from storage. However, this endpoint can be used to:
 * - Log the logout event
 * - Optionally invalidate tokens in a token blacklist (if implemented)
 * - Provide a consistent API endpoint
 * 
 * @param {Object} req - Express request object (may contain user info from auth middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token from localStorage/sessionStorage
    
    // Optional: If you implement token blacklisting, call the service here
    // await authService.logout(req.user.id, req.token);
    
    // Return success message
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    // Handle any errors that occur during logout
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get Current User Controller
 * 
 * Retrieves the authenticated user's profile information:
 * The user data is already populated by the authentication middleware
 * (typically attached to req.user after JWT verification)
 * 
 * @param {Object} req - Express request object (contains user info from auth middleware)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getCurrentUser = async (req, res) => {
  try {
    // Check if user data exists in request (should be populated by auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Return basic user profile information
    // The user object is already attached by the authentication middleware
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role, // student, faculty, or admin
          name: req.user.name || undefined,
          // Add other basic profile fields as needed
          // Avoid returning sensitive information like passwords
        }
      }
    });

  } catch (error) {
    // Handle any unexpected errors
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving user information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all controller functions
module.exports = {
  login,
  logout,
  getCurrentUser
};


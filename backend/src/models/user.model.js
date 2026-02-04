/**
 * User Model (user.model.js)
 *
 * Is schema ka main role:
 *  - System ke saare users (students, teachers, admins) ko represent karna
 *  - Authentication (login), authorization (roles/permissions) aur attendance system
 *    ke liye base entity provide karna
 *
 * Important Concepts:
 *  - Password hashing:
 *      - Plain text password kabhi database me store nahi karte
 *      - Bcrypt ka use karke password ko hash (one-way encrypted) form me store karte hain
 *  - pre-save hook:
 *      - Mongoose ka middleware jo `save` operation se pehle automatically run hota hai
 *      - Yahin par hum password hash karenge
 *  - Schema methods:
 *      - Instance-level helper functions (e.g. `user.comparePassword()`)
 *      - Business logic se related common operations yahan define kar sakte hain
 *  - Role-based system:
 *      - Different user types (student/teacher/admin) ke liye access control implement karna
 *      - Same User schema se multiple roles handle ho jate hain
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

// User roles enum (role-based system):
//  - Isse role field sirf allowed values tak restricted rahega
//  - Typos ya invalid roles (e.g. "teacher1") automatically reject ho jayenge
const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// Bcrypt salt rounds:
//  - Higher value = more secure but slower
//  - Typical production value: 10-12
//  - Yahan default 10 rakha hai, lekin environment variable se override kiya ja sakta hai
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

/**
 * User Schema Definition
 *
 * Field-wise explanation:
 *  - name:
 *      - User ka full name
 *      - Required, trimmed (leading/trailing spaces removed)
 *
 *  - email:
 *      - Unique identifier for user login
 *      - Required, lowercase, trimmed
 *      - Unique index lagaya gaya hai (duplicate emails allow nahi honge)
 *
 *  - password:
 *      - Hashed password store hoga (plain-text kabhi nahi)
 *      - `select: false` -> default queries me password field return nahi hoga
 *        (security ke liye important: accidental leaks prevent hoti hain)
 *
 *  - role:
 *      - User ka type (student / teacher / admin)
 *      - Enum se restricted, default 'student'
 *
 *  - isActive:
 *      - Soft-disable flag
 *      - true = user active
 *      - false = user logically disabled (login/operations block ho sakte hain)
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Unique constraint (MongoDB level)
      lowercase: true, // Automatically lowercase convert karega
      trim: true
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      // select: false ka matlab:
      //  - Jab hum User.find() ya User.findOne() karein,
      //    to default response me password field include nahi hoga.
      //  - Agar zarurat ho to explicitly `.select('+password')` use kar sakte hain.
      select: false
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES), // Enum: sirf allowed roles hi store honge
      default: USER_ROLES.STUDENT,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    // Mongoose timestamps:
    //  - createdAt: Document kab create hua
    //  - updatedAt: Document last time kab update hua
    //  - Auditing, reporting, debug ke liye helpful
    timestamps: true,
    collection: 'users'
  }
);

/**
 * Index for email uniqueness:
 *  - Although `unique: true` schema level pe diya hai,
 *    explicit index define karna ek achhi practice hai.
 */
userSchema.index({ email: 1 }, { unique: true, name: 'unique_user_email' });

/**
 * Pre-save Hook: Password Hashing Flow
 *
 * pre('save') hook ka role:
 *  - Jab bhi `user.save()` call hota hai:
 *      1. Ye hook run hota hai (save se just pehle)
 *      2. Agar password field naya hai ya change hua hai:
 *          - Bcrypt se salt generate karte hain
 *          - Plain password ko hash me convert karte hain
 *          - Hash ko password field me replace kar dete hain
 *      3. Then control `next()` ke through actual save operation ko milta hai
 *
 * Important:
 *  - Agar password modified nahi hua (e.g. sirf name update kar rahe ho),
 *    to hashing dobara run nahi hogi -> performance better, aur double hashing avoid hota hai.
 */
userSchema.pre('save', async function preSave(next) {
  try {
    const user = this;

    // Agar password field modified hi nahi hua to hashing skip karo
    if (!user.isModified('password')) {
      return next();
    }

    // 1. Salt generate karo
    const salt = await bcrypt.genSalt(SALT_ROUNDS);

    // 2. Plain-text password ko hash karo
    const hashedPassword = await bcrypt.hash(user.password, salt);

    // 3. Password field me hash assign karo
    user.password = hashedPassword;

    return next();
  } catch (error) {
    // Agar hashing process me kuch galat ho jaye,
    // to error ko next(error) ke through global error handler tak bhejo.
    return next(error);
  }
});

/**
 * Schema Method: comparePassword
 *
 * Role:
 *  - Login ke time user ke input password (plain text) ko
 *    stored hashed password ke against compare karna.
 *
 * Flow:
 *  - bcrypt.compare(plainPassword, this.passwordHash)
 *  - Result: true (match) / false (mismatch)
 *
 * Usage Example (controller/service ke andar):
 *  const user = await User.findOne({ email }).select('+password');
 *  const isMatch = await user.comparePassword(inputPassword);
 */
userSchema.methods.comparePassword = async function comparePassword(
  plainPassword
) {
  // Defensive check:
  //  - Agar password field loaded hi nahi (select: false by default) to error throw karo
  if (!this.password) {
    throw new Error(
      'Password is not selected in the query. Use .select("+password") when fetching user.'
    );
  }

  return bcrypt.compare(plainPassword, this.password);
};

// Model Creation:
//  - `User` model `users` collection ko represent karega.
//  - Authentication & authorization related operations isi model par based rahenge.
const User = mongoose.model('User', userSchema);

module.exports = User;
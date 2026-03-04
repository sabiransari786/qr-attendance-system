/**
 * Attendance Model (attendance.model.js)
 *
 * Is schema ka role:
 *  - Har student ki attendance record store karna
 *  - Kis specific session (QR code session) ke liye attendance mark hui hai, wo track karna
 *  - Ek hi student ek hi session ke liye multiple baar attendance na mark kar paye (duplicate prevention)
 *
 * System Context:
 *  - User model: "User" (students, faculty, admins stored yahan)
 *  - Session model: "Session" (QR code based class sessions yahan store hote hain)
 *
 * Important Concepts:
 *  - ObjectId reference: MongoDB ka unique identifier jo documents ko link karne ke liye use hota hai
 *    - studentId -> `User` collection ke ek document ko point karega
 *    - sessionId -> `Session` collection ke ek document ko point karega
 *    - markedBy  -> `User` (generally teacher/admin) ko refer karega
 *  - Unique compound index (studentId + sessionId):
 *    - Ensure karega ki same student same session ke liye sirf ek hi attendance record ho
 *  - Enum:
 *    - status field ko fixed values tak limit karta hai (e.g. 'present', 'absent')
 *    - Isse data consistency aur validation strong ho jata hai
 *  - Timestamps:
 *    - Mongoose ka feature jo har document ke liye `createdAt` aur `updatedAt` auto-manage karta hai
 *    - Auditing, debugging, reporting mein kaafi helpful hota hai
 */

const mongoose = require('mongoose');

// Optionally: centralized constants use karne ke liye
//  - Ye codebase ke `config/constants.js` se attendance related constants import karega.
//  - Benefit: Magic strings avoid hote hain (e.g. 'present', 'absent')
const { ATTENDANCE_STATUS } = require('../config/constants');

const { Schema } = mongoose;

/**
 * Attendance Schema Definition
 *
 * Field-wise explanation:
 *  - studentId:
 *      - Kis student ki attendance hai
 *      - Type: ObjectId (reference to `User` model)
 *      - Required: true (attendance bina student ke possible nahi)
 *
 *  - sessionId:
 *      - Kis QR session / class session ke liye attendance mark hui
 *      - Type: ObjectId (reference to `Session` model)
 *      - Required: true (attendance bina session ke meaningful nahi)
 *
 *  - markedAt:
 *      - Jab attendance actually mark hui (scanner ne QR scan kiya / manual mark hua)
 *      - Type: Date
 *      - Default: current timestamp (Date.now)
 *
 *  - status:
 *      - Attendance ka status (present / absent)
 *      - Enum: sirf allowed values hi store honge
 *      - Default: 'present'
 *
 *  - markedBy:
 *      - Kis teacher / admin ne attendance session generate ya approve kiya
 *      - Type: ObjectId (reference to `User` model)
 *      - Optional field (har scenario mein zaroori nahi ki ye explicitly set ho)
 */
const attendanceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // ObjectId reference to User model
      required: true
    },

    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session', // ObjectId reference to Session model
      required: true
    },

    markedAt: {
      type: Date,
      // Default current timestamp:
      //  - Iska benefit: Jab bhi naya attendance record create hoga,
      //    system automatically mark karega ki us time attendance kab hui.
      default: Date.now
    },

    status: {
      type: String,
      // Enum ka role:
      //  - Sirf allowed status values store hone dena
      //  - Data consistency maintain karna
      //  - Typos / random strings ko prevent karna
      enum: Object.values(ATTENDANCE_STATUS),
      // Default attendance status:
      //  - Generally QR scan hone ka matlab student present hai,
      //    isliye default 'present' rakha gaya hai.
      default: ATTENDANCE_STATUS.PRESENT,
      required: true
    },

    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Teacher/Admin jinhone attendance process initiate/approve kiya
      required: false
    }
  },
  {
    // Mongoose timestamps:
    //  - createdAt: Document kab create hua
    //  - updatedAt: Document last time kab update hua
    //
    // Benefit:
    //  - Audit logs, analytics, reporting ke liye bahut useful
    //  - Query operations mein easily latest changes track kar sakte ho
    timestamps: true,
    // Optional: collection name explicit define karna (best practice for clarity)
    collection: 'attendances'
  }
);

/**
 * Compound Unique Index: (studentId, sessionId)
 *
 * Unique index ka purpose:
 *  - Ensure karna ki ek student ek particular session me multiple baar
 *    attendance mark na kar sake.
 *
 * Kaise kaam karta hai?
 *  - MongoDB level constraint lag jata hai:
 *      - (studentId: X, sessionId: Y) combination sirf ek hi document ke liye allowed hai
 *  - Agar koi duplicate insert/update attempt kare:
 *      - MongoDB duplicate key error throw karega (E11000)
 *      - Application layer is error ko handle karke user ko batayegi
 *
 * Is approach ka benefit:
 *  - Business rule enforce ho jata hai directly database level par
 *  - Race conditions / concurrent requests ke scenario me bhi
 *    duplicate attendance safely prevent hoti hai
 */
attendanceSchema.index(
  { studentId: 1, sessionId: 1 },
  {
    unique: true,
    name: 'unique_student_session_attendance'
  }
);

// Model Creation:
//  - `Attendance` model `attendances` collection ko represent karega.
//  - Is model ka use controllers/services mein CRUD operations ke liye hoga.
//  - IMPORTANT: Yahan sirf schema definition hai, koi business logic nahi.
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
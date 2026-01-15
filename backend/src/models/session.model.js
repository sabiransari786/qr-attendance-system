/**
 * Session Model (session.model.js)
 *
 * Is schema ka main role:
 *  - Har QR code based class / lecture session ko represent karna
 *  - Attendance marking ke liye ek time-bound session create karna
 *  - Attendance ko specific subject / class / teacher ke saath link karna
 *
 * System Context:
 *  - User model: "User" (teachers / admins isi model se aayenge)
 *  - Attendance model: ek-ek student ki attendance sessions ke against record karega
 *
 * Important Concepts:
 *  - Time-bound session:
 *      - Har QR session ke liye startTime aur endTime define hoga
 *      - Is time window ke beech hi QR scan / attendance allowed hoga
 *  - ObjectId reference:
 *      - createdBy field `User` collection ke document ko point karega
 *      - Isse pata chalega ki kaun se teacher/admin ne ye session create kiya
 *  - isActive flag:
 *      - true  -> session abhi active hai (QR scanning allowed)
 *      - false -> session close ho chuka hai (QR scanning band)
 *      - Ye flag application-level checks ke liye bahut useful hai
 *  - Timestamps:
 *      - createdAt / updatedAt automatically track honge
 *      - Session lifecycle (kab create/update hua) easily trace ho sakta hai
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Session Schema Definition
 *
 * Field-wise explanation:
 *  - title:
 *      - Optional session name / lecture topic
 *      - Example: "DSA - Sorting Algorithms", "Maths - Integration Basics"
 *
 *  - subject:
 *      - Course / subject ka naam ya code
 *      - Example: "CS101", "Mathematics", "Operating Systems"
 *      - Required field (session bina subject ke incomplete hoga)
 *
 *  - createdBy:
 *      - Kis teacher / admin ne session create kiya
 *      - Type: ObjectId (reference to `User` model)
 *      - Required: true (har session ka owner/creator clear hona chahiye)
 *
 *  - startTime:
 *      - Session start hone ka exact timestamp
 *      - Required: true
 *      - Example: jab class officially start hoti hai ya jab QR active hota hai
 *
 *  - endTime:
 *      - Session end hone ka exact timestamp
 *      - Required: true
 *      - Validation: endTime > startTime hona chahiye
 *      - Is validation se ensure hota hai ki session ka time window logically correct ho
 *
 *  - isActive:
 *      - Boolean flag: QR scanning allowed hai ya nahi
 *      - Default: true
 *      - Jab session expire ho jaye / teacher manually close kare:
 *          - isActive ko false set kiya ja sakta hai
 */
const sessionSchema = new Schema(
  {
    title: {
      type: String,
      trim: true
    },

    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Teacher / Admin jinhone session create kiya
      required: [true, 'Session creator (createdBy) is required']
    },

    startTime: {
      type: Date,
      required: [true, 'Session start time is required']
    },

    endTime: {
      type: Date,
      required: [true, 'Session end time is required'],
      // Custom validator: endTime must be greater than startTime
      validate: {
        validator: function validateEndTime(value) {
          // Agar startTime ya endTime missing hai to ye validation skip ho sakta hai,
          // lekin "required" rules already ensure kar rahe hain ki dono defined hon.
          if (!this.startTime || !value) return true;
          return value > this.startTime;
        },
        message: 'End time must be greater than start time'
      }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    // Timestamps:
    //  - createdAt: Session document kab create hua
    //  - updatedAt: Session document last time kab update hua
    //
    // Benefit:
    //  - Session history, reporting, analytics ke liye direct information mil jati hai
    timestamps: true,
    // Explicit collection name define karna best practice hai clarity ke liye
    collection: 'sessions'
  }
);

/**
 * Indexes
 *
 * 1. createdBy + isActive index:
 *    - "Only one active session per teacher" constraint ko support karne ke liye
 *    - Partial unique index:
 *        - Har teacher (createdBy) ke liye max 1 document ho sakta hai jahan isActive = true
 *        - Agar koi naya active session create karne ki koshish karega
 *          jab ek aur active session already hai, to MongoDB duplicate key error throw karega
 *
 *    NOTE:
 *    - Ye database-level constraint hai jo race conditions ke against bhi protection deta hai.
 *    - Application ko is constraint se aane wale errors ko gracefully handle karna chahiye
 *      (e.g. "You already have an active session").
 */
sessionSchema.index(
  { createdBy: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'unique_active_session_per_teacher'
  }
);

/**
 * Additional helpful indexes:
 *
 * 2. createdBy + startTime:
 *    - Kisi particular teacher ke past sessions ko sort/filter karna fast ho jata hai.
 */
sessionSchema.index(
  { createdBy: 1, startTime: -1 },
  { name: 'sessions_by_teacher_and_startTime' }
);

/**
 * 3. subject index:
 *    - Subject-based reporting / lookup ke liye helpful.
 */
sessionSchema.index(
  { subject: 1 },
  { name: 'sessions_by_subject' }
);

// Model Creation:
//  - `Session` model `sessions` collection ko represent karega.
//  - Is model ke through controllers/services sessions create/read/update/close karenge.
//  - NOTE: QR generation, expiry checks, etc. business logic level par honge, model me nahi.
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
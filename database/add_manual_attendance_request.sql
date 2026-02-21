-- ============================================================================
-- MANUAL ATTENDANCE REQUEST TABLE
-- ============================================================================
-- Jab student QR scan nahi kar paya (network issue ya koi aur reason) to
-- teacher se manually attendance request karta hai.
-- Teacher approve ya reject kar sakta hai.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `manual_attendance_request` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `student_id`    INT NOT NULL COMMENT 'Student jo request kar raha hai',
  `session_id`    INT NOT NULL COMMENT 'Session jiske liye request hai',
  `reason`        VARCHAR(500) NOT NULL COMMENT 'Student-provided reason',
  `status`        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by`   INT NULL COMMENT 'Faculty ID jo approve/reject karta hai',
  `reviewed_at`   TIMESTAMP NULL COMMENT 'Kab review kiya',
  `rejection_note` VARCHAR(500) NULL COMMENT 'Optional reason for rejection',
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Each student can submit only one request per session
  UNIQUE KEY `uq_student_session` (`student_id`, `session_id`),

  FOREIGN KEY (`student_id`)  REFERENCES `users`(`id`)     ON DELETE CASCADE,
  FOREIGN KEY (`session_id`)  REFERENCES `sessions`(`id`)  ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`)     ON DELETE SET NULL,

  INDEX `idx_student_id`  (`student_id`),
  INDEX `idx_session_id`  (`session_id`),
  INDEX `idx_status`      (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Student manual attendance requests when QR could not be scanned';

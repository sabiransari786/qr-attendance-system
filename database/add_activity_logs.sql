-- ============================================================================
-- ACTIVITY LOGS TABLE - System Activity and Audit Trail
-- ============================================================================
--
-- This migration adds activity logging for admin visibility.
--
-- Usage:
--   mysql -u root -p attendance_tracker < database/add_activity_logs.sql
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL COMMENT 'Actor user id (nullable for anonymous actions)',
  `user_role` VARCHAR(20) NULL COMMENT 'Actor role at time of action',
  `action` VARCHAR(120) NOT NULL COMMENT 'Normalized action label',
  `entity_type` VARCHAR(80) NULL COMMENT 'Affected entity type',
  `entity_id` VARCHAR(80) NULL COMMENT 'Affected entity id',
  `method` VARCHAR(10) NOT NULL COMMENT 'HTTP method',
  `path` VARCHAR(255) NOT NULL COMMENT 'Request path',
  `status_code` INT NOT NULL COMMENT 'HTTP status code',
  `ip_address` VARCHAR(64) NULL COMMENT 'Request IP address',
  `user_agent` VARCHAR(255) NULL COMMENT 'Client user agent',
  `metadata` LONGTEXT NULL COMMENT 'Additional metadata for debugging (JSON string)',
  `duration_ms` INT NULL COMMENT 'Request duration in milliseconds',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_activity_user_id` (`user_id`),
  INDEX `idx_activity_role` (`user_role`),
  INDEX `idx_activity_action` (`action`),
  INDEX `idx_activity_status` (`status_code`),
  INDEX `idx_activity_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional foreign key (safe to skip if you prefer manual management)
-- ALTER TABLE `activity_logs`
--   ADD CONSTRAINT `fk_activity_logs_user_id`
--   FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

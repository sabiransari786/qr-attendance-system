-- Add profile photo field to users table
-- This allows students to upload and store their profile photos

ALTER TABLE `users` ADD COLUMN `profile_photo` LONGBLOB COMMENT 'User profile photo (stored as binary data)' AFTER `is_active`;
ALTER TABLE `users` ADD COLUMN `photo_mime_type` VARCHAR(50) COMMENT 'MIME type of the photo (e.g., image/jpeg, image/png)' AFTER `profile_photo`;

-- Add index for better query performance
ALTER TABLE `users` ADD INDEX `idx_profile_photo` (`id`);

-- Display confirmation
SELECT 'Profile photo columns added successfully!' as status;

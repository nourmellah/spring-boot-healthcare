-- Step 5: keep notification.type as VARCHAR in MySQL.
-- This only changes the notifications.type column and does not touch notification rows or other tables.
-- Run this once if your existing MySQL table was created as ENUM or with an incompatible type.

SELECT COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'notifications'
  AND COLUMN_NAME = 'type';

ALTER TABLE notifications
  MODIFY COLUMN type VARCHAR(50) NOT NULL;

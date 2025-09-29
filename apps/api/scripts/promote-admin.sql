-- SQL script to promote user emir.m@live.com to ADMIN role
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'emir.m@live.com';

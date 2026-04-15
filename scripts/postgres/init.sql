-- Create the Auth database if it doesn't exist
SELECT 'CREATE DATABASE fintech_auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fintech_auth')\gexec

-- Create the User Profile database if it doesn't exist
SELECT 'CREATE DATABASE fintech_user_profile'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fintech_user_profile')\gexec

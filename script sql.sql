CREATE DATABASE challenge_db;
CREATE USER 'challenge'@'localhost' IDENTIFIED BY 'challenge_2024';
GRANT ALL PRIVILEGES ON challenge_db.* TO 'challenge'@'localhost';
FLUSH PRIVILEGES;
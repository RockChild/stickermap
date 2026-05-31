-- Runs once on first cluster init. The main DB (stickerboard) is created by
-- POSTGRES_DB; here we add the isolated test database.
CREATE DATABASE stickerboard_test;

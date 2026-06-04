CREATE DATABASE finance_tracker;
USE finance_tracker;

CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),
    balance DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    monthly_limit DECIMAL(10,2) NULL
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    category_id INT,
    type ENUM('income','expense'),
    amount DECIMAL(10,2),
    note TEXT,
    date_transaction DATE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
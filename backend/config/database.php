<?php
$pdo = new PDO(
    "mysql:host=localhost;dbname=finance_tracker",
    "root",
    "",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
?>
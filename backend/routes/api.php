<?php
require_once '../config/database.php';
require_once '../controllers/AccountController.php';
require_once '../controllers/TransactionController.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';

switch ($method . ' ' . $route) {

    case 'POST accounts':
        AccountController::create($pdo);
        break;

    case 'GET accounts':
        AccountController::getAll($pdo);
        break;

    case 'POST transactions':
        TransactionController::create($pdo);
        break;

    default:
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Route not found"
        ]);
}
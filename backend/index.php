<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/AccountController.php';
require_once __DIR__ . '/controllers/TransactionController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/services/SummaryService.php';

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

switch ($route) {

    // ACCOUNTS
    case 'accounts/create':
        AccountController::create($pdo);
        break;

    case 'accounts/all':
        AccountController::getAll($pdo);
        break;

    // ⭐ AJOUT DELETE
    case 'accounts/delete':
        AccountController::delete($pdo);
        break;

    // CATEGORIES
    case 'categories/create':
        CategoryController::create($pdo);
        break;

    case 'categories/all':
        CategoryController::getAll($pdo);
        break;

    // TRANSACTIONS
    case 'transactions/create':
        TransactionController::create($pdo);
        break;

    
    // SUMMARY
    case 'summary/monthly':
        $accountId = $_GET['account_id'];
        $month = $_GET['month'];

        echo json_encode(
            SummaryService::getMonthlySummary($pdo, $accountId, $month)
        );
        break;

    default:
        echo json_encode(["error" => "Route introuvable"]);
}
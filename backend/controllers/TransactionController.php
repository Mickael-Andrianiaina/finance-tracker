<?php

header("Content-Type: application/json");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/AccountService.php';
require_once __DIR__ . '/../services/TransactionService.php';

class TransactionController {

    // ➕ CREATE TRANSACTION
    public static function create($pdo, $data = null) {
        if ($data === null) {
            $data = json_decode(file_get_contents("php://input"));
        }

        if (!$data || !isset($data->account_id, $data->type, $data->amount)) {
            http_response_code(400);
            echo json_encode(["error" => "Données invalides"]);
            return;
        }

        $accountId = $data->account_id;
        $categoryId = isset($data->category_id) && $data->category_id !== '' ? $data->category_id : null;
        $type = $data->type;
        $amount = floatval($data->amount);
        $note = $data->note ?? null;
        $date = !empty($data->date) ? $data->date : date('Y-m-d');

        // Simple validation
        if ($amount <= 0 || !in_array($type, ['income', 'expense'])) {
            http_response_code(400);
            echo json_encode(["error" => "Montant ou type de transaction invalide"]);
            return;
        }

        try {
            $pdo->beginTransaction();

            // 1. Check category monthly limit if it is an expense and category is specified
            $warning = null;
            if ($type === 'expense' && $categoryId !== null) {
                $warning = TransactionService::checkCategoryLimit($pdo, $categoryId, $amount);
            }

            // 2. Update account balance (will throw Exception if balance is insufficient for expense)
            AccountService::updateBalance($pdo, $accountId, $amount, $type);

            // 3. Insert transaction
            $stmt = $pdo->prepare("
                INSERT INTO transactions (account_id, category_id, type, amount, note, date_transaction)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $accountId,
                $categoryId,
                $type,
                $amount,
                $note,
                $date
            ]);

            $pdo->commit();

            $response = ["message" => "Transaction créée avec succès"];
            if ($warning) {
                $response["warning"] = $warning;
            }
            echo json_encode($response);

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
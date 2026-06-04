<?php

header("Content-Type: application/json");

require_once __DIR__ . '/../config/database.php';

class AccountController {

    // ➕ CREATE ACCOUNT
    public static function create($pdo) {

        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->name, $data->type, $data->balance)) {
            http_response_code(400);
            echo json_encode(["error" => "Données invalides"]);
            return;
        }

        // ❌ RÈGLE 1 : Solde initial doit être strictement positif (> 0)
        if ((float)$data->balance <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Le solde initial doit être supérieur à 0"]);
            return;
        }

        // ❌ RÈGLE 2 : Nom de compte unique (insensible à la casse)
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) as total FROM accounts WHERE LOWER(name) = LOWER(?)");
        $stmtCheck->execute([trim($data->name)]);
        if ($stmtCheck->fetch()['total'] > 0) {
            http_response_code(400);
            echo json_encode(["error" => "Un compte avec ce nom existe déjà"]);
            return;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO accounts(name, type, balance)
                VALUES(?, ?, ?)
            ");

            $stmt->execute([
                trim($data->name),
                $data->type,
                (float)$data->balance
            ]);

            echo json_encode([
                "message" => "Compte créé avec succès"
            ]);

        } catch (Exception $e) {

            http_response_code(500);

            echo json_encode([
                "error" => $e->getMessage()
            ]);
        }
    }


    // 📋 GET ALL ACCOUNTS
    public static function getAll($pdo) {

        try {

            $stmt = $pdo->query("SELECT * FROM accounts");

            echo json_encode(
                $stmt->fetchAll(PDO::FETCH_ASSOC)
            );

        } catch (Exception $e) {

            http_response_code(500);

            echo json_encode([
                "error" => $e->getMessage()
            ]);
        }
    }


    // 🗑️ DELETE ACCOUNT (RULE: no transactions allowed)
    public static function delete($pdo) {

        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->id)) {
            http_response_code(400);
            echo json_encode(["error" => "ID requis"]);
            return;
        }

        try {

            // vérifier s'il y a des transactions
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total
                FROM transactions
                WHERE account_id=?
            ");

            $stmt->execute([$data->id]);
            $count = $stmt->fetch()['total'];

            if ($count > 0) {
                http_response_code(400);
                echo json_encode([
                    "error" => "Impossible de supprimer un compte avec des transactions"
                ]);
                return;
            }

            // delete account
            $stmt = $pdo->prepare("
                DELETE FROM accounts
                WHERE id=?
            ");

            $stmt->execute([$data->id]);

            echo json_encode([
                "message" => "Compte supprimé avec succès"
            ]);

        } catch (Exception $e) {

            http_response_code(500);

            echo json_encode([
                "error" => $e->getMessage()
            ]);
        }
    }
}
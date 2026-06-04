<?php

class TransactionService {

    /**
     * VALIDATION GLOBALE DE LA TRANSACTION
     */
    public static function validate($pdo, $data) {

        // 1. Vérifier montant
        if (!isset($data['amount']) || $data['amount'] <= 0) {
            throw new Exception("Montant invalide");
        }

        // 2. Vérifier compte
        $stmt = $pdo->prepare("SELECT balance FROM accounts WHERE id=?");
        $stmt->execute([$data['account_id']]);
        $account = $stmt->fetch();

        if (!$account) {
            throw new Exception("Compte introuvable");
        }

        // 3. Vérifier solde (uniquement pour expense)
        if ($data['type'] === 'expense' && $account['balance'] < $data['amount']) {
            throw new Exception("Solde insuffisant");
        }

        // 4. Vérifier catégorie
        $limitCheck = self::checkCategoryLimit(
            $pdo,
            $data['category_id'],
            $data['amount']
        );

        if (!$limitCheck['valid']) {
            throw new Exception($limitCheck['message']);
        }
    }


    /**
     * CRÉER UNE TRANSACTION
     */
    public static function create($pdo, $data) {

        // 1. Validation globale
        self::validate($pdo, $data);

        // 2. Insertion transaction
        $stmt = $pdo->prepare("
            INSERT INTO transactions (
                account_id,
                category_id,
                type,
                amount,
                note,
                date_transaction
            )
            VALUES (?, ?, ?, ?, ?, CURDATE())
        ");

        $stmt->execute([
            $data['account_id'],
            $data['category_id'],
            $data['type'],
            $data['amount'],
            $data['note'] ?? null
        ]);

        // 3. Mise à jour solde
        if ($data['type'] === 'expense') {
            $stmt = $pdo->prepare("
                UPDATE accounts
                SET balance = balance - ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data['amount'],
                $data['account_id']
            ]);
        }

        if ($data['type'] === 'income') {
            $stmt = $pdo->prepare("
                UPDATE accounts
                SET balance = balance + ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data['amount'],
                $data['account_id']
            ]);
        }

        return [
            "success" => true,
            "message" => "Transaction créée avec succès"
        ];
    }


    /**
     * CHECK LIMITE CATEGORIE MENSUELLE
     */
    public static function checkCategoryLimit($pdo, $categoryId, $amount) {

        // récupérer limite catégorie
        $stmt = $pdo->prepare("
            SELECT monthly_limit 
            FROM categories 
            WHERE id = ?
        ");
        $stmt->execute([$categoryId]);
        $cat = $stmt->fetch();

        if (!$cat || !$cat['monthly_limit']) {
            return [
                "valid" => true,
                "message" => "Aucune limite définie"
            ];
        }

        // total dépenses du mois
        $stmt = $pdo->prepare("
            SELECT SUM(amount) as total
            FROM transactions
            WHERE category_id = ?
            AND type = 'expense'
            AND MONTH(date_transaction) = MONTH(CURDATE())
            AND YEAR(date_transaction) = YEAR(CURDATE())
        ");
        $stmt->execute([$categoryId]);

        $total = $stmt->fetch()['total'] ?? 0;

        // vérification limite
        if ($total + $amount > $cat['monthly_limit']) {
            return [
                "valid" => false,
                "message" => "Limite mensuelle dépassée"
            ];
        }

        return [
            "valid" => true,
            "message" => "OK"
        ];
    }
}
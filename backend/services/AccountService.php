<?php

class AccountService {

    public static function updateBalance($pdo, $accountId, $amount, $type) {

        $stmt = $pdo->prepare("SELECT balance FROM accounts WHERE id=?");
        $stmt->execute([$accountId]);
        $account = $stmt->fetch();

        $newBalance = $account['balance'];

        if ($type === 'income') {
            $newBalance += $amount;
        } else {
            $newBalance -= $amount;
        }

        if ($newBalance < 0) {
            throw new Exception("Solde insuffisant");
        }

        $stmt = $pdo->prepare("UPDATE accounts SET balance=? WHERE id=?");
        $stmt->execute([$newBalance, $accountId]);
    }
}
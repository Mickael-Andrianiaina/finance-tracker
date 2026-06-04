<?php

require_once '../backend/config/database.php';

/**
 * Petit framework de test simple
 */
function assertEqual($a, $b, $message) {
    if ($a === $b) {
        echo "✔ PASS : $message\n";
    } else {
        echo "❌ FAIL : $message\n";
        echo "   Attendu: $b\n";
        echo "   Obtenu: $a\n";
    }
}

echo "=== TESTS FINANCE TRACKER ===\n\n";


// =======================
// 1. TEST CREATION COMPTE
// =======================
$stmt = $pdo->prepare("INSERT INTO accounts(name,type,balance) VALUES('Test','cash',100)");
$stmt->execute();

$accountId = $pdo->lastInsertId();

assertEqual(is_numeric($accountId), true, "Création compte");


// =======================
// 2. TEST TRANSACTION + SOLDE
// =======================
$stmt = $pdo->prepare("INSERT INTO transactions(account_id,category_id,type,amount,note,date_transaction)
VALUES(?,?,?,?,?,CURDATE())");

$stmt->execute([$accountId, 1, 'expense', 50, 'test']);

$stmt = $pdo->prepare("UPDATE accounts SET balance = balance - 50 WHERE id=?");
$stmt->execute([$accountId]);

$stmt = $pdo->prepare("SELECT balance FROM accounts WHERE id=?");
$stmt->execute([$accountId]);

$balance = $stmt->fetch()['balance'];

assertEqual($balance, 50, "Mise à jour solde");


// =======================
// 3. TEST SOLDE NEGATIF BLOQUE
// =======================
try {

    $stmt = $pdo->prepare("UPDATE accounts SET balance = balance - 1000 WHERE id=?");
    $stmt->execute([$accountId]);

    assertEqual(false, true, "Blocage solde négatif");

} catch (Exception $e) {
    assertEqual(true, true, "Blocage solde négatif");
}


// =======================
// CLEAN
// =======================
$pdo->prepare("DELETE FROM transactions WHERE account_id=?")->execute([$accountId]);
$pdo->prepare("DELETE FROM accounts WHERE id=?")->execute([$accountId]);

echo "\n=== FIN TESTS ===\n";
<?php

class SummaryService {

    public static function getMonthlySummary($pdo, $accountId, $month) {

        // income
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(amount),0) as income
            FROM transactions
            WHERE account_id=?
            AND type='income'
            AND DATE_FORMAT(date_transaction,'%Y-%m')=?
        ");
        $stmt->execute([$accountId, $month]);
        $income = $stmt->fetch()['income'];

        // expense
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(amount),0) as expense
            FROM transactions
            WHERE account_id=?
            AND type='expense'
            AND DATE_FORMAT(date_transaction,'%Y-%m')=?
        ");
        $stmt->execute([$accountId, $month]);
        $expense = $stmt->fetch()['expense'];

        // by category
        $stmt = $pdo->prepare("
            SELECT c.name, SUM(t.amount) as total
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.account_id=?
            AND t.type='expense'
            AND DATE_FORMAT(t.date_transaction,'%Y-%m')=?
            GROUP BY t.category_id
        ");
        $stmt->execute([$accountId, $month]);
        $byCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // progress categories
        $stmt = $pdo->prepare("
            SELECT c.id, c.name, c.monthly_limit,
            COALESCE(SUM(t.amount),0) as spent
            FROM categories c
            LEFT JOIN transactions t
            ON c.id = t.category_id
            AND t.type='expense'
            AND DATE_FORMAT(t.date_transaction,'%Y-%m')=?
            GROUP BY c.id
        ");
        $stmt->execute([$month]);
        $progress = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $p) {
            $limit = (float)$p['monthly_limit'];
            $spent = (float)$p['spent'];

            $progress[] = [
                "id" => $p['id'],
                "name" => $p['name'],
                "monthly_limit" => $p['monthly_limit'],
                "spent" => $spent,
                "progress_percent" => $limit > 0 ? round(($spent/$limit)*100,2) : 0
            ];
        }

        return [
            "income" => $income,
            "expense" => $expense,
            "net" => $income - $expense,
            "byCategory" => $byCategory,
            "progress" => $progress
        ];
    }
}
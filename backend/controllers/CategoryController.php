<?php

require_once __DIR__ . '/../config/database.php';

class CategoryController {

    public static function create($pdo) {

        $data = json_decode(file_get_contents("php://input"));

        $stmt = $pdo->prepare("
            INSERT INTO categories(name, monthly_limit)
            VALUES(?, ?)
        ");

        $stmt->execute([
            $data->name,
            $data->monthly_limit
        ]);

        echo json_encode(["message" => "Catégorie créée"]);
    }

    public static function getAll($pdo) {

        $stmt = $pdo->query("SELECT * FROM categories");

        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}
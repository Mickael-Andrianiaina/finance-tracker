<?php
class Response {
    public static function json($data = null, $message = "OK", $status = 200) {
        http_response_code($status);

        echo json_encode([
            "success" => $status < 400,
            "message" => $message,
            "data" => $data
        ]);
        exit;
    }
}
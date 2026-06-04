<?php
class Validator {

    public static function required($data, $fields) {
        foreach ($fields as $field) {
            if (!isset($data[$field]) || $data[$field] === "") {
                throw new Exception("$field is required");
            }
        }
    }
}
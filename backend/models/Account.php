<?php

class Account {

    public $id;
    public $name;
    public $type;
    public $balance;

    public function __construct($data = []) {
        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->type = $data['type'] ?? null;
        $this->balance = $data['balance'] ?? 0;
    }
}
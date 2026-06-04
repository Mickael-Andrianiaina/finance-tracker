<?php

class Category {

    public $id;
    public $name;
    public $monthly_limit;

    public function __construct($data = []) {
        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->monthly_limit = $data['monthly_limit'] ?? null;
    }
}
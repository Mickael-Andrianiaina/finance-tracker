<?php

class Transaction {

    public $id;
    public $account_id;
    public $category_id;
    public $type;
    public $amount;
    public $note;
    public $date_transaction;

    public function __construct($data = []) {
        $this->id = $data['id'] ?? null;
        $this->account_id = $data['account_id'] ?? null;
        $this->category_id = $data['category_id'] ?? null;
        $this->type = $data['type'] ?? null;
        $this->amount = $data['amount'] ?? 0;
        $this->note = $data['note'] ?? null;
        $this->date_transaction = $data['date_transaction'] ?? null;
    }
}
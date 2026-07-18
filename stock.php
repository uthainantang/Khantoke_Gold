<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/includes/functions.php';

$conn = db();
$pageKey = 'stock';
$pageTitle = 'สต๊อกวัตถุดิบ';
$initialDark = (bool)$conn->query('SELECT dark_mode FROM settings WHERE id = 1')->fetch_assoc()['dark_mode'];

require __DIR__ . '/includes/header.php';
$pageScript = 'assets/stock.js';
require __DIR__ . '/includes/footer.php';

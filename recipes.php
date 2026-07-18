<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/includes/functions.php';

$conn = db();
$pageKey = 'recipes';
$pageTitle = 'เมนู & ต้นทุน';
$initialDark = (bool)$conn->query('SELECT dark_mode FROM settings WHERE id = 1')->fetch_assoc()['dark_mode'];

require __DIR__ . '/includes/header.php';
$pageScript = 'assets/recipes.js';
require __DIR__ . '/includes/footer.php';

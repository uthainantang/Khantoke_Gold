<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/functions.php';

$conn = db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'add') {
    require_method('POST');
    $body = request_body();
    $name = trim((string)($body['name'] ?? ''));
    $price = (float)($body['price'] ?? -1);
    if ($name === '') json_error('กรุณาระบุชื่อเมนู');
    if ($price < 0) json_error('กรุณาระบุราคาที่ถูกต้อง');
    $stmt = $conn->prepare('INSERT INTO recipes (name, price, is_today) VALUES (?, ?, 0)');
    $stmt->bind_param('sd', $name, $price);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "เพิ่มเมนู \"$name\" แล้ว ✓"]);
}

if ($action === 'update') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $name = trim((string)($body['name'] ?? ''));
    $price = (float)($body['price'] ?? -1);
    if ($name === '') json_error('กรุณาระบุชื่อเมนู');
    if ($price < 0) json_error('กรุณาระบุราคาที่ถูกต้อง');
    $stmt = $conn->prepare('UPDATE recipes SET name = ?, price = ? WHERE id = ?');
    $stmt->bind_param('sdi', $name, $price, $id);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "อัปเดต \"$name\" แล้ว ✓"]);
}

if ($action === 'delete') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT name FROM recipes WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM recipes WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบเมนู \"{$row['name']}\" แล้ว" : 'ลบแล้ว']);
}

if ($action === 'add_ingredient') {
    require_method('POST');
    $body = request_body();
    $recipeId = (int)($body['recipe_id'] ?? 0);
    $source = (string)($body['source'] ?? ''); // "stock:ID" หรือ "sauce:ID"
    $qty = (float)($body['qty'] ?? 0);
    if ($qty <= 0) json_error('กรุณาระบุปริมาณที่ถูกต้อง');

    if (substr($source, 0, 6) === 'sauce:') {
        $sauceId = (int)substr($source, 6);
        $sauce = $conn->query("SELECT name, max_price_per_bag FROM sauces WHERE id = $sauceId")->fetch_assoc();
        if (!$sauce) json_error('กรุณาเลือกวัตถุดิบ');
        $name = $sauce['name'];
        $qtyLabel = "$qty ถุง";
        $cost = $qty * (float)$sauce['max_price_per_bag'];
    } else {
        $stockId = (int)str_replace('stock:', '', $source);
        $stock = $conn->query("SELECT name, unit, price FROM stock WHERE id = $stockId")->fetch_assoc();
        if (!$stock) json_error('กรุณาเลือกวัตถุดิบ');
        $name = $stock['name'];
        $qtyLabel = "$qty {$stock['unit']}";
        $cost = $qty * (float)$stock['price'];
    }

    $stmt = $conn->prepare('INSERT INTO recipe_ingredients (recipe_id, name, qty_label, cost) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('issd', $recipeId, $name, $qtyLabel, $cost);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "เพิ่ม \"$name\" แล้ว ✓"]);
}

if ($action === 'delete_ingredient') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT name FROM recipe_ingredients WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM recipe_ingredients WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบ \"{$row['name']}\" แล้ว" : 'ลบแล้ว']);
}

/* ── GET: รายการเมนูทั้งหมด พร้อมต้นทุน/กำไร ── */

$recipes = [];
$rres = $conn->query('SELECT id, name, price FROM recipes ORDER BY id');
$marginSum = 0;
while ($r = $rres->fetch_assoc()) {
    $stmt = $conn->prepare('SELECT id, name, qty_label, cost FROM recipe_ingredients WHERE recipe_id = ? ORDER BY id');
    $stmt->bind_param('i', $r['id']);
    $stmt->execute();
    $ings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $cost = array_sum(array_map(fn($i) => (float)$i['cost'], $ings));
    $price = (float)$r['price'];
    $margin = $price - $cost;
    $mPct = $price > 0 ? (int)round(($margin / $price) * 100) : 0;
    $marginSum += $mPct;

    $dq = $conn->query("SELECT COALESCE(SUM(qty),0) q FROM order_items WHERE menu_name = '" . $conn->real_escape_string($r['name']) . "'")->fetch_assoc();
    $dayQty = (int)$dq['q'];

    $recipes[] = [
        'id' => (int)$r['id'], 'name' => $r['name'], 'price' => $price,
        'cost' => f2($cost), 'margin' => f2($margin), 'mPct' => $mPct,
        'dayQty' => $dayQty, 'dayAmt' => fmt_money($dayQty * $price),
        'ings' => array_map(fn($i) => [
            'id' => (int)$i['id'], 'name' => $i['name'], 'qty' => $i['qty_label'], 'costStr' => f2((float)$i['cost']),
        ], $ings),
    ];
}
$avgMargin = count($recipes) > 0 ? (int)round($marginSum / count($recipes)) : 0;

$ingredientOpts = [];
$sres = $conn->query('SELECT id, name, unit, price FROM stock ORDER BY id');
while ($s = $sres->fetch_assoc()) {
    $ingredientOpts[] = [
        'value' => 'stock:' . $s['id'], 'name' => $s['name'], 'price' => (float)$s['price'],
        'label' => $s['name'] . ' (' . $s['unit'] . ($s['price'] ? " · ฿" . f2((float)$s['price']) . "/{$s['unit']}" : '') . ')',
    ];
}
$saures = $conn->query('SELECT id, name, max_price_per_bag FROM sauces ORDER BY id');
while ($sa = $saures->fetch_assoc()) {
    $ingredientOpts[] = [
        'value' => 'sauce:' . $sa['id'], 'name' => $sa['name'], 'price' => (float)$sa['max_price_per_bag'],
        'label' => $sa['name'] . ' — น้ำจิ้ม (ถุง' . ($sa['max_price_per_bag'] ? " · ฿" . f2((float)$sa['max_price_per_bag']) . "/ถุง" : '') . ')',
    ];
}

json_out([
    'ok' => true,
    'recipes' => $recipes,
    'avgMargin' => $avgMargin,
    'menuCount' => count($recipes),
    'ingredientOpts' => $ingredientOpts,
]);

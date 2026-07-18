<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/functions.php';

$conn = db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

const UNIT_OPTS = ['กก.', 'กรัม', 'ขวด', 'ลิตร', 'ฟอง', 'ชิ้น', 'ถุง'];

/* ── วัตถุดิบ ───────────────────────────────────────────── */

if ($action === 'add') {
    require_method('POST');
    $body = request_body();
    $name = trim((string)($body['name'] ?? ''));
    $qty = (float)($body['qty'] ?? -1);
    $unit = (string)($body['unit'] ?? 'กก.');
    $min = (float)($body['min'] ?? 0);
    $price = (float)($body['price'] ?? 0); // ราคารวมที่กรอก
    if ($name === '') json_error('กรุณาระบุชื่อวัตถุดิบ');
    if ($qty < 0) json_error('กรุณาระบุจำนวนให้ถูกต้อง');
    $pricePerUnit = $qty > 0 ? $price / $qty : 0;
    $stmt = $conn->prepare('INSERT INTO stock (name, qty, unit, min_qty, price) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('sdsdd', $name, $qty, $unit, $min, $pricePerUnit);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "เพิ่ม \"$name\" แล้ว ✓"]);
}

if ($action === 'update') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $name = trim((string)($body['name'] ?? ''));
    $qty = (float)($body['qty'] ?? -1);
    $unit = (string)($body['unit'] ?? 'กก.');
    $min = (float)($body['min'] ?? 0);
    $price = (float)($body['price'] ?? 0); // ราคาต่อหน่วยโดยตรง (จากฟอร์มแก้ไข)
    if ($name === '') json_error('กรุณาระบุชื่อวัตถุดิบ');
    if ($qty < 0) json_error('กรุณาใส่จำนวนที่ถูกต้อง');
    $stmt = $conn->prepare('UPDATE stock SET name=?, qty=?, unit=?, min_qty=?, price=? WHERE id=?');
    $stmt->bind_param('sdsddi', $name, $qty, $unit, $min, $price, $id);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "อัปเดต \"$name\" แล้ว ✓"]);
}

if ($action === 'delete') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT name FROM stock WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM stock WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบ \"{$row['name']}\" แล้ว" : 'ลบแล้ว']);
}

/* ── น้ำจิ้ม ────────────────────────────────────────────── */

if ($action === 'sauce_add') {
    require_method('POST');
    $body = request_body();
    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') json_error('กรุณาระบุชื่อน้ำจิ้ม');
    $stmt = $conn->prepare('INSERT INTO sauces (name, stock_qty, max_price_per_bag) VALUES (?, 0, 0)');
    $stmt->bind_param('s', $name);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "เพิ่ม \"$name\" แล้ว ✓"]);
}

if ($action === 'sauce_update_name') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') json_error('กรุณาระบุชื่อน้ำจิ้ม');
    $stmt = $conn->prepare('UPDATE sauces SET name = ? WHERE id = ?');
    $stmt->bind_param('si', $name, $id);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "อัปเดต \"$name\" แล้ว ✓"]);
}

if ($action === 'sauce_delete') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT name FROM sauces WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM sauces WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบ \"{$row['name']}\" แล้ว" : 'ลบแล้ว']);
}

if ($action === 'sauce_add_ingredient') {
    require_method('POST');
    $body = request_body();
    $sauceId = (int)($body['sauce_id'] ?? 0);
    $stockId = (int)($body['stock_id'] ?? 0);
    $qty = (float)($body['qty'] ?? 0);
    if ($qty <= 0) json_error('กรุณาระบุปริมาณที่ถูกต้อง');
    $stock = $conn->query("SELECT name, unit FROM stock WHERE id = $stockId")->fetch_assoc();
    if (!$stock) json_error('กรุณาเลือกวัตถุดิบ');
    $stmt = $conn->prepare('INSERT INTO sauce_ingredients (sauce_id, name, qty_per_round, unit) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('isds', $sauceId, $stock['name'], $qty, $stock['unit']);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "เพิ่ม \"{$stock['name']}\" แล้ว ✓"]);
}

if ($action === 'sauce_delete_ingredient') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT name FROM sauce_ingredients WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM sauce_ingredients WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบ \"{$row['name']}\" แล้ว" : 'ลบแล้ว']);
}

if ($action === 'sauce_add_batch') {
    require_method('POST');
    $body = request_body();
    $sauceId = (int)($body['sauce_id'] ?? 0);
    $bags = (float)($body['bags'] ?? 0);
    if ($bags <= 0) json_error('กรุณาระบุจำนวนถุงที่ถูกต้อง');

    $sauce = $conn->query("SELECT name, stock_qty, max_price_per_bag FROM sauces WHERE id = $sauceId")->fetch_assoc();
    if (!$sauce) json_error('ไม่พบน้ำจิ้ม', 404);

    $ings = $conn->query("SELECT name, qty_per_round FROM sauce_ingredients WHERE sauce_id = $sauceId")->fetch_all(MYSQLI_ASSOC);

    $insufficient = [];
    $roundCost = 0;
    $conn->begin_transaction();
    try {
        foreach ($ings as $ing) {
            $st = $conn->query("SELECT id, qty, price FROM stock WHERE name = '" . $conn->real_escape_string($ing['name']) . "' LIMIT 1")->fetch_assoc();
            if ($st) {
                if ((float)$st['qty'] < (float)$ing['qty_per_round']) $insufficient[] = $ing['name'];
                $roundCost += (float)$ing['qty_per_round'] * (float)$st['price'];
                $conn->query('UPDATE stock SET qty = GREATEST(0, qty - ' . (float)$ing['qty_per_round'] . ') WHERE id = ' . (int)$st['id']);
            }
        }
        $pricePerBag = $roundCost / $bags;
        $newMax = max((float)$sauce['max_price_per_bag'], $pricePerBag);
        $stmt = $conn->prepare('UPDATE sauces SET stock_qty = stock_qty + ?, max_price_per_bag = ? WHERE id = ?');
        $stmt->bind_param('ddi', $bags, $newMax, $sauceId);
        $stmt->execute();
        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollback();
        json_error('บันทึกไม่สำเร็จ: ' . $e->getMessage(), 500);
    }

    $msg = count($insufficient) > 0
        ? 'บันทึกแล้ว แต่วัตถุดิบไม่พอ: ' . implode(', ', $insufficient)
        : "ทำ \"{$sauce['name']}\" รอบนี้ได้ $bags ถุง — ราคาต่อถุง ฿" . f2($pricePerBag) . ' ✓';
    json_out(['ok' => true, 'message' => $msg]);
}

/* ── GET: รายการสต๊อก + น้ำจิ้มทั้งหมด ───────────────────── */

$stock = [];
$sres = $conn->query('SELECT id, name, qty, unit, min_qty, price FROM stock ORDER BY id');
$crit = 0; $low = 0;
while ($s = $sres->fetch_assoc()) {
    $status = stock_status((float)$s['qty'], (float)$s['min_qty']);
    if ($status === 'critical') $crit++;
    elseif ($status === 'low') $low++;
    $stock[] = [
        'id' => (int)$s['id'], 'name' => $s['name'], 'qty' => (float)$s['qty'], 'unit' => $s['unit'],
        'min' => (float)$s['min_qty'], 'price' => (float)$s['price'], 'status' => $status,
    ];
}

$sauces = [];
$saures = $conn->query('SELECT id, name, stock_qty, max_price_per_bag FROM sauces ORDER BY id');
while ($sa = $saures->fetch_assoc()) {
    $stmt = $conn->prepare('SELECT id, name, qty_per_round, unit FROM sauce_ingredients WHERE sauce_id = ? ORDER BY id');
    $stmt->bind_param('i', $sa['id']);
    $stmt->execute();
    $ings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $sauces[] = [
        'id' => (int)$sa['id'], 'name' => $sa['name'], 'stockQty' => (float)$sa['stock_qty'],
        'maxPricePerBag' => (float)$sa['max_price_per_bag'],
        'ings' => array_map(fn($i) => [
            'id' => (int)$i['id'], 'name' => $i['name'], 'qtyPerRound' => (float)$i['qty_per_round'], 'unit' => $i['unit'],
        ], $ings),
    ];
}

json_out([
    'ok' => true,
    'stock' => $stock,
    'critCount' => $crit,
    'lowCount' => $low,
    'okCount' => count($stock) - $crit - $low,
    'unitOpts' => UNIT_OPTS,
    'sauces' => $sauces,
]);

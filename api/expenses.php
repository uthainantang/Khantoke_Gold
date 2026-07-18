<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/functions.php';

$conn = db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

const CATEGORY_LABELS = [
    'material' => 'ต้นทุนวัตถุดิบ',
    'labor' => 'ค่าแรง',
    'other' => 'อื่นๆ',
];

if ($action === 'add') {
    require_method('POST');
    $body = request_body();
    $date = (string)($body['date'] ?? date('Y-m-d'));
    $category = (string)($body['category'] ?? '');
    if (!isset(CATEGORY_LABELS[$category])) json_error('กรุณาเลือกประเภทรายจ่าย');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) json_error('รูปแบบวันที่ไม่ถูกต้อง');

    $amount = (float)($body['amount'] ?? -1);
    if ($amount <= 0) json_error('กรุณาระบุจำนวนเงินให้ถูกต้อง');

    if ($category === 'material') {
        $stockId = (int)($body['stock_id'] ?? 0);
        $qty = (float)($body['qty'] ?? -1);
        if ($qty <= 0) json_error('กรุณาระบุจำนวนสินค้าให้ถูกต้อง');
        $stock = $conn->query("SELECT id, name, unit FROM stock WHERE id = $stockId")->fetch_assoc();
        if (!$stock) json_error('กรุณาเลือกวัตถุดิบ');
        $unitPrice = $amount / $qty;

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare('INSERT INTO expenses (expense_date, category, stock_id, description, qty, unit, unit_price, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->bind_param('ssisdsdd', $date, $category, $stockId, $stock['name'], $qty, $stock['unit'], $unitPrice, $amount);
            $stmt->execute();

            $upd = $conn->prepare('UPDATE stock SET qty = qty + ?, price = ? WHERE id = ?');
            $upd->bind_param('ddi', $qty, $unitPrice, $stockId);
            $upd->execute();
            $conn->commit();
        } catch (Throwable $e) {
            $conn->rollback();
            json_error('บันทึกไม่สำเร็จ: ' . $e->getMessage(), 500);
        }
        json_out(['ok' => true, 'message' => "บันทึกรายจ่าย \"{$stock['name']}\" ฿" . f2($amount) . " แล้ว ✓ (เพิ่มสต๊อก $qty {$stock['unit']}, ปรับราคาต่อหน่วยเป็น ฿" . f2($unitPrice) . ")"]);
    }

    // labor / other
    $description = trim((string)($body['description'] ?? ''));
    if ($description === '') json_error('กรุณาระบุรายละเอียดรายจ่าย');
    $stmt = $conn->prepare('INSERT INTO expenses (expense_date, category, description, amount) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('sssd', $date, $category, $description, $amount);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "บันทึกรายจ่าย \"$description\" ฿" . f2($amount) . " แล้ว ✓"]);
}

if ($action === 'delete') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT description FROM expenses WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM expenses WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบ \"{$row['description']}\" แล้ว" : 'ลบแล้ว']);
}

// ── GET: รายจ่ายของวันที่ระบุ (ค่าเริ่มต้น = วันนี้ตามปฏิทินจริง ไม่ผูกกับวันที่ออเดอร์) ──
$date = (string)($_GET['date'] ?? date('Y-m-d'));
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) $date = date('Y-m-d');

$stmt = $conn->prepare('SELECT id, category, description, qty, unit, unit_price, amount, created_at FROM expenses WHERE expense_date = ? ORDER BY id DESC');
$stmt->bind_param('s', $date);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$items = [];
$totals = ['material' => 0.0, 'labor' => 0.0, 'other' => 0.0];
foreach ($rows as $r) {
    $totals[$r['category']] += (float)$r['amount'];
    $items[] = [
        'id' => (int)$r['id'],
        'category' => $r['category'],
        'categoryLabel' => CATEGORY_LABELS[$r['category']],
        'description' => $r['description'],
        'qty' => $r['qty'] !== null ? (float)$r['qty'] : null,
        'unit' => $r['unit'],
        'unitPrice' => $r['unit_price'] !== null ? f2((float)$r['unit_price']) : null,
        'amount' => f2((float)$r['amount']),
        'time' => date('H:i', strtotime($r['created_at'])),
    ];
}
$grandTotal = array_sum($totals);

$stockOpts = [];
$sres = $conn->query('SELECT id, name, unit, price FROM stock ORDER BY name');
while ($s = $sres->fetch_assoc()) {
    $stockOpts[] = [
        'id' => (int)$s['id'], 'name' => $s['name'], 'unit' => $s['unit'], 'price' => (float)$s['price'],
        'label' => $s['name'] . ' (' . $s['unit'] . ($s['price'] ? " · ฿" . f2((float)$s['price']) . "/{$s['unit']}" : '') . ')',
    ];
}

json_out([
    'ok' => true,
    'date' => $date,
    'dateLabel' => thai_date_label($date),
    'items' => $items,
    'stockOpts' => $stockOpts,
    'categories' => CATEGORY_LABELS,
    'totals' => [
        'material' => f2($totals['material']),
        'labor' => f2($totals['labor']),
        'other' => f2($totals['other']),
    ],
    'grandTotal' => f2($grandTotal),
]);

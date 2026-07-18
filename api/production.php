<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/functions.php';

$conn = db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

const STATIONS = [
    'soup' => 'น้ำซุป',
    'rice' => 'หุงข้าว',
    'meat' => 'เนื้อและอื่นๆ',
];

function current_order_date_p(mysqli $conn): string
{
    return $conn->query('SELECT order_date FROM settings WHERE id = 1')->fetch_assoc()['order_date'];
}

if ($action === 'add') {
    require_method('POST');
    $body = request_body();
    $stationKey = (string)($body['station'] ?? '');
    $stockId = (int)($body['stock_id'] ?? 0);
    $qty = (float)($body['qty'] ?? 0);
    if (!isset(STATIONS[$stationKey])) json_error('สถานีไม่ถูกต้อง');
    if ($qty <= 0) json_error('กรุณาระบุปริมาณที่ถูกต้อง');

    $date = current_order_date_p($conn);
    $ordersForDate = $conn->query("SELECT COUNT(*) c FROM orders WHERE order_date = '" . $conn->real_escape_string($date) . "'")->fetch_assoc()['c'];
    if ((int)$ordersForDate === 0) json_error('ยังไม่มีออเดอร์สำหรับวันที่นี้');

    $stmt = $conn->prepare('SELECT name, unit, qty, price FROM stock WHERE id = ?');
    $stmt->bind_param('i', $stockId);
    $stmt->execute();
    $stock = $stmt->get_result()->fetch_assoc();
    if (!$stock) json_error('กรุณาเลือกวัตถุดิบ');

    $cost = $qty * (float)$stock['price'];
    $insufficient = (float)$stock['qty'] < $qty;

    $conn->begin_transaction();
    try {
        $ins = $conn->prepare('INSERT INTO station_logs (station_key, production_date, name, qty, unit, cost) VALUES (?, ?, ?, ?, ?, ?)');
        $ins->bind_param('sssdsd', $stationKey, $date, $stock['name'], $qty, $stock['unit'], $cost);
        $ins->execute();

        $upd = $conn->prepare('UPDATE stock SET qty = GREATEST(0, qty - ?) WHERE id = ?');
        $upd->bind_param('di', $qty, $stockId);
        $upd->execute();
        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollback();
        json_error('บันทึกไม่สำเร็จ: ' . $e->getMessage(), 500);
    }
    $msg = $insufficient
        ? "บันทึกแล้ว แต่ \"{$stock['name']}\" ในสต๊อกไม่พอ"
        : "เพิ่ม \"{$stock['name']}\" $qty {$stock['unit']} แล้ว ✓";
    json_out(['ok' => true, 'message' => $msg]);
}

if ($action === 'delete') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT name FROM station_logs WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM station_logs WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบ \"{$row['name']}\" แล้ว" : 'ลบแล้ว']);
}

// ── GET: ข้อมูลหน้าผลิตของวันที่ปัจจุบัน ──
$date = current_order_date_p($conn);
$orderCount = (int)$conn->query("SELECT COUNT(*) c FROM orders WHERE order_date = '" . $conn->real_escape_string($date) . "'")->fetch_assoc()['c'];

$stock = [];
$sres = $conn->query('SELECT id, name, unit, price FROM stock ORDER BY id');
while ($s = $sres->fetch_assoc()) $stock[] = $s;

$stations = [];
$prodTotalCost = 0;
foreach (STATIONS as $key => $label) {
    $stmt = $conn->prepare('SELECT id, name, qty, unit, cost FROM station_logs WHERE station_key = ? AND production_date = ? ORDER BY id');
    $stmt->bind_param('ss', $key, $date);
    $stmt->execute();
    $entries = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $totalCost = array_sum(array_map(fn($e) => (float)$e['cost'], $entries));
    $prodTotalCost += $totalCost;
    $stations[] = [
        'key' => $key,
        'label' => $label,
        'totalCostStr' => f2($totalCost),
        'entries' => array_map(fn($e) => [
            'id' => (int)$e['id'], 'name' => $e['name'], 'qtyStr' => $e['qty'] . ' ' . $e['unit'], 'costStr' => f2((float)$e['cost']),
        ], $entries),
    ];
}

json_out([
    'ok' => true,
    'orderDate' => $date,
    'orderDateLabel' => thai_date_label($date),
    'orderCount' => $orderCount,
    'noOrdersForProdDate' => $orderCount === 0,
    'prodTotalCost' => f2($prodTotalCost),
    'stations' => $stations,
    'stockOpts' => array_map(fn($s) => [
        'id' => (int)$s['id'], 'name' => $s['name'], 'unit' => $s['unit'], 'price' => (float)$s['price'],
        'label' => $s['name'] . ' (' . $s['unit'] . ($s['price'] ? " · ฿" . f2((float)$s['price']) . "/{$s['unit']}" : '') . ')',
    ], $stock),
]);

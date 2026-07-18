<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/functions.php';

$conn = db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

function current_order_date(mysqli $conn): string
{
    return $conn->query('SELECT order_date FROM settings WHERE id = 1')->fetch_assoc()['order_date'];
}

if ($action === 'toggle_menu') {
    require_method('POST');
    $body = request_body();
    $name = trim((string)($body['name'] ?? ''));
    if ($name === '') json_error('ไม่พบชื่อเมนู');
    $stmt = $conn->prepare('UPDATE recipes SET is_today = 1 - is_today WHERE name = ?');
    $stmt->bind_param('s', $name);
    $stmt->execute();
    json_out(['ok' => true]);
}

if ($action === 'add') {
    require_method('POST');
    $body = request_body();
    $customer = trim((string)($body['customer'] ?? ''));
    $items = is_array($body['items'] ?? null) ? $body['items'] : [];
    if ($customer === '') json_error('กรุณาระบุชื่อลูกค้า');
    $items = array_values(array_filter($items, fn($it) => (int)($it['qty'] ?? 0) > 0));
    if (count($items) === 0) json_error('กรุณาระบุจำนวนอย่างน้อย 1 เมนู');

    $date = current_order_date($conn);
    $time = date('H:i');

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare('INSERT INTO orders (order_date, customer_name, order_time, paid) VALUES (?, ?, ?, 0)');
        $stmt->bind_param('sss', $date, $customer, $time);
        $stmt->execute();
        $orderId = $conn->insert_id;

        $istmt = $conn->prepare('INSERT INTO order_items (order_id, menu_name, qty, price) VALUES (?, ?, ?, ?)');
        foreach ($items as $it) {
            $menu = (string)$it['menu'];
            $qty = (int)$it['qty'];
            $price = (float)$it['price'];
            $istmt->bind_param('isid', $orderId, $menu, $qty, $price);
            $istmt->execute();
        }
        $conn->commit();
    } catch (Throwable $e) {
        $conn->rollback();
        json_error('บันทึกออเดอร์ไม่สำเร็จ: ' . $e->getMessage(), 500);
    }
    json_out(['ok' => true, 'message' => "บันทึกออเดอร์ \"$customer\" แล้ว ✓"]);
}

if ($action === 'delete') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $conn->query("DELETE FROM orders WHERE id = $id");
    json_out(['ok' => true, 'message' => 'ลบออเดอร์แล้ว']);
}

// ── GET: ข้อมูลหน้าออเดอร์ทั้งหมดสำหรับวันที่ปัจจุบัน (settings.order_date) ──
$orderDate = current_order_date($conn);

$recipes = [];
$rres = $conn->query('SELECT id, name, price, is_today FROM recipes ORDER BY id');
while ($r = $rres->fetch_assoc()) $recipes[] = $r;

$todayMenus = array_values(array_map(fn($r) => $r['name'], array_filter($recipes, fn($r) => (int)$r['is_today'] === 1)));

$stmt = $conn->prepare('SELECT id, customer_name, order_time FROM orders WHERE order_date = ? ORDER BY id');
$stmt->bind_param('s', $orderDate);
$stmt->execute();
$ordersForDate = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$orderedNamesToday = array_map(fn($o) => $o['customer_name'], $ordersForDate);

$vendors = [];
$vres = $conn->query('SELECT id, name FROM vendors ORDER BY id');
while ($v = $vres->fetch_assoc()) $vendors[] = $v;
$customerChips = array_values(array_filter($vendors, fn($v) => !in_array($v['name'], $orderedNamesToday, true)));

// สรุปยอดต่อเมนูของวันนี้ (จากออเดอร์ของวันที่นี้)
$menuTotals = [];
foreach ($ordersForDate as $o) {
    $istmt = $conn->prepare('SELECT menu_name, qty FROM order_items WHERE order_id = ?');
    $istmt->bind_param('i', $o['id']);
    $istmt->execute();
    $ir = $istmt->get_result();
    while ($it = $ir->fetch_assoc()) {
        $menuTotals[$it['menu_name']] = ($menuTotals[$it['menu_name']] ?? 0) + (int)$it['qty'];
    }
}
$menuSummary = array_map(fn($name) => ['shortName' => $name, 'totalQty' => $menuTotals[$name] ?? 0], $todayMenus);

$orderItems = [];
$orderBoxTotal = 0;
foreach (array_reverse($ordersForDate) as $o) {
    $istmt = $conn->prepare('SELECT menu_name, qty, price FROM order_items WHERE order_id = ?');
    $istmt->bind_param('i', $o['id']);
    $istmt->execute();
    $ir = $istmt->get_result();
    $items = []; $total = 0; $totalBoxes = 0;
    while ($it = $ir->fetch_assoc()) {
        $amt = $it['qty'] * $it['price'];
        $items[] = ['menu' => $it['menu_name'], 'qty' => (int)$it['qty'], 'amt' => fmt_money($amt)];
        $total += $amt;
        $totalBoxes += $it['qty'];
    }
    $orderBoxTotal += $totalBoxes;
    $orderItems[] = [
        'id' => (int)$o['id'], 'customer' => $o['customer_name'], 'time' => $o['order_time'],
        'items' => $items, 'total' => fmt_money($total), 'totalBoxes' => $totalBoxes,
    ];
}

json_out([
    'ok' => true,
    'orderDate' => $orderDate,
    'orderDateLabel' => thai_date_label($orderDate),
    'recipes' => array_map(fn($r) => ['name' => $r['name'], 'price' => (float)$r['price']], $recipes),
    'todayMenus' => $todayMenus,
    'menuSummary' => $menuSummary,
    'customerChips' => $customerChips,
    'noCustomersLeft' => count($customerChips) === 0,
    'orderItems' => $orderItems,
    'orderCount' => count($ordersForDate),
    'orderBoxTotal' => $orderBoxTotal,
]);

<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/functions.php';

$conn = db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'toggle_paid') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $conn->query("UPDATE orders SET paid = 1 - paid WHERE id = $id");
    $row = $conn->query("SELECT paid, customer_name FROM orders WHERE id = $id")->fetch_assoc();
    if (!$row) json_error('ไม่พบออเดอร์', 404);
    json_out([
        'ok' => true,
        'paid' => (bool)$row['paid'],
        'message' => $row['paid'] ? 'บันทึกการจ่ายเงินแล้ว ✓' : 'ยกเลิกการจ่ายเงินแล้ว',
    ]);
}

// ── GET: สรุปข้อมูลหน้าหลัก ──────────────────────────────────
$orders = [];
$res = $conn->query('SELECT id, order_date, customer_name, order_time, paid FROM orders ORDER BY id DESC');
while ($o = $res->fetch_assoc()) {
    $items = [];
    $stmt = $conn->prepare('SELECT menu_name, qty, price FROM order_items WHERE order_id = ?');
    $stmt->bind_param('i', $o['id']);
    $stmt->execute();
    $ir = $stmt->get_result();
    while ($it = $ir->fetch_assoc()) $items[] = $it;
    $o['items'] = $items;
    $orders[] = $o;
}

$totalSalesRaw = 0; $totalBoxesRaw = 0;
$salesByMenu = [];
foreach ($orders as $o) {
    foreach ($o['items'] as $it) {
        $amt = $it['qty'] * $it['price'];
        $totalSalesRaw += $amt;
        $totalBoxesRaw += $it['qty'];
        if (!isset($salesByMenu[$it['menu_name']])) $salesByMenu[$it['menu_name']] = ['qty' => 0, 'amt' => 0];
        $salesByMenu[$it['menu_name']]['qty'] += $it['qty'];
        $salesByMenu[$it['menu_name']]['amt'] += $amt;
    }
}
// ต้นทุนวัตถุดิบจริง (จากรายจ่ายที่บันทึกในหน้า "รายจ่าย") แทนตัวเลขประมาณการเดิม
// ค่าแรง/อื่นๆ หักออกจากกำไรสุทธิด้วย แต่ไม่นับรวมเป็น "ต้นทุนวัตถุดิบ"
$totalCostRaw = 0.0; $otherExpenseRaw = 0.0;
$eres = $conn->query("SELECT category, SUM(amount) total FROM expenses GROUP BY category");
while ($e = $eres->fetch_assoc()) {
    if ($e['category'] === 'material') $totalCostRaw = (float)$e['total'];
    else $otherExpenseRaw += (float)$e['total'];
}
$totalProfitRaw = $totalSalesRaw - $totalCostRaw - $otherExpenseRaw;
$yest = 12400;
$diff = $totalSalesRaw - $yest;
$trendPct = $yest > 0 ? round(($diff / $yest) * 100, 1) : 0;
$salesTrendColor = $diff >= 0 ? '#1A9E5A' : '#D03830';
$salesTrend = ($diff >= 0 ? '+' : '') . $trendPct . '%';
$marginPctRaw = $totalSalesRaw > 0 ? (int)round(($totalProfitRaw / $totalSalesRaw) * 100) : 0;
$marginColor = $marginPctRaw >= 35 ? '#1A9E5A' : ($marginPctRaw >= 20 ? '#E8920A' : '#D03830');

// แจ้งเตือนสต๊อก
$critNames = []; $lowNames = [];
$sres = $conn->query('SELECT name, qty, min_qty FROM stock');
while ($s = $sres->fetch_assoc()) {
    $st = stock_status((float)$s['qty'], (float)$s['min_qty']);
    if ($st === 'critical') $critNames[] = $s['name'];
    elseif ($st === 'low') $lowNames[] = $s['name'];
}
$hasAlert = count($critNames) > 0 || count($lowNames) > 0;
$alertText = ''; $alertColor = '#E8920A'; $alertBg = 'rgba(232,146,10,0.1)'; $alertBorderColor = 'rgba(232,146,10,0.28)';
if (count($critNames) > 0) {
    $alertText = 'วิกฤต: ' . implode(', ', $critNames) . ' — หมดหรือใกล้หมด';
    $alertColor = '#D03830'; $alertBg = 'rgba(208,56,48,0.1)'; $alertBorderColor = 'rgba(208,56,48,0.28)';
} elseif (count($lowNames) > 0) {
    $alertText = 'สต๊อกต่ำ: ' . implode(', ', $lowNames);
}

arsort($salesByMenu);
$topMenus = [];
$rank = 1;
foreach (array_slice($salesByMenu, 0, 3, true) as $name => $d) {
    $topMenus[] = ['rank' => (string)$rank, 'name' => $name, 'qty' => $d['qty'], 'amount' => fmt_money($d['amt'])];
    $rank++;
}

$dashOrders = [];
foreach ($orders as $o) {
    $total = 0; $summaryParts = [];
    foreach ($o['items'] as $it) {
        $total += $it['qty'] * $it['price'];
        $summaryParts[] = $it['menu_name'] . ' x' . $it['qty'];
    }
    $dashOrders[] = [
        'id' => (int)$o['id'],
        'customer' => $o['customer_name'],
        'summary' => implode(', ', $summaryParts),
        'total' => fmt_money($total),
        'dateLabel' => date('j/n', strtotime($o['order_date'])),
        'paid' => (bool)$o['paid'],
    ];
}

json_out([
    'ok' => true,
    'totalSales' => fmt_money($totalSalesRaw),
    'totalBoxes' => $totalBoxesRaw,
    'totalProfit' => fmt_money($totalProfitRaw),
    'otherExpense' => fmt_money($otherExpenseRaw),
    'hasOtherExpense' => $otherExpenseRaw > 0,
    'totalCost' => fmt_money($totalCostRaw),
    'marginPct' => $marginPctRaw,
    'marginColor' => $marginColor,
    'salesTrend' => $salesTrend,
    'salesTrendColor' => $salesTrendColor,
    'hasAlert' => $hasAlert,
    'alertText' => $alertText,
    'alertColor' => $alertColor,
    'alertBg' => $alertBg,
    'alertBorderColor' => $alertBorderColor,
    'topMenus' => $topMenus,
    'orders' => $dashOrders,
]);

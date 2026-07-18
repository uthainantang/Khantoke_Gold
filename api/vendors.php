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
    $phone = trim((string)($body['phone'] ?? ''));
    $address = trim((string)($body['address'] ?? ''));
    if ($name === '') json_error('กรุณาระบุชื่อลูกค้า');
    $stmt = $conn->prepare('INSERT INTO vendors (name, phone, address) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $name, $phone, $address);
    $stmt->execute();
    json_out(['ok' => true, 'message' => "เพิ่ม \"$name\" แล้ว ✓"]);
}

if ($action === 'delete') {
    require_method('POST');
    $body = request_body();
    $id = (int)($body['id'] ?? 0);
    $row = $conn->query("SELECT name FROM vendors WHERE id = $id")->fetch_assoc();
    $conn->query("DELETE FROM vendors WHERE id = $id");
    json_out(['ok' => true, 'message' => $row ? "ลบ \"{$row['name']}\" แล้ว" : 'ลบแล้ว']);
}

// ── GET ──
$vendors = [];
$res = $conn->query('SELECT id, name, phone, address FROM vendors ORDER BY id');
while ($v = $res->fetch_assoc()) {
    // ถ้าชื่อขึ้นต้นด้วยตัวเลข (เช่น "13.พี่ดาว") ให้แสดงเลขเต็มเป็นลำดับ ไม่ใช่แค่หลักแรก
    $initial = preg_match('/^\d+/', $v['name'], $m) ? $m[0] : mb_substr($v['name'], 0, 1, 'UTF-8');
    $vendors[] = [
        'id' => (int)$v['id'], 'name' => $v['name'], 'phone' => $v['phone'], 'address' => $v['address'],
        'initial' => $initial, 'hasAddress' => $v['address'] !== '',
    ];
}
json_out(['ok' => true, 'vendors' => $vendors, 'vendorCount' => count($vendors)]);

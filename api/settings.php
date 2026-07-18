<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../includes/functions.php';

$conn = db();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'toggle_theme') {
    require_method('POST');
    $body = request_body();
    $dark = !empty($body['dark']) ? 1 : 0;
    $conn->query("UPDATE settings SET dark_mode = $dark WHERE id = 1");
    json_out(['ok' => true, 'dark' => (bool)$dark]);
}

if ($action === 'set_order_date') {
    require_method('POST');
    $body = request_body();
    $date = $body['date'] ?? '';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        json_error('รูปแบบวันที่ไม่ถูกต้อง');
    }
    $stmt = $conn->prepare('UPDATE settings SET order_date = ? WHERE id = 1');
    $stmt->bind_param('s', $date);
    $stmt->execute();
    json_out(['ok' => true, 'orderDate' => $date, 'orderDateLabel' => thai_date_label($date)]);
}

// GET เริ่มต้น: คืนค่าการตั้งค่าปัจจุบันทั้งหมด
$row = $conn->query('SELECT dark_mode, order_date FROM settings WHERE id = 1')->fetch_assoc();
json_out([
    'ok' => true,
    'dark' => (bool)$row['dark_mode'],
    'orderDate' => $row['order_date'],
    'orderDateLabel' => thai_date_label($row['order_date']),
]);

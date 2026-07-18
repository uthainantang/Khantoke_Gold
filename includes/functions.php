<?php
/**
 * ฟังก์ชันช่วยเหลือที่ใช้ร่วมกันทุกหน้า/ทุก API
 */

declare(strict_types=1);

function thai_date_label(string $ymd): string
{
    $days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    $months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    $ts = strtotime($ymd);
    if ($ts === false) {
        return $ymd;
    }
    $d = (int)date('w', $ts);
    $day = (int)date('j', $ts);
    $m = (int)date('n', $ts) - 1;
    $y = (int)date('Y', $ts) + 543;
    return "{$days[$d]} {$day} {$months[$m]} {$y}";
}

function fmt_money(float $n): string
{
    return number_format($n, 0);
}

function f2(float $n): string
{
    return number_format($n, 2, '.', '');
}

function stock_status(float $qty, float $min): string
{
    if ($qty === 0.0 || $qty < $min * 0.4) {
        return 'critical';
    }
    if ($qty < $min) {
        return 'low';
    }
    return 'ok';
}

/** ส่งค่ากลับเป็น JSON แล้วจบการทำงาน */
function json_out($data): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $code = 400): void
{
    http_response_code($code);
    json_out(['ok' => false, 'error' => $message]);
}

/** อ่าน body แบบ JSON ของ request (ถ้ามี) รวมกับ $_POST */
function request_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded + $_POST;
        }
    }
    return $_POST;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_error('ต้องใช้ ' . $method . ' method เท่านั้น', 405);
    }
}

/** ต่อ ?v=<เวลาที่แก้ไฟล์ล่าสุด> ท้าย path เพื่อบังคับให้เบราว์เซอร์โหลดไฟล์ใหม่ทุกครั้งที่แก้ไข (cache busting) */
function asset_url(string $path): string
{
    $full = __DIR__ . '/../' . $path;
    $v = is_file($full) ? filemtime($full) : time();
    return $path . '?v=' . $v;
}

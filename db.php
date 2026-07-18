<?php
/**
 * ไฟล์เชื่อมต่อฐานข้อมูล (MySQLi) — include ไฟล์นี้จากทุกไฟล์ที่ต้องคุยกับฐานข้อมูล
 * แก้ค่าคอนฟิกด้านล่างให้ตรงกับเซิร์ฟเวอร์ MySQL ของคุณถ้าไม่ได้ใช้ XAMPP ค่าเริ่มต้น
 */

declare(strict_types=1);

const DB_HOST = '127.0.0.1';
const DB_USER = 'root';
const DB_PASS = '';
const DB_NAME = 'khantoke_gold';
const DB_PORT = 3306;

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function db(): mysqli
{
    static $conn = null;
    if ($conn === null) {
        try {
            $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
            $conn->set_charset('utf8mb4');
        } catch (mysqli_sql_exception $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => false, 'error' => 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    return $conn;
}

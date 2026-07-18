<?php
/**
 * ส่วนหัวร่วมของทุกหน้า — ต้องตั้งตัวแปรก่อน include:
 *   $pageKey   (dashboard|orders|stock|recipes|settings)
 *   $pageTitle (ข้อความหัวข้อหน้า)
 *   $initialDark (bool)
 */
?>
<!DOCTYPE html>
<html lang="th" data-theme="<?= $initialDark ? 'dark' : 'light' ?>">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>Khantoke Gold — <?= htmlspecialchars($pageTitle) ?></title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="<?= asset_url('assets/style.css') ?>" />
</head>
<body>
<div id="kg-app" class="kg-app">

  <div class="kg-main">

    <div class="kg-header">
      <div class="kg-header-left">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="var(--gold-dim)" stroke="var(--gold)" stroke-width="1.5" />
          <text x="18" y="22" text-anchor="middle" font-family="Sarabun,sans-serif" font-weight="800" font-size="11" fill="var(--gold)">KG</text>
        </svg>
        <div>
          <div class="kg-title">Khantoke Gold</div>
          <div class="kg-clock"><span id="kg-clock-date"></span> · <span id="kg-clock-time"></span></div>
        </div>
      </div>
      <button type="button" id="kg-theme-btn" class="kg-theme-btn"><?= $initialDark ? '' : '' ?></button>
    </div>

    <div class="kg-page-header">
      <h1><?= htmlspecialchars($pageTitle) ?></h1>
    </div>

    <div class="kg-content kg-scroll" id="page-root">
      <div style="text-align:center;color:var(--text-3);padding:40px 0;">กำลังโหลด...</div>
    </div>

  </div>

  <div class="kg-nav">
    <a href="index.php" class="<?= $pageKey === 'dashboard' ? 'active' : '' ?>"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2.5"/><rect x="13" y="3" width="8" height="8" rx="2.5"/><rect x="3" y="13" width="8" height="8" rx="2.5"/><rect x="13" y="13" width="8" height="8" rx="2.5"/></svg><span>หน้าหลัก</span></a>
    <a href="orders.php" class="<?= $pageKey === 'orders' ? 'active' : '' ?>"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" fill="currentColor" stroke="none"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg><span>ออเดอร์</span></a>
    <a href="expenses.php" class="<?= $pageKey === 'expenses' ? 'active' : '' ?>"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg><span>รายจ่าย</span></a>
    <a href="stock.php" class="<?= $pageKey === 'stock' ? 'active' : '' ?>"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg><span>สต๊อก</span></a>
    <a href="recipes.php" class="<?= $pageKey === 'recipes' ? 'active' : '' ?>"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg><span>เมนู</span></a>
    <a href="settings.php" class="<?= $pageKey === 'settings' ? 'active' : '' ?>"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg><span>ตั้งค่า</span></a>
  </div>

  <div id="kg-toast" class="kg-toast"></div>
</div>

<script src="<?= asset_url('assets/app.js') ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('kg-theme-btn');
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = dark ? KG_ICONS.sun : KG_ICONS.moon;
});
</script>

(() => {
  const root = document.getElementById('page-root');

  function render(d) {
    const alertHtml = d.hasAlert ? `
      <div class="kg-card" style="background:${d.alertBg};border:1px solid ${d.alertBorderColor};border-radius:14px;padding:11px 14px;margin-bottom:12px;display:flex;align-items:center;gap:10px;">
        <div class="kg-dot" style="background:${d.alertColor};animation:blink 1.4s infinite;"></div>
        <div style="font-size:13px;font-weight:600;color:${d.alertColor};line-height:1.4;flex:1;">${KG.escapeHtml(d.alertText)}</div>
        <a href="stock.php" style="font-size:11px;font-weight:700;color:${d.alertColor};background:${d.alertColor}22;border:none;border-radius:8px;padding:4px 10px;text-decoration:none;white-space:nowrap;">ดูสต๊อก</a>
      </div>` : '';

    const topMenusHtml = d.topMenus.length === 0
      ? `<div style="font-size:13px;color:var(--text-3);padding:8px 0;">ยังไม่มีข้อมูลยอดขาย</div>`
      : d.topMenus.map(tm => `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--divider);">
          <div style="width:26px;height:26px;border-radius:8px;background:var(--gold-dim);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--gold);flex-shrink:0;">${tm.rank}</div>
          <div style="flex:1;font-size:14px;font-weight:500;color:var(--text-1);">${KG.escapeHtml(tm.name)}</div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:14px;font-weight:700;color:var(--gold);">฿${tm.amount}</div>
            <div style="font-size:11px;color:var(--text-3);">${tm.qty} กล่อง</div>
          </div>
        </div>`).join('');

    const ordersHtml = d.orders.map(o => `
      <div style="padding:11px 0;border-bottom:1px solid var(--divider);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:5px;">
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:700;color:var(--text-1);">${KG.escapeHtml(o.customer)}</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:2px;">${KG.escapeHtml(o.summary)}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px;">ส่ง ${o.dateLabel}</div>
          </div>
          <div style="font-size:15px;font-weight:800;color:var(--gold);white-space:nowrap;">฿${o.total}</div>
        </div>
        <button type="button" data-toggle-paid="${o.id}" style="width:100%;min-height:40px;border-radius:10px;border:1.5px solid ${o.paid ? 'rgba(26,158,90,0.3)' : 'var(--gold)'};background:${o.paid ? 'rgba(26,158,90,0.12)' : 'var(--gold)'};color:${o.paid ? '#1A9E5A' : '#111018'};font-family:'Sarabun',sans-serif;font-size:13px;font-weight:700;cursor:pointer;margin-top:6px;">
          ${o.paid ? 'จ่ายแล้ว ✓' : 'จ่ายเงิน'}
        </button>
      </div>`).join('');

    root.innerHTML = `
      ${alertHtml}
      <div class="kg-grid-2 kg-mb10">
        <div class="kg-card">
          <div style="font-size:11px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">ยอดขายวันนี้</div>
          <div style="font-size:28px;font-weight:800;color:var(--gold);line-height:1;">${d.totalSales}</div>
          <div style="display:flex;align-items:center;gap:5px;margin-top:5px;">
            <span style="font-size:12px;color:var(--text-3);">฿</span>
            <span style="font-size:12px;font-weight:700;color:${d.salesTrendColor};background:${d.salesTrendColor}20;border-radius:6px;padding:2px 7px;">${d.salesTrend}</span>
          </div>
        </div>
        <div class="kg-card">
          <div style="font-size:11px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">กล่องที่ขาย</div>
          <div style="font-size:28px;font-weight:800;color:var(--gold);line-height:1;">${d.totalBoxes}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:5px;">กล่อง วันนี้</div>
        </div>
      </div>
      <div class="kg-grid-2 kg-mb12">
        <div class="kg-card">
          <div style="font-size:11px;font-weight:600;color:var(--text-2);letter-spacing:0.5px;margin-bottom:6px;">กำไรสุทธิ</div>
          <div style="font-size:24px;font-weight:800;color:#1A9E5A;line-height:1;">${d.totalProfit}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:5px;">
            <span style="font-size:12px;color:var(--text-3);">฿</span>
            <span style="font-size:11px;font-weight:700;color:${d.marginColor};background:${d.marginColor}20;border-radius:6px;padding:2px 7px;">${d.marginPct}%</span>
          </div>
        </div>
        <div class="kg-card">
          <div style="font-size:11px;font-weight:600;color:var(--text-2);letter-spacing:0.5px;margin-bottom:6px;">ต้นทุนวัตถุดิบ</div>
          <div style="font-size:24px;font-weight:800;color:#E8920A;line-height:1;">${d.totalCost}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:5px;">฿ วันนี้</div>
        </div>
      </div>
      <div class="kg-card kg-mb12">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:12px;">เมนูขายดีวันนี้</div>
        ${topMenusHtml}
      </div>
      <div class="kg-card">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:12px;">รายการออเดอร์ที่สั่ง</div>
        ${ordersHtml}
      </div>
    `;

    root.querySelectorAll('[data-toggle-paid]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await KG.apiPost('api/dashboard.php?action=toggle_paid', { id: btn.dataset.togglePaid });
          KG.toast(res.message);
          poller.refreshNow();
        } catch (e) {
          KG.toast('เกิดข้อผิดพลาด: ' + e.message);
        }
      });
    });
  }

  async function load() {
    const d = await KG.apiGet('api/dashboard.php');
    render(d);
  }

  const poller = KG.startPolling(load, 5000);
})();

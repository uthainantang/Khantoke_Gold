(() => {
  const root = document.getElementById('page-root');
  const local = { customer: '', qtyMap: {} };

  function render(d) {
    const menuChipsHtml = d.recipes.map(r => {
      const active = d.todayMenus.includes(r.name);
      return `<button type="button" class="kg-chip ${active ? 'active' : ''}" data-toggle-menu="${KG.escapeHtml(r.name)}">${KG.escapeHtml(r.name)}</button>`;
    }).join('');

    const menuSummaryHtml = d.menuSummary.map(ms => `
      <div style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:13px;padding:11px 13px;flex-shrink:0;min-width:94px;">
        <div style="font-size:11px;color:var(--text-3);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:84px;">${KG.escapeHtml(ms.shortName)}</div>
        <div style="font-size:24px;font-weight:800;color:var(--gold);line-height:1.1;">${ms.totalQty}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:2px;">กล่อง</div>
      </div>`).join('');

    const oMenuItems = d.todayMenus.map(name => {
      const r = d.recipes.find(x => x.name === name);
      return { menu: name, price: r ? r.price : 0, qty: local.qtyMap[name] || 0 };
    });
    const oTotalBoxes = oMenuItems.reduce((a, mi) => a + mi.qty, 0);
    const oTotalAmt = KG.fmt(oMenuItems.reduce((a, mi) => a + mi.qty * mi.price, 0));

    const customerChipsHtml = d.customerChips.map(cc => `
      <button type="button" class="kg-chip ${local.customer === cc.name ? 'active' : ''}" data-select-customer="${KG.escapeHtml(cc.name)}">${KG.escapeHtml(cc.name)}</button>
    `).join('');

    const qtyRowsHtml = oMenuItems.map(mi => `
      <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid var(--divider);">
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:600;color:var(--text-1);">${KG.escapeHtml(mi.menu)}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:1px;">฿${mi.price} / กล่อง</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <button type="button" class="kg-stepper-btn" data-dec="${KG.escapeHtml(mi.menu)}">−</button>
          <div style="font-size:26px;font-weight:800;color:var(--text-1);min-width:36px;text-align:center;">${mi.qty}</div>
          <button type="button" class="kg-stepper-btn plus" data-inc="${KG.escapeHtml(mi.menu)}">+</button>
        </div>
      </div>`).join('');

    const orderItemsHtml = d.orderItems.map(ord => `
      <div style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:13px;padding:13px 14px;margin-bottom:9px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-size:15px;font-weight:700;color:var(--text-1);">${KG.escapeHtml(ord.customer)}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="font-size:11px;color:var(--text-3);">${ord.time}</div>
            <button type="button" class="kg-btn-delete" data-delete-order="${ord.id}">ลบ</button>
          </div>
        </div>
        ${ord.items.map(oi => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--divider);">
            <div style="font-size:13px;color:var(--text-2);">${KG.escapeHtml(oi.menu)}</div>
            <div style="font-size:13px;color:var(--text-1);">${oi.qty} กล่อง <span style="font-weight:700;color:var(--gold);">฿${oi.amt}</span></div>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <div style="font-size:12px;color:var(--text-3);">${ord.totalBoxes} กล่อง</div>
          <div style="font-size:15px;font-weight:800;color:var(--gold);">฿${ord.total}</div>
        </div>
      </div>`).join('');

    root.innerHTML = `
      <div class="kg-card-tight kg-mb12" style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;">
          <label class="kg-label">วันที่ออเดอร์ / ผลิต</label>
          <input type="date" id="order-date-input" class="kg-input strong" value="${d.orderDate}" />
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:11px;color:var(--text-3);">แสดงผล</div>
          <div style="font-size:14px;font-weight:700;color:var(--gold);white-space:nowrap;">${d.orderDateLabel}</div>
        </div>
      </div>

      <div class="kg-card-tight kg-mb12">
        <div class="kg-section-label">เมนูที่ทำวันนี้ — กดเลือก</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">${menuChipsHtml}</div>
      </div>

      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;margin-bottom:12px;">
        ${menuSummaryHtml}
        <div style="background:var(--gold-dim);border:1.5px solid var(--gold-border);border-radius:13px;padding:11px 13px;flex-shrink:0;min-width:94px;">
          <div style="font-size:11px;color:var(--text-2);margin-bottom:3px;">รวมทุกเมนู</div>
          <div style="font-size:24px;font-weight:800;color:var(--gold);line-height:1.1;">${oTotalBoxes}</div>
          <div style="font-size:11px;color:var(--text-2);margin-top:2px;">฿${oTotalAmt}</div>
        </div>
      </div>

      <div class="kg-card kg-mb12">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:13px;">รับออเดอร์จากลูกค้า</div>
        <div style="margin-bottom:13px;">
          <label class="kg-label">เลือกลูกค้า</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">${customerChipsHtml}</div>
          ${d.noCustomersLeft ? '<div style="font-size:13px;color:var(--text-3);padding:6px 0;">ลูกค้าทั้งหมดสั่งของวันนี้แล้ว</div>' : ''}
        </div>
        ${qtyRowsHtml}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 14px;">
          <div style="font-size:13px;color:var(--text-2);">รวม <span style="font-weight:700;color:var(--text-1);">${oTotalBoxes} กล่อง</span></div>
          <div style="font-size:16px;font-weight:800;color:var(--gold);">฿${oTotalAmt}</div>
        </div>
        <button type="button" id="btn-add-order" class="kg-btn-primary">บันทึกออเดอร์</button>
      </div>

      <div class="kg-section-label">รายการวันที่ ${d.orderDateLabel} (${d.orderCount} ร้าน)</div>
      ${orderItemsHtml}
    `;

    document.getElementById('order-date-input').addEventListener('change', async (e) => {
      try {
        await KG.apiPost('api/settings.php?action=set_order_date', { date: e.target.value });
        poller.refreshNow();
      } catch (err) { KG.toast('เปลี่ยนวันที่ไม่สำเร็จ: ' + err.message); }
    });

    root.querySelectorAll('[data-toggle-menu]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await KG.apiPost('api/orders.php?action=toggle_menu', { name: btn.dataset.toggleMenu });
          poller.refreshNow();
        } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
      });
    });

    root.querySelectorAll('[data-select-customer]').forEach(btn => {
      btn.addEventListener('click', () => {
        local.customer = btn.dataset.selectCustomer;
        render(d);
      });
    });

    root.querySelectorAll('[data-inc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.inc;
        local.qtyMap[m] = (local.qtyMap[m] || 0) + 1;
        render(d);
      });
    });
    root.querySelectorAll('[data-dec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.dec;
        local.qtyMap[m] = Math.max(0, (local.qtyMap[m] || 0) - 1);
        render(d);
      });
    });

    root.querySelectorAll('[data-delete-order]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await KG.apiPost('api/orders.php?action=delete', { id: btn.dataset.deleteOrder });
          KG.toast(res.message);
          poller.refreshNow();
        } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
      });
    });

    document.getElementById('btn-add-order').addEventListener('click', async () => {
      if (!local.customer) { KG.toast('กรุณาระบุชื่อลูกค้า'); return; }
      const items = oMenuItems.filter(mi => mi.qty > 0).map(mi => ({ menu: mi.menu, qty: mi.qty, price: mi.price }));
      if (items.length === 0) { KG.toast('กรุณาระบุจำนวนอย่างน้อย 1 เมนู'); return; }
      try {
        const res = await KG.apiPost('api/orders.php?action=add', { customer: local.customer, items });
        KG.toast(res.message);
        local.customer = ''; local.qtyMap = {};
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    });
  }

  async function load() {
    const d = await KG.apiGet('api/orders.php');
    // ถ้าลูกค้าที่เลือกไว้ถูกบันทึกไปแล้ว (จากอีกแท็บ) ให้ล้างการเลือก
    if (local.customer && !d.customerChips.some(c => c.name === local.customer)) local.customer = '';
    render(d);
  }

  const poller = KG.startPolling(load, 5000);
})();

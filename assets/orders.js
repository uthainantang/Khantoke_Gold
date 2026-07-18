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

    const mx = d.matrix || { menus: [], rows: [], colTotals: {}, grandTotal: 0 };
    const thStyle = 'padding:6px 3px;font-size:10px;line-height:1.2;font-weight:700;color:var(--text-2);background:var(--gold-dim);border-bottom:1.5px solid var(--gold-border);text-align:center;overflow-wrap:break-word;word-break:break-word;position:sticky;top:0;';
    const thNoStyle = thStyle + 'width:20px;';
    const thNameStyle = thStyle + 'width:52px;text-align:left;';
    const thMenuStyle = thStyle + 'width:36px;';
    const tdStyle = 'padding:6px 3px;font-size:12px;color:var(--text-1);border-bottom:1px solid var(--divider);text-align:center;';
    const tdNameStyle = 'padding:6px 4px;font-size:12px;color:var(--text-1);border-bottom:1px solid var(--divider);text-align:left;overflow-wrap:break-word;word-break:break-word;';
    const delBtnStyle = 'font-size:10px;color:#D03830;background:rgba(208,56,48,0.09);border:1px solid rgba(208,56,48,0.2);border-radius:6px;padding:3px 5px;cursor:pointer;font-family:\'Sarabun\',sans-serif;font-weight:600;';

    const matrixHeadHtml = `
      <tr>
        <th style="${thNoStyle}">ลำดับ</th>
        <th style="${thNameStyle}">รายชื่อ</th>
        ${mx.menus.map(m => `<th style="${thMenuStyle}">${KG.escapeHtml(m)}</th>`).join('')}
        <th style="${thNoStyle}">รวม</th>
        <th style="${thNoStyle}"></th>
      </tr>`;

    const matrixRowsHtml = mx.rows.map((r, i) => {
      const rowBg = i % 2 === 0 ? 'var(--card-bg)' : 'var(--input-bg)';
      return `
      <tr style="background:${rowBg};">
        <td style="${tdStyle}">${r.no !== null ? KG.escapeHtml(r.no) : '-'}</td>
        <td style="${tdNameStyle}">${KG.escapeHtml(r.name)}</td>
        ${mx.menus.map(m => `<td style="${tdStyle}">${r.cells[m] ? r.cells[m] : ''}</td>`).join('')}
        <td style="${tdStyle}font-weight:800;color:var(--gold);">${r.rowTotal}</td>
        <td style="${tdStyle}">${r.orderId ? `<button type="button" style="${delBtnStyle}" data-delete-order="${r.orderId}">✕</button>` : ''}</td>
      </tr>`;
    }).join('');

    const matrixFootHtml = `
      <tr>
        <td colspan="2" style="${tdStyle}text-align:left;font-weight:700;background:var(--gold-dim);">รวม</td>
        ${mx.menus.map(m => `<td style="${tdStyle}font-weight:800;background:var(--gold-dim);">${mx.colTotals[m] || 0}</td>`).join('')}
        <td style="${tdStyle}font-weight:800;color:var(--gold);background:var(--gold-dim);">${mx.grandTotal}</td>
        <td style="${tdStyle}background:var(--gold-dim);"></td>
      </tr>`;

    const matrixTableHtml = mx.rows.length === 0
      ? `<div class="kg-card" style="text-align:center;color:var(--text-3);font-size:13px;">ยังไม่มีเมนู/ออเดอร์สำหรับวันที่นี้</div>`
      : `<div class="kg-card" style="padding:0;overflow-x:auto;">
          <table style="table-layout:fixed;border-collapse:collapse;">
            <thead>${matrixHeadHtml}</thead>
            <tbody>${matrixRowsHtml}</tbody>
            <tfoot>${matrixFootHtml}</tfoot>
          </table>
        </div>`;

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
      ${matrixTableHtml}
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

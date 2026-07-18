(() => {
  const root = document.getElementById('page-root');
  const local = { addingStation: '', stockId: '', qty: '' };

  function render(d) {
    const stockById = {};
    d.stockOpts.forEach(s => { stockById[s.id] = s; });

    const stationsHtml = d.stations.map(st => {
      const adding = local.addingStation === st.key;
      const entriesHtml = st.entries.map(en => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--divider);gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:500;color:var(--text-1);">${KG.escapeHtml(en.name)}</div>
            <div style="font-size:11px;color:var(--text-3);">${KG.escapeHtml(en.qtyStr)}</div>
          </div>
          <div style="font-size:13px;font-weight:700;color:var(--text-1);flex-shrink:0;">฿${en.costStr}</div>
          <button type="button" class="kg-btn-delete" data-delete-entry="${en.id}">ลบ</button>
        </div>`).join('');

      const selected = stockById[local.stockId] || d.stockOpts[0];
      const unit = selected ? selected.unit : '-';
      const preview = selected ? KG.f2((parseFloat(local.qty) || 0) * selected.price) : '0.00';

      const formHtml = adding ? `
        <div style="display:flex;flex-direction:column;gap:7px;padding-top:8px;border-top:1px solid var(--divider);">
          <select class="kg-select gold" data-stock-select="${st.key}">
            ${d.stockOpts.map(s => `<option value="${s.id}" ${String(s.id) === String(local.stockId) ? 'selected' : ''}>${KG.escapeHtml(s.label)}</option>`).join('')}
          </select>
          <input type="number" class="kg-input gold" data-qty-input="${st.key}" placeholder="ปริมาณที่ใช้ (${KG.escapeHtml(unit)})" inputmode="decimal" value="${KG.escapeHtml(local.qty)}" />
          <div style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:10px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:12px;color:var(--text-2);">ราคา</div>
            <div style="font-size:15px;font-weight:800;color:var(--gold);" id="cost-preview-${st.key}">฿${preview}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="kg-btn-gold-sm" data-save-add="${st.key}">บันทึก (หักสต๊อก)</button>
            <button type="button" class="kg-btn-ghost" data-cancel-add>ยกเลิก</button>
          </div>
        </div>` : `
        <button type="button" class="kg-btn-dashed" data-start-add="${st.key}" ${d.noOrdersForProdDate ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>+ เพิ่มปริมาณวัตถุดิบที่ใช้</button>`;

      return `
        <div class="kg-card-tight" style="padding:0;overflow:hidden;margin-bottom:11px;">
          <div style="padding:14px;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:15px;font-weight:700;color:var(--text-1);">${KG.escapeHtml(st.label)}</div>
            <div style="text-align:right;">
              <div style="font-size:11px;color:var(--text-3);">ต้นทุนรวม</div>
              <div style="font-size:16px;font-weight:800;color:var(--gold);">฿${st.totalCostStr}</div>
            </div>
          </div>
          ${st.entries.length > 0 ? `<div style="padding:0 14px;">${entriesHtml}</div>` : ''}
          <div style="padding:12px 14px 14px;">${formHtml}</div>
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="kg-card-tight kg-mb12" style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;">
          <label class="kg-label">วันที่ผลิต (ตรงกับออเดอร์)</label>
          <input type="date" id="prod-date-input" class="kg-input strong" value="${d.orderDate}" />
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:11px;color:var(--text-3);">ออเดอร์วันนี้</div>
          <div style="font-size:14px;font-weight:700;color:var(--gold);">${d.orderCount} ร้าน</div>
        </div>
      </div>
      ${d.noOrdersForProdDate ? `
        <div style="background:rgba(208,56,48,0.1);border:1px solid rgba(208,56,48,0.28);border-radius:14px;padding:12px 14px;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:600;color:#D03830;">ยังไม่มีออเดอร์สำหรับวันที่ ${d.orderDateLabel} — ต้องรับออเดอร์ก่อนจึงจะเพิ่มการผลิตได้</div>
        </div>` : ''}
      <div style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:16px;padding:14px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--text-2);">ต้นทุนการผลิตวันนี้ (รวมทุกส่วน)</div>
          <div style="font-size:24px;font-weight:800;color:var(--gold);line-height:1.2;">฿${d.prodTotalCost}</div>
        </div>
        <div style="font-size:12px;color:var(--text-3);text-align:right;">ผลิตพร้อมกันทั้งหมด<br/>แบ่ง 3 ส่วน</div>
      </div>
      ${stationsHtml}
    `;

    document.getElementById('prod-date-input').addEventListener('change', async (e) => {
      try {
        await KG.apiPost('api/settings.php?action=set_order_date', { date: e.target.value });
        poller.refreshNow();
      } catch (err) { KG.toast('เปลี่ยนวันที่ไม่สำเร็จ: ' + err.message); }
    });

    root.querySelectorAll('[data-start-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (d.noOrdersForProdDate) { KG.toast('ยังไม่มีออเดอร์สำหรับวันที่นี้'); return; }
        local.addingStation = btn.dataset.startAdd;
        local.stockId = d.stockOpts[0] ? d.stockOpts[0].id : '';
        local.qty = '';
        render(d);
      });
    });
    root.querySelectorAll('[data-cancel-add]').forEach(btn => btn.addEventListener('click', () => { local.addingStation = ''; render(d); }));
    root.querySelectorAll('[data-stock-select]').forEach(sel => sel.addEventListener('change', () => { local.stockId = sel.value; render(d); }));
    root.querySelectorAll('[data-qty-input]').forEach(inp => inp.addEventListener('input', () => {
      local.qty = inp.value;
      const key = inp.dataset.qtyInput;
      const selected = stockById[local.stockId] || d.stockOpts[0];
      const preview = document.getElementById('cost-preview-' + key);
      if (preview) preview.textContent = '฿' + KG.f2((parseFloat(local.qty) || 0) * (selected ? selected.price : 0));
    }));

    root.querySelectorAll('[data-save-add]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await KG.apiPost('api/production.php?action=add', { station: btn.dataset.saveAdd, stock_id: local.stockId, qty: local.qty });
          KG.toast(res.message);
          local.addingStation = ''; local.qty = '';
          poller.refreshNow();
        } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
      });
    });

    root.querySelectorAll('[data-delete-entry]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await KG.apiPost('api/production.php?action=delete', { id: btn.dataset.deleteEntry });
          KG.toast(res.message);
          poller.refreshNow();
        } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
      });
    });
  }

  async function load() {
    const d = await KG.apiGet('api/production.php');
    render(d);
  }

  const poller = KG.startPolling(load, 5000);
})();

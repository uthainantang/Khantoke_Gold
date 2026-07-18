(() => {
  const root = document.getElementById('page-root');
  const todayStr = new Date().toISOString().slice(0, 10);
  const local = {
    date: todayStr,
    category: 'material',
    stockId: '', qty: '', amount: '', description: '',
  };

  const CAT_META = {
    material: { label: 'ต้นทุนวัตถุดิบ', color: '#D03830', bg: 'rgba(208,56,48,0.1)', border: 'rgba(208,56,48,0.28)' },
    labor: { label: 'ค่าแรง', color: '#E8920A', bg: 'rgba(232,146,10,0.1)', border: 'rgba(232,146,10,0.28)' },
    other: { label: 'อื่นๆ', color: 'var(--text-2)', bg: 'var(--input-bg)', border: 'var(--card-border)' },
  };

  function render(d) {
    const stockById = {};
    (d.stockOpts || []).forEach(s => { stockById[s.id] = s; });
    const selectedStock = stockById[local.stockId] || (d.stockOpts || [])[0];
    const previewUnit = selectedStock ? selectedStock.unit : '-';
    const previewUnitPrice = (selectedStock && parseFloat(local.qty) > 0)
      ? KG.f2((parseFloat(local.amount) || 0) / parseFloat(local.qty))
      : '0.00';

    const catChipsHtml = Object.entries(CAT_META).map(([key, m]) => {
      const active = local.category === key;
      return `<button type="button" class="kg-chip ${active ? 'active' : ''}" data-select-cat="${key}">${m.label}</button>`;
    }).join('');

    const materialFieldsHtml = `
      <div style="margin-bottom:11px;">
        <label class="kg-label">เลือกวัตถุดิบ</label>
        <select id="exp-stock" class="kg-select">
          ${(d.stockOpts || []).map(s => `<option value="${s.id}" ${String(s.id) === String(local.stockId) ? 'selected' : ''}>${KG.escapeHtml(s.label)}</option>`).join('')}
        </select>
      </div>
      <div class="kg-grid-2" style="margin-bottom:11px;">
        <div>
          <label class="kg-label">จำนวนสินค้า (${KG.escapeHtml(previewUnit)})</label>
          <input type="number" id="exp-qty" class="kg-input strong" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.qty)}" />
        </div>
        <div>
          <label class="kg-label">จำนวนเงิน (฿)</label>
          <input type="number" id="exp-amount" class="kg-input strong" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.amount)}" />
        </div>
      </div>
      <div style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:12px;padding:12px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:13px;font-weight:600;color:var(--text-2);">ราคาต่อหน่วย (คำนวณให้)</div>
        <div style="font-size:20px;font-weight:800;color:var(--gold);" id="exp-price-preview">฿${previewUnitPrice}</div>
      </div>
      <div style="font-size:11px;color:var(--text-3);margin-bottom:14px;">บันทึกแล้วจะเพิ่มจำนวนเข้าสต๊อกและปรับราคาต่อหน่วยให้อัตโนมัติ</div>
    `;

    const otherFieldsHtml = `
      <div style="margin-bottom:14px;">
        <label class="kg-label">รายละเอียด</label>
        <input type="text" id="exp-desc" class="kg-input" placeholder="${local.category === 'labor' ? 'เช่น ค่าแรงถอนวันนี้...' : 'เช่น ค่าแก๊ส, ค่าน้ำมัน...'}" value="${KG.escapeHtml(local.description)}" />
      </div>
      <div style="margin-bottom:14px;">
        <label class="kg-label">จำนวนเงิน (฿)</label>
        <input type="number" id="exp-amount" class="kg-input strong" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.amount)}" />
      </div>
    `;

    const summaryCardsHtml = Object.entries(CAT_META).map(([key, m]) => `
      <div style="background:${m.bg};border:1px solid ${m.border};border-radius:13px;padding:11px;text-align:center;">
        <div style="font-size:16px;font-weight:800;color:${m.color};line-height:1.2;">฿${KG.fmt(d.totals ? d.totals[key] : 0)}</div>
        <div style="font-size:10px;font-weight:700;color:${m.color};margin-top:3px;">${m.label}</div>
      </div>`).join('');

    const thStyle = 'padding:6px 4px;font-size:10px;line-height:1.2;font-weight:700;color:var(--text-2);background:var(--gold-dim);border-bottom:1.5px solid var(--gold-border);text-align:center;position:sticky;top:0;';
    const tdStyle = 'padding:6px 4px;font-size:11px;color:var(--text-1);border-bottom:1px solid var(--divider);text-align:center;overflow-wrap:break-word;word-break:break-word;';
    const delBtnStyle = 'font-size:10px;color:#D03830;background:rgba(208,56,48,0.09);border:1px solid rgba(208,56,48,0.2);border-radius:6px;padding:3px 5px;cursor:pointer;font-family:\'Sarabun\',sans-serif;font-weight:600;';

    const items = d.items || [];
    const tableHtml = items.length === 0
      ? `<div class="kg-card" style="text-align:center;color:var(--text-3);font-size:13px;">ยังไม่มีรายจ่ายวันที่นี้</div>`
      : `<div class="kg-card" style="padding:0;overflow-x:auto;">
          <table style="table-layout:fixed;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="${thStyle}width:36px;">เวลา</th>
                <th style="${thStyle}width:54px;">ประเภท</th>
                <th style="${thStyle}width:64px;text-align:left;">รายการ</th>
                <th style="${thStyle}width:44px;">จำนวน</th>
                <th style="${thStyle}width:44px;">฿/หน่วย</th>
                <th style="${thStyle}width:48px;">เงิน</th>
                <th style="${thStyle}width:22px;"></th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it, i) => {
                const m = CAT_META[it.category];
                const rowBg = i % 2 === 0 ? 'var(--card-bg)' : 'var(--input-bg)';
                return `
                <tr style="background:${rowBg};">
                  <td style="${tdStyle}">${it.time}</td>
                  <td style="${tdStyle}color:${m.color};font-weight:700;">${m.label}</td>
                  <td style="${tdStyle}text-align:left;">${KG.escapeHtml(it.description)}</td>
                  <td style="${tdStyle}">${it.qty !== null ? it.qty + ' ' + KG.escapeHtml(it.unit || '') : '-'}</td>
                  <td style="${tdStyle}">${it.unitPrice !== null ? '฿' + it.unitPrice : '-'}</td>
                  <td style="${tdStyle}font-weight:800;color:var(--gold);">฿${it.amount}</td>
                  <td style="${tdStyle}"><button type="button" style="${delBtnStyle}" data-delete-expense="${it.id}">✕</button></td>
                </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="${tdStyle}text-align:left;font-weight:700;background:var(--gold-dim);">รวมทั้งหมด</td>
                <td style="${tdStyle}font-weight:800;color:var(--gold);background:var(--gold-dim);">฿${d.grandTotal}</td>
                <td style="${tdStyle}background:var(--gold-dim);"></td>
              </tr>
            </tfoot>
          </table>
        </div>`;

    root.innerHTML = `
      <div class="kg-card-tight kg-mb12" style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;">
          <label class="kg-label">วันที่</label>
          <input type="date" id="exp-date-input" class="kg-input strong" value="${d.date}" />
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:11px;color:var(--text-3);">แสดงผล</div>
          <div style="font-size:14px;font-weight:700;color:var(--gold);white-space:nowrap;">${d.dateLabel}</div>
        </div>
      </div>

      <div class="kg-grid-3 kg-mb12">${summaryCardsHtml}</div>

      <div class="kg-card kg-mb12">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:13px;">เพิ่มรายจ่าย</div>
        <div style="margin-bottom:13px;">
          <label class="kg-label">ประเภท</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">${catChipsHtml}</div>
        </div>
        ${local.category === 'material' ? materialFieldsHtml : otherFieldsHtml}
        <button type="button" id="btn-add-expense" class="kg-btn-primary">บันทึกรายจ่าย</button>
      </div>

      <div class="kg-section-label">รายการวันที่ ${d.dateLabel} (${items.length} รายการ)</div>
      ${tableHtml}
    `;

    document.getElementById('exp-date-input').addEventListener('change', async (e) => {
      local.date = e.target.value;
      try { await load(); } catch (err) { KG.toast('โหลดข้อมูลไม่สำเร็จ: ' + err.message); }
    });

    root.querySelectorAll('[data-select-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        local.category = btn.dataset.selectCat;
        render(d);
      });
    });

    const stockSel = document.getElementById('exp-stock');
    if (stockSel) stockSel.addEventListener('change', () => { local.stockId = stockSel.value; render(d); });

    const qtyInp = document.getElementById('exp-qty');
    const amountInp = document.getElementById('exp-amount');
    const descInp = document.getElementById('exp-desc');

    function updatePricePreview() {
      const preview = document.getElementById('exp-price-preview');
      if (!preview) return;
      const q = parseFloat(local.qty) || 0;
      const a = parseFloat(local.amount) || 0;
      preview.textContent = '฿' + (q > 0 ? KG.f2(a / q) : '0.00');
    }
    if (qtyInp) qtyInp.addEventListener('input', () => { local.qty = qtyInp.value; updatePricePreview(); });
    if (amountInp) amountInp.addEventListener('input', () => { local.amount = amountInp.value; if (local.category === 'material') updatePricePreview(); });
    if (descInp) descInp.addEventListener('input', () => { local.description = descInp.value; });

    root.querySelectorAll('[data-delete-expense]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const res = await KG.apiPost('api/expenses.php?action=delete', { id: btn.dataset.deleteExpense });
          KG.toast(res.message);
          poller.refreshNow();
        } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
      });
    });

    document.getElementById('btn-add-expense').addEventListener('click', async () => {
      const payload = { date: local.date, category: local.category, amount: local.amount };
      if (local.category === 'material') {
        payload.stock_id = local.stockId;
        payload.qty = local.qty;
      } else {
        payload.description = local.description;
      }
      try {
        const res = await KG.apiPost('api/expenses.php?action=add', payload);
        KG.toast(res.message);
        local.qty = ''; local.amount = ''; local.description = '';
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    });
  }

  async function load() {
    const d = await KG.apiGet('api/expenses.php?date=' + encodeURIComponent(local.date));
    if (!local.stockId && d.stockOpts && d.stockOpts[0]) local.stockId = d.stockOpts[0].id;
    render(d);
  }

  const poller = KG.startPolling(load, 6000);
})();

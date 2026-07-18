(() => {
  const root = document.getElementById('page-root');
  const local = {
    showAddMat: false, matName: '', matQty: '', matUnit: 'กก.', matPrice: '', matMin: '',
    editingStockId: null, editName: '', editQty: '', editUnit: 'กก.', editMin: '', editPrice: '',
    showAddSauce: false, newSauceName: '',
    expandedSauceId: null, editingSauceNameId: null, editSauceName: '', editSauceQty: '', editSaucePrice: '',
    addingIngSauceId: null, newSIngStockId: '', newSIngQty: '',
    addingQtySauceId: null, newSauceBags: '',
  };

  const STATUS_META = {
    critical: { color: '#D03830', bg: 'rgba(208,56,48,0.12)', border: 'rgba(208,56,48,0.4)', label: 'วิกฤต', anim: 'blink 1.2s infinite' },
    low: { color: '#E8920A', bg: 'rgba(232,146,10,0.12)', border: 'rgba(232,146,10,0.32)', label: 'ต่ำ', anim: 'none' },
    ok: { color: '#1A9E5A', bg: 'rgba(26,158,90,0.12)', border: 'var(--card-border)', label: 'ปกติ', anim: 'none' },
  };

  function render(d) {
    const matQtyNum = parseFloat(local.matQty) || 0;
    const matPriceNum = parseFloat(local.matPrice) || 0;
    const matPerUnit = matQtyNum > 0 ? matPriceNum / matQtyNum : 0;
    const matTotal = matQtyNum > 0 ? `฿${KG.f2(matPerUnit)} / ${local.matUnit}` : '—';

    const addMatFormHtml = local.showAddMat ? `
      <div class="kg-card kg-mb12">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:13px;">เพิ่มวัตถุดิบใหม่</div>
        <div style="margin-bottom:11px;">
          <label class="kg-label">ชื่อวัตถุดิบ</label>
          <input type="text" id="mat-name" class="kg-input" placeholder="เช่น พริกแห้ง..." value="${KG.escapeHtml(local.matName)}" />
        </div>
        <div class="kg-grid-2" style="margin-bottom:11px;">
          <div><label class="kg-label">จำนวน</label><input type="number" id="mat-qty" class="kg-input strong" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.matQty)}" /></div>
          <div><label class="kg-label">หน่วย</label>
            <select id="mat-unit" class="kg-select">${d.unitOpts.map(u => `<option ${u === local.matUnit ? 'selected' : ''}>${u}</option>`).join('')}</select>
          </div>
        </div>
        <div class="kg-grid-2" style="margin-bottom:14px;">
          <div><label class="kg-label">ราคา (บาท)</label><input type="number" id="mat-price" class="kg-input strong" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.matPrice)}" /></div>
          <div><label class="kg-label">แจ้งเตือนเมื่อต่ำกว่า</label><input type="number" id="mat-min" class="kg-input strong" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.matMin)}" /></div>
        </div>
        <div style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:12px;padding:12px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:13px;font-weight:600;color:var(--text-2);">ราคาต่อหน่วย</div>
          <div style="font-size:20px;font-weight:800;color:var(--gold);" id="mat-total-preview">${matTotal}</div>
        </div>
        <button type="button" id="btn-save-mat" class="kg-btn-primary">บันทึกวัตถุดิบ</button>
      </div>` : '';

    const stockCardsHtml = d.stock.map(item => {
      const meta = STATUS_META[item.status];
      const isEditing = local.editingStockId === item.id;
      return `
        <div class="kg-stock-card" style="border-color:${meta.border};">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div class="kg-status-badge" style="color:${meta.color};background:${meta.bg};">${meta.label}</div>
            <div class="kg-dot" style="background:${meta.color};animation:${meta.anim};"></div>
          </div>
          <div style="font-size:15px;font-weight:700;color:var(--text-1);line-height:1.2;">${KG.escapeHtml(item.name)}</div>
          ${!isEditing ? `
            <div>
              <div style="font-size:26px;font-weight:800;color:${meta.color};line-height:1.1;">${item.qty}</div>
              <div style="font-size:12px;color:var(--text-3);">${KG.escapeHtml(item.unit)} · min ${item.min}</div>
              ${item.price ? `<div style="font-size:11px;color:var(--text-3);margin-top:1px;">ราคาต่อหน่วย ฿${KG.f2(item.price)} / ${KG.escapeHtml(item.unit)}</div>` : ''}
            </div>
            <button type="button" class="kg-btn-ghost" style="width:100%;" data-start-edit-stock="${item.id}">แก้ไขปริมาณ</button>
          ` : `
            <input type="text" class="kg-input gold" style="font-weight:700;" id="edit-name-${item.id}" value="${KG.escapeHtml(local.editName)}" placeholder="ชื่อวัตถุดิบ" />
            <div class="kg-grid-2" style="gap:6px;">
              <input type="number" class="kg-input gold-strong" id="edit-qty-${item.id}" value="${KG.escapeHtml(local.editQty)}" inputmode="decimal" />
              <select class="kg-select gold" id="edit-unit-${item.id}">${d.unitOpts.map(u => `<option ${u === local.editUnit ? 'selected' : ''}>${u}</option>`).join('')}</select>
            </div>
            <div class="kg-grid-2" style="gap:6px;">
              <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px;">แจ้งเตือนต่ำกว่า</div><input type="number" class="kg-input gold-strong" id="edit-min-${item.id}" value="${KG.escapeHtml(local.editMin)}" inputmode="decimal" /></div>
              <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px;">ราคาต่อหน่วย (฿)</div><input type="number" class="kg-input gold-strong" id="edit-price-${item.id}" value="${KG.escapeHtml(local.editPrice)}" inputmode="decimal" /></div>
            </div>
            <div style="display:flex;gap:6px;">
              <button type="button" class="kg-btn-gold-sm" data-save-edit-stock="${item.id}">บันทึก</button>
              <button type="button" class="kg-btn-ghost" data-cancel-edit-stock>ยกเลิก</button>
            </div>
            <button type="button" class="kg-btn-delete-wide" data-delete-stock="${item.id}" data-name="${KG.escapeHtml(item.name)}">ลบวัตถุดิบนี้</button>
          `}
        </div>`;
    }).join('');

    const addSauceFormHtml = local.showAddSauce ? `
      <div class="kg-card kg-mb12">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:12px;">เพิ่มรายการน้ำจิ้ม</div>
        <input type="text" id="new-sauce-name" class="kg-input" style="margin-bottom:12px;" placeholder="เช่น น้ำจิ้มไก่, น้ำจิ้มแจ่ว..." value="${KG.escapeHtml(local.newSauceName)}" />
        <button type="button" id="btn-save-sauce" class="kg-btn-primary">บันทึกน้ำจิ้ม</button>
      </div>` : '';

    const sauceCardsHtml = d.sauces.map(sa => {
      const expanded = local.expandedSauceId === sa.id;
      const editingName = local.editingSauceNameId === sa.id;
      const addingIng = local.addingIngSauceId === sa.id;
      const addingQty = local.addingQtySauceId === sa.id;
      const maxPriceLabel = sa.maxPricePerBag > 0 ? `฿${KG.f2(sa.maxPricePerBag)}` : 'ยังไม่ระบุ';

      const headHtml = !editingName ? `
        <div class="kg-expand-head" data-toggle-sauce="${sa.id}">
          <div class="kg-avatar"><div style="font-size:17px;font-weight:800;color:var(--gold);line-height:1;">${sa.stockQty}</div><div style="font-size:9px;color:var(--gold);font-weight:700;margin-top:1px;">ถุง</div></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:15px;font-weight:700;color:var(--text-1);margin-bottom:2px;">${KG.escapeHtml(sa.name)}</div>
            <div style="font-size:12px;color:var(--text-2);">${sa.ings.length} วัตถุดิบ / รอบ · ราคาต่อถุง ${maxPriceLabel}</div>
          </div>
          <button type="button" style="width:34px;height:34px;border-radius:9px;background:var(--input-bg);border:1px solid var(--card-border);color:var(--text-2);cursor:pointer;flex-shrink:0;" data-start-edit-sauce-name="${sa.id}">✎</button>
          <div style="color:var(--text-3);font-size:14px;flex-shrink:0;">${expanded ? '▲' : '▼'}</div>
        </div>` : `
        <div style="padding:14px;">
          <div class="kg-section-label">แก้ไขข้อมูลน้ำจิ้ม</div>
          <input type="text" class="kg-input gold" style="font-weight:700;margin-bottom:9px;" id="edit-sauce-name-${sa.id}" placeholder="ชื่อน้ำจิ้ม" value="${KG.escapeHtml(local.editSauceName)}" />
          <div class="kg-grid-2" style="gap:6px;margin-bottom:9px;">
            <div>
              <div style="font-size:10px;color:var(--text-3);margin-bottom:3px;">จำนวนถุงคงเหลือ</div>
              <input type="number" class="kg-input gold-strong" id="edit-sauce-qty-${sa.id}" inputmode="decimal" value="${KG.escapeHtml(local.editSauceQty)}" />
            </div>
            <div>
              <div style="font-size:10px;color:var(--text-3);margin-bottom:3px;">ราคาต่อถุง (฿)</div>
              <input type="number" class="kg-input gold-strong" id="edit-sauce-price-${sa.id}" inputmode="decimal" value="${KG.escapeHtml(local.editSaucePrice)}" />
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="kg-btn-gold-sm" data-save-sauce-name="${sa.id}">บันทึก</button>
            <button type="button" class="kg-btn-ghost" data-cancel-sauce-name>ยกเลิก</button>
          </div>
          <button type="button" class="kg-btn-delete-wide" style="margin-top:8px;" data-delete-sauce="${sa.id}" data-name="${KG.escapeHtml(sa.name)}">ลบน้ำจิ้มนี้</button>
        </div>`;

      const expandHtml = expanded ? `
        <div style="border-top:1px solid var(--divider);padding:12px 14px 14px;">
          <div class="kg-section-label">วัตถุดิบที่ใช้ต่อรอบ</div>
          ${sa.ings.map(ing => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--divider);gap:8px;">
              <div style="font-size:14px;font-weight:500;color:var(--text-1);flex:1;">${KG.escapeHtml(ing.name)}</div>
              <div style="font-size:13px;color:var(--text-2);flex-shrink:0;">${ing.qtyPerRound} ${KG.escapeHtml(ing.unit)} / รอบ</div>
              <button type="button" class="kg-btn-delete" data-delete-sauce-ing="${ing.id}" data-name="${KG.escapeHtml(ing.name)}">ลบ</button>
            </div>`).join('')}
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;">
            <div style="font-size:13px;font-weight:700;color:var(--text-2);">ราคาต่อถุง (สูงสุดที่เคยทำ)</div>
            <div style="font-size:16px;font-weight:800;color:#D03830;">${maxPriceLabel}</div>
          </div>
          ${addingIng ? `
            <div style="padding-top:10px;display:flex;flex-direction:column;gap:7px;">
              <select class="kg-select gold" id="sauce-ing-stock-${sa.id}">${d.stockOpts.map(so => `<option value="${so.id}" ${String(so.id) === String(local.newSIngStockId) ? 'selected' : ''}>${KG.escapeHtml(so.label)}</option>`).join('')}</select>
              <input type="number" class="kg-input gold" id="sauce-ing-qty-${sa.id}" placeholder="ปริมาณต่อรอบ" inputmode="decimal" value="${KG.escapeHtml(local.newSIngQty)}" />
              <div style="display:flex;gap:6px;">
                <button type="button" class="kg-btn-gold-sm" data-save-sauce-ing="${sa.id}">บันทึก</button>
                <button type="button" class="kg-btn-ghost" data-cancel-sauce-ing>ยกเลิก</button>
              </div>
            </div>` : `<button type="button" class="kg-btn-dashed" data-start-sauce-ing="${sa.id}">+ เพิ่มวัตถุดิบ</button>`}
          ${addingQty ? `
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--divider);display:flex;flex-direction:column;gap:7px;">
              <div class="kg-section-label">ทำน้ำจิ้มรอบใหม่ — ได้กี่ถุง</div>
              <input type="number" class="kg-input gold-strong" id="sauce-bags-${sa.id}" placeholder="จำนวนถุงที่ทำรอบนี้" inputmode="decimal" value="${KG.escapeHtml(local.newSauceBags)}" />
              <div style="display:flex;gap:6px;">
                <button type="button" class="kg-btn-gold-sm" data-save-sauce-batch="${sa.id}">บันทึก (หักสต๊อก)</button>
                <button type="button" class="kg-btn-ghost" data-cancel-sauce-batch>ยกเลิก</button>
              </div>
            </div>` : `<button type="button" class="kg-btn-primary" style="min-height:44px;font-size:13px;margin-top:12px;" data-start-sauce-batch="${sa.id}">+ เพิ่มปริมาณน้ำจิ้ม (ถุง)</button>`}
        </div>` : '';

      return `<div class="kg-expand-card">${headHtml}${expandHtml}</div>`;
    }).join('');

    root.innerHTML = `
      <button type="button" id="btn-toggle-add-mat" class="kg-btn-toggle ${local.showAddMat ? 'open' : ''}">${local.showAddMat ? '✕ ปิดฟอร์ม' : '+ เพิ่มวัตถุดิบ'}</button>
      ${addMatFormHtml}
      <div class="kg-grid-3 kg-mb12">
        <div style="background:rgba(208,56,48,0.1);border:1px solid rgba(208,56,48,0.28);border-radius:13px;padding:12px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#D03830;line-height:1;">${d.critCount}</div><div style="font-size:11px;font-weight:700;color:#D03830;margin-top:3px;">วิกฤต</div>
        </div>
        <div style="background:rgba(232,146,10,0.1);border:1px solid rgba(232,146,10,0.28);border-radius:13px;padding:12px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#E8920A;line-height:1;">${d.lowCount}</div><div style="font-size:11px;font-weight:700;color:#E8920A;margin-top:3px;">ต่ำ</div>
        </div>
        <div style="background:rgba(26,158,90,0.1);border:1px solid rgba(26,158,90,0.28);border-radius:13px;padding:12px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#1A9E5A;line-height:1;">${d.okCount}</div><div style="font-size:11px;font-weight:700;color:#1A9E5A;margin-top:3px;">ปกติ</div>
        </div>
      </div>
      <div class="kg-grid-2 kg-mb20">${stockCardsHtml}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><div style="font-size:15px;font-weight:800;color:var(--text-1);">น้ำจิ้ม</div></div>
      <button type="button" id="btn-toggle-add-sauce" class="kg-btn-toggle ${local.showAddSauce ? 'open' : ''}">${local.showAddSauce ? '✕ ปิดฟอร์ม' : '+ เพิ่มรายการน้ำจิ้ม'}</button>
      ${addSauceFormHtml}
      ${sauceCardsHtml}
    `;

    wireEvents(d);
  }

  function wireEvents(d) {
    const q = sel => root.querySelector(sel);
    const qa = sel => root.querySelectorAll(sel);

    q('#btn-toggle-add-mat')?.addEventListener('click', () => { local.showAddMat = !local.showAddMat; render(d); });
    function updateMatTotalPreview() {
      const qtyNum = parseFloat(local.matQty) || 0;
      const priceNum = parseFloat(local.matPrice) || 0;
      const perUnit = qtyNum > 0 ? priceNum / qtyNum : 0;
      const el = document.getElementById('mat-total-preview');
      if (el) el.textContent = qtyNum > 0 ? `฿${KG.f2(perUnit)} / ${local.matUnit}` : '—';
    }
    q('#mat-name')?.addEventListener('input', e => local.matName = e.target.value);
    q('#mat-qty')?.addEventListener('input', e => { local.matQty = e.target.value; updateMatTotalPreview(); });
    q('#mat-unit')?.addEventListener('change', e => { local.matUnit = e.target.value; updateMatTotalPreview(); });
    q('#mat-price')?.addEventListener('input', e => { local.matPrice = e.target.value; updateMatTotalPreview(); });
    q('#mat-min')?.addEventListener('input', e => local.matMin = e.target.value);
    q('#btn-save-mat')?.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=add', { name: local.matName, qty: local.matQty, unit: local.matUnit, price: local.matPrice, min: local.matMin });
        KG.toast(res.message);
        Object.assign(local, { showAddMat: false, matName: '', matQty: '', matUnit: 'กก.', matPrice: '', matMin: '' });
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    });

    qa('[data-start-edit-stock]').forEach(btn => btn.addEventListener('click', () => {
      const item = d.stock.find(s => String(s.id) === btn.dataset.startEditStock);
      local.editingStockId = item.id; local.editName = item.name; local.editQty = String(item.qty);
      local.editUnit = item.unit; local.editMin = String(item.min); local.editPrice = item.price ? String(item.price) : '';
      render(d);
    }));
    qa('[data-cancel-edit-stock]').forEach(btn => btn.addEventListener('click', () => { local.editingStockId = null; render(d); }));
    qa('[id^="edit-name-"]').forEach(inp => inp.addEventListener('input', e => local.editName = e.target.value));
    qa('[id^="edit-qty-"]').forEach(inp => inp.addEventListener('input', e => local.editQty = e.target.value));
    qa('[id^="edit-unit-"]').forEach(sel => sel.addEventListener('change', e => local.editUnit = e.target.value));
    qa('[id^="edit-min-"]').forEach(inp => inp.addEventListener('input', e => local.editMin = e.target.value));
    qa('[id^="edit-price-"]').forEach(inp => inp.addEventListener('input', e => local.editPrice = e.target.value));
    qa('[data-save-edit-stock]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=update', { id: btn.dataset.saveEditStock, name: local.editName, qty: local.editQty, unit: local.editUnit, min: local.editMin, price: local.editPrice });
        KG.toast(res.message);
        local.editingStockId = null;
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
    qa('[data-delete-stock]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=delete', { id: btn.dataset.deleteStock });
        KG.toast(res.message);
        local.editingStockId = null;
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));

    q('#btn-toggle-add-sauce')?.addEventListener('click', () => { local.showAddSauce = !local.showAddSauce; render(d); });
    q('#new-sauce-name')?.addEventListener('input', e => local.newSauceName = e.target.value);
    q('#btn-save-sauce')?.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=sauce_add', { name: local.newSauceName });
        KG.toast(res.message);
        Object.assign(local, { showAddSauce: false, newSauceName: '' });
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    });

    qa('[data-toggle-sauce]').forEach(el => el.addEventListener('click', () => {
      const id = Number(el.dataset.toggleSauce);
      local.expandedSauceId = local.expandedSauceId === id ? null : id;
      render(d);
    }));
    qa('[data-start-edit-sauce-name]').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sa = d.sauces.find(s => String(s.id) === btn.dataset.startEditSauceName);
      local.editingSauceNameId = sa.id; local.editSauceName = sa.name;
      local.editSauceQty = String(sa.stockQty); local.editSaucePrice = sa.maxPricePerBag ? String(sa.maxPricePerBag) : '0';
      render(d);
    }));
    qa('[id^="edit-sauce-name-"]').forEach(inp => inp.addEventListener('input', e => local.editSauceName = e.target.value));
    qa('[id^="edit-sauce-qty-"]').forEach(inp => inp.addEventListener('input', e => local.editSauceQty = e.target.value));
    qa('[id^="edit-sauce-price-"]').forEach(inp => inp.addEventListener('input', e => local.editSaucePrice = e.target.value));
    qa('[data-cancel-sauce-name]').forEach(btn => btn.addEventListener('click', () => { local.editingSauceNameId = null; render(d); }));
    qa('[data-save-sauce-name]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=sauce_update', {
          id: btn.dataset.saveSauceName, name: local.editSauceName,
          stock_qty: local.editSauceQty, price_per_bag: local.editSaucePrice,
        });
        KG.toast(res.message);
        local.editingSauceNameId = null;
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
    qa('[data-delete-sauce]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=sauce_delete', { id: btn.dataset.deleteSauce });
        KG.toast(res.message);
        Object.assign(local, { editingSauceNameId: null, expandedSauceId: null });
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));

    qa('[data-start-sauce-ing]').forEach(btn => btn.addEventListener('click', () => {
      local.addingIngSauceId = Number(btn.dataset.startSauceIng);
      local.newSIngStockId = d.stockOpts[0] ? d.stockOpts[0].id : ''; local.newSIngQty = '';
      render(d);
    }));
    qa('[data-cancel-sauce-ing]').forEach(btn => btn.addEventListener('click', () => { local.addingIngSauceId = null; render(d); }));
    qa('[id^="sauce-ing-stock-"]').forEach(sel => sel.addEventListener('change', e => local.newSIngStockId = e.target.value));
    qa('[id^="sauce-ing-qty-"]').forEach(inp => inp.addEventListener('input', e => local.newSIngQty = e.target.value));
    qa('[data-save-sauce-ing]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=sauce_add_ingredient', { sauce_id: btn.dataset.saveSauceIng, stock_id: local.newSIngStockId, qty: local.newSIngQty });
        KG.toast(res.message);
        local.addingIngSauceId = null;
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
    qa('[data-delete-sauce-ing]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=sauce_delete_ingredient', { id: btn.dataset.deleteSauceIng });
        KG.toast(res.message);
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));

    qa('[data-start-sauce-batch]').forEach(btn => btn.addEventListener('click', () => {
      local.addingQtySauceId = Number(btn.dataset.startSauceBatch); local.newSauceBags = '';
      render(d);
    }));
    qa('[data-cancel-sauce-batch]').forEach(btn => btn.addEventListener('click', () => { local.addingQtySauceId = null; render(d); }));
    qa('[id^="sauce-bags-"]').forEach(inp => inp.addEventListener('input', e => local.newSauceBags = e.target.value));
    qa('[data-save-sauce-batch]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/stock.php?action=sauce_add_batch', { sauce_id: btn.dataset.saveSauceBatch, bags: local.newSauceBags });
        KG.toast(res.message);
        local.addingQtySauceId = null;
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
  }

  async function load() {
    const d = await KG.apiGet('api/stock.php');
    render(d);
  }

  const poller = KG.startPolling(load, 6000);
})();

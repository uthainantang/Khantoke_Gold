(() => {
  const root = document.getElementById('page-root');
  const local = {
    showAddRecipe: false, newRName: '', newRPrice: '',
    expandedId: null, editingMenuId: null, editRName: '', editRPrice: '',
    addingIngId: null, newIngSource: '', newIngQty: '',
  };

  function ingCostPreview(source, qty, d) {
    const opt = d.ingredientOpts.find(o => o.value === source);
    const price = opt ? opt.price : 0;
    return KG.f2((parseFloat(qty) || 0) * price);
  }

  function render(d) {
    const addRecipeFormHtml = local.showAddRecipe ? `
      <div class="kg-card kg-mb12">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:13px;">เพิ่มเมนูใหม่</div>
        <div style="margin-bottom:11px;"><label class="kg-label">ชื่อเมนู</label><input type="text" id="new-r-name" class="kg-input" placeholder="เช่น ข้าวหมูกรอบ..." value="${KG.escapeHtml(local.newRName)}" /></div>
        <div style="margin-bottom:14px;"><label class="kg-label">ราคาขายต่อกล่อง (฿)</label><input type="number" id="new-r-price" class="kg-input strong" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.newRPrice)}" /></div>
        <button type="button" id="btn-save-recipe" class="kg-btn-primary">บันทึกเมนู</button>
      </div>` : '';

    const cardsHtml = d.recipes.map(r => {
      const expanded = local.expandedId === r.id;
      const editingMenu = local.editingMenuId === r.id;
      const addingIng = local.addingIngId === r.id;
      const mPct = r.mPct;
      const mc = mPct >= 40 ? '#1A9E5A' : mPct >= 25 ? '#E8920A' : '#D03830';
      const mb = mPct >= 40 ? 'rgba(26,158,90,0.12)' : mPct >= 25 ? 'rgba(232,146,10,0.12)' : 'rgba(208,56,48,0.12)';

      const headHtml = !editingMenu ? `
        <div class="kg-expand-head" data-toggle-recipe="${r.id}">
          <div class="kg-avatar" style="background:${mb};border-color:${mc}30;"><div style="font-size:15px;font-weight:800;color:${mc};line-height:1;">${mPct}%</div><div style="font-size:9px;color:${mc};font-weight:700;margin-top:1px;">กำไร</div></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:15px;font-weight:700;color:var(--text-1);margin-bottom:2px;">${KG.escapeHtml(r.name)}</div>
            <div style="font-size:12px;color:var(--text-2);">ราคา ฿${r.price} · ต้นทุน ฿${r.cost}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px;">ขายวันนี้ ${r.dayQty} กล่อง · ฿${r.dayAmt}</div>
          </div>
          <button type="button" style="width:34px;height:34px;border-radius:9px;background:var(--input-bg);border:1px solid var(--card-border);color:var(--text-2);cursor:pointer;flex-shrink:0;" data-start-edit-recipe="${r.id}">✎</button>
          <div style="color:var(--text-3);font-size:14px;flex-shrink:0;">${expanded ? '▲' : '▼'}</div>
        </div>` : `
        <div style="padding:14px;">
          <div class="kg-section-label">แก้ไขเมนู</div>
          <input type="text" class="kg-input gold" style="font-weight:700;margin-bottom:9px;" id="edit-r-name-${r.id}" value="${KG.escapeHtml(local.editRName)}" />
          <div style="margin-bottom:12px;"><div style="font-size:10px;color:var(--text-3);margin-bottom:3px;">ราคาขายต่อกล่อง (฿)</div><input type="number" class="kg-input gold-strong" id="edit-r-price-${r.id}" value="${KG.escapeHtml(local.editRPrice)}" inputmode="decimal" /></div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="kg-btn-gold-sm" data-save-recipe="${r.id}">บันทึก</button>
            <button type="button" class="kg-btn-ghost" data-cancel-edit-recipe>ยกเลิก</button>
          </div>
          <button type="button" class="kg-btn-delete-wide" style="margin-top:8px;" data-delete-recipe="${r.id}" data-name="${KG.escapeHtml(r.name)}">ลบเมนูนี้</button>
        </div>`;

      const expandHtml = expanded ? `
        <div style="border-top:1px solid var(--divider);padding:12px 14px 14px;">
          <div class="kg-section-label">ส่วนผสมต่อกล่อง & ต้นทุนต่อกล่อง</div>
          ${r.ings.map(ing => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--divider);gap:8px;">
              <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:500;color:var(--text-1);">${KG.escapeHtml(ing.name)}</div><div style="font-size:11px;color:var(--text-3);">${KG.escapeHtml(ing.qty)}</div></div>
              <div style="font-size:14px;font-weight:700;color:var(--text-1);flex-shrink:0;">฿${ing.costStr}</div>
              <button type="button" class="kg-btn-delete" data-delete-ing="${ing.id}" data-name="${KG.escapeHtml(ing.name)}">ลบ</button>
            </div>`).join('')}
          ${addingIng ? `
            <div style="padding-top:10px;display:flex;flex-direction:column;gap:7px;">
              <div><div style="font-size:10px;color:var(--text-3);margin-bottom:4px;">เลือกวัตถุดิบ</div>
                <select class="kg-select gold" id="ing-source-${r.id}">${d.ingredientOpts.map(o => `<option value="${o.value}" ${o.value === local.newIngSource ? 'selected' : ''}>${KG.escapeHtml(o.label)}</option>`).join('')}</select>
              </div>
              <div><div style="font-size:10px;color:var(--text-3);margin-bottom:4px;">ปริมาณที่ใช้ต่อกล่อง</div><input type="number" class="kg-input gold" id="ing-qty-${r.id}" placeholder="0" inputmode="decimal" value="${KG.escapeHtml(local.newIngQty)}" /></div>
              <div style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:10px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:12px;color:var(--text-2);">ต้นทุนต่อกล่อง</div>
                <div style="font-size:15px;font-weight:800;color:var(--gold);" id="ing-cost-preview-${r.id}">฿${ingCostPreview(local.newIngSource, local.newIngQty, d)}</div>
              </div>
              <div style="display:flex;gap:6px;">
                <button type="button" class="kg-btn-gold-sm" data-save-ing="${r.id}">บันทึกวัตถุดิบ</button>
                <button type="button" class="kg-btn-ghost" data-cancel-ing>ยกเลิก</button>
              </div>
            </div>` : `<button type="button" class="kg-btn-dashed" data-start-ing="${r.id}">+ เพิ่มวัตถุดิบ</button>`}
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;"><div style="font-size:13px;font-weight:700;color:var(--text-2);">รวมต้นทุน</div><div style="font-size:16px;font-weight:800;color:#D03830;">฿${r.cost}</div></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid var(--divider);"><div style="font-size:13px;font-weight:700;color:var(--text-2);">กำไรต่อกล่อง</div><div style="font-size:16px;font-weight:800;color:#1A9E5A;">฿${r.margin} (${mPct}%)</div></div>
        </div>` : '';

      return `<div class="kg-expand-card">${headHtml}${expandHtml}</div>`;
    }).join('');

    root.innerHTML = `
      <button type="button" id="btn-toggle-add-recipe" class="kg-btn-toggle ${local.showAddRecipe ? 'open' : ''}">${local.showAddRecipe ? '✕ ปิดฟอร์ม' : '+ เพิ่มเมนูใหม่'}</button>
      ${addRecipeFormHtml}
      <div style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:14px;padding:13px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:11px;font-weight:600;color:var(--text-2);">กำไรเฉลี่ยทุกเมนู</div><div style="font-size:24px;font-weight:800;color:var(--gold);line-height:1.2;">${d.avgMargin}%</div></div>
        <div style="text-align:right;"><div style="font-size:12px;color:var(--text-3);">${d.menuCount} เมนู</div><div style="font-size:11px;color:var(--text-3);margin-top:2px;">กดเพื่อดูรายละเอียด</div></div>
      </div>
      ${cardsHtml}
    `;

    const q = sel => root.querySelector(sel);
    const qa = sel => root.querySelectorAll(sel);

    q('#btn-toggle-add-recipe')?.addEventListener('click', () => { local.showAddRecipe = !local.showAddRecipe; render(d); });
    q('#new-r-name')?.addEventListener('input', e => local.newRName = e.target.value);
    q('#new-r-price')?.addEventListener('input', e => local.newRPrice = e.target.value);
    q('#btn-save-recipe')?.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/recipes.php?action=add', { name: local.newRName, price: local.newRPrice });
        KG.toast(res.message);
        Object.assign(local, { showAddRecipe: false, newRName: '', newRPrice: '' });
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    });

    qa('[data-toggle-recipe]').forEach(el => el.addEventListener('click', () => {
      const id = Number(el.dataset.toggleRecipe);
      local.expandedId = local.expandedId === id ? null : id;
      render(d);
    }));
    qa('[data-start-edit-recipe]').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = d.recipes.find(x => String(x.id) === btn.dataset.startEditRecipe);
      local.editingMenuId = r.id; local.editRName = r.name; local.editRPrice = String(r.price);
      render(d);
    }));
    qa('[id^="edit-r-name-"]').forEach(inp => inp.addEventListener('input', e => local.editRName = e.target.value));
    qa('[id^="edit-r-price-"]').forEach(inp => inp.addEventListener('input', e => local.editRPrice = e.target.value));
    qa('[data-cancel-edit-recipe]').forEach(btn => btn.addEventListener('click', () => { local.editingMenuId = null; render(d); }));
    qa('[data-save-recipe]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/recipes.php?action=update', { id: btn.dataset.saveRecipe, name: local.editRName, price: local.editRPrice });
        KG.toast(res.message);
        local.editingMenuId = null;
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
    qa('[data-delete-recipe]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/recipes.php?action=delete', { id: btn.dataset.deleteRecipe });
        KG.toast(res.message);
        Object.assign(local, { editingMenuId: null, expandedId: null });
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));

    qa('[data-start-ing]').forEach(btn => btn.addEventListener('click', () => {
      local.addingIngId = Number(btn.dataset.startIng);
      local.newIngSource = d.ingredientOpts[0] ? d.ingredientOpts[0].value : ''; local.newIngQty = '';
      render(d);
    }));
    qa('[data-cancel-ing]').forEach(btn => btn.addEventListener('click', () => { local.addingIngId = null; render(d); }));
    qa('[id^="ing-source-"]').forEach(sel => sel.addEventListener('change', e => {
      local.newIngSource = e.target.value;
      const preview = document.getElementById('ing-cost-preview-' + local.addingIngId);
      if (preview) preview.textContent = '฿' + ingCostPreview(local.newIngSource, local.newIngQty, d);
    }));
    qa('[id^="ing-qty-"]').forEach(inp => inp.addEventListener('input', e => {
      local.newIngQty = e.target.value;
      const preview = document.getElementById('ing-cost-preview-' + local.addingIngId);
      if (preview) preview.textContent = '฿' + ingCostPreview(local.newIngSource, local.newIngQty, d);
    }));
    qa('[data-save-ing]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/recipes.php?action=add_ingredient', { recipe_id: btn.dataset.saveIng, source: local.newIngSource, qty: local.newIngQty });
        KG.toast(res.message);
        local.addingIngId = null;
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
    qa('[data-delete-ing]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/recipes.php?action=delete_ingredient', { id: btn.dataset.deleteIng });
        KG.toast(res.message);
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
  }

  async function load() {
    const d = await KG.apiGet('api/recipes.php');
    render(d);
  }

  const poller = KG.startPolling(load, 6000);
})();

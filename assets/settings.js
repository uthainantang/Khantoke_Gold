(() => {
  const root = document.getElementById('page-root');
  const local = { vName: '', vPhone: '', vAddress: '' };

  function render(d) {
    const vendorsHtml = d.vendors.map(v => `
      <div style="background:var(--card-bg);border:1px solid var(--card-border);border-radius:13px;padding:13px 14px;margin-bottom:9px;display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;border-radius:11px;background:var(--gold-dim);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:var(--gold);flex-shrink:0;">${KG.escapeHtml(v.initial)}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:700;color:var(--text-1);">${KG.escapeHtml(v.name)}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:2px;">${KG.escapeHtml(v.phone)}</div>
          ${v.hasAddress ? `<div style="font-size:11px;color:var(--text-3);margin-top:1px;">${KG.escapeHtml(v.address)}</div>` : ''}
        </div>
        <button type="button" class="kg-btn-delete" style="padding:6px 10px;" data-delete-vendor="${v.id}" data-name="${KG.escapeHtml(v.name)}">ลบ</button>
      </div>`).join('');

    root.innerHTML = `
      <div class="kg-card kg-mb12">
        <div style="font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:14px;">เพิ่มข้อมูลลูกค้า</div>
        <div style="margin-bottom:11px;"><label class="kg-label">ชื่อลูกค้า / ร้าน</label><input type="text" id="v-name" class="kg-input" placeholder="เช่น แม่สมหมาย..." value="${KG.escapeHtml(local.vName)}" /></div>
        <div style="margin-bottom:11px;"><label class="kg-label">เบอร์โทร</label><input type="tel" id="v-phone" class="kg-input" placeholder="08x-xxx-xxxx" value="${KG.escapeHtml(local.vPhone)}" /></div>
        <div style="margin-bottom:14px;"><label class="kg-label">ที่อยู่ / จุดส่ง</label><input type="text" id="v-address" class="kg-input" placeholder="เช่น ตลาดสด แผงที่ 12..." value="${KG.escapeHtml(local.vAddress)}" /></div>
        <button type="button" id="btn-add-vendor" class="kg-btn-primary">เพิ่มลูกค้า</button>
      </div>
      <div class="kg-section-label">รายชื่อลูกค้า (${d.vendorCount})</div>
      ${vendorsHtml}
    `;

    const q = sel => root.querySelector(sel);
    q('#v-name').addEventListener('input', e => local.vName = e.target.value);
    q('#v-phone').addEventListener('input', e => local.vPhone = e.target.value);
    q('#v-address').addEventListener('input', e => local.vAddress = e.target.value);
    q('#btn-add-vendor').addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/vendors.php?action=add', { name: local.vName, phone: local.vPhone, address: local.vAddress });
        KG.toast(res.message);
        Object.assign(local, { vName: '', vPhone: '', vAddress: '' });
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    });
    root.querySelectorAll('[data-delete-vendor]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const res = await KG.apiPost('api/vendors.php?action=delete', { id: btn.dataset.deleteVendor });
        KG.toast(res.message);
        poller.refreshNow();
      } catch (err) { KG.toast('เกิดข้อผิดพลาด: ' + err.message); }
    }));
  }

  async function load() {
    const d = await KG.apiGet('api/vendors.php');
    render(d);
  }

  const poller = KG.startPolling(load, 6000);
})();

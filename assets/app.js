/**
 * โค้ด JS ที่ใช้ร่วมกันทุกหน้า — toast, นาฬิกาหัวเว็บ, สลับโหมดมืด, helper สำหรับเรียก API,
 * และตัว polling สำหรับให้ข้อมูลอัปเดตแบบ real-time (ดึงข้อมูลใหม่จากฐานข้อมูลเป็นระยะ)
 */

const KG = (() => {
  const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  function fmt(n) {
    return Number(n || 0).toLocaleString('th-TH');
  }
  function f2(n) {
    return Number(n || 0).toFixed(2);
  }
  function thaiDateLabel(ymd) {
    const d = new Date(ymd + 'T00:00:00');
    if (isNaN(d)) return ymd;
    return `${THAI_DAYS[d.getDay()]} ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function apiGet(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    if (!res.ok || data.ok === false) throw new Error(data.error || 'เกิดข้อผิดพลาด');
    return data;
  }
  async function apiPost(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) throw new Error(data.error || 'เกิดข้อผิดพลาด');
    return data;
  }

  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('kg-toast');
    if (!el) return;
    clearTimeout(toastTimer);
    el.textContent = msg;
    el.classList.add('show');
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function startClock() {
    const dateEl = document.getElementById('kg-clock-date');
    const timeEl = document.getElementById('kg-clock-time');
    function tick() {
      const now = new Date();
      if (dateEl) dateEl.textContent = thaiDateLabel(now.toISOString().slice(0, 10));
      if (timeEl) timeEl.textContent = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
    tick();
    setInterval(tick, 15000);
  }

  function initThemeToggle() {
    const btn = document.getElementById('kg-theme-btn');
    const root = document.documentElement;
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const dark = root.getAttribute('data-theme') !== 'dark';
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
      btn.innerHTML = dark ? KG_ICONS.sun : KG_ICONS.moon;
      try {
        await apiPost('api/settings.php?action=toggle_theme', { dark: dark ? 1 : 0 });
      } catch (e) {
        toast('บันทึกโหมดสีไม่สำเร็จ: ' + e.message);
      }
    });
  }

  /** true ถ้าผู้ใช้กำลังโฟกัส/พิมพ์อยู่ในช่องกรอกข้อมูลของหน้านั้น (ไม่นับปุ่ม) */
  function isEditingField() {
    const el = document.activeElement;
    const root = document.getElementById('page-root');
    if (!el || !root || !root.contains(el)) return false;
    return el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA';
  }

  /**
   * เรียก fetcher(ทุกๆ intervalMs วินาที) เพื่อให้หน้าอัปเดตแบบ real-time หยุดโพลเมื่อแท็บถูกซ่อน
   * และ "ข้าม" รอบอัตโนมัติขณะผู้ใช้กำลังพิมพ์อยู่ในฟอร์ม — ไม่งั้นการ re-render DOM ทุกรอบจะทำให้
   * ช่องกรอกเสียโฟกัสกลางคัน (บนมือถือ = แป้นพิมพ์หุบเอง) ส่วน refreshNow() (เรียกหลังกดบันทึก/ลบ)
   * จะรีเฟรชทันทีเสมอ ไม่สนโฟกัส เพราะเป็นการกระทำที่ผู้ใช้ตั้งใจกดเอง
   */
  function startPolling(fetcher, intervalMs) {
    let timer = null;
    async function raw() {
      try { await fetcher(); } catch (e) { console.warn('polling error', e); }
    }
    async function guarded() {
      if (isEditingField()) return;
      await raw();
    }
    function start() {
      if (timer) return;
      guarded();
      timer = setInterval(guarded, intervalMs);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else start();
    });
    start();
    return { stop, start, refreshNow: raw };
  }

  return { fmt, f2, thaiDateLabel, escapeHtml, apiGet, apiPost, toast, startClock, initThemeToggle, startPolling };
})();

const KG_ICONS = {
  moon: '<svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="10" r="4" fill="currentColor" stroke="none"/><line x1="10" y1="1" x2="10" y2="3"/><line x1="10" y1="17" x2="10" y2="19"/><line x1="1" y1="10" x2="3" y2="10"/><line x1="17" y1="10" x2="19" y2="10"/><line x1="3.5" y1="3.5" x2="4.9" y2="4.9"/><line x1="15.1" y1="15.1" x2="16.5" y2="16.5"/><line x1="3.5" y1="16.5" x2="4.9" y2="15.1"/><line x1="15.1" y1="4.9" x2="16.5" y2="3.5"/></svg>',
  sun: '<svg width="19" height="19" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>',
};

document.addEventListener('DOMContentLoaded', () => {
  KG.startClock();
  KG.initThemeToggle();
});

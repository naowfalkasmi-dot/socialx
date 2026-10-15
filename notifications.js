(function () {
  const sb = window.sb;
  if (!sb) return;
  const bar = document.querySelector('header .bar');
  const newPost = document.getElementById('newPost');
  if (!bar || !newPost) return;

  let me = null;
  let items = [];
  let names = new Map();
  let channel = null;

  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const style = document.createElement('style');
  style.textContent = `
.sxn-wrap{display:flex;align-items:center;gap:8px}
.sxn-bell{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid #4a3560;background:#1b1429;color:#fff;font-size:19px}
.sxn-badge{position:absolute;top:-4px;right:-4px;min-width:19px;height:19px;border-radius:10px;background:#ff3b6b;color:#fff;font-size:11px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 5px}
.sxn-page{position:fixed;inset:0;z-index:45;background:#0e0b17;color:#fff;display:flex;flex-direction:column}
.sxn-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #2b213b}
.sxn-head h2{flex:1;margin:0;font-size:18px}
.sxn-x{background:#ffffff18;border:0;color:#fff;border-radius:50%;width:38px;height:38px;font-size:17px}
.sxn-list{flex:1;overflow-y:auto;padding:10px 14px 40px;max-width:670px;width:100%;margin:0 auto}
.sxn-row{display:flex;gap:12px;align-items:center;padding:12px;border-radius:14px;margin-bottom:8px;background:#1b1429;border:1px solid #2f2340}
.sxn-row.new{border-color:#783fe0;background:#241838}
.sxn-ic{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#2b213b;font-size:19px;flex:none}
.sxn-txt{flex:1;min-width:0;line-height:1.5;overflow-wrap:anywhere}
.sxn-txt small{display:block;color:#a999c1}
.sxn-empty{text-align:center;color:#a999c1;padding:60px 10px}
`;
  document.head.append(style);

  const wrap = mk('div', 'sxn-wrap');
  const bell = mk('button', 'sxn-bell', '🔔');
  bell.setAttribute('aria-label', 'الإشعارات');
  const badge = mk('span', 'sxn-badge', '0');
  bell.append(badge);
  newPost.before(wrap);
  wrap.append(bell, newPost);
  wrap.style.display = 'none';

  const unread = () => items.filter((n) => !n.read).length;
  function paintBadge() {
    const u = unread();
    badge.textContent = u > 99 ? '99+' : String(u);
    badge.style.display = u ? 'flex' : 'none';
  }

  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 1) return 'دابا';
    if (m < 60) return 'قبل ' + m + ' د';
    if (m < 1440) return 'قبل ' + Math.round(m / 60) + ' س';
    return 'قبل ' + Math.round(m / 1440) + ' يوم';
  };

  async function fillNames(list) {
    const need = Array.from(new Set(list.map((n) => n.actor_id))).filter((id) => !names.has(id));
    if (!need.length) return;
    const r = await sb.from('profiles').select('id,username').in('id', need);
    (r.data || []).forEach((p) => names.set(p.id, p.username));
  }

  async function load() {
    if (!me) return;
    const r = await sb
      .from('notifications')
      .select('id,actor_id,type,body,read,created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (r.error) { console.error('notifications', r.error.message); return; }
    items = r.data || [];
    await fillNames(items);
    paintBadge();
  }

  let page = null;
  function render() {
    if (!page) return;
    const list = page.querySelector('.sxn-list');
    list.replaceChildren();
    if (!items.length) {
      list.append(mk('div', 'sxn-empty', 'ما كاين حتى إشعار دابا 🔔'));
      return;
    }
    items.forEach((n) => {
      const who = names.get(n.actor_id) || 'شي واحد';
      const row = mk('div', 'sxn-row' + (n.__fresh ? ' new' : ''));
      const icon = n.type === 'like' ? '💜' : n.type === 'comment' ? '💬' : '👤';
      let text = who + ' ';
      if (n.type === 'like') text += 'عجبو منشورك';
      else if (n.type === 'comment') text += 'علّق على منشورك';
      else text += 'بدا كيتابعك';
      const t = mk('div', 'sxn-txt', text);
      if (n.type === 'comment' && n.body) t.append(mk('small', '', '“' + n.body + '”'));
      t.append(mk('small', '', ago(n.created_at)));
      row.append(mk('div', 'sxn-ic', icon), t);
      list.append(row);
    });
  }

  function closePage() {
    if (page) { page.remove(); page = null; }
    document.body.style.overflow = '';
  }

  async function openPage() {
    if (page) return;
    page = mk('div', 'sxn-page');
    const head = mk('div', 'sxn-head');
    const x = mk('button', 'sxn-x', '✕');
    x.setAttribute('aria-label', 'سد');
    x.onclick = closePage;
    head.append(mk('h2', '', 'الإشعارات'), x);
    page.append(head, mk('div', 'sxn-list'));
    document.body.append(page);
    document.body.style.overflow = 'hidden';
    items.forEach((n) => { n.__fresh = !n.read; });
    render();
    // بلّغ أنها تقراو
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (ids.length) {
      items.forEach((n) => { n.read = true; });
      paintBadge();
      sb.from('notifications').update({ read: true }).in('id', ids).then(() => {});
    }
  }
  bell.onclick = openPage;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePage(); });

  function subscribe() {
    if (channel) { sb.removeChannel(channel); channel = null; }
    if (!me) return;
    channel = sb
      .channel('notif-' + me)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + me },
        async (payload) => {
          const n = payload.new;
          n.__fresh = true;
          items.unshift(n);
          await fillNames([n]);
          paintBadge();
          if (page) render();
        }
      )
      .subscribe();
  }

  function setUser(id) {
    if (id === me) return;
    me = id;
    items = [];
    paintBadge();
    closePage();
    if (!me) { wrap.style.display = 'none'; if (channel) { sb.removeChannel(channel); channel = null; } return; }
    wrap.style.display = 'flex';
    load();
    subscribe();
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
  setInterval(() => { if (me && document.visibilityState === 'visible') load(); }, 120000);
})();

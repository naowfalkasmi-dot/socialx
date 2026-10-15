(function () {
  const sb = window.sb;
  if (!sb) return;

  const home = document.getElementById('home');
  if (!home) return;

  let me = null;
  let groups = []; // [{uid, name, avatar, items:[{id,url,kind,caption,created}]}]
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const isHttps = (u) => /^https:\/\/\S+$/i.test(u || '');

  /* ---------- المشاهدات (فـ هاد الجهاز) ---------- */
  const seenKey = () => 'socialx-stories-seen-' + me;
  const getSeen = () => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey())) || []); } catch (e) { return new Set(); }
  };
  const markSeen = (id) => {
    try {
      const s = getSeen();
      s.add(id);
      localStorage.setItem(seenKey(), JSON.stringify(Array.from(s).slice(-300)));
    } catch (e) { /* ignore */ }
  };

  /* ---------- الستايل ---------- */
  const style = document.createElement('style');
  style.textContent = `
.sxs-bar{display:flex;gap:14px;overflow-x:auto;padding:12px 14px;margin-bottom:15px;background:#1b1429;border:1px solid #372749;border-radius:18px}
.sxs-item{flex:none;width:68px;background:none;border:0;color:#d8c9ee;text-align:center;padding:0}
.sxs-ring{width:64px;height:64px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#783fe0,#e68bff);display:block;margin:0 auto 5px;position:relative}
.sxs-ring.seen{background:#4a3a60}
.sxs-ring.empty{background:#2b213b;border:2px dashed #5d3b7a;padding:0}
.sxs-av{width:100%;height:100%;border-radius:50%;background:#0e0b17;border:2px solid #0e0b17;overflow:hidden;display:grid;place-items:center;font-weight:800;color:#fff}
.sxs-av img{width:100%;height:100%;object-fit:cover;display:block}
.sxs-plus{position:absolute;bottom:-2px;right:-2px;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#783fe0,#b65af0);border:2px solid #1b1429;color:#fff;font-size:14px;line-height:18px;font-weight:900}
.sxs-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.sxv{position:fixed;inset:0;z-index:50;background:#000;display:flex;flex-direction:column;color:#fff;padding-top:env(safe-area-inset-top,0)}
.sxv-bars{display:flex;gap:4px;padding:10px 10px 6px}
.sxv-seg{flex:1;height:3px;border-radius:3px;background:#ffffff44;overflow:hidden}
.sxv-fill{height:100%;width:0;background:#fff}
.sxv-head{display:flex;align-items:center;gap:10px;padding:4px 12px 8px}
.sxv-head .sxs-av{width:36px;height:36px;flex:none;font-size:14px}
.sxv-meta{flex:1;min-width:0}
.sxv-meta strong{display:block;font-size:14px}
.sxv-meta small{color:#cbbbe0}
.sxv-btn{background:#ffffff22;border:0;color:#fff;border-radius:50%;width:38px;height:38px;font-size:17px;flex:none}
.sxv-stage{flex:1;min-height:0;position:relative;display:grid;place-items:center}
.sxv-stage img,.sxv-stage video{max-width:100%;max-height:100%;object-fit:contain}
.sxv-tap{position:absolute;top:0;bottom:0;width:50%;background:none;border:0}
.sxv-cap{padding:12px 16px calc(18px + env(safe-area-inset-bottom,0px));text-align:center;font-size:15px;line-height:1.6;min-height:56px;overflow-wrap:anywhere}
`;
  document.head.append(style);

  /* ---------- الشريط فـ الرئيسية ---------- */
  const bar = mk('div', 'sxs-bar');
  bar.style.display = 'none';
  home.prepend(bar);

  function avatarNode(name, url) {
    const a = mk('span', 'sxs-av');
    if (isHttps(url)) {
      const i = document.createElement('img');
      i.src = url;
      i.alt = '';
      i.referrerPolicy = 'no-referrer';
      a.append(i);
    } else {
      a.textContent = (name || 'U')[0].toUpperCase();
    }
    return a;
  }

  function paintBar() {
    if (!me) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.replaceChildren();
    const seen = getSeen();
    const mine = groups.find((g) => g.uid === me);

    // قصتي
    const myBtn = mk('button', 'sxs-item');
    const myRing = mk('span', 'sxs-ring' + (mine ? (mine.items.every((x) => seen.has(x.id)) ? ' seen' : '') : ' empty'));
    myRing.append(avatarNode(mine ? mine.name : 'أنا', mine ? mine.avatar : (window.__sxMyAvatar || '')));
    const plus = mk('span', 'sxs-plus', '+');
    plus.onclick = (e) => {
      e.stopPropagation();
      if (window.sxOpenComposer) window.sxOpenComposer('story');
    };
    myRing.append(plus);
    myBtn.append(myRing, mk('span', 'sxs-name', 'قصتي'));
    myBtn.onclick = () => {
      if (mine) openViewer(groups.indexOf(mine));
      else if (window.sxOpenComposer) window.sxOpenComposer('story');
    };
    bar.append(myBtn);

    groups.forEach((g, idx) => {
      if (g.uid === me) return;
      const b = mk('button', 'sxs-item');
      const ring = mk('span', 'sxs-ring' + (g.items.every((x) => seen.has(x.id)) ? ' seen' : ''));
      ring.append(avatarNode(g.name, g.avatar));
      b.append(ring, mk('span', 'sxs-name', g.name));
      b.onclick = () => openViewer(idx);
      bar.append(b);
    });
  }

  async function load() {
    if (!me) return;
    const st = await sb
      .from('stories')
      .select('id,user_id,media_url,kind,caption,created_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(300);
    if (st.error) { console.error('stories', st.error.message); paintBar(); return; }
    const rows = (st.data || []).filter((r) => isHttps(r.media_url));
    const ids = Array.from(new Set(rows.map((r) => r.user_id).concat([me])));
    const pr = await sb.from('profiles').select('id,username,avatar_url').in('id', ids);
    const info = new Map((pr.data || []).map((p) => [p.id, p]));
    const meInfo = info.get(me);
    window.__sxMyAvatar = meInfo && isHttps(meInfo.avatar_url) ? meInfo.avatar_url : '';

    const by = new Map();
    rows.forEach((r) => {
      if (!by.has(r.user_id)) {
        const p = info.get(r.user_id) || {};
        by.set(r.user_id, { uid: r.user_id, name: p.username || 'مستخدم', avatar: p.avatar_url || '', items: [] });
      }
      by.get(r.user_id).items.push({ id: r.id, url: r.media_url, kind: r.kind, caption: r.caption || '', created: r.created_at });
    });
    // قصتي أولا ثم الباقي (اللي ما شافهمش بعد قبل)
    const seen = getSeen();
    groups = Array.from(by.values()).sort((a, b) => {
      const ua = a.items.every((x) => seen.has(x.id)) ? 1 : 0;
      const ub = b.items.every((x) => seen.has(x.id)) ? 1 : 0;
      return ua - ub;
    });
    paintBar();
  }
  window.sxReloadStories = load;

  /* ---------- العارض ---------- */
  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 1) return 'دابا';
    if (m < 60) return 'قبل ' + m + ' د';
    return 'قبل ' + Math.round(m / 60) + ' س';
  };

  let viewer = null;
  let timer = null;
  let raf = 0;

  function closeViewer() {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey);
    if (viewer) { viewer.remove(); viewer = null; }
    document.body.style.overflow = '';
    paintBar();
  }
  function onKey(e) {
    if (!viewer) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') viewer.__next();
    if (e.key === 'ArrowRight') viewer.__prev();
  }

  function openViewer(gi) {
    if (viewer) closeViewer();
    if (gi < 0 || !groups[gi]) return;
    let g = gi;
    let i = 0;

    viewer = mk('div', 'sxv');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    const v = viewer;

    function show() {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      const group = groups[g];
      const item = group.items[i];
      markSeen(item.id);
      v.replaceChildren();

      const bars = mk('div', 'sxv-bars');
      const fills = group.items.map((_, k) => {
        const seg = mk('div', 'sxv-seg');
        const f = mk('div', 'sxv-fill');
        f.style.width = k < i ? '100%' : '0';
        seg.append(f);
        bars.append(seg);
        return f;
      });

      const head = mk('div', 'sxv-head');
      const meta = mk('div', 'sxv-meta');
      meta.append(mk('strong', '', group.name), mk('small', '', ago(item.created)));
      head.append(avatarNode(group.name, group.avatar), meta);
      if (group.uid === me) {
        const del = mk('button', 'sxv-btn', '🗑');
        del.setAttribute('aria-label', 'حذف القصة');
        del.onclick = async () => {
          if (!confirm('واش متأكد بغيتي تحذف هاد القصة؟')) return;
          const r = await sb.from('stories').delete().eq('id', item.id);
          if (r.error) { alert('وقع مشكل: ' + r.error.message); return; }
          const m = item.url.match(/\/(post-images|post-videos)\/(.+)$/);
          if (m) sb.storage.from(m[1]).remove([decodeURIComponent(m[2])]);
          group.items.splice(i, 1);
          if (!group.items.length) groups.splice(g, 1);
          if (!groups.length) { closeViewer(); return; }
          if (!groups[g]) { closeViewer(); return; }
          if (i >= groups[g].items.length) { i = 0; if (!groups[g].items.length) g++; }
          if (!groups[g]) { closeViewer(); return; }
          show();
        };
        head.append(del);
      }
      const x = mk('button', 'sxv-btn', '✕');
      x.setAttribute('aria-label', 'سد');
      x.onclick = closeViewer;
      head.append(x);

      const stage = mk('div', 'sxv-stage');
      let started = Date.now();
      let dur = 5000;

      function tick() {
        const p = Math.min(1, (Date.now() - started) / dur);
        fills[i].style.width = p * 100 + '%';
        if (p < 1) raf = requestAnimationFrame(tick);
      }

      if (item.kind === 'video') {
        const vd = document.createElement('video');
        vd.src = item.url;
        vd.autoplay = true;
        vd.playsInline = true;
        vd.muted = false;
        vd.onloadedmetadata = () => {
          dur = Math.min(60000, Math.max(1000, (vd.duration || 5) * 1000));
          started = Date.now();
          cancelAnimationFrame(raf);
          tick();
        };
        vd.onended = () => v.__next();
        vd.onerror = () => v.__next();
        stage.append(vd);
        const pl = vd.play();
        if (pl && pl.catch) pl.catch(() => { vd.muted = true; vd.play().catch(() => {}); });
        tick();
      } else {
        const im = document.createElement('img');
        im.src = item.url;
        im.alt = '';
        im.onerror = () => v.__next();
        stage.append(im);
        timer = setTimeout(() => v.__next(), dur);
        tick();
      }

      // لمسة يسار = الموالي، يمين = السابق (الصفحة RTL)
      const nextTap = mk('button', 'sxv-tap');
      nextTap.style.left = '0';
      nextTap.setAttribute('aria-label', 'الموالي');
      nextTap.onclick = () => v.__next();
      const prevTap = mk('button', 'sxv-tap');
      prevTap.style.right = '0';
      prevTap.setAttribute('aria-label', 'السابق');
      prevTap.onclick = () => v.__prev();
      stage.append(nextTap, prevTap);

      const cap = mk('div', 'sxv-cap', item.caption || '');
      v.append(bars, head, stage, cap);
    }

    v.__next = () => {
      const group = groups[g];
      if (i < group.items.length - 1) { i++; show(); return; }
      // القصة الجاية ديال شخص آخر
      let n = g + 1;
      if (groups[n] && groups[n].uid === me) n++;
      if (groups[n]) { g = n; i = 0; show(); return; }
      closeViewer();
    };
    v.__prev = () => {
      if (i > 0) { i--; show(); return; }
      if (g > 0) { g--; i = 0; show(); return; }
      show();
    };

    document.body.append(v);
    show();
  }

  /* ---------- المستخدم ---------- */
  function setUser(id) {
    if (id === me) return;
    me = id;
    if (!me) { groups = []; bar.style.display = 'none'; if (viewer) closeViewer(); return; }
    load();
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
  setInterval(() => { if (me && document.visibilityState === 'visible' && !viewer) load(); }, 90000);
})();

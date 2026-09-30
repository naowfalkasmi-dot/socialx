(function () {
  const sb = window.sb;
  if (!sb) return;

  let me = null;
  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  // آخر مرة فتحنا فيها كل دردشة (لتحديد الرسائل الجديدة)
  const seenKey = () => 'socialx-seen-' + me;
  const getSeen = () => {
    try { return JSON.parse(localStorage.getItem(seenKey())) || {}; } catch (e) { return {}; }
  };
  const markSeen = (uid) => {
    try {
      const s = getSeen();
      s[uid] = new Date().toISOString();
      localStorage.setItem(seenKey(), JSON.stringify(s));
    } catch (e) { /* ignore */ }
  };

  const sec = mk('section', 'hidden');
  sec.id = 'inbox';
  const panel = mk('div', 'panel pad');
  panel.append(mk('h2', '', '💬 الدردشة'));
  const box = mk('div');
  panel.append(box);
  sec.append(panel);
  document.querySelector('main').append(sec);

  const footer = document.querySelector('footer');
  const btn = mk('button', 'ghost', '💬 دردشة');
  footer.append(' ', btn);

  btn.onclick = () => {
    ['home', 'profile', 'about', 'people', 'datingPage'].forEach((id) => {
      const el = $(id);
      if (el) el.classList.add('hidden');
    });
    sec.classList.remove('hidden');
    window.scrollTo(0, 0);
    load();
  };
  footer.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b !== btn) sec.classList.add('hidden');
  });

  function avatar(p, size) {
    const wrap = mk('div', 'avatar');
    wrap.style.width = size + 'px';
    wrap.style.height = size + 'px';
    wrap.style.overflow = 'hidden';
    if (p.photo_url) {
      const img = document.createElement('img');
      img.src = p.photo_url;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover';
      wrap.append(img);
    } else {
      wrap.textContent = (p.display_name || 'U')[0].toUpperCase();
    }
    return wrap;
  }

  function open(uid, name) {
    markSeen(uid);
    if (window.openChat) window.openChat(uid, name);
  }

  async function load() {
    if (!me) return;
    const [sent, received, profiles, msgs] = await Promise.all([
      sb.from('match_likes').select('to_user').eq('from_user', me),
      sb.from('match_likes').select('from_user').eq('to_user', me),
      sb.from('match_profiles').select('user_id,display_name,photo_url'),
      sb.from('messages')
        .select('sender_id,receiver_id,message,created_at')
        .or('sender_id.eq.' + me + ',receiver_id.eq.' + me)
        .order('created_at', { ascending: false })
        .limit(300)
    ]);

    if (sent.error || received.error || profiles.error || msgs.error) {
      box.replaceChildren(mk('p', 'hint', 'وقع مشكل فـ التحميل، عاود حدث الصفحة'));
      return;
    }

    const incoming = new Set((received.data || []).map((x) => x.from_user));
    const matchIds = (sent.data || []).map((x) => x.to_user).filter((id) => incoming.has(id));
    const byId = new Map((profiles.data || []).map((p) => [p.user_id, p]));

    const last = new Map();
    (msgs.data || []).forEach((m) => {
      const other = m.sender_id === me ? m.receiver_id : m.sender_id;
      if (!last.has(other)) last.set(other, m);
    });

    const seen = getSeen();
    const people = matchIds.filter((id) => byId.has(id));
    const fresh = people.filter((id) => !last.has(id));
    const chats = people
      .filter((id) => last.has(id))
      .sort((a, b) => (last.get(b).created_at > last.get(a).created_at ? 1 : -1));

    box.replaceChildren();

    box.append(mk('h3', '', 'مطابقات جديدة'));
    if (!fresh.length) {
      box.append(mk('p', 'hint', 'ما كاين حتى مطابقة جديدة دابا'));
    } else {
      const row = mk('div');
      row.style.cssText = 'display:flex;gap:14px;overflow-x:auto;padding:6px 0 12px';
      fresh.forEach((id) => {
        const p = byId.get(id);
        const item = mk('button', '');
        item.style.cssText = 'background:none;border:0;color:inherit;text-align:center;flex:none;width:72px';
        item.append(avatar(p, 64), mk('div', 'hint', p.display_name));
        item.onclick = () => open(id, p.display_name);
        row.append(item);
      });
      box.append(row);
    }

    box.append(mk('h3', '', 'الرسائل'));
    if (!chats.length) {
      box.append(mk('p', 'hint', 'ما عندك حتى دردشة دابا. بدا من مطابقة جديدة 💜'));
    }
    chats.forEach((id) => {
      const p = byId.get(id);
      const m = last.get(id);
      const theirTurn = m.sender_id !== me;
      const isNew = theirTurn && (!seen[id] || m.created_at > seen[id]);

      const row = mk('button', '');
      row.style.cssText =
        'display:flex;align-items:center;gap:12px;width:100%;background:none;border:0;' +
        'border-bottom:1px solid #352745;padding:12px 0;color:inherit;text-align:right';
      const text = mk('div');
      text.style.cssText = 'flex:1;min-width:0';
      const title = mk('div', '', p.display_name);
      title.style.fontWeight = isNew ? '800' : '600';
      const preview = mk('div', 'hint', (theirTurn ? '' : '↩ ') + m.message);
      preview.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      text.append(title, preview);
      row.append(avatar(p, 52), text);

      if (isNew) {
        row.append(mk('span', '', '🔴'));
      } else if (theirTurn) {
        const chip = mk('span', '', 'حان دورك');
        chip.style.cssText =
          'background:#f1eaff;color:#2a1740;border-radius:14px;padding:4px 10px;font-size:12px;font-weight:700;flex:none';
        row.append(chip);
      }
      row.onclick = () => open(id, p.display_name);
      box.append(row);
    });
  }

  // تحديث اللائحة ملي كتوصل رسالة، وملي كتسد الدردشة
  let channel = null;
  function subscribe() {
    if (channel) { sb.removeChannel(channel); channel = null; }
    if (!me) return;
    channel = sb
      .channel('inbox-' + me)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'receiver_id=eq.' + me },
        () => { if (!sec.classList.contains('hidden')) load(); }
      )
      .subscribe();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#closeChat') && !sec.classList.contains('hidden')) {
      setTimeout(load, 400);
    }
  });

  function setUser(id) {
    if (id === me) return;
    me = id;
    subscribe();
    if (!me) sec.classList.add('hidden');
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
})();

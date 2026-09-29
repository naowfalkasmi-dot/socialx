(function () {
  const sb = window.sb;
  let me = null;

  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const sec = mk('section', 'hidden');
  sec.id = 'people';
  const panel = mk('div', 'panel pad');
  panel.append(mk('h2', '', 'أشخاص فـ SocialX'));
  const list = mk('div');
  panel.append(list);
  sec.append(panel);
  document.querySelector('main').append(sec);

  const footer = document.querySelector('footer');
  const btn = mk('button', 'ghost', '👥 أشخاص');
  footer.insertBefore(btn, footer.querySelector('[data-page="profile"]'));

  btn.onclick = () => {
    ['home', 'profile', 'about'].forEach((id) => document.getElementById(id).classList.add('hidden'));
    sec.classList.remove('hidden');
    window.scrollTo(0, 0);
    load();
  };
  document.querySelectorAll('[data-page]').forEach((b) =>
    b.addEventListener('click', () => sec.classList.add('hidden'))
  );

  async function load() {
    if (!me) return;
    const [pr, fo] = await Promise.all([
      sb.from('profiles').select('id,username').order('created_at', { ascending: false }).limit(100),
      sb.from('follows').select('follower_id,following_id')
    ]);
    if (pr.error || fo.error) {
      list.replaceChildren(mk('p', 'hint', 'وقع مشكل فـ التحميل، عاود حدث الصفحة'));
      return;
    }
    const mine = new Set();
    const followsMe = new Set();
    const counts = {};
    fo.data.forEach((f) => {
      counts[f.following_id] = (counts[f.following_id] || 0) + 1;
      if (f.follower_id === me) mine.add(f.following_id);
      if (f.following_id === me) followsMe.add(f.follower_id);
    });
    list.replaceChildren();
    const others = pr.data.filter((p) => p.id !== me);
    if (!others.length) {
      list.append(mk('p', 'hint', 'ما كاين حتى واحد آخر دابا. عيط على صحابك يسجلو!'));
      return;
    }
    others.forEach((p) => {
      const row = mk('div', 'row');
      row.style.padding = '10px 0';
      const left = mk('div', 'post-head');
      left.style.padding = '0';
      const info = mk('div');
      info.append(mk('strong', '', p.username || 'مستخدم'), mk('small', '', (counts[p.id] || 0) + ' متابع' + (followsMe.has(p.id) ? ' · يتابعك' : '')));
      left.append(mk('div', 'avatar', (p.username || 'U')[0].toUpperCase()), info);
      const following = mine.has(p.id);
      const b = mk('button', following ? 'ghost' : 'btn', following ? 'إلغاء المتابعة' : (followsMe.has(p.id) ? 'رد المتابعة' : 'تابع'));
      b.onclick = async () => {
        b.disabled = true;
        const r = following
          ? await sb.from('follows').delete().eq('follower_id', me).eq('following_id', p.id)
          : await sb.from('follows').insert({ following_id: p.id });
        if (r.error) alert('وقع مشكل: ' + r.error.message);
        load();
        stats();
      };
      row.append(left, b);
      list.append(row);
    });
  }

  const statsEl = mk('p', 'stat');
  document.getElementById('profileCount').after(statsEl);

  async function stats() {
    if (!me) return;
    const [a, b] = await Promise.all([
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', me),
      sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', me)
    ]);
    statsEl.textContent = (a.count || 0) + ' متابع · ' + (b.count || 0) + ' يتابع';
  }
  document.querySelector('[data-page="profile"]').addEventListener('click', stats);

  sb.auth.onAuthStateChange((_e, s) => {
    me = s ? s.user.id : null;
    if (!me) sec.classList.add('hidden');
    else setTimeout(stats, 0);
  });
  sb.auth.getSession().then(({ data }) => {
    me = data.session ? data.session.user.id : null;
    stats();
  });
})();

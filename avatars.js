(function () {
  const sb = window.sb;
  if (!sb) return;

  let me = null;
  const byName = new Map();

  async function loadMap() {
    if (!me) return;
    const { data, error } = await sb.from('profiles').select('username,avatar_url').not('avatar_url', 'is', null);
    if (error || !data) return;
    byName.clear();
    data.forEach((p) => {
      if (p.username && /^https:\/\/\S+$/i.test(p.avatar_url || '')) byName.set(p.username, p.avatar_url);
    });
  }

  function paint() {
    if (!me || !byName.size) return;
    document.querySelectorAll('.avatar:not([data-sx])').forEach((el) => {
      if (el.closest('#profile') || el.querySelector('img')) { el.setAttribute('data-sx', '1'); return; }
      const host = el.parentElement && el.parentElement.parentElement ? el.parentElement : null;
      const strong = host && host.querySelector('strong');
      const name = strong ? strong.textContent.trim() : '';
      const url = byName.get(name);
      if (!url) return; // نعاودو نحاولو فـ الدورة الجاية
      el.setAttribute('data-sx', '1');
      el.textContent = '';
      el.style.overflow = 'hidden';
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
      el.append(img);
    });
  }

  setInterval(paint, 1200);
  setInterval(loadMap, 60000);

  function setUser(id) {
    if (id === me) return;
    me = id;
    if (me) loadMap().then(paint);
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
})();

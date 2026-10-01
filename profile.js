(function () {
  const sb = window.sb;
  if (!sb) return;

  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const profile = $('profile');
  const top = profile && profile.querySelector('.profile-top');
  const footer = document.querySelector('footer');
  if (!profile || !top || !footer) return;

  let me = null;
  const INPUT =
    'width:100%;padding:12px;margin:6px 0;border-radius:10px;' +
    'border:1px solid #58416e;background:#120d1d;color:white';

  /* ---------- صفحة البروفايل ---------- */
  const bar = mk('div', 'row');
  bar.style.cssText = 'justify-content:space-between;margin-bottom:8px';
  bar.append(mk('span', 'hint', 'حسابي'));
  const gear = mk('button', 'ghost', '⚙️ الإعدادات');
  bar.append(gear);
  top.prepend(bar);

  const bio = mk('p', 'hint');
  bio.id = 'profileBio';
  bio.style.cssText = 'margin:6px 0 10px;white-space:pre-wrap;overflow-wrap:anywhere';
  $('profileName').after(bio);

  const oldEdit = $('editName');
  const editBtn = mk('button', 'btn', 'تعديل البروفايل');
  if (oldEdit) {
    oldEdit.after(editBtn);
    oldEdit.style.display = 'none';
  } else {
    top.append(editBtn);
  }

  /* ---------- صفحة الإعدادات ---------- */
  const st = mk('section', 'hidden');
  st.id = 'settings';
  const panel = mk('div', 'panel pad');

  const head = mk('div', 'row');
  head.append(mk('h2', '', '⚙️ الإعدادات'));
  const back = mk('button', 'ghost', '→ رجوع');
  head.append(back);
  panel.append(head);

  panel.append(mk('h3', '', 'تعديل البروفايل'));
  const nameLabel = mk('label', 'hint', 'الاسم (من 3 حتى 20: حروف، أرقام أو _)');
  const nameIn = document.createElement('input');
  nameIn.maxLength = 20;
  nameIn.style.cssText = INPUT;
  const bioLabel = mk('label', 'hint', 'النبذة (150 حرف)');
  const bioIn = document.createElement('textarea');
  bioIn.maxLength = 150;
  bioIn.style.cssText = INPUT + ';min-height:90px;resize:vertical';
  const save = mk('button', 'btn', 'حفظ');
  panel.append(nameLabel, nameIn, bioLabel, bioIn, save);

  panel.append(mk('h3', '', 'الخصوصية'));
  const visRow = mk('label');
  visRow.style.cssText = 'display:flex;gap:10px;align-items:center;margin:8px 0';
  const vis = document.createElement('input');
  vis.type = 'checkbox';
  visRow.append(vis, mk('span', '', 'ظهور بروفايلي فـ قسم التعارف'));
  const visHint = mk('p', 'hint');
  panel.append(visRow, visHint);

  panel.append(mk('h3', '', 'الحساب'));
  const emailP = mk('p', 'hint');
  const out = mk('button', 'ghost', '⏻ تسجيل الخروج');
  panel.append(emailP, out);

  const msgEl = mk('p', 'hint');
  panel.append(msgEl);
  st.append(panel);
  document.querySelector('main').append(st);

  const msg = (t) => { msgEl.textContent = t || ''; };

  /* ---------- البيانات ---------- */
  async function loadMine() {
    if (!me) return;
    const { data } = await sb.from('profiles').select('username,bio').eq('id', me).maybeSingle();
    if (!data) return;
    bio.textContent = data.bio || '';
    if (data.username) $('profileName').textContent = data.username;
  }

  async function loadSettings() {
    if (!me) return;
    msg('');
    const [pr, mp, u] = await Promise.all([
      sb.from('profiles').select('username,bio').eq('id', me).maybeSingle(),
      sb.from('match_profiles').select('visible').eq('user_id', me).maybeSingle(),
      sb.auth.getUser()
    ]);
    nameIn.value = (pr.data && pr.data.username) || '';
    bioIn.value = (pr.data && pr.data.bio) || '';
    emailP.textContent = (u.data && u.data.user && u.data.user.email) || '';
    if (mp.data) {
      vis.disabled = false;
      vis.checked = !!mp.data.visible;
      visHint.textContent = '';
    } else {
      vis.disabled = true;
      vis.checked = false;
      visHint.textContent = 'ما عندكش بروفايل تعارف بعد.';
    }
  }

  save.onclick = async () => {
    if (!me) return;
    const v = nameIn.value.trim();
    if (!/^[\p{L}\p{N}_]{3,20}$/u.test(v)) {
      msg('الاسم خاصو يكون من 3 حتى 20 حرف: حروف، أرقام أو _');
      return;
    }
    const b = bioIn.value.trim().slice(0, 150);
    const { error } = await sb.from('profiles').update({ username: v, bio: b || null }).eq('id', me);
    if (error) { msg('وقع مشكل: ' + error.message); return; }
    if (typeof state !== 'undefined') state.name = v;
    if (typeof render === 'function') render();
    msg('تم الحفظ ✅');
    loadMine();
  };

  vis.onchange = async () => {
    if (!me) return;
    const { error } = await sb.from('match_profiles').update({ visible: vis.checked }).eq('user_id', me);
    if (error) {
      vis.checked = !vis.checked;
      msg('وقع مشكل: ' + error.message);
    } else {
      msg('تم الحفظ ✅');
    }
  };

  out.onclick = () => {
    st.classList.add('hidden');
    sb.auth.signOut();
  };

  /* ---------- التنقل ---------- */
  function openSettings() {
    profile.classList.add('hidden');
    st.classList.remove('hidden');
    window.scrollTo(0, 0);
    loadSettings();
  }
  gear.onclick = openSettings;
  editBtn.onclick = openSettings;
  back.onclick = () => {
    st.classList.add('hidden');
    profile.classList.remove('hidden');
    loadMine();
  };

  footer.addEventListener('click', () => st.classList.add('hidden'));
  const profileBtn = footer.querySelector('[data-page="profile"]');
  if (profileBtn) profileBtn.addEventListener('click', loadMine);

  // زر الخروج ولى فـ الإعدادات، بحال Instagram
  const lo = Array.from(footer.querySelectorAll('button')).find((b) => b.textContent.includes('خروج'));
  if (lo) lo.style.display = 'none';

  function setUser(id) {
    if (id === me) return;
    me = id;
    if (me) loadMine();
    else { st.classList.add('hidden'); bio.textContent = ''; }
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
})();

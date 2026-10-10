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
  const footer = document.querySelector('footer');
  if (!profile || !footer) return;

  let me = null;
  let current = 'hub';

  // الصفحة القديمة (تعديل البروفايل) كتبدل الاسم باش الصفحة الجديدة تاخد 'settings'
  const oldEdit = $('settings');
  if (oldEdit) oldEdit.id = 'settingsEdit';

  const INPUT =
    'width:100%;padding:12px;margin:6px 0;border-radius:10px;' +
    'border:1px solid #58416e;background:#120d1d;color:white';

  const hub = mk('section', 'hidden');
  hub.id = 'settings';
  const panel = mk('div', 'panel pad');
  hub.append(panel);
  document.querySelector('main').append(hub);

  const head = mk('div', 'row');
  const title = mk('h2', '', 'الإعدادات');
  const back = mk('button', 'ghost', '→ رجوع');
  head.append(title, back);
  const body = mk('div');
  const msgEl = mk('p', 'hint');
  panel.append(head, body, msgEl);
  const msg = (t) => { msgEl.textContent = t || ''; };

  function row(icon, label, hint, onClick, danger) {
    const b = mk('button', '');
    b.style.cssText =
      'display:flex;align-items:center;gap:12px;width:100%;background:none;border:0;' +
      'border-bottom:1px solid #352745;padding:14px 4px;text-align:right;color:' +
      (danger ? '#ff6b81' : 'inherit');
    const i = mk('span', '', icon);
    i.style.fontSize = '20px';
    const t = mk('span', '', label);
    t.style.flex = '1';
    b.append(i, t);
    if (hint) b.append(mk('span', 'hint', hint));
    b.append(mk('span', 'hint', '‹'));
    b.onclick = onClick;
    return b;
  }

  const soon = () => msg('هاد الخاصية جاية قريبا 💜');

  /* ---------- الشاشات ---------- */
  function renderHub() {
    title.textContent = 'الإعدادات';
    body.replaceChildren(
      row('👤', 'تعديل البروفايل', '', () => {
        hub.classList.add('hidden');
        const edit = Array.from(profile.querySelectorAll('button')).find(
          (b) => b.textContent.trim() === 'تعديل البروفايل'
        );
        if (edit) edit.click();
      }),
      row('🔒', 'الخصوصية', '', () => go('privacy')),
      row('🛡️', 'الأمان وكلمة السر', '', () => go('security')),
      row('🔔', 'الإشعارات', 'قريبا', soon),
      row('🎨', 'المظهر واللغة', 'قريبا', soon),
      row('ℹ️', 'المساعدة وحول SocialX', '', () => go('about')),
      row('⏻', 'تسجيل الخروج', '', async () => {
        hub.classList.add('hidden');
        await sb.auth.signOut();
      }, true)
    );
  }

  async function renderPrivacy() {
    title.textContent = 'الخصوصية';
    body.replaceChildren();

    const visRow = mk('label');
    visRow.style.cssText = 'display:flex;gap:10px;align-items:center;margin:10px 0';
    const vis = document.createElement('input');
    vis.type = 'checkbox';
    visRow.append(vis, mk('span', '', 'ظهور بروفايلي فـ قسم التعارف'));
    const visHint = mk('p', 'hint');
    body.append(visRow, visHint);

    const mp = await sb.from('match_profiles').select('visible').eq('user_id', me).maybeSingle();
    if (mp.data) {
      vis.checked = !!mp.data.visible;
    } else {
      vis.disabled = true;
      visHint.textContent = 'ما عندكش بروفايل تعارف بعد.';
    }
    vis.onchange = async () => {
      const { error } = await sb.from('match_profiles').update({ visible: vis.checked }).eq('user_id', me);
      if (error) { vis.checked = !vis.checked; msg('وقع مشكل: ' + error.message); }
      else msg('تم الحفظ ✅');
    };

    body.append(mk('h3', '', 'الحسابات المحظورة'));
    const box = mk('div');
    body.append(box);
    await loadBlocked(box);

    body.append(mk('h3', '', 'الحساب الخاص'));
    body.append(mk('p', 'hint', 'الحساب الخاص وطلبات المتابعة: جاية قريبا.'));
  }

  async function loadBlocked(box) {
    const { data, error } = await sb.from('match_blocks').select('blocked').eq('blocker', me);
    box.replaceChildren();
    if (error) { box.append(mk('p', 'hint', 'تعذر تحميل القائمة')); return; }
    const ids = (data || []).map((x) => x.blocked);
    if (!ids.length) { box.append(mk('p', 'hint', 'ما عندك حتى حساب محظور')); return; }
    const pr = await sb.from('profiles').select('id,username').in('id', ids);
    const names = new Map((pr.data || []).map((p) => [p.id, p.username]));
    ids.forEach((id) => {
      const r = mk('div', 'row');
      r.style.padding = '8px 0';
      const un = mk('button', 'ghost', 'إلغاء الحظر');
      un.onclick = async () => {
        const res = await sb.from('match_blocks').delete().eq('blocker', me).eq('blocked', id);
        if (res.error) msg('وقع مشكل: ' + res.error.message);
        else loadBlocked(box);
      };
      r.append(mk('span', '', names.get(id) || 'مستخدم'), un);
      box.append(r);
    });
  }

  async function renderSecurity() {
    title.textContent = 'الأمان وكلمة السر';
    body.replaceChildren();
    const u = await sb.auth.getUser();
    body.append(mk('p', 'hint', 'البريد الإلكتروني: ' + ((u.data && u.data.user && u.data.user.email) || '')));

    body.append(mk('h3', '', 'تغيير كلمة السر'));
    const p1 = document.createElement('input');
    p1.type = 'password';
    p1.placeholder = 'كلمة السر الجديدة (6 حروف على الأقل)';
    p1.autocomplete = 'new-password';
    p1.style.cssText = INPUT;
    const p2 = document.createElement('input');
    p2.type = 'password';
    p2.placeholder = 'عاود كتب كلمة السر';
    p2.autocomplete = 'new-password';
    p2.style.cssText = INPUT;
    const save = mk('button', 'btn', 'تغيير كلمة السر');
    save.onclick = async () => {
      if (p1.value.length < 6) { msg('كلمة السر خاصها 6 حروف على الأقل'); return; }
      if (p1.value !== p2.value) { msg('كلمتين السر ماشي بحال بحال'); return; }
      const { error } = await sb.auth.updateUser({ password: p1.value });
      if (error) { msg('وقع مشكل: ' + error.message); return; }
      p1.value = '';
      p2.value = '';
      msg('تبدلات كلمة السر ✅');
    };
    body.append(p1, p2, save);

    body.append(mk('h3', '', 'الأجهزة'));
    const all = mk('button', 'ghost', 'تسجيل الخروج من كل الأجهزة');
    all.onclick = async () => {
      if (!confirm('واش متأكد بغيتي تخرج من كل الأجهزة؟')) return;
      hub.classList.add('hidden');
      await sb.auth.signOut({ scope: 'global' });
    };
    body.append(all);
  }

  function renderAbout() {
    title.textContent = 'المساعدة وحول SocialX';
    body.replaceChildren(
      mk('h3', '', '✦ SocialX'),
      mk('p', 'hint', 'نسخة تجريبية (Beta). تواصل، متابعة، تعارف 18+ ودردشة.'),
      mk('h3', '', 'السلامة'),
      mk('p', 'hint', 'قسم التعارف للبالغين 18+ فقط. تقدر تحظر أو تبلغ على أي حساب من بطاقة الشخص.'),
      mk('p', 'hint', 'سياسة الخصوصية وشروط الاستخدام: جايين قبل الإطلاق الرسمي.')
    );
  }

  const screens = { hub: renderHub, privacy: renderPrivacy, security: renderSecurity, about: renderAbout };
  function go(name) {
    current = name;
    msg('');
    screens[name]();
  }

  back.onclick = () => {
    if (current !== 'hub') { go('hub'); return; }
    hub.classList.add('hidden');
    profile.classList.remove('hidden');
  };

  function openHub() {
    if (!me) return;
    profile.classList.add('hidden');
    const edit = $('settingsEdit');
    if (edit) edit.classList.add('hidden');
    hub.classList.remove('hidden');
    window.scrollTo(0, 0);
    go('hub');
  }

  const gear = profile.querySelector('button[title="الإعدادات"]');
  if (gear) gear.onclick = openHub;
  footer.addEventListener('click', () => hub.classList.add('hidden'));

  function setUser(id) {
    me = id;
    if (!me) hub.classList.add('hidden');
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
})();

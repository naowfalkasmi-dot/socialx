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
  let myCity = '';

  // الصفحة القديمة (تعديل البروفايل) كتبدل الاسم باش الصفحة الجديدة تاخد 'settings'
  const oldEdit = $('settings');
  if (oldEdit) oldEdit.id = 'settingsEdit';

  const INPUT =
    'width:100%;padding:12px;margin:6px 0;border-radius:10px;' +
    'border:1px solid #58416e;background:#120d1d;color:white';

  /* ================= الإعدادات (كتتحفظ فـ Supabase + نسخة محلية) ================= */
  const LS = 'socialx-prefs';
  const DEFAULTS = {
    toast: true, sound: false,
    accent: 'violet', size: 'normal', calm: false, bold: false,
    ageMin: 18, ageMax: 60, sameCity: false, needPhoto: false,
    limit: 0
  };
  let cfg = Object.assign({}, DEFAULTS);
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(LS)) || {}); } catch (e) { /* ignore */ }

  let saveTimer = null;
  function saveCfg() {
    try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    if (!me) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const { error } = await sb
        .from('user_settings')
        .upsert({ user_id: me, data: cfg, updated_at: new Date().toISOString() });
      if (error) console.error('settings save', error.message);
    }, 500);
  }
  function setCfg(k, v) {
    cfg[k] = v;
    applyAll();
    saveCfg();
    msg('تم الحفظ ✅');
  }
  async function loadCfg() {
    if (!me) return;
    const { data } = await sb.from('user_settings').select('data').eq('user_id', me).maybeSingle();
    if (data && data.data) {
      cfg = Object.assign({}, DEFAULTS, data.data);
      try { localStorage.setItem(LS, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    }
    applyAll();
  }

  /* ---------- المظهر ---------- */
  const ACCENTS = {
    violet: ['#783fe0', '#b65af0'],
    pink: ['#d6336c', '#ff7ab6'],
    blue: ['#2563eb', '#38bdf8'],
    green: ['#059669', '#34d399'],
    orange: ['#ea580c', '#fbbf24']
  };
  const themeStyle = document.createElement('style');
  document.head.append(themeStyle);
  function applyAll() {
    const a = ACCENTS[cfg.accent] || ACCENTS.violet;
    document.body.style.zoom = cfg.size === 'big' ? '1.12' : cfg.size === 'small' ? '0.92' : '';
    themeStyle.textContent =
      '.btn{background:linear-gradient(100deg,' + a[0] + ',' + a[1] + ') !important}' +
      (cfg.bold ? 'body{font-weight:600}' : '') +
      (cfg.calm ? '*{animation:none !important;transition:none !important}' : '');
  }
  applyAll();

  /* ---------- إشعار الرسالة: إخفاؤه / صوت ---------- */
  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const c = new Ctx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.start();
      o.stop(c.currentTime + 0.15);
      setTimeout(() => c.close(), 400);
    } catch (e) { /* ignore */ }
  }
  new MutationObserver((list) => {
    list.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1 || n.textContent !== '💬 رسالة جديدة') return;
      if (cfg.toast === false) n.remove();
      if (cfg.sound) beep();
    }));
  }).observe(document.body, { childList: true });

  /* ---------- فلتر التعارف (كيقراه match.js) ---------- */
  window.sxDiscoverFilter = function (p) {
    const age = Number(p.age);
    if (age && (age < (cfg.ageMin || 18) || age > (cfg.ageMax || 100))) return false;
    if (cfg.needPhoto && !p.photo_url) return false;
    if (cfg.sameCity) {
      const c = (p.city || '').trim().toLowerCase();
      if (myCity && c !== myCity) return false;
    }
    return true;
  };
  async function loadMyCity() {
    if (!me) return;
    const r = await sb.from('match_profiles').select('city').eq('user_id', me).maybeSingle();
    myCity = ((r.data && r.data.city) || '').trim().toLowerCase();
  }

  /* ---------- الوقت اللي كتقضي فـ التطبيق ---------- */
  const dayKey = () => 'socialx-time-' + new Date().toISOString().slice(0, 10);
  const getSecs = () => { try { return Number(localStorage.getItem(dayKey())) || 0; } catch (e) { return 0; } };
  function note(text) {
    const t = mk('div', '', text);
    t.style.cssText =
      'position:fixed;top:14px;left:50%;transform:translateX(-50%);max-width:90%;text-align:center;' +
      'background:#783fe0;color:#fff;padding:10px 16px;border-radius:12px;z-index:20;font-size:14px;' +
      'box-shadow:0 4px 18px #0008';
    document.body.append(t);
    setTimeout(() => t.remove(), 6000);
  }
  setInterval(() => {
    if (!me || document.visibilityState !== 'visible') return;
    try {
      const s = getSecs() + 30;
      localStorage.setItem(dayKey(), String(s));
      const flag = dayKey() + '-warned';
      if (cfg.limit > 0 && s >= cfg.limit * 60 && !localStorage.getItem(flag)) {
        localStorage.setItem(flag, '1');
        note('⏰ وصلتي الحد اليومي (' + cfg.limit + ' دقيقة). خد بريك 💜');
      }
    } catch (e) { /* ignore */ }
  }, 30000);

  /* ================= الواجهة ================= */
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
  function msg(t) { msgEl.textContent = t || ''; }

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

  function section(t) {
    const h = mk('p', 'hint', t);
    h.style.cssText = 'margin:16px 4px 2px;font-weight:700';
    return h;
  }

  function toggleRow(label, hint, key) {
    const wrap = mk('div');
    const l = mk('label');
    l.style.cssText = 'display:flex;gap:10px;align-items:center;margin:12px 0';
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = !!cfg[key];
    c.onchange = () => setCfg(key, c.checked);
    l.append(c, mk('span', '', label));
    wrap.append(l);
    if (hint) wrap.append(mk('p', 'hint', hint));
    return wrap;
  }

  function choiceRow(label, key, options) {
    const wrap = mk('div');
    wrap.append(mk('h3', '', label));
    const line = mk('div');
    line.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px';
    const paint = () => {
      Array.from(line.children).forEach((b) => {
        b.className = String(b.dataset.v) === String(cfg[key]) ? 'btn' : 'ghost';
      });
    };
    options.forEach(([v, text]) => {
      const b = mk('button', 'ghost', text);
      b.dataset.v = v;
      b.onclick = () => { setCfg(key, v); paint(); };
      line.append(b);
    });
    wrap.append(line);
    paint();
    return wrap;
  }

  /* ---------- الرئيسية ---------- */
  function renderHub() {
    title.textContent = 'الإعدادات';
    body.replaceChildren(
      section('حسابك'),
      row('👤', 'تعديل البروفايل', '', () => {
        hub.classList.add('hidden');
        const edit = Array.from(profile.querySelectorAll('button')).find(
          (b) => b.textContent.trim() === 'تعديل البروفايل'
        );
        if (edit) edit.click();
      }),
      row('🪪', 'معلومات الحساب', '', () => go('account')),
      row('🛡️', 'الأمان وكلمة السر', '', () => go('security')),
      section('الخصوصية'),
      row('🔒', 'الخصوصية والحظر', '', () => go('privacy')),
      section('التعارف'),
      row('💜', 'إعدادات التعارف والفلاتر', '', () => go('discover')),
      section('تجربتك'),
      row('🔔', 'الإشعارات', '', () => go('notifs')),
      row('⏱️', 'وقتك فـ التطبيق', '', () => go('time')),
      row('🎨', 'المظهر وسهولة الاستخدام', '', () => go('look')),
      section('بياناتك'),
      row('🗂️', 'بياناتي', '', () => go('data')),
      section('الدعم'),
      row('ℹ️', 'المساعدة وحول SocialX', '', () => go('about')),
      row('⏻', 'تسجيل الخروج', '', async () => {
        hub.classList.add('hidden');
        await sb.auth.signOut();
      }, true)
    );
  }

  /* ---------- الحساب ---------- */
  async function renderAccount() {
    title.textContent = 'معلومات الحساب';
    body.replaceChildren();
    const u = await sb.auth.getUser();
    const user = (u.data && u.data.user) || {};
    const pr = await sb.from('profiles').select('username').eq('id', me).maybeSingle();
    body.append(
      mk('p', '', 'اسم المستخدم: ' + ((pr.data && pr.data.username) || '—')),
      mk('p', '', 'البريد: ' + (user.email || '')),
      mk('p', 'hint', 'تاريخ التسجيل: ' + (user.created_at ? new Date(user.created_at).toLocaleDateString('ar') : ''))
    );

    body.append(mk('h3', '', 'تغيير اسم المستخدم'));
    const un = mk('button', 'ghost', '✏️ تغيير الاسم');
    un.onclick = () => {
      hub.classList.add('hidden');
      const b = $('editName');
      if (b) b.click();
    };
    body.append(un);

    body.append(mk('h3', '', 'تغيير البريد الإلكتروني'));
    const em = document.createElement('input');
    em.type = 'email';
    em.placeholder = 'البريد الجديد';
    em.autocomplete = 'email';
    em.style.cssText = INPUT;
    const sv = mk('button', 'btn', 'تغيير البريد');
    sv.onclick = async () => {
      const v = em.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(v)) { msg('كتب بريد صحيح'); return; }
      const { error } = await sb.auth.updateUser({ email: v });
      if (error) msg('وقع مشكل: ' + error.message);
      else msg('بعثنا ليك رسالة تأكيد. حتى تأكد البريد الجديد ما غيتبدلش ✉️');
    };
    body.append(em, sv);

    body.append(mk('h3', '', 'حذف الحساب'));
    body.append(mk('p', 'hint', 'حذف الحساب نهائيا خاصو سيرفر آمن، وغنزيدوه قبل الإطلاق الرسمي. دابا تقدر تمسح منشوراتك من "بياناتي".'));
  }

  /* ---------- الأمان ---------- */
  async function renderSecurity() {
    title.textContent = 'الأمان وكلمة السر';
    body.replaceChildren();
    const u = await sb.auth.getUser();
    const user = (u.data && u.data.user) || {};
    body.append(mk('p', 'hint', 'البريد الإلكتروني: ' + (user.email || '')));
    if (user.last_sign_in_at) {
      body.append(mk('p', 'hint', 'آخر دخول: ' + new Date(user.last_sign_in_at).toLocaleString('ar')));
    }

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

    body.append(mk('h3', '', 'التحقق بخطوتين'));
    body.append(mk('p', 'hint', 'جاي قريبا.'));
  }

  /* ---------- الخصوصية ---------- */
  async function renderPrivacy() {
    title.textContent = 'الخصوصية والحظر';
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

    body.append(mk('h3', '', 'الرسائل'));
    body.append(mk('p', 'hint', '✅ ما يقدر يراسلك حد حتى يكون Match بيناتكم، والمحظورين ما يقدروش يراسلوك.'));

    body.append(mk('h3', '', 'الحسابات المحظورة'));
    const box = mk('div');
    body.append(box);
    await loadBlocked(box);

    body.append(mk('h3', '', 'جاي قريبا'));
    body.append(mk('p', 'hint', 'الحساب الخاص وطلبات المتابعة · حالة النشاط · الأصدقاء المقربين · كتم الحسابات.'));
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

  /* ---------- التعارف (بحال تيندر) ---------- */
  function numberRow(label, key, min, max) {
    const l = mk('label');
    l.style.cssText = 'display:flex;gap:10px;align-items:center;margin:8px 0';
    const i = document.createElement('input');
    i.type = 'number';
    i.min = min;
    i.max = max;
    i.value = cfg[key];
    i.style.cssText = INPUT + ';width:100px';
    i.onchange = () => {
      let v = Math.round(Number(i.value));
      if (!Number.isFinite(v)) v = DEFAULTS[key];
      v = Math.min(max, Math.max(min, v));
      if (key === 'ageMin' && v > cfg.ageMax) v = cfg.ageMax;
      if (key === 'ageMax' && v < cfg.ageMin) v = cfg.ageMin;
      i.value = v;
      setCfg(key, v);
    };
    l.append(mk('span', '', label), i);
    return l;
  }

  async function renderDiscover() {
    title.textContent = 'إعدادات التعارف';
    body.replaceChildren();
    const mp = await sb.from('match_profiles').select('visible,display_name,city').eq('user_id', me).maybeSingle();

    if (!mp.data) {
      body.append(mk('p', 'hint', 'ما عندكش بروفايل تعارف بعد. ادخل لقسم "تعارف" وكمل المعلومات.'));
    } else {
      myCity = (mp.data.city || '').trim().toLowerCase();
      body.append(mk('p', '', 'اسمك فـ التعارف: ' + mp.data.display_name));
      const vr = mk('label');
      vr.style.cssText = 'display:flex;gap:10px;align-items:center;margin:12px 0';
      const vis = document.createElement('input');
      vis.type = 'checkbox';
      vis.checked = !!mp.data.visible;
      vis.onchange = async () => {
        const { error } = await sb.from('match_profiles').update({ visible: vis.checked }).eq('user_id', me);
        if (error) { vis.checked = !vis.checked; msg('وقع مشكل: ' + error.message); }
        else msg('تم الحفظ ✅');
      };
      vr.append(vis, mk('span', '', 'إظهار بروفايلي (إيقاف مؤقت للتعارف)'));
      body.append(vr);

      const ed = mk('button', 'ghost', '✏️ تعديل بروفايل التعارف');
      ed.onclick = () => {
        hub.classList.add('hidden');
        const tab = Array.from(footer.querySelectorAll('button')).find((b) => b.textContent.includes('تعارف'));
        if (tab) tab.click();
        setTimeout(() => { const e = $('datingEdit'); if (e) e.click(); }, 700);
      };
      body.append(ed);
    }

    body.append(mk('h3', '', 'شكون بغيتي تشوف'));
    body.append(numberRow('أصغر عمر', 'ageMin', 18, 100));
    body.append(numberRow('أكبر عمر', 'ageMax', 18, 100));
    body.append(toggleRow('غير الناس من مدينتي', myCity ? '' : 'خاصك تكتب المدينة فـ بروفايل التعارف باش يخدم هاد الخيار.', 'sameCity'));
    body.append(toggleRow('غير البروفايلات اللي فيها صورة', '', 'needPhoto'));
    body.append(mk('p', 'hint', 'الفلاتر كتطبق ملي تحدث قسم التعارف.'));

    body.append(mk('h3', '', 'إعادة الأشخاص اللي تخطيتي'));
    body.append(mk('p', 'hint', 'كيرجعو يبانو ليك الناس اللي ضغطتي عليهم "تخطي".'));
    const rp = mk('button', 'ghost', 'إعادة التخطيات');
    rp.onclick = async () => {
      if (!confirm('واش متأكد؟')) return;
      const { error } = await sb.from('match_passes').delete().eq('from_user', me);
      msg(error ? 'وقع مشكل: ' + error.message : 'تمت الإعادة ✅');
    };
    body.append(rp);

    body.append(mk('h3', '', 'السلامة'));
    body.append(mk('p', 'hint', 'ما تعطي حتى معلومة حساسة (عنوان، فلوس) لشي واحد جديد. تقدر تحظر وتبلغ من بطاقة الشخص.'));
    body.append(mk('p', 'hint', 'جاي قريبا: اختيار الجنس، المسافة، وإخفاء العمر أو المدينة.'));
  }

  /* ---------- الإشعارات ---------- */
  function renderNotifs() {
    title.textContent = 'الإشعارات';
    body.replaceChildren(
      toggleRow('إشعار "رسالة جديدة" فوق الشاشة', 'النقطة الحمراء 🔴 كتبقى ديما.', 'toast'),
      toggleRow('صوت عند وصول رسالة', 'كيخدم ملي التطبيق مفتوح.', 'sound'),
      mk('p', 'hint', 'الإشعارات خارج التطبيق جايين مستقبلا.')
    );
  }

  /* ---------- الوقت ---------- */
  function renderTime() {
    title.textContent = 'وقتك فـ التطبيق';
    const mins = Math.floor(getSecs() / 60);
    body.replaceChildren(
      mk('p', '', 'اليوم قضيتي تقريبا: ' + mins + ' دقيقة (فـ هاد الجهاز)'),
      choiceRow('تذكير الحد اليومي', 'limit', [
        [0, 'بلا'], [15, '15 د'], [30, '30 د'], [60, 'ساعة'], [120, 'ساعتين']
      ]),
      mk('p', 'hint', 'ملي توصل للحد غيطلع ليك تنبيه. ماشي إغلاق، غير تذكير.')
    );
  }

  /* ---------- المظهر ---------- */
  function renderLook() {
    title.textContent = 'المظهر وسهولة الاستخدام';
    body.replaceChildren(
      choiceRow('لون الأزرار', 'accent', [
        ['violet', '💜 بنفسجي'], ['pink', '🌸 وردي'], ['blue', '💙 أزرق'], ['green', '💚 أخضر'], ['orange', '🧡 برتقالي']
      ]),
      choiceRow('حجم الكتابة', 'size', [['small', 'صغير'], ['normal', 'عادي'], ['big', 'كبير']]),
      toggleRow('كتابة غليظة (أوضح)', '', 'bold'),
      toggleRow('وضع هادئ (بلا حركات)', '', 'calm'),
      mk('p', 'hint', 'الوضع الفاتح واللغات: جايين قريبا.')
    );
  }

  /* ---------- بياناتي ---------- */
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderData() {
    title.textContent = 'بياناتي';
    body.replaceChildren();

    body.append(mk('h3', '', 'تحميل نسخة من بياناتي'));
    body.append(mk('p', 'hint', 'ملف JSON فيه البروفايل، المنشورات، المتابعات، التعارف والرسائل ديالك.'));
    const ex = mk('button', 'btn', '⬇️ تحميل بياناتي');
    ex.onclick = async () => {
      ex.disabled = true;
      msg('كنجمع البيانات...');
      const q = (t, col) => sb.from(t).select('*').eq(col, me);
      const [a, b, c, d, e, f, g, h] = await Promise.all([
        q('profiles', 'id'), q('posts', 'user_id'), q('follows', 'follower_id'), q('follows', 'following_id'),
        q('match_profiles', 'user_id'), q('match_likes', 'from_user'),
        q('messages', 'sender_id'), q('messages', 'receiver_id')
      ]);
      download('socialx-data.json', JSON.stringify({
        exported_at: new Date().toISOString(),
        profile: a.data, posts: b.data, following: c.data, followers: d.data,
        dating_profile: e.data, dating_likes: f.data, messages_sent: g.data, messages_received: h.data,
        settings: cfg
      }, null, 2));
      ex.disabled = false;
      msg('تم التحميل ✅');
    };
    body.append(ex);

    body.append(mk('h3', '', 'حذف منشوراتي'));
    body.append(mk('p', 'hint', 'كيمسح كل المنشورات ديالك. ما كيرجعش.'));
    const dp = mk('button', 'ghost', '🗑️ حذف كل منشوراتي');
    dp.style.color = '#ff6b81';
    dp.onclick = async () => {
      if (!confirm('غادي تتمسح كل منشوراتك. واش متأكد؟')) return;
      const { error } = await sb.from('posts').delete().eq('user_id', me);
      msg(error ? 'وقع مشكل: ' + error.message : 'تم الحذف ✅ حدث الصفحة باش تشوف النتيجة');
    };
    body.append(dp);

    body.append(mk('h3', '', 'إرجاع الإعدادات للأصل'));
    const rs = mk('button', 'ghost', 'إعادة ضبط كل الإعدادات');
    rs.onclick = () => {
      if (!confirm('كل الإعدادات غترجع للأصل. واش متأكد؟')) return;
      cfg = Object.assign({}, DEFAULTS);
      applyAll();
      saveCfg();
      msg('تمت إعادة الضبط ✅');
    };
    body.append(rs);
  }

  /* ---------- المساعدة ---------- */
  function renderAbout() {
    title.textContent = 'المساعدة وحول SocialX';
    body.replaceChildren(
      mk('h3', '', '✦ SocialX'),
      mk('p', 'hint', 'نسخة تجريبية (Beta). تواصل، متابعة، تعارف 18+ ودردشة.'),
      mk('h3', '', 'السلامة'),
      mk('p', 'hint', 'قسم التعارف للبالغين 18+ فقط. تقدر تحظر أو تبلغ على أي حساب من بطاقة الشخص.'),
      mk('p', 'hint', '• استعمل كلمة سر قوية ما كتستعملهاش فـ موقع آخر.'),
      mk('p', 'hint', '• ما تشارك كلمة السر مع حد، SocialX عمرو غيطلبها منك.'),
      mk('h3', '', 'جاي قريبا'),
      mk('p', 'hint', 'حساب خاص · طلبات المتابعة · حالة النشاط · أصدقاء مقربين · كتم · تحقق بخطوتين · حذف الحساب · الوضع الفاتح · لغات · إشعارات خارج التطبيق · سياسة الخصوصية وشروط الاستخدام.'),
      mk('p', 'hint', 'النسخة: Beta 1.0')
    );
  }

  const screens = {
    hub: renderHub, account: renderAccount, security: renderSecurity, privacy: renderPrivacy,
    discover: renderDiscover, notifs: renderNotifs, time: renderTime, look: renderLook,
    data: renderData, about: renderAbout
  };
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
    if (id === me) return;
    me = id;
    if (!me) { hub.classList.add('hidden'); return; }
    loadCfg();
    loadMyCity();
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
})();

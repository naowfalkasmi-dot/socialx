(function () {
  const SUPABASE_URL = 'https://ouchxygnnujvrncvsagf.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_4nbWqzDmVImUxVGVwraEdg_10LVtlh-';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.sb = sb;

  const box = document.createElement('div');
  box.className = 'modal hidden';
  box.style.zIndex = '9';
  box.innerHTML =
    '<div class="modal-inner">' +
    '<h2 id="authTitle">تسجيل الدخول</h2>' +
    '<input id="authEmail" type="email" placeholder="الإيميل" autocomplete="email">' +
    '<input id="authPass" type="password" placeholder="كلمة السر (6 حروف على الأقل)" autocomplete="current-password">' +
    '<p class="hint" id="authMsg"></p>' +
    '<div class="row"><button class="btn" id="authMain">دخول</button>' +
    '<button class="ghost" id="authSwitch">ما عندكش حساب؟ سجل</button></div></div>';
  document.body.append(box);

  const out = document.createElement('button');
  out.className = 'ghost hidden';
  out.textContent = '⏻ خروج';
  document.querySelector('footer').append(' ', out);

  const $ = (id) => document.getElementById(id);
  let mode = 'login';

  function setMode(m) {
    mode = m;
    $('authTitle').textContent = m === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب';
    $('authMain').textContent = m === 'login' ? 'دخول' : 'سجل';
    $('authSwitch').textContent = m === 'login' ? 'ما عندكش حساب؟ سجل' : 'عندك حساب؟ دخل';
    $('authMsg').textContent = '';
  }

  function tr(msg) {
    if (/Invalid login/i.test(msg)) return 'الإيميل ولا كلمة السر غالطين';
    if (/not confirmed/i.test(msg)) return 'خاصك تأكد الإيميل أولا (شوف الإيميل ديالك)';
    if (/already registered/i.test(msg)) return 'هاد الإيميل ديجا مسجل، جرب تدخل';
    if (/at least 6/i.test(msg)) return 'كلمة السر خاصها تكون 6 حروف على الأقل';
    return msg;
  }

  async function submit() {
    const email = $('authEmail').value.trim();
    const password = $('authPass').value;
    const msg = $('authMsg');
    if (!email || !password) { msg.textContent = 'كتب الإيميل وكلمة السر'; return; }
    msg.textContent = '...';
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      msg.textContent = error ? tr(error.message) : '';
    } else {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: location.origin + location.pathname }
      });
      if (error) msg.textContent = tr(error.message);
      else if (!data.session) msg.textContent = 'تسجل الحساب ✅ شوف الإيميل ديالك وكليكي على الرابط باش تأكد، من بعد دخل.';
    }
  }

  $('authMain').onclick = submit;
  $('authPass').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('authSwitch').onclick = () => setMode(mode === 'login' ? 'signup' : 'login');
  out.onclick = () => sb.auth.signOut();

  function update(session) {
    box.classList.toggle('hidden', !!session);
    out.classList.toggle('hidden', !session);
  }

  sb.auth.onAuthStateChange((_e, session) => update(session));
  sb.auth.getSession().then(({ data }) => update(data.session));
})();

(function () {
  const sb = window.sb;
  let me = null;

  async function load() {
    if (!me) return;
    const [p, u] = await Promise.all([
      sb.from('posts').select('id,user_id,content,created_at').order('created_at', { ascending: false }).limit(50),
      sb.from('profiles').select('id,username')
    ]);
    if (p.error) { console.error(p.error); return; }
    const names = {};
    (u.data || []).forEach((x) => { names[x.id] = x.username; });
    if (names[me]) state.name = names[me];
    state.posts = p.data.reverse().map((r) => ({
      id: r.id,
      author: names[r.user_id] || 'مستخدم',
      text: r.content || '',
      image: null,
      date: r.created_at,
      likes: 0,
      liked: false,
      saved: false,
      comments: [],
      mine: r.user_id === me
    }));
    render();
  }

  document.getElementById('publish').onclick = async () => {
    const text = document.getElementById('content').value.trim();
    if (!text) { alert('كتب شي حاجة'); return; }
    const { error } = await sb.from('posts').insert({ content: text });
    if (error) { alert('وقع مشكل: ' + error.message); return; }
    document.getElementById('content').value = '';
    document.getElementById('photo').value = '';
    document.getElementById('preview').classList.add('hidden');
    document.getElementById('count').textContent = '0 / 1500';
    document.getElementById('modal').classList.add('hidden');
    load();
  };

  document.getElementById('editName').onclick = async () => {
    if (!me) return;
    const name = prompt('شنو الاسم اللي بغيتي؟ (من 3 حتى 20: حروف، أرقام أو _)', state.name);
    if (!name) return;
    const v = name.trim();
    if (!/^[\p{L}\p{N}_]{3,20}$/u.test(v)) {
      alert('الاسم خاصو يكون من 3 حتى 20 حرف، غير حروف وأرقام و _');
      return;
    }
    const { error } = await sb.from('profiles').update({ username: v }).eq('id', me);
    if (error) { alert('وقع مشكل: ' + error.message); return; }
    state.name = v;
    load();
  };

  sb.auth.onAuthStateChange((_e, s) => {
    me = s ? s.user.id : null;
    if (me) setTimeout(load, 0);
    else { state.posts = []; render(); }
  });
  sb.auth.getSession().then(({ data }) => {
    me = data.session ? data.session.user.id : null;
    load();
  });
})();

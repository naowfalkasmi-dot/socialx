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

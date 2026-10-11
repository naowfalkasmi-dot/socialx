(function () {
  const sb = window.sb;
  let me = null;
  const names = {};
  const SAVED_KEY = 'socialx-saved-posts';
  const openComments = new Set();

  const getSaved = () => {
    try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY)) || []); } catch (e) { return new Set(); }
  };
  const putSaved = (set) => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(set))); } catch (e) { /* ignore */ }
  };

  async function load() {
    if (!me) return;
    const [p, u] = await Promise.all([
      sb.from('posts').select('id,user_id,content,created_at,edited_at').order('created_at', { ascending: false }).limit(50),
      sb.from('profiles').select('id,username')
    ]);
    if (p.error) { console.error(p.error); return; }
    (u.data || []).forEach((x) => { names[x.id] = x.username; });
    if (names[me]) state.name = names[me];

    const ids = p.data.map((r) => r.id);
    let likes = [];
    let comments = [];
    if (ids.length) {
      const [l, c] = await Promise.all([
        sb.from('post_likes').select('post_id,user_id').in('post_id', ids),
        sb.from('post_comments').select('id,post_id,user_id,body,created_at,edited_at').in('post_id', ids).order('created_at', { ascending: true })
      ]);
      likes = l.data || [];
      comments = c.data || [];
    }
    const likeCount = {};
    const likedByMe = new Set();
    likes.forEach((x) => {
      const k = String(x.post_id);
      likeCount[k] = (likeCount[k] || 0) + 1;
      if (x.user_id === me) likedByMe.add(k);
    });
    const byPost = {};
    comments.forEach((c) => {
      const k = String(c.post_id);
      (byPost[k] = byPost[k] || []).push({
        id: c.id,
        author: names[c.user_id] || 'مستخدم',
        text: c.body,
        edited: !!c.edited_at,
        mine: c.user_id === me
      });
    });

    const saved = getSaved();
    state.posts = p.data.reverse().map((r) => {
      const k = String(r.id);
      return {
        id: r.id,
        author: names[r.user_id] || 'مستخدم',
        text: r.content || '',
        image: null,
        date: r.created_at,
        edited: !!r.edited_at,
        likes: likeCount[k] || 0,
        liked: likedByMe.has(k),
        saved: saved.has(k),
        commentRows: byPost[k] || [],
        comments: [],
        mine: r.user_id === me
      };
    });
    render();
  }

  /* ---------- رسم المنشورات (لايكات وتعليقات حقيقية) ---------- */
  window.renderPosts = function (target, posts) {
    target.replaceChildren();
    if (!posts.length) {
      target.append(el('div', 'panel empty', 'ما كاين حتى منشور هنا دابا ✨'));
      return;
    }
    posts.forEach((p) => {
      const key = String(p.id);
      const card = el('article', 'panel');
      const head = el('div', 'post-head');
      const av = el('div', 'avatar', (p.author || 'S')[0].toUpperCase());
      const info = el('div');
      info.append(
        el('strong', '', p.author || 'مستخدم'),
        el('small', '', new Date(p.date).toLocaleString('ar-MA') + (p.edited ? ' · تم التعديل' : ''))
      );
      head.append(av, info);
      if (p.mine) {
        const menu = el('div');
        menu.style.cssText = 'margin-inline-start:auto;display:flex;gap:6px';
        const ed = el('button', 'ghost', '✎');
        ed.title = 'تعديل المنشور';
        ed.onclick = async () => {
          const v = prompt('عدل المنشور', p.text);
          if (v === null) return;
          const t = v.trim();
          if (!t) { alert('المنشور ما يمكنش يكون خاوي'); return; }
          if (t.length > 1500) { alert('المنشور طويل (الأقصى 1500 حرف)'); return; }
          if (t === p.text) return;
          const r = await sb.from('posts').update({ content: t, edited_at: new Date().toISOString() }).eq('id', p.id);
          if (r.error) { alert('وقع مشكل: ' + r.error.message); return; }
          p.text = t;
          p.edited = true;
          render();
        };
        const dl = el('button', 'ghost', '🗑');
        dl.title = 'حذف المنشور';
        dl.onclick = async () => {
          if (!confirm('واش متأكد بغيتي تحذف هاد المنشور؟')) return;
          const r = await sb.from('posts').delete().eq('id', p.id);
          if (r.error) { alert('وقع مشكل: ' + r.error.message); return; }
          state.posts = state.posts.filter((x) => String(x.id) !== key);
          render();
        };
        menu.append(ed, dl);
        head.append(menu);
      }
      card.append(head, el('div', 'post-text', p.text));

      const rows = p.commentRows || [];
      const actions = el('div', 'actions');
      const like = el('button', p.liked ? 'liked' : '', '♥ ' + (p.likes || 0));
      const comment = el('button', '', '◉ تعليق ' + rows.length);
      const bookmark = el('button', '', '☆ ' + (p.saved ? 'محفوظ' : 'حفظ'));

      like.onclick = async () => {
        if (!me) return;
        like.disabled = true;
        const was = p.liked;
        p.liked = !was;
        p.likes = Math.max(0, (p.likes || 0) + (p.liked ? 1 : -1));
        render();
        const r = was
          ? await sb.from('post_likes').delete().eq('post_id', p.id).eq('user_id', me)
          : await sb.from('post_likes').insert({ post_id: p.id });
        if (r.error) {
          p.liked = was;
          p.likes = Math.max(0, (p.likes || 0) + (was ? 1 : -1));
          render();
          alert('وقع مشكل: ' + r.error.message);
        }
      };

      bookmark.onclick = () => {
        p.saved = !p.saved;
        const s = getSaved();
        if (p.saved) s.add(key); else s.delete(key);
        putSaved(s);
        render();
      };

      actions.append(like, comment, bookmark);
      card.append(actions);

      const box = el('div', openComments.has(key) ? 'comments' : 'comments hidden');
      rows.forEach((c) => {
        const line = el('div', 'comment');
        line.append(el('strong', '', c.author + ': '), document.createTextNode(c.text));
        if (c.edited) line.append(el('small', 'hint', ' (معدّل)'));
        if (c.mine) {
          const ec = el('button', 'ghost', '✎');
          ec.style.cssText = 'margin-inline-start:8px;padding:2px 8px';
          ec.title = 'تعديل التعليق';
          ec.onclick = async () => {
            const v = prompt('عدل التعليق', c.text);
            if (v === null) return;
            const t = v.trim();
            if (!t || t.length > 300) { alert('التعليق خاصو يكون من 1 حتى 300 حرف'); return; }
            if (t === c.text) return;
            const r = await sb.from('post_comments').update({ body: t, edited_at: new Date().toISOString() }).eq('id', c.id);
            if (r.error) { alert('وقع مشكل: ' + r.error.message); return; }
            c.text = t;
            c.edited = true;
            openComments.add(key);
            render();
          };
          line.append(ec);
          const del = el('button', 'ghost', '✕');
          del.style.cssText = 'margin-inline-start:4px;padding:2px 8px';
          del.onclick = async () => {
            const r = await sb.from('post_comments').delete().eq('id', c.id);
            if (r.error) { alert('وقع مشكل: ' + r.error.message); return; }
            p.commentRows = rows.filter((x) => x.id !== c.id);
            render();
          };
          line.append(del);
        }
        box.append(line);
      });

      const form = el('form', 'comment-form');
      const input = el('input');
      input.placeholder = 'اكتب تعليقاً...';
      input.maxLength = 300;
      const send = el('button', 'btn', 'إرسال');
      send.type = 'submit';
      form.append(input, send);
      form.onsubmit = async (e) => {
        e.preventDefault();
        const v = input.value.trim();
        if (!v || !me) return;
        send.disabled = true;
        const r = await sb.from('post_comments').insert({ post_id: p.id, body: v }).select('id').single();
        if (r.error) { send.disabled = false; alert('وقع مشكل: ' + r.error.message); return; }
        (p.commentRows = p.commentRows || []).push({ id: r.data.id, author: state.name, text: v, mine: true });
        openComments.add(key);
        render();
      };
      box.append(form);

      comment.onclick = () => {
        box.classList.toggle('hidden');
        if (box.classList.contains('hidden')) openComments.delete(key); else openComments.add(key);
      };
      card.append(box);
      target.append(card);
    });
  };

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

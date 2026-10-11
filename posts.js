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
      sb.from('posts').select('id,user_id,content,image_url,created_at,edited_at').order('created_at', { ascending: false }).limit(50),
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
        image: r.image_url || null,
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

  /* ---------- قائمة الإجراءات (بحال فيسبوك) ---------- */
  const HIDE_KEY = 'socialx-hidden';
  const getHidden = () => {
    try { return new Set(JSON.parse(localStorage.getItem(HIDE_KEY)) || []); } catch (e) { return new Set(); }
  };
  const hide = (k) => {
    const h = getHidden();
    h.add(k);
    try { localStorage.setItem(HIDE_KEY, JSON.stringify(Array.from(h))); } catch (e) { /* ignore */ }
  };

  async function copyText(t) {
    try {
      await navigator.clipboard.writeText(t);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = t;
      document.body.append(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
      ta.remove();
    }
  }

  function sheet(items) {
    const back = el('div');
    back.style.cssText =
      'position:fixed;inset:0;background:#000a;z-index:30;display:grid;place-items:center;padding:16px';
    const box = el('div');
    box.style.cssText =
      'width:min(100%,340px);display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:28px;' +
      'background:rgba(33,23,47,.94);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);' +
      'border:1px solid #5d3b7a;box-shadow:0 20px 60px #000a';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    function close() {
      document.removeEventListener('keydown', onKey);
      back.remove();
    }
    items.forEach(([text, fn, danger]) => {
      const b = el('button', '', text);
      b.style.cssText =
        'padding:15px;border-radius:22px;border:0;background:#3a2b52;font-size:16px;color:' +
        (danger ? '#ff6b81' : '#fff');
      b.onclick = () => { close(); fn(); };
      box.append(b);
    });
    back.onclick = (e) => { if (e.target === back) close(); };
    document.addEventListener('keydown', onKey);
    back.append(box);
    document.body.append(back);
  }

  // ضغطة طويلة / كليك يمين / زر ⋯
  function attachMenu(node, open) {
    let timer = null;
    const stop = () => { clearTimeout(timer); timer = null; };
    node.style.webkitTouchCallout = 'none';
    node.addEventListener('contextmenu', (e) => { e.preventDefault(); open(); });
    node.addEventListener('touchstart', () => { stop(); timer = setTimeout(open, 450); }, { passive: true });
    ['touchend', 'touchmove', 'touchcancel'].forEach((ev) => node.addEventListener(ev, stop, { passive: true }));
  }

  function moreButton(open) {
    const b = el('button', 'ghost', '⋯');
    b.title = 'خيارات';
    b.style.cssText = 'padding:2px 10px;font-weight:900';
    b.onclick = open;
    return b;
  }

  /* ---------- رسم المنشورات (لايكات وتعليقات حقيقية) ---------- */
  window.renderPosts = function (target, posts) {
    target.replaceChildren();
    const hidden = getHidden();
    posts = posts.filter((p) => !hidden.has('p:' + p.id));
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
      const postText = el('div', 'post-text', p.text);
      const openPostMenu = () => {
        const items = [];
        items.push(['📋 نسخ النص', () => copyText(p.text)]);
        items.push([p.saved ? '★ إلغاء الحفظ' : '☆ حفظ المنشور', () => {
          p.saved = !p.saved;
          const sv = getSaved();
          if (p.saved) sv.add(key); else sv.delete(key);
          putSaved(sv);
          render();
        }]);
        if (p.mine) {
          items.push(['✎ تعديل المنشور', async () => {
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
          }]);
          items.push(['🗑 حذف المنشور', async () => {
            if (!confirm('واش متأكد بغيتي تحذف هاد المنشور؟')) return;
            const r = await sb.from('posts').delete().eq('id', p.id);
            if (r.error) { alert('وقع مشكل: ' + r.error.message); return; }
            const m = (p.image || '').match(/\/post-images\/(.+)$/);
            if (m) sb.storage.from('post-images').remove([decodeURIComponent(m[1])]);
            state.posts = state.posts.filter((x) => String(x.id) !== key);
            render();
          }, true]);
        } else {
          items.push(['🫥 إخفاء من عندي', () => { hide('p:' + key); render(); }]);
        }
        sheet(items);
      };
      const pm = moreButton(openPostMenu);
      pm.style.marginInlineStart = 'auto';
      head.append(pm);
      attachMenu(postText, openPostMenu);
      card.append(head, postText);
      if (p.image && /^https:\/\//i.test(p.image)) {
        const im = el('img', 'post-img');
        im.src = p.image;
        im.alt = 'صورة المنشور';
        im.loading = 'lazy';
        im.referrerPolicy = 'no-referrer';
        card.append(im);
      }

      const rows = p.commentRows || [];
      const hiddenSet = getHidden();
      const visibleRows = rows.filter((c) => !hiddenSet.has('c:' + c.id));
      const actions = el('div', 'actions');
      const like = el('button', p.liked ? 'liked' : '', '♥ ' + (p.likes || 0));
      const comment = el('button', '', '◉ تعليق ' + visibleRows.length);
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

      visibleRows.forEach((c) => {
        const line = el('div', 'comment');
        line.style.userSelect = 'none';
        line.append(el('strong', '', c.author + ': '), document.createTextNode(c.text));
        if (c.edited) line.append(el('small', 'hint', ' (معدّل)'));

        const openCommentMenu = () => {
          const items = [];
          items.push(['↩ رد', () => {
            input.value = '@' + c.author + ' ';
            input.focus();
          }]);
          if (c.mine) {
            items.push(['✎ تعديل', async () => {
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
            }]);
            items.push(['🗑 حذف', async () => {
              const r = await sb.from('post_comments').delete().eq('id', c.id);
              if (r.error) { alert('وقع مشكل: ' + r.error.message); return; }
              p.commentRows = rows.filter((x) => x.id !== c.id);
              openComments.add(key);
              render();
            }, true]);
          }
          items.push(['📋 نسخ النص', () => copyText(c.text)]);
          if (!c.mine) items.push(['🫥 إخفاء من عندي', () => { hide('c:' + c.id); openComments.add(key); render(); }]);
          sheet(items);
        };
        const cm = moreButton(openCommentMenu);
        cm.style.marginInlineStart = '8px';
        line.append(cm);
        attachMenu(line, openCommentMenu);
        box.append(line);
      });

      box.append(form);

      comment.onclick = () => {
        box.classList.toggle('hidden');
        if (box.classList.contains('hidden')) openComments.delete(key); else openComments.add(key);
      };
      card.append(box);
      target.append(card);
    });
  };

  // معاينة الصورة (كتقبل صور كبيرة، كنصغروها قبل الرفع)
  const photoInput = document.getElementById('photo');
  const previewImg = document.getElementById('preview');
  photoInput.onchange = () => {
    const f = photoInput.files[0];
    if (!f) { previewImg.classList.add('hidden'); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
      alert('خاص تكون صورة JPG أو PNG أو WEBP');
      photoInput.value = '';
      previewImg.classList.add('hidden');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      alert('الصورة كبيرة بزاف (الأقصى 15 ميغابايت)');
      photoInput.value = '';
      previewImg.classList.add('hidden');
      return;
    }
    previewImg.src = URL.createObjectURL(f);
    previewImg.classList.remove('hidden');
  };
  document.querySelectorAll('#modal .hint').forEach((h) => {
    if (h.textContent.includes('ميغابايت')) h.textContent = 'كنصغرو الصورة أوتوماتيكيا قبل الرفع.';
  });

  function resizeToJpeg(file, max) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k));
        const h = Math.max(1, Math.round(img.height * k));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('تعذر معالجة الصورة'))), 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('الصورة غير صالحة')); };
      img.src = url;
    });
  }

  let publishing = false;
  document.getElementById('publish').onclick = async () => {
    if (publishing || !me) return;
    const text = document.getElementById('content').value.trim();
    const file = document.getElementById('photo').files[0];
    if (!text && !file) { alert('كتب شي حاجة أو زيد صورة'); return; }

    publishing = true;
    const btn = document.getElementById('publish');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'كننشر...';
    try {
      let imageUrl = null;
      if (file) {
        const blob = await resizeToJpeg(file, 1280);
        const path = me + '/' + Date.now() + '.jpg';
        const up = await sb.storage.from('post-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) { alert('وقع مشكل فـ رفع الصورة: ' + up.error.message); return; }
        imageUrl = sb.storage.from('post-images').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await sb.from('posts').insert({ content: text, image_url: imageUrl });
      if (error) { alert('وقع مشكل: ' + error.message); return; }
      document.getElementById('content').value = '';
      document.getElementById('photo').value = '';
      document.getElementById('preview').classList.add('hidden');
      document.getElementById('count').textContent = '0 / 1500';
      document.getElementById('modal').classList.add('hidden');
      load();
    } catch (e) {
      alert('وقع مشكل: ' + e.message);
    } finally {
      publishing = false;
      btn.disabled = false;
      btn.textContent = label;
    }
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

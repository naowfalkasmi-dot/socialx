(function () {
  const sb = window.sb;
  if (!sb) return;

  let me = null;
  let currentChatUser = null;
  let channel = null;
  const unread = new Set();

  const $ = (id) => document.getElementById(id);

  function toast(text) {
    const t = document.createElement('div');
    t.textContent = text;
    t.style.cssText =
      'position:fixed;top:14px;left:50%;transform:translateX(-50%);' +
      'background:#783fe0;color:#fff;padding:10px 16px;border-radius:12px;' +
      'z-index:20;font-size:14px;box-shadow:0 4px 18px #0008';
    document.body.append(t);
    setTimeout(() => t.remove(), 3000);
  }

  function refreshBadges() {
    const has = unread.size > 0;
    document.querySelectorAll('footer button').forEach((b) => {
      if (b.textContent.includes('تعارف')) {
        b.textContent = '💜 تعارف' + (has ? ' 🔴' : '');
      }
    });
    document.querySelectorAll('[data-chat-user]').forEach((b) => {
      const dot = unread.has(b.getAttribute('data-chat-user')) ? ' 🔴' : '';
      b.textContent = '💬 دردشة' + dot;
    });
  }

  function ensureModal() {
    let modal = $('chatModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'chatModal';
    modal.className = 'modal hidden';
    modal.innerHTML =
      '<div class="modal-inner" style="display:flex;flex-direction:column;height:80vh;max-height:500px;background:#181124;color:#fff;padding:15px;border-radius:12px;border:1px solid #372749;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #372749;padding-bottom:10px;margin-bottom:10px;">' +
      '<h2 id="chatTitle" style="margin:0;font-size:16px;">دردشة</h2>' +
      '<button class="ghost" id="closeChat" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div id="chatMessages" style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;background:#120d1d;border-radius:8px;margin-bottom:10px;"></div>' +
      '<form id="chatForm" style="display:flex;gap:8px;">' +
      '<input type="text" id="chatInput" placeholder="اكتب رسالتك..." maxlength="500" style="flex:1;padding:8px;border-radius:6px;border:1px solid #372749;background:#1b1429;color:#fff;" autocomplete="off">' +
      '<button type="submit" class="btn" style="padding:0 16px;background:#783fe0;color:#fff;border:none;border-radius:6px;cursor:pointer;">إرسال</button>' +
      '</form></div>';
    document.body.appendChild(modal);

    $('closeChat').onclick = () => modal.classList.add('hidden');

    $('chatForm').onsubmit = async (e) => {
      e.preventDefault();
      const input = $('chatInput');
      const text = input.value.trim();
      if (!text || !currentChatUser || !me) return;

      const { error } = await sb.from('messages').insert({
        sender_id: me,
        receiver_id: currentChatUser,
        message: text
      });
      if (error) {
        alert('ما قدرتش نبعث الرسالة. خاص يكون Match بيناتكم وما يكونش حظر.');
        return;
      }
      input.value = '';
      fetchMessages();
    };

    return modal;
  }

  window.openChat = async function (targetUserId, targetUsername) {
    const modal = ensureModal();
    currentChatUser = targetUserId;
    unread.delete(targetUserId);
    refreshBadges();
    $('chatTitle').textContent = 'دردشة مع: ' + (targetUsername || 'مستخدم');
    modal.classList.remove('hidden');
    fetchMessages();
  };

  async function fetchMessages() {
    if (!currentChatUser || !me) return;
    const box = $('chatMessages');
    if (!box) return;

    const { data, error } = await sb
      .from('messages')
      .select('sender_id,message,created_at')
      .or(
        'and(sender_id.eq.' + me + ',receiver_id.eq.' + currentChatUser + '),' +
        'and(sender_id.eq.' + currentChatUser + ',receiver_id.eq.' + me + ')'
      )
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) return;

    box.replaceChildren();
    (data || []).forEach((m) => {
      const isMe = m.sender_id === me;
      const el = document.createElement('div');
      el.style.cssText =
        'max-width:75%;padding:8px 12px;border-radius:10px;word-break:break-word;' +
        'align-self:' + (isMe ? 'flex-end' : 'flex-start') + ';' +
        'background:' + (isMe ? '#783fe0' : '#2b203b') + ';color:white;font-size:14px;';
      el.textContent = m.message;
      box.appendChild(el);
    });
    box.scrollTop = box.scrollHeight;
  }

  function subscribe() {
    if (channel) {
      sb.removeChannel(channel);
      channel = null;
    }
    if (!me) return;

    channel = sb
      .channel('messages-' + me)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'receiver_id=eq.' + me },
        (payload) => {
          const m = payload.new;
          const modal = $('chatModal');
          const open = modal && !modal.classList.contains('hidden');
          if (open && currentChatUser === m.sender_id) {
            fetchMessages();
          } else {
            unread.add(m.sender_id);
            refreshBadges();
            toast('💬 رسالة جديدة');
          }
        }
      )
      .subscribe();
  }

  function setUser(id) {
    if (id === me) return;
    me = id;
    unread.clear();
    refreshBadges();
    subscribe();
    if (!me) {
      const modal = $('chatModal');
      if (modal) modal.classList.add('hidden');
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-chat-user]');
    if (!btn) return;
    window.openChat(btn.getAttribute('data-chat-user'), btn.getAttribute('data-chat-name'));
  });

  const wait = setInterval(() => {
    const c = $('datingContent');
    if (!c) return;
    clearInterval(wait);
    new MutationObserver(refreshBadges).observe(c, { childList: true, subtree: true });
  }, 500);

  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
})();

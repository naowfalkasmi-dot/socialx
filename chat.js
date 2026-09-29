(function () {
  const sb = window.sb;
  let currentChatUser = null;
  let me = null;

  // دالة فتح نافذة الشات
  window.openChat = async function (targetUserId, targetUsername) {
    currentChatUser = targetUserId;
    let modal = document.getElementById('chatModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'chatModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-inner" style="display: flex; flex-direction: column; height: 80vh; max-height: 500px; background: #181124; color: #fff; padding: 15px; border-radius: 12px; border: 1px solid #372749;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #372749; padding-bottom: 10px; margin-bottom: 10px;">
            <h2 id="chatTitle" style="margin: 0; font-size: 16px;">دردشة</h2>
            <button class="ghost" id="closeChat" style="background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer;">✕</button>
          </div>
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; background: #120d1d; border-radius: 8px; margin-bottom: 10px;"></div>
          <form id="chatForm" style="display: flex; gap: 8px;">
            <input type="text" id="chatInput" placeholder="اكتب رسالتك..." maxlength="500" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #372749; background: #1b1429; color: #fff;" autocomplete="off">
            <button type="submit" class="btn" style="padding: 0 16px; background: #783fe0; color: #fff; border: none; border-radius: 6px; cursor: pointer;">إرسال</button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('closeChat').onclick = () => modal.classList.add('hidden');
      
      document.getElementById('chatForm').onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text || !currentChatUser || !me) return;

        await sb.from('messages').insert({
          sender_id: me,
          receiver_id: currentChatUser,
          message: text
        });

        input.value = '';
        fetchMessages();
      };
    }

    document.getElementById('chatTitle').textContent = `دردشة مع: ${targetUsername || 'مستخدم'}`;
    modal.classList.remove('hidden');
    fetchMessages();
  };

  async function fetchMessages() {
    if (!currentChatUser || !me) return;
    const box = document.getElementById('chatMessages');
    if (!box) return;

    const { data } = await sb
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},receiver_id.eq.${currentChatUser}),and(sender_id.eq.${currentChatUser},receiver_id.eq.${me})`)
      .order('created_at', { ascending: true });

    box.innerHTML = '';
    (data || []).forEach(m => {
      const isMe = m.sender_id === me;
      const msgEl = document.createElement('div');
      msgEl.style.cssText = `max-width: 75%; padding: 8px 12px; border-radius: 10px; word-break: break-word; align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? '#783fe0' : '#2b203b'}; color: white; font-size: 14px;`;
      msgEl.textContent = m.message;
      box.appendChild(msgEl);
    });
    box.scrollTop = box.scrollHeight;
  }

  // مراقبة الضغط على المطابقات لإضافة زر الشات تلقائياً
  setInterval(() => {
    const container = document.getElementById('datingContent');
    if (container && !container.dataset.chatWatched) {
      container.dataset.chatWatched = "true";
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-chat-user]');
        if (btn) {
          const uid = btn.getAttribute('data-chat-user');
          const uname = btn.getAttribute('data-chat-name');
          window.openChat(uid, uname);
        }
      });
    }
  }, 1000);

  sb.auth.onAuthStateChange((_e, s) => { me = s ? s.user.id : null; });
  sb.auth.getSession().then(({ data }) => { me = data.session ? data.session.user.id : null; });
})();

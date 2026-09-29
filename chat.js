(function () {
  const sb = window.sb;
  let currentChatUser = null;
  let me = null;

  // دالة لفتح نافذة الشات مع شخص معين
  window.openChat = async function (targetUserId, targetUsername) {
    currentChatUser = targetUserId;
    let modal = document.getElementById('chatModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'chatModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-inner" style="display: flex; flex-direction: column; height: 80vh; max-height: 500px;">
          <div class="row" style="border-bottom: 1px solid #372749; padding-bottom: 10px; margin-bottom: 10px;">
            <h2 id="chatTitle" style="margin: 0; font-size: 18px;">دردشة</h2>
            <button class="ghost" id="closeChat">✕</button>
          </div>
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; background: #120d1d; border-radius: 10px; margin-bottom: 10px;"></div>
          <form id="chatForm" style="display: flex; gap: 8px;">
            <input type="text" id="chatInput" placeholder="اكتب رسالتك..." maxlength="500" style="flex: 1; margin: 0; background: #1b1429;" autocomplete="off">
            <button type="submit" class="btn" style="padding: 0 16px;">إرسال</button>
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

        const { error } = await sb.from('messages').insert({
          sender_id: me,
          receiver_id: currentChatUser,
          message: text
        });

        if (!error) {
          input.value = '';
          fetchMessages();
        }
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

    const { data, error } = await sb
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},receiver_id.eq.${currentChatUser}),and(sender_id.eq.${currentChatUser},receiver_id.eq.${me})`)
      .order('created_at', { ascending: true });

    if (error) return;

    box.innerHTML = '';
    (data || []).forEach(m => {
      const isMe = m.sender_id === me;
      const msgEl = document.createElement('div');
      msgEl.style.cssText = `max-width: 75%; padding: 8px 12px; border-radius: 12px; word-break: break-word; align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? '#783fe0' : '#2b203b'}; color: white;`;
      msgEl.textContent = m.message;
      box.appendChild(msgEl);
    });
    box.scrollTop = box.scrollHeight;
  }

  sb.auth.onAuthStateChange((_e, s) => {
    me = s ? s.user.id : null;
  });
  sb.auth.getSession().then(({ data }) => {
    me = data.session ? data.session.user.id : null;
  });
})();

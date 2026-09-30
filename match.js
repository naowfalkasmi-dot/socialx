(function () {
  const sb = window.sb;
  if (!sb) return;

  let me = null;
  let people = [];
  let current = 0;

  const $ = id => document.getElementById(id);

  const style = document.createElement('style');
  style.textContent = `
    .dating-card {
      max-width:420px;
      margin:18px auto;
      background:#241632;
      border:1px solid #7043a0;
      border-radius:22px;
      overflow:hidden;
   }
   .socialx-match-card {
  box-shadow: 0 10px 30px rgba(164, 67, 233, 0.25);
  border: 1px solid #a343e9;
}
    .dating-photo {
      width:100%;
      height:350px;
      object-fit:cover;
      background:#39224e;
    }
    .dating-info {padding:18px}
    .dating-actions {
      display:flex;
      justify-content:center;
      gap:30px;
      padding:18px;
    }
    .dating-actions button {
      width:65px;
      height:65px;
      border-radius:50%;
      border:0;
      font-size:30px;
      color:white;
      background:#493052;
    }
    .dating-actions .heart {
      background:#a343e9;
    }
    .dating-field {
      width:100%;
      padding:12px;
      margin:7px 0;
      border-radius:10px;
      border:1px solid #58416e;
      background:#120d1d;
      color:white;
    }
  `;
  document.head.append(style);

  const page = document.createElement('section');
  page.id = 'datingPage';
  page.className = 'hidden';
  page.innerHTML = `
    <div class="panel pad">
      <h2>💜 SocialX Match</h2>
      <p class="hint">تعارف اختياري للبالغين +18</p>

      <div id="datingSetup" class="hidden">
        <h2>إنشاء بروفايل التعارف</h2>
        <input id="datingName" class="dating-field"
          placeholder="الاسم" maxlength="40">
        <input id="datingAge" class="dating-field"
          type="number" min="18" max="100"
          placeholder="العمر">
        <input id="datingCity" class="dating-field"
          placeholder="المدينة" maxlength="80">
        <textarea id="datingBio" class="dating-field"
          placeholder="عرف براسك" maxlength="500"></textarea>
        <input id="datingInterests" class="dating-field"
          placeholder="الاهتمامات: سفر، رياضة، موسيقى">
        <input id="datingPhoto" class="dating-field"
          type="url" placeholder="رابط صورة HTTPS">
        <button class="btn" id="datingSave">
          حفظ البروفايل
        </button>
      </div>

      <div id="datingBrowse" class="hidden">
        <div class="row">
          <button class="ghost" id="datingEdit">
            تعديل بروفايلي
          </button>
          <button class="ghost" id="datingMatches">
            💞 المطابقات
          </button>
        </div>
        <div id="datingContent"></div>
      </div>

      <p id="datingMessage" class="hint"></p>
    </div>
  `;
  document.querySelector('main').append(page);

  const nav = document.createElement('button');
  nav.className = 'ghost';
  nav.textContent = '💜 تعارف';
  document.querySelector('footer').append(nav);

  nav.onclick = () => {
    ['home', 'profile', 'about', 'people']
      .forEach(id => $(id)?.classList.add('hidden'));
    page.classList.remove('hidden');
    init();
  };

  document.querySelectorAll('[data-page]').forEach(b => {
    b.addEventListener('click', () => {
      page.classList.add('hidden');
    });
  });

  const msg = text => {
    $('datingMessage').textContent = text || '';
  };

  async function init() {
    const { data: { user } } = await sb.auth.getUser();
    me = user?.id || null;

    if (!me) {
      msg('خاصك تسجل الدخول');
      return;
    }

    const { data, error } = await sb
      .from('match_profiles')
      .select('*')
      .eq('user_id', me)
      .maybeSingle();

    if (error) {
      msg(error.message);
      return;
    }

    $('datingSetup').classList.toggle('hidden', !!data);
    $('datingBrowse').classList.toggle('hidden', !data);

    if (data) loadPeople();
  }

  $('datingSave').onclick = async () => {
    if (!me) return;

    const name = $('datingName').value.trim();
    const age = Number($('datingAge').value);
    const photo = $('datingPhoto').value.trim();

    if (name.length < 2 || name.length > 40 ||
        !Number.isInteger(age) || age < 18 || age > 100) {
      msg('دخل اسم صحيح وعمر 18 سنة أو أكثر');
      return;
    }

    if (photo && !/^https:\/\/\S+$/i.test(photo)) {
      msg('رابط الصورة خاصو يبدا بـ https://');
      return;
    }

    const { error } = await sb
      .from('match_profiles')
      .upsert({
        user_id: me,
        display_name: name,
        age,
        city: $('datingCity').value.trim(),
        bio: $('datingBio').value.trim(),
        interests: $('datingInterests').value
          .split(',')
          .map(x => x.trim())
          .filter(Boolean)
          .slice(0, 10),
        photo_url: photo || null,
        visible: true
      });

    if (error) {
      msg(error.message);
      return;
    }

    init();
  };

  $('datingEdit').onclick = async () => {
    const { data } = await sb
      .from('match_profiles')
      .select('*')
      .eq('user_id', me)
      .single();

    if (!data) return;

    $('datingName').value = data.display_name;
    $('datingAge').value = data.age;
    $('datingCity').value = data.city || '';
    $('datingBio').value = data.bio || '';
    $('datingInterests').value =
      (data.interests || []).join(', ');
    $('datingPhoto').value = data.photo_url || '';

    $('datingSetup').classList.remove('hidden');
    $('datingBrowse').classList.add('hidden');
  };

  async function loadPeople() {
    msg('');

    const [profiles, likes, passes, blocks] =
      await Promise.all([
        sb.from('match_profiles')
          .select('*')
          .eq('visible', true)
          .neq('user_id', me)
          .limit(100),
        sb.from('match_likes')
          .select('to_user')
          .eq('from_user', me),
        sb.from('match_passes')
          .select('to_user')
          .eq('from_user', me),
        sb.from('match_blocks')
          .select('blocked')
          .eq('blocker', me)
      ]);

    const error = [
      profiles.error, likes.error,
      passes.error, blocks.error
    ].find(Boolean);

    if (error) {
      msg(error.message);
      return;
    }

    const excluded = new Set([
      ...(likes.data || []).map(x => x.to_user),
      ...(passes.data || []).map(x => x.to_user),
      ...(blocks.data || []).map(x => x.blocked)
    ]);

    people = (profiles.data || [])
      .filter(p => !excluded.has(p.user_id));

    current = 0;
    showCard();
  }

  function showCard() {
    const box = $('datingContent');
    box.replaceChildren();

    const p = people[current];

    if (!p) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent =
        'ما بقا حتى بروفايل دابا 💜';
      box.append(empty);

      const refresh = document.createElement('button');
      refresh.className = 'btn';
      refresh.textContent = 'تحديث';
      refresh.onclick = loadPeople;
      box.append(refresh);
      return;
    }

    const card = document.createElement('div');
    card.className = 'dating-card socialx-match-card';

    if (p.photo_url) {
      const img = document.createElement('img');
      img.className = 'dating-photo';
      img.src = p.photo_url;
      img.alt = 'صورة البروفايل';
      img.referrerPolicy = 'no-referrer';
      card.append(img);
    }

    const info = document.createElement('div');
    info.className = 'dating-info';

    const title = document.createElement('h2');
    title.textContent =
      p.display_name + '، ' + p.age;

    const city = document.createElement('p');
    city.textContent =
      p.city ? '📍 ' + p.city : '';

    const bio = document.createElement('p');
    bio.textContent = p.bio || '';

    const interests = document.createElement('p');
    interests.className = 'hint';
    interests.textContent =
      (p.interests || []).join(' · ');

    info.append(title, city, bio, interests);
    card.append(info);

    const actions = document.createElement('div');
    actions.className = 'dating-actions';

    const no = document.createElement('button');
    no.textContent =  'تخطي';
    no.onclick = () => react(p, false);

    const yes = document.createElement('button');
    yes.className = 'heart';
    yes.textContent = '♥';
    yes.onclick = () => react(p, true);

    actions.append(no, yes);
    card.append(actions);

    const safety = document.createElement('div');
    safety.className = 'row pad';

    const block = document.createElement('button');
    block.className = 'ghost';
    block.textContent = 'حظر';
    block.onclick = async () => {
      if (!confirm('واش متأكد بغيتي تحظر هاد الشخص؟'))
        return;

      const { error } = await sb
        .from('match_blocks')
        .insert({
          blocker: me,
          blocked: p.user_id
        });

      if (error) {
        msg(error.message);
        return;
      }

      await sb.from('match_likes')
        .delete()
        .eq('from_user', me)
        .eq('to_user', p.user_id);

      current++;
      showCard();
    };

    const report = document.createElement('button');
    report.className = 'ghost';
    report.textContent = 'تبليغ';
    report.onclick = async () => {
      const reason = prompt('علاش بغيتي تبلغ؟');
      if (!reason || reason.trim().length < 5) return;

      const { error } = await sb
        .from('match_reports')
        .insert({
          reporter: me,
          reported: p.user_id,
          reason: reason.trim().slice(0, 500)
        });

      msg(error
        ? error.message
        : 'تم إرسال التبليغ');
    };

    safety.append(block, report);
    card.append(safety);
    box.append(card);
  }

  async function react(p, liked) {
    const table = liked
      ? 'match_likes'
      : 'match_passes';

    const { error } = await sb
      .from(table)
      .insert({
        from_user: me,
        to_user: p.user_id
      });

    if (error) {
      msg(error.message);
      return;
    }

    if (liked) {
      const { data } = await sb
        .from('match_likes')
        .select('from_user')
        .eq('from_user', p.user_id)
        .eq('to_user', me)
        .maybeSingle();

      if (data) {
        if (confirm('💞 It’s a Match! واش بغيتي تبدا الدردشة دابا؟') && window.openChat) {
          window.openChat(p.user_id, p.display_name);
        }
      }
    }

    current++;
    showCard();
  }

  $('datingMatches').onclick = async () => {
    const [sent, received, profiles] =
      await Promise.all([
        sb.from('match_likes')
          .select('to_user')
          .eq('from_user', me),
        sb.from('match_likes')
          .select('from_user')
          .eq('to_user', me),
        sb.from('match_profiles')
          .select('user_id,display_name')
      ]);

    if (sent.error || received.error || profiles.error) {
      msg('تعذر تحميل المطابقات');
      return;
    }

    const incoming = new Set(
      (received.data || []).map(x => x.from_user)
    );

    const matches = (sent.data || [])
      .map(x => x.to_user)
      .filter(id => incoming.has(id));

    const names = new Map(
      (profiles.data || [])
        .map(p => [p.user_id, p.display_name])
    );

    const box = $('datingContent');
    box.replaceChildren();

    const heading = document.createElement('h2');
    heading.textContent = '💞 المطابقات';
    box.append(heading);

    if (!matches.length) {
      const empty = document.createElement('p');
      empty.textContent = 'ما عندك حتى Match دابا';
      box.append(empty);
    }

    matches.forEach(id => {
      const name = names.get(id) || 'مستخدم';

      const row = document.createElement('div');
      row.className = 'panel pad row';

      const label = document.createElement('span');
      label.textContent = '💜 ' + name;

      const chat = document.createElement('button');
      chat.className = 'btn';
      chat.textContent = '💬 دردشة';
      chat.setAttribute('data-chat-user', id);
      chat.setAttribute('data-chat-name', name);

      row.append(label, chat);
      box.append(row);
    });

    const back = document.createElement('button');
    back.className = 'btn';
    back.textContent = 'رجوع';
    back.onclick = loadPeople;
    box.append(back);
  };

  sb.auth.onAuthStateChange((_event, session) => {
    me = session?.user?.id || null;
    if (!me) page.classList.add('hidden');
  });
})();

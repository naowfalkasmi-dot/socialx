(function () {
  const footer = document.querySelector('footer');
  if (!footer) return;

  const $ = (id) => document.getElementById(id);
  const findBtn = (txt) =>
    Array.from(footer.querySelectorAll('button')).find((b) => b.textContent.includes(txt));
  const pageBtn = (p) => footer.querySelector('[data-page="' + p + '"]');

  const PATHS = {
    home: '<path d="M12 2.5l2.4 6.1 6.1 2.4-6.1 2.4L12 19.5l-2.4-6.1L3.5 11l6.1-2.4z"/>',
    people: '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    match: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
    chat:
      '<path d="M5 4h14a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 19 17h-6l-4.5 3.5V17H5a2.5 2.5 0 0 1-2.5-2.5v-8A2.5 2.5 0 0 1 5 4z"/>' +
      '<circle cx="8.5" cy="10.5" r=".9"/><circle cx="12" cy="10.5" r=".9"/><circle cx="15.5" cy="10.5" r=".9"/>',
    profile:
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/>' +
      '<path d="M6.5 18c1.3-2.2 3.2-3.2 5.5-3.2s4.2 1 5.5 3.2"/>'
  };
  const svg = (key, w) =>
    '<svg width="' + (w || 24) + '" height="' + (w || 24) + '" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ' +
    'style="display:block">' + PATHS[key] + '</svg>';

  const items = [
    { key: 'home', label: 'الرئيسية', sections: ['home'], go: () => pageBtn('home') },
    { key: 'people', label: 'أشخاص', sections: ['people'], go: () => findBtn('أشخاص') },
    { key: 'plus', label: 'جديد', sections: [], go: () => $('newPost') },
    { key: 'match', label: 'تعارف', sections: ['datingPage'], go: () => findBtn('تعارف') },
    { key: 'chat', label: 'دردشة', sections: ['inbox'], go: () => findBtn('دردشة') },
    { key: 'profile', label: 'حسابي', sections: ['profile', 'settings'], go: () => pageBtn('profile') }
  ];

  const bar = document.createElement('nav');
  bar.style.cssText =
    'position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:4;' +
    'display:flex;justify-content:space-around;align-items:center;padding:6px 8px;border-radius:28px;' +
    'background:rgba(21,16,34,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);' +
    'border:1px solid #4a2d6b;box-shadow:0 10px 34px rgba(120,63,224,.35)';

  const btns = {};
  items.forEach((it) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', it.label);
    const ic = document.createElement('span');
    ic.style.cssText = 'display:grid;place-items:center';
    const lb = document.createElement('span');
    lb.textContent = it.label;
    lb.style.cssText = 'display:none;font-size:12px;font-weight:700';

    if (it.key === 'plus') {
      b.style.cssText =
        'width:54px;height:54px;border-radius:50%;margin-top:-26px;color:#fff;border:3px solid #0e0b17;' +
        'background:linear-gradient(135deg,#783fe0,#e68bff);box-shadow:0 6px 20px rgba(182,90,240,.6);' +
        'display:grid;place-items:center;padding:0';
      ic.innerHTML = svg('plus', 26);
      b.append(ic);
    } else {
      b.style.cssText =
        'background:none;border:0;color:#bca9d5;padding:9px 11px;border-radius:20px;' +
        'display:flex;align-items:center;gap:6px;position:relative';
      ic.innerHTML = svg(it.key);
      b.append(ic, lb);
    }
    b.onclick = () => {
      const target = it.go();
      if (target) target.click();
      setTimeout(tick, 120);
    };
    btns[it.key] = { b, ic, lb };
    bar.append(b);
  });

  const dot = document.createElement('span');
  dot.style.cssText =
    'position:absolute;top:5px;right:7px;width:10px;height:10px;border-radius:50%;' +
    'background:#ff4d6d;display:none';
  btns.chat.b.append(dot);

  document.body.append(bar);
  footer.style.display = 'none';

  let lastAvatar = '';
  function tick() {
    items.forEach((it) => {
      if (it.key === 'plus') return;
      const on = it.sections.some((id) => {
        const el = $(id);
        return el && !el.classList.contains('hidden');
      });
      const x = btns[it.key];
      x.b.style.background = on ? 'linear-gradient(100deg,#783fe0,#b65af0)' : 'none';
      x.b.style.color = on ? '#fff' : '#bca9d5';
      x.lb.style.display = on ? 'inline' : 'none';
    });

    const m = findBtn('تعارف');
    const want = m && m.textContent.includes('🔴') ? 'block' : 'none';
    if (dot.style.display !== want) dot.style.display = want;

    const img = document.querySelector('#profile .avatar img');
    const src = img ? img.src : '';
    if (src !== lastAvatar) {
      lastAvatar = src;
      if (src) {
        const wrap = document.createElement('span');
        wrap.style.cssText = 'width:26px;height:26px;border-radius:50%;overflow:hidden;display:block';
        const i = document.createElement('img');
        i.src = src;
        i.alt = '';
        i.style.cssText = 'width:100%;height:100%;object-fit:cover';
        wrap.append(i);
        btns.profile.ic.replaceChildren(wrap);
      } else {
        btns.profile.ic.innerHTML = svg('profile');
      }
    }
  }
  setInterval(tick, 1000);
  tick();
})();

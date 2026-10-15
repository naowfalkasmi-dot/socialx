(function () {
  const sb = window.sb;
  if (!sb) return;

  let me = null;
  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  /* ================= الستايل ================= */
  const style = document.createElement('style');
  style.textContent = `
.sxc{position:fixed;inset:0;z-index:40;background:#0a0712;color:#f5f1ff;display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0)}
.sxc *{box-sizing:border-box}
.sxc-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px}
.sxc-title{font-weight:800;font-size:16px}
.sxc-x{width:42px;height:42px;border-radius:50%;background:#241a35;border:0;color:#fff;font-size:20px;flex:none}
.sxc-next{background:linear-gradient(100deg,#783fe0,#b65af0);border:0;border-radius:22px;padding:11px 20px;color:#fff;font-weight:800;font-size:15px;flex:none}
.sxc-next:disabled{opacity:.5}
.sxc-stage{flex:1;min-height:0;display:grid;place-items:center;padding:6px 12px;overflow:hidden}
.sxc-stage canvas,.sxc-stage video{max-width:100%;max-height:100%;border-radius:16px;background:#000}
.sxc-panel{padding:8px 14px;min-height:72px}
.sxc-panel label{display:flex;align-items:center;gap:10px;margin:6px 0;font-size:14px}
.sxc-panel input[type=range]{flex:1;accent-color:#b65af0}
.sxc-panel textarea,.sxc-panel input[type=text]{width:100%;background:#120d1d;color:#fff;border:1px solid #58416e;border-radius:12px;padding:10px;font:inherit}
.sxc-tools{display:flex;justify-content:space-around;gap:6px;padding:10px 8px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid #2a1d3d}
.sxc-tool{background:#1b1429;border:0;color:#d8c9ee;border-radius:16px;padding:9px 4px;flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:12px}
.sxc-tool.on{background:#3b2370;color:#fff}
.sxc-tool .ic{font-size:20px;line-height:1}
.sxc-chips{display:flex;gap:8px;overflow-x:auto;padding:4px 0}
.sxc-chip{flex:none;background:#241a35;border:1px solid #3c2b51;color:#eee;border-radius:14px;padding:9px 14px;font-size:14px}
.sxc-chip.on{background:#6334aa;border-color:#b65af0;color:#fff}
.sxc-swatch{flex:none;width:30px;height:30px;border-radius:50%;border:2px solid #4a3a60}
.sxc-swatch.on{border-color:#fff}
.sxc-center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;text-align:center}
.sxc-drop{width:min(100%,360px);border:2px dashed #5d3b7a;border-radius:24px;padding:36px 16px;background:#150f22}
.sxc-big{font-size:46px}
.sxc-btn{background:linear-gradient(100deg,#783fe0,#b65af0);border:0;border-radius:16px;padding:14px 22px;color:#fff;font-weight:800;font-size:16px}
.sxc-modes{display:flex;justify-content:center;gap:8px;padding:12px 12px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid #2a1d3d}
.sxc-mode{background:none;border:0;color:#bca9d5;border-radius:18px;padding:9px 18px;font-weight:700;font-size:15px}
.sxc-mode.on{background:#3b2370;color:#fff}
.sxc-share{flex:1;overflow:auto;padding:6px 14px 14px}
.sxc-row{display:flex;gap:12px;align-items:flex-start}
.sxc-thumb{width:84px;height:84px;object-fit:cover;border-radius:12px;background:#000;flex:none}
.sxc-share textarea{flex:1;min-height:110px;background:#120d1d;color:#fff;border:1px solid #58416e;border-radius:14px;padding:12px;font:inherit;resize:vertical;width:100%}
.sxc-foot{padding:10px 14px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid #2a1d3d}
.sxc-foot .sxc-btn{width:100%}
.sxc-hint{color:#a999c1;font-size:13px;line-height:1.6}
.sxc-prev{flex:none;height:36vh;min-height:170px;display:grid;place-items:center;background:#000;margin:0 12px;border-radius:16px;overflow:hidden;color:#a999c1;text-align:center;padding:8px}
.sxc-prev img,.sxc-prev video{width:100%;height:100%;object-fit:contain;display:block}
.sxc-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px}
.sxc-grid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:0 2px 6px;align-content:start}
.sxc-tile{position:relative;aspect-ratio:1;background:#1b1429;border:0;padding:0;overflow:hidden;color:#fff;font-size:14px}
.sxc-tile img,.sxc-tile video{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.sxc-tile.on{outline:3px solid #b65af0;outline-offset:-3px}
.sxc-tile .badge{position:absolute;bottom:6px;left:8px;font-size:12px;font-weight:700;text-shadow:0 1px 3px #000}
.sxc-tile .dot{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;border:2px solid #fff;background:#0006}
.sxc-tile.on .dot{background:#b65af0}
.sxc-tile.write{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:#241a35}
.sxc-mode{padding:9px 14px;font-size:14px}
.sxc-soon{font-size:11px;color:#e68bff;margin-inline-start:4px}
.sxc-toast{position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#783fe0;color:#fff;padding:10px 16px;border-radius:12px;z-index:60;font-size:14px;box-shadow:0 4px 18px #0008}
`;
  document.head.append(style);

  function toast(t) {
    const n = mk('div', 'sxc-toast', t);
    document.body.append(n);
    setTimeout(() => n.remove(), 2800);
  }

  /* ================= الفلاتر (بالبيكسل، كتخدم فـ كل المتصفحات) ================= */
  const PRESETS = {
    none: { label: 'أصلي', p: {} },
    bw: { label: 'أبيض وأسود', p: { gray: 1 } },
    warm: { label: 'دافئ', p: { tint: [255, 150, 60, 0.18], s: 1.1 } },
    cool: { label: 'بارد', p: { tint: [60, 140, 255, 0.16] } },
    gold: { label: 'ذهبي', p: { sepia: 0.55, c: 1.05 } },
    vivid: { label: 'حيوي', p: { s: 1.45, c: 1.1 } },
    fade: { label: 'باهت', p: { c: 0.85, b: 1.08, s: 0.8 } },
    night: { label: 'ليلي', p: { b: 0.88, c: 1.2, tint: [110, 60, 220, 0.18] } }
  };

  function applyPixels(img, e) {
    const pr = PRESETS[e.filter] ? PRESETS[e.filter].p : {};
    const b = (pr.b || 1) * e.b;
    const c = (pr.c || 1) * e.c;
    const s = (pr.s || 1) * e.s;
    const gray = pr.gray || 0;
    const sep = pr.sepia || 0;
    const tint = pr.tint || null;
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] * b;
      let g = d[i + 1] * b;
      let bl = d[i + 2] * b;
      r = (r - 128) * c + 128;
      g = (g - 128) * c + 128;
      bl = (bl - 128) * c + 128;
      const l = 0.299 * r + 0.587 * g + 0.114 * bl;
      r = l + (r - l) * s;
      g = l + (g - l) * s;
      bl = l + (bl - l) * s;
      if (gray) {
        r += (l - r) * gray;
        g += (l - g) * gray;
        bl += (l - bl) * gray;
      }
      if (sep) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * bl;
        const sg = 0.349 * r + 0.686 * g + 0.168 * bl;
        const sb2 = 0.272 * r + 0.534 * g + 0.131 * bl;
        r += (sr - r) * sep;
        g += (sg - g) * sep;
        bl += (sb2 - bl) * sep;
      }
      if (tint) {
        const a = tint[3];
        r = r * (1 - a) + tint[0] * a;
        g = g * (1 - a) + tint[1] * a;
        bl = bl * (1 - a) + tint[2] * a;
      }
      d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      d[i + 2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
    }
  }

  /* ================= الحالة ================= */
  const root = mk('div', 'sxc');
  root.style.display = 'none';
  document.body.append(root);

  const fresh = () => ({
    filter: 'none', b: 1, c: 1, s: 1, rot: 0, ratio: 'orig',
    text: '', tcolor: '#ffffff', tsize: 'm', tpos: 'bottom'
  });
  let st = null;

  function reset() {
    if (st) {
      if (st.vurl) URL.revokeObjectURL(st.vurl);
    }
    st = { mode: 'photo', base: null, vfile: null, vurl: null, vdur: 0, cover: 0, edit: fresh(), caption: '', tool: 'filters', publishing: false };
  }

  /* ================= رسم الصورة ================= */
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k));
        c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('الصورة غير صالحة')); };
      img.src = url;
    });
  }

  const RATIOS = { orig: 0, '1:1': 1, '4:5': 0.8, '9:16': 9 / 16 };

  function renderTo(canvas, maxSide) {
    const e = st.edit;
    const base = st.base;
    const odd = e.rot % 180 !== 0;
    const rw = odd ? base.height : base.width;
    const rh = odd ? base.width : base.height;

    const rotated = document.createElement('canvas');
    rotated.width = rw;
    rotated.height = rh;
    const rc = rotated.getContext('2d');
    rc.translate(rw / 2, rh / 2);
    rc.rotate((e.rot * Math.PI) / 180);
    rc.drawImage(base, -base.width / 2, -base.height / 2);

    let cw = rw;
    let ch = rh;
    const a = RATIOS[e.ratio];
    if (a) {
      if (rw / rh > a) { cw = rh * a; ch = rh; } else { cw = rw; ch = rw / a; }
    }
    const sx = (rw - cw) / 2;
    const sy = (rh - ch) / 2;
    const k = Math.min(1, maxSide / Math.max(cw, ch));
    const ow = Math.max(1, Math.round(cw * k));
    const oh = Math.max(1, Math.round(ch * k));
    canvas.width = ow;
    canvas.height = oh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(rotated, sx, sy, cw, ch, 0, 0, ow, oh);

    const needPixels = e.filter !== 'none' || e.b !== 1 || e.c !== 1 || e.s !== 1;
    if (needPixels) {
      const data = ctx.getImageData(0, 0, ow, oh);
      applyPixels(data, e);
      ctx.putImageData(data, 0, 0);
    }

    if (e.text.trim()) {
      const px = Math.round(ow * ({ s: 0.06, m: 0.09, l: 0.13 }[e.tsize] || 0.09));
      ctx.font = '800 ' + px + 'px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = e.tcolor;
      ctx.shadowColor = 'rgba(0,0,0,.65)';
      ctx.shadowBlur = Math.round(px * 0.25);
      const lines = e.text.split('\n').slice(0, 5);
      const lh = px * 1.25;
      const cy = oh * ({ top: 0.15, center: 0.5, bottom: 0.85 }[e.tpos] || 0.85);
      const y0 = cy - ((lines.length - 1) * lh) / 2;
      lines.forEach((ln, i) => ctx.fillText(ln, ow / 2, y0 + i * lh, ow * 0.92));
      ctx.shadowBlur = 0;
    }
  }

  let raf = 0;
  function redraw() {
    if (!st || !st.base) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const cv = root.querySelector('#sxcCanvas');
      if (cv) renderTo(cv, 760);
    });
  }

  /* ================= الشاشات ================= */
  function clear() { root.replaceChildren(); }

  function topBar(left, title, rightNode) {
    const top = mk('div', 'sxc-top');
    top.append(left, mk('div', 'sxc-title', title || ''), rightNode || mk('span'));
    top.lastChild.style.minWidth = '42px';
    return top;
  }
  function xBtn(onclick, label) {
    const b = mk('button', 'sxc-x', label || '✕');
    b.setAttribute('aria-label', 'رجوع');
    b.onclick = onclick;
    return b;
  }

  /* ---- 1) المعرض (اختيار) ---- */
  const recent = { photo: [], reel: [], story: [] };

  function addRecent(kind, files) {
    const added = files.map((f) => ({ file: f, url: URL.createObjectURL(f), dur: 0 }));
    added.forEach((it) => {
      if (it.file.type.indexOf('video/') === 0) {
        videoMeta(it.url).then((d) => {
          it.dur = Number.isFinite(d) ? d : 0;
          if (st && st.screen === 'pick' && st.paintGrid) st.paintGrid();
        });
      }
    });
    recent[kind] = added.concat(recent[kind]);
    recent[kind].slice(40).forEach((it) => URL.revokeObjectURL(it.url));
    recent[kind] = recent[kind].slice(0, 40);
    return added;
  }

  const fmtDur = (d) => {
    if (!d) return '';
    const m = Math.floor(d / 60);
    const sec = Math.floor(d % 60);
    return m + ':' + String(sec).padStart(2, '0');
  };

  function showPick() {
    clear();
    st.screen = 'pick';
    st.base = null;
    st.vfile = null;
    st.sel = null;
    st.paintGrid = null;
    if (st.vurl) { URL.revokeObjectURL(st.vurl); st.vurl = null; }
    st.edit = fresh();
    if (st.mode === 'text') st.mode = 'photo';

    const isGallery = st.mode === 'photo' || st.mode === 'reel' || st.mode === 'story';
    const kind = st.mode === 'reel' ? 'reel' : st.mode === 'story' ? 'story' : 'photo';
    const titles = { photo: 'منشور جديد', reel: 'ريل جديد', story: 'قصة جديدة', live: 'بث مباشر' };

    const next = mk('button', 'sxc-next', 'التالي ←');
    next.disabled = true;
    root.append(topBar(xBtn(closeComposer), titles[st.mode], next));

    if (!isGallery) {
      const center = mk('div', 'sxc-center');
      center.append(
        mk('div', 'sxc-big', '📡'),
        mk('p', '', 'البث المباشر جاي قريبا'),
        mk('p', 'sxc-hint', 'دابا تقدر تنشر منشور، قصة أو ريل.')
      );
      root.append(center, modeTabs());
      st.pickInput = null;
      return;
    }

    const prev = mk('div', 'sxc-prev');
    const bar = mk('div', 'sxc-bar');
    const grid = mk('div', 'sxc-grid');

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = kind === 'reel' ? 'video/mp4,video/webm,video/quicktime' : kind === 'story' ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp';
    input.style.display = 'none';
    st.pickInput = input;

    const open = mk('button', 'sxc-chip', '📂 فتح المعرض');
    open.onclick = () => input.click();
    bar.append(mk('strong', '', 'الأخيرة'), open, input);

    function paintPreview() {
      prev.replaceChildren();
      if (!st.sel) {
        prev.append(mk('div', '', kind === 'reel' ? '🎬 اختار فيديو من المعرض' : kind === 'story' ? '✦ اختار صورة ولا فيديو للقصة' : '🖼️ اختار صورة من المعرض'));
        return;
      }
      if (st.sel.file.type.indexOf('video/') === 0) {
        const v = document.createElement('video');
        v.src = st.sel.url;
        v.muted = true;
        v.loop = true;
        v.autoplay = true;
        v.playsInline = true;
        prev.append(v);
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        const im = document.createElement('img');
        im.src = st.sel.url;
        im.alt = '';
        prev.append(im);
      }
    }

    function paintGrid() {
      grid.replaceChildren();
      if (kind === 'photo') {
        const w = mk('button', 'sxc-tile write');
        w.append(mk('span', '', '✍️'), mk('span', '', 'كتابة'));
        w.style.fontSize = '15px';
        w.onclick = () => { st.mode = 'text'; showShare(); };
        grid.append(w);
      }
      recent[kind].forEach((it) => {
        const t = mk('button', 'sxc-tile' + (st.sel === it ? ' on' : ''));
        if (it.file.type.indexOf('video/') === 0) {
          const v = document.createElement('video');
          v.src = it.url + '#t=0.1';
          v.muted = true;
          v.preload = 'metadata';
          v.playsInline = true;
          t.append(v);
          if (it.dur) t.append(mk('span', 'badge', fmtDur(it.dur)));
        } else {
          const im = document.createElement('img');
          im.src = it.url;
          im.alt = '';
          im.loading = 'lazy';
          t.append(im);
        }
        t.append(mk('span', 'dot'));
        t.onclick = () => { st.sel = it; next.disabled = false; paintPreview(); paintGrid(); };
        grid.append(t);
      });
      if (!recent[kind].length) {
        const h = mk('p', 'sxc-hint', 'ضغط على "فتح المعرض" واختار ' + (kind === 'reel' ? 'فيديوهات' : kind === 'story' ? 'صور ولا فيديوهات' : 'صور') + ' (تقدر تختار بزاف).');
        h.style.gridColumn = '1 / -1';
        h.style.padding = '10px 14px';
        grid.append(h);
      }
    }
    st.paintGrid = paintGrid;

    input.onchange = () => {
      const files = Array.from(input.files || []);
      input.value = '';
      if (!files.length) return;
      const okType = kind === 'reel' ? /^video\/(mp4|webm|quicktime)$/ : kind === 'story' ? /^(video\/(mp4|webm|quicktime)|image\/(jpeg|png|webp))$/ : /^image\/(jpeg|png|webp)$/;
      const good = files.filter((f) => okType.test(f.type));
      if (good.length !== files.length) toast(kind === 'reel' ? 'غير فيديوهات MP4 أو WEBM أو MOV' : kind === 'story' ? 'غير صور أو فيديوهات مدعومة' : 'غير صور JPG أو PNG أو WEBP');
      if (!good.length) return;
      const added = addRecent(kind, good);
      st.sel = added[0];
      next.disabled = false;
      paintPreview();
      paintGrid();
    };

    next.onclick = () => {
      if (!st.sel) return;
      if (st.sel.file.type.indexOf('video/') === 0) takeVideo(st.sel.file); else takePhoto(st.sel.file);
    };

    grid.ondragover = (e) => e.preventDefault();
    grid.ondrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        input.onchange();
      }
    };

    paintPreview();
    paintGrid();
    root.append(prev, bar, grid, modeTabs());
  }

  function modeTabs() {
    const tabs = mk('div', 'sxc-modes');
    [['photo', 'منشور'], ['story', 'قصة'], ['reel', 'ريل'], ['live', 'لايف']].forEach(([m, label]) => {
      const b = mk('button', 'sxc-mode' + (st.mode === m ? ' on' : ''), label);
      if (m === 'live') b.append(mk('span', 'sxc-soon', 'قريبا'));
      b.onclick = () => { st.mode = m; showPick(); };
      tabs.append(b);
    });
    return tabs;
  }

  async function takePhoto(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast('خاص تكون صورة JPG أو PNG أو WEBP'); return; }
    if (file.size > 15 * 1024 * 1024) { toast('الصورة كبيرة بزاف (الأقصى 15 ميغابايت)'); return; }
    try {
      st.base = await loadImage(file);
    } catch (e) { toast(e.message); return; }
    st.edit = fresh();
    st.tool = 'filters';
    st.storyKind = 'image';
    showEditPhoto();
  }

  function videoMeta(url) {
    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.muted = true;
      const done = (d) => { v.removeAttribute('src'); resolve(d); };
      v.onloadedmetadata = () => done(v.duration);
      v.onerror = () => done(NaN);
      setTimeout(() => done(NaN), 8000);
      v.src = url;
    });
  }

  async function takeVideo(file) {
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) { toast('الفيديو خاصو يكون MP4 أو WEBM أو MOV'); return; }
    if (file.size > 30 * 1024 * 1024) { toast('الفيديو كبير بزاف (الأقصى 30 ميغابايت)'); return; }
    const url = URL.createObjectURL(file);
    const dur = await videoMeta(url);
    if (Number.isFinite(dur) && dur > 90) {
      URL.revokeObjectURL(url);
      toast('الفيديو طويل بزاف (الأقصى 90 ثانية)');
      return;
    }
    st.vfile = file;
    st.vurl = url;
    st.vdur = Number.isFinite(dur) ? dur : 0;
    st.cover = 0;
    st.storyKind = 'video';
    if (st.mode === 'story') {
      if (st.vdur > 60) { toast('فيديو القصة الأقصى 60 ثانية'); URL.revokeObjectURL(url); st.vurl = null; return; }
      st.poster = null;
      showShare();
      return;
    }
    showEditVideo();
  }

  /* ---- 2) تعديل الصورة ---- */
  function showEditPhoto() {
    clear();
    const next = mk('button', 'sxc-next', 'التالي ←');
    next.onclick = showShare;
    root.append(topBar(xBtn(showPick), 'تعديل', next));

    const stage = mk('div', 'sxc-stage');
    const cv = document.createElement('canvas');
    cv.id = 'sxcCanvas';
    stage.append(cv);

    const panel = mk('div', 'sxc-panel');
    const tools = mk('div', 'sxc-tools');
    const defs = [
      ['filters', '🎨', 'فلاتر'],
      ['adjust', '☀️', 'ضبط'],
      ['rotate', '⟳', 'تدوير'],
      ['crop', '▢', 'قص'],
      ['text', 'Aa', 'نص']
    ];
    const btns = {};
    defs.forEach(([k, ic, label]) => {
      const b = mk('button', 'sxc-tool');
      b.append(mk('span', 'ic', ic), mk('span', '', label));
      b.onclick = () => {
        if (k === 'rotate') {
          st.edit.rot = (st.edit.rot + 90) % 360;
          redraw();
          return;
        }
        st.tool = k;
        paintPanel();
      };
      btns[k] = b;
      tools.append(b);
    });

    function paintPanel() {
      Object.keys(btns).forEach((k) => btns[k].classList.toggle('on', k === st.tool));
      panel.replaceChildren();
      const e = st.edit;

      if (st.tool === 'filters') {
        const chips = mk('div', 'sxc-chips');
        Object.keys(PRESETS).forEach((k) => {
          const c = mk('button', 'sxc-chip' + (e.filter === k ? ' on' : ''), PRESETS[k].label);
          c.onclick = () => { e.filter = k; paintPanel(); redraw(); };
          chips.append(c);
        });
        panel.append(chips);
      }

      if (st.tool === 'adjust') {
        const slider = (label, key) => {
          const l = mk('label');
          const r = document.createElement('input');
          r.type = 'range';
          r.min = key === 's' ? 0 : 50;
          r.max = key === 's' ? 200 : 150;
          r.value = Math.round(e[key] * 100);
          r.oninput = () => { e[key] = Number(r.value) / 100; redraw(); };
          l.append(mk('span', '', label), r);
          return l;
        };
        const rs = mk('button', 'sxc-chip', 'إعادة ضبط');
        rs.onclick = () => { e.b = 1; e.c = 1; e.s = 1; paintPanel(); redraw(); };
        panel.append(slider('سطوع', 'b'), slider('تباين', 'c'), slider('تشبع', 's'), rs);
      }

      if (st.tool === 'crop') {
        const chips = mk('div', 'sxc-chips');
        [['orig', 'الأصلي'], ['1:1', 'مربع 1:1'], ['4:5', 'عمودي 4:5'], ['9:16', 'ستوري 9:16']].forEach(([k, label]) => {
          const c = mk('button', 'sxc-chip' + (e.ratio === k ? ' on' : ''), label);
          c.onclick = () => { e.ratio = k; paintPanel(); redraw(); };
          chips.append(c);
        });
        panel.append(chips);
      }

      if (st.tool === 'text') {
        const ta = document.createElement('input');
        ta.type = 'text';
        ta.maxLength = 60;
        ta.placeholder = 'كتب نص فوق الصورة...';
        ta.value = e.text;
        ta.oninput = () => { e.text = ta.value; redraw(); };
        const colors = mk('div', 'sxc-chips');
        ['#ffffff', '#111111', '#e68bff', '#b65af0', '#ffd34d', '#ff6b81', '#5ee0a0'].forEach((col) => {
          const sw = mk('button', 'sxc-swatch' + (e.tcolor === col ? ' on' : ''));
          sw.style.background = col;
          sw.onclick = () => { e.tcolor = col; paintPanel(); redraw(); };
          colors.append(sw);
        });
        const opts = mk('div', 'sxc-chips');
        [['s', 'صغير'], ['m', 'وسط'], ['l', 'كبير']].forEach(([k, label]) => {
          const c = mk('button', 'sxc-chip' + (e.tsize === k ? ' on' : ''), label);
          c.onclick = () => { e.tsize = k; paintPanel(); redraw(); };
          opts.append(c);
        });
        [['top', 'فوق'], ['center', 'وسط'], ['bottom', 'تحت']].forEach(([k, label]) => {
          const c = mk('button', 'sxc-chip' + (e.tpos === k ? ' on' : ''), label);
          c.onclick = () => { e.tpos = k; paintPanel(); redraw(); };
          opts.append(c);
        });
        panel.append(ta, colors, opts);
      }
    }

    root.append(stage, panel, tools);
    paintPanel();
    renderTo(cv, 760);
  }

  /* ---- 2) تعديل الفيديو ---- */
  function showEditVideo() {
    clear();
    const next = mk('button', 'sxc-next', 'التالي ←');
    next.onclick = async () => {
      next.disabled = true;
      await captureCover();
      showShare();
    };
    root.append(topBar(xBtn(showPick), 'تعديل الريل', next));

    const stage = mk('div', 'sxc-stage');
    const v = document.createElement('video');
    v.id = 'sxcVideo';
    v.src = st.vurl;
    v.controls = true;
    v.playsInline = true;
    v.muted = false;
    v.preload = 'auto';
    stage.append(v);

    const panel = mk('div', 'sxc-panel');
    panel.append(mk('p', 'sxc-hint', 'اختار الغلاف (الصورة اللي كتبان قبل ما يتشغل الفيديو):'));
    const l = mk('label');
    const r = document.createElement('input');
    r.type = 'range';
    r.min = 0;
    r.max = 1000;
    r.value = st.vdur ? Math.round((st.cover / st.vdur) * 1000) : 0;
    r.oninput = () => {
      st.cover = (Number(r.value) / 1000) * (st.vdur || 0);
      v.pause();
      try { v.currentTime = st.cover; } catch (e) { /* ignore */ }
    };
    l.append(mk('span', '', '🖼 الغلاف'), r);
    panel.append(l, mk('p', 'sxc-hint', '✂️ قص الفيديو وفلاتر الفيديو: جايين قريبا.'));
    root.append(stage, panel);
  }

  async function captureCover() {
    st.poster = null;
    const v = $('sxcVideo');
    if (!v) return;
    try {
      if (v.readyState < 2) await new Promise((res) => { v.onloadeddata = res; setTimeout(res, 3000); });
      if (Math.abs(v.currentTime - st.cover) > 0.05) {
        await new Promise((res) => { v.onseeked = res; try { v.currentTime = st.cover; } catch (e) { res(); } setTimeout(res, 2500); });
      }
      const w = v.videoWidth;
      const h = v.videoHeight;
      if (!w || !h) return;
      const k = Math.min(1, 1080 / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.round(w * k);
      c.height = Math.round(h * k);
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      st.poster = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
    } catch (e) { st.poster = null; }
  }

  /* ---- 3) صفحة النشر ---- */
  function showShare() {
    clear();
    const isText = st.mode === 'text';
    const isStory = st.mode === 'story';
    const storyVideo = isStory && st.storyKind === 'video';
    const title = isText ? 'منشور جديد' : isStory ? 'قصة جديدة' : st.mode === 'reel' ? 'ريل جديد' : 'صورة جديدة';
    const back = xBtn(isText || storyVideo ? showPick : (st.mode === 'reel' ? showEditVideo : showEditPhoto), '→');
    root.append(topBar(back, title));

    const body = mk('div', 'sxc-share');
    const row = mk('div', 'sxc-row');
    if (!isText) {
      let thumb;
      if (st.mode === 'photo' || (isStory && !storyVideo)) {
        thumb = document.createElement('canvas');
        renderTo(thumb, 240);
        thumb.className = 'sxc-thumb';
      } else if (st.poster) {
        thumb = document.createElement('img');
        thumb.src = URL.createObjectURL(st.poster);
        thumb.className = 'sxc-thumb';
      } else {
        thumb = mk('div', 'sxc-thumb', '🎬');
        thumb.style.cssText += ';display:grid;place-items:center;font-size:34px';
      }
      row.append(thumb);
    }
    const ta = document.createElement('textarea');
    ta.maxLength = isStory ? 200 : 1500;
    ta.placeholder = isText ? 'شارك أفكارك...' : isStory ? 'أضف تعليقا قصيرا (اختياري)...' : 'أضف وصفا...';
    ta.value = st.caption;
    ta.oninput = () => { st.caption = ta.value; count.textContent = ta.value.length + ' / ' + ta.maxLength; };
    row.append(ta);
    const count = mk('p', 'sxc-hint', ta.value.length + ' / ' + ta.maxLength);
    body.append(row, count);
    if (isText) {
      body.append(modeHintTabs());
    }

    const foot = mk('div', 'sxc-foot');
    const pub = mk('button', 'sxc-btn', isStory ? 'نشر القصة ✦' : 'نشر الآن ✦');
    pub.onclick = () => publish(pub, ta);
    foot.append(pub);
    root.append(body, foot);
    setTimeout(() => ta.focus(), 50);
  }

  function modeHintTabs() {
    const t = mk('div', 'sxc-chips');
    [['photo', '🖼️ زيد صورة'], ['reel', '🎬 زيد ريل']].forEach(([m, label]) => {
      const c = mk('button', 'sxc-chip', label);
      c.onclick = () => { st.mode = m; showPick(); };
      t.append(c);
    });
    return t;
  }

  /* ================= النشر ================= */
  function toJpeg(canvas, q) {
    return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('تعذر معالجة الصورة'))), 'image/jpeg', q));
  }

  async function publish(btn, ta) {
    if (st.publishing || !me) return;
    const caption = ta.value.trim();
    if (st.mode === 'text' && !caption) { toast('كتب شي حاجة'); return; }

    st.publishing = true;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'كننشر... ⏳';
    try {
      let imageUrl = null;
      let videoUrl = null;
      const stamp = Date.now();

      if (st.mode === 'story') {
        let mediaUrl;
        let kind;
        if (st.storyKind === 'video') {
          const f = st.vfile;
          const ext = f.type === 'video/webm' ? 'webm' : f.type === 'video/quicktime' ? 'mov' : 'mp4';
          const path = me + '/story-' + stamp + '.' + ext;
          const up = await sb.storage.from('post-videos').upload(path, f, { contentType: f.type, upsert: false });
          if (up.error) throw new Error('رفع الفيديو: ' + up.error.message);
          mediaUrl = sb.storage.from('post-videos').getPublicUrl(path).data.publicUrl;
          kind = 'video';
        } else {
          const out = document.createElement('canvas');
          renderTo(out, 1280);
          const blob = await toJpeg(out, 0.85);
          const path = me + '/story-' + stamp + '.jpg';
          const up = await sb.storage.from('post-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
          if (up.error) throw new Error('رفع الصورة: ' + up.error.message);
          mediaUrl = sb.storage.from('post-images').getPublicUrl(path).data.publicUrl;
          kind = 'image';
        }
        const ins = await sb.from('stories').insert({ media_url: mediaUrl, kind, caption: caption || null });
        if (ins.error) throw new Error(ins.error.message);
        st.publishing = false;
        closeComposer();
        toast('تم نشر القصة ✅');
        if (window.sxReloadStories) window.sxReloadStories();
        return;
      }

      if (st.mode === 'photo') {
        const out = document.createElement('canvas');
        renderTo(out, 1280);
        const blob = await toJpeg(out, 0.85);
        const path = me + '/' + stamp + '.jpg';
        const up = await sb.storage.from('post-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw new Error('رفع الصورة: ' + up.error.message);
        imageUrl = sb.storage.from('post-images').getPublicUrl(path).data.publicUrl;
      }

      if (st.mode === 'reel') {
        const f = st.vfile;
        const ext = f.type === 'video/webm' ? 'webm' : f.type === 'video/quicktime' ? 'mov' : 'mp4';
        const path = me + '/' + stamp + '.' + ext;
        const up = await sb.storage.from('post-videos').upload(path, f, { contentType: f.type, upsert: false });
        if (up.error) throw new Error('رفع الفيديو: ' + up.error.message);
        videoUrl = sb.storage.from('post-videos').getPublicUrl(path).data.publicUrl;
        if (st.poster) {
          const pp = me + '/' + stamp + '-cover.jpg';
          const upc = await sb.storage.from('post-images').upload(pp, st.poster, { contentType: 'image/jpeg', upsert: false });
          if (!upc.error) imageUrl = sb.storage.from('post-images').getPublicUrl(pp).data.publicUrl;
        }
      }

      const { error } = await sb.from('posts').insert({
        content: caption || (videoUrl ? '🎬' : imageUrl ? '📷' : ''),
        image_url: imageUrl,
        video_url: videoUrl
      });
      if (error) throw new Error(error.message);

      st.publishing = false;
      closeComposer();
      toast('تم النشر ✅');
      if (window.sxReloadPosts) window.sxReloadPosts();
    } catch (e) {
      toast('وقع مشكل: ' + e.message);
      btn.disabled = false;
      btn.textContent = label;
    } finally {
      st.publishing = false;
    }
  }

  /* ================= فتح / إغلاق ================= */
  function onKey(e) { if (e.key === 'Escape') closeComposer(); }

  function openComposer(startMode) {
    if (!me) { toast('خاصك تسجل الدخول أولا'); return; }
    reset();
    if (typeof startMode === 'string') st.mode = startMode;
    root.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    showPick();
    if (st.pickInput && !recent[st.mode === 'reel' ? 'reel' : st.mode === 'story' ? 'story' : 'photo'].length) st.pickInput.click();
  }

  function closeComposer() {
    if (st && st.publishing) return;
    root.style.display = 'none';
    root.replaceChildren();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (st && st.vurl) { URL.revokeObjectURL(st.vurl); st.vurl = null; }
  }

  window.sxOpenComposer = openComposer;
  const np = $('newPost');
  const cp = $('composer');
  if (np) np.onclick = openComposer;
  if (cp) cp.onclick = openComposer;

  function setUser(id) {
    me = id;
    if (!me) closeComposer();
  }
  sb.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => setUser(s ? s.user.id : null), 0);
  });
  sb.auth.getSession().then(({ data }) => {
    setUser(data.session ? data.session.user.id : null);
  });
})();

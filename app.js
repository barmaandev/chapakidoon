/* global cssjanus */
(function () {
  const input = document.getElementById('inputCss');
  const output = document.getElementById('outputCss');
  const copyBtn = document.getElementById('copyRtl');
  const styleLtr = document.getElementById('styleLtr');
  const styleRtl = document.getElementById('styleRtl');
  const swapLogical = document.getElementById('swapLogical');
  const preserveUrls = document.getElementById('preserveUrls');
  const badgeLtr = document.getElementById('badgeLtr');
  const badgeRtl = document.getElementById('badgeRtl');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const downloadBtn = document.getElementById('downloadBtn');
  const shareBtn = document.getElementById('shareBtn');
  const gutterLtr = document.getElementById('gutterLtr');
  const gutterRtl = document.getElementById('gutterRtl');

  function convert(ltrCss) {
    const shouldSwap = swapLogical.checked;
    if (!shouldSwap) return ltrCss;
    try {
      const options = {
        transformDirInUrl: !preserveUrls.checked,
        swapLtrRtlInUrl: !preserveUrls.checked,
      };
      if (window.cssjanus && typeof window.cssjanus.transform === 'function') {
        return window.cssjanus.transform(ltrCss, options);
      }
    } catch (_) {}
    // Fallback: naive flipping for common cases if library missing
    return fallbackFlip(ltrCss);
  }

  function fallbackFlip(css) {
    let out = css;
    // Flip left/right words in property names
    out = out.replace(/(margin|padding)\-(left|right)\s*:/gi, (m, prop, side) => {
      const other = side.toLowerCase() === 'left' ? 'right' : 'left';
      return `${prop}-${other}:`;
    });
    // border-left/right and sub-properties
    out = out.replace(/(border(?:\-(?:color|style|width))?)\-(left|right)\s*:/gi, (m, prop, side) => {
      const other = side.toLowerCase() === 'left' ? 'right' : 'left';
      return `${prop}-${other}:`;
    });
    // logical borders: border-inline-start/end (+ color/style/width)
    out = out.replace(/(border(?:\-(?:color|style|width))?)\-inline\-(start|end)\s*:/gi, (m, prop, side) => {
      const other = side.toLowerCase() === 'start' ? 'end' : 'start';
      return `${prop}-inline-${other}:`;
    });
    // corner radii
    out = out
      .replace(/border\-top\-left\-radius/gi, '__TMP_BORDER_TOP_LEFT__')
      .replace(/border\-top\-right\-radius/gi, 'border-top-left-radius')
      .replace(/__TMP_BORDER_TOP_LEFT__/g, 'border-top-right-radius')
      .replace(/border\-bottom\-left\-radius/gi, '__TMP_BORDER_BOTTOM_LEFT__')
      .replace(/border\-bottom\-right\-radius/gi, 'border-bottom-left-radius')
      .replace(/__TMP_BORDER_BOTTOM_LEFT__/g, 'border-bottom-right-radius');

    out = out.replace(/text\-align\s*:\s*(left|right)/gi, (m, side) => `text-align: ${side.toLowerCase()==='left'?'right':'left'}`);
    out = out.replace(/\b(float|clear)\s*:\s*(left|right)/gi, (m, prop, side) => `${prop}: ${side.toLowerCase()==='left'?'right':'left'}`);
    // float/clear logical keywords
    out = out.replace(/\b(float|clear)\s*:\s*(inline\-start|inline\-end)/gi, (m, prop, side) => `${prop}: ${side.toLowerCase()==='inline-start'?'inline-end':'inline-start'}`);
    // positional left/right properties
    out = out.replace(/(^|[;{\s])\s*(left|right)\s*:/gi, (m, pre, prop) => `${pre} ${prop.toLowerCase()==='left'?'right':'left'}:`);
    // logical inset inline start/end
    out = out.replace(/(^|[;{\s])\s*inset\-inline\-(start|end)\s*:/gi, (m, pre, side) => `${pre} inset-inline-${side.toLowerCase()==='start'?'end':'start'}:`);
    // margin/padding logical longhand
    out = out.replace(/\b(margin|padding)\-inline\-(start|end)\s*:/gi, (m, prop, side) => `${prop}-inline-${side.toLowerCase()==='start'?'end':'start'}:`);
    // margin/padding logical shorthand: one or two values
    out = out.replace(/\b(margin|padding)\-inline\s*:\s*([^;{}]*)/gi, (m, prop, values) => {
      const parts = values.trim().split(/\s+/);
      if (parts.length === 2) {
        const [startVal, endVal] = parts;
        return `${prop}-inline: ${endVal} ${startVal}`;
      }
      return m;
    });
    // border-inline shorthand width/style/color can be various orders; we just swap two-value cases
    out = out.replace(/\bborder\-inline\s*:\s*([^;{}]*)/gi, (m, values) => {
      // Try to detect two slash-separated or space-separated values like: border-inline: 1px 2px;
      const val = values.trim();
      const parts = val.split(/\s+/);
      if (parts.length === 2 && /\d|thin|medium|thick|none|solid|dashed|dotted|double|groove|ridge|inset|outset|#|rgb|hsl/i.test(val)) {
        return `border-inline: ${parts[1]} ${parts[0]}`;
      }
      return m;
    });
    // logical radii: border-start-start-radius, etc.
    out = out
      .replace(/border\-start\-start\-radius/gi, '__TMP_BSS__')
      .replace(/border\-start\-end\-radius/gi, 'border-start-start-radius')
      .replace(/__TMP_BSS__/g, 'border-start-end-radius')
      .replace(/border\-end\-start\-radius/gi, '__TMP_BES__')
      .replace(/border\-end\-end\-radius/gi, 'border-end-start-radius')
      .replace(/__TMP_BES__/g, 'border-end-end-radius');
    // text-align: start/end
    out = out.replace(/text\-align\s*:\s*(start|end)/gi, (m, side) => `text-align: ${side.toLowerCase()==='start'?'end':'start'}`);
    // background-position keywords
    out = out.replace(/background\-position\s*:\s*([^;{}]*)/gi, (m, values) => {
      let v = values;
      v = v.replace(/\bleft\b/gi, '__TMP_LEFT__');
      v = v.replace(/\bright\b/gi, 'left');
      v = v.replace(/__TMP_LEFT__/g, 'right');
      return `background-position: ${v}`;
    });
    // transform-origin keywords
    out = out.replace(/transform\-origin\s*:\s*([^;{}]*)/gi, (m, values) => {
      let v = values;
      v = v.replace(/\bleft\b/gi, '__TMP_LEFT__');
      v = v.replace(/\bright\b/gi, 'left');
      v = v.replace(/__TMP_LEFT__/g, 'right');
      return `transform-origin: ${v}`;
    });
    // transform translateX()/translate()/translate3d(): flip horizontal component sign
    out = out.replace(/transform\s*:\s*([^;{}]*)/gi, (m, values) => {
      let v = values;
      v = v.replace(/translateX\(\s*([^\)]+)\)/gi, (mm, x) => `translateX(${negateLength(x.trim())})`);
      v = v.replace(/translate\(\s*([^,\)]+)(\s*,\s*[^\)]+)?\)/gi, (mm, x, rest) => `translate(${negateLength(x.trim())}${rest||''})`);
      v = v.replace(/translate3d\(\s*([^,\)]+)(\s*,\s*[^,\)]+)(\s*,\s*[^\)]+)\)/gi, (mm, x, y, z) => `translate3d(${negateLength(x.trim())}${y}${z})`);
      // scaleX / skewX
      v = v.replace(/scaleX\(\s*([^\)]+)\)/gi, (mm, x) => `scaleX(${negateNumber(x.trim())})`);
      v = v.replace(/skewX\(\s*([^\)]+)\)/gi, (mm, x) => `skewX(${negateAngle(x.trim())})`);
      // matrix(a, b, c, d, tx, ty) => flip tx
      v = v.replace(/matrix\(\s*([^,\)]+),\s*([^,\)]+),\s*([^,\)]+),\s*([^,\)]+),\s*([^,\)]+),\s*([^,\)]+)\)/gi,
        (mm, a,b,c,d,tx,ty) => `matrix(${a}, ${b}, ${c}, ${d}, ${negateLength(String(tx).trim())}, ${ty})`);
      return `transform: ${v}`;
    });
    // shadows: box-shadow/text-shadow first length is horizontal offset; swap sign
    out = out.replace(/\b(box\-shadow|text\-shadow)\s*:\s*([^;{}]*)/gi, (m, prop, values) => {
      const segments = values.split(/,(?![^\(]*\))/); // split by commas not inside parentheses
      const flipped = segments.map(seg => {
        const parts = seg.trim().split(/\s+/);
        if (parts.length >= 2) {
          parts[0] = negateLength(parts[0]);
        }
        return parts.join(' ');
      });
      return `${prop}: ${flipped.join(', ')}`;
    });
    // background gradients: swap to left/right and mirror numeric angle if present
    out = out.replace(/(linear\-gradient|repeating\-linear\-gradient)\(([^\)]*)\)/gi, (m, fn, inside) => {
      let s = inside.trim();
      // swap keywords
      s = s.replace(/to\s+left/gi, '__TMP_TO_LEFT__');
      s = s.replace(/to\s+right/gi, 'to left');
      s = s.replace(/__TMP_TO_LEFT__/g, 'to right');
      // mirror starting numeric angle
      s = s.replace(/^([+-]?[0-9]*\.?[0-9]+)(deg|rad|grad|turn)(\s*,)/i, (mm, val, unit, comma) => {
        return `${mirrorAngle(parseFloat(val), unit)}${unit}${comma}`;
      });
      return `${fn}(${s})`;
    });
    // background-position numeric/percent pair: X Y (swap X via mirroring: left<->right keywords already handled; for numbers, no mirror w/o box width, so skip)
    out = out.replace(/background\-position\s*:\s*([\d\.]+%|[\-\+]?[\d\.]+[a-z%]*)\s+([^;{}]*)/gi, (m, x, y) => {
      return `background-position: ${mirrorPercentOrKeep(x)} ${y}`;
    });
    // clip-path inset(): inset(T R B L) -> inset(T L B R)
    out = out.replace(/clip\-path\s*:\s*inset\(\s*([^\)]*)\)/gi, (m, inside) => {
      const parts = inside.trim().split(/\s+/);
      if (parts.length === 4) {
        const [t, r, b, l] = parts;
        return `clip-path: inset(${t} ${l} ${b} ${r})`;
      }
      return m;
    });
    // cursor e-resize/w-resize
    out = out.replace(/cursor\s*:\s*(?:[^;]*\s)?(e\-resize|w\-resize)/gi, (m, dir) => m.replace(dir, dir === 'e-resize' ? 'w-resize' : 'e-resize'));
    // flex-direction: row <-> row-reverse
    out = out.replace(/flex\-direction\s*:\s*(row\-reverse|row)/gi, (m, dir) => `flex-direction: ${dir.toLowerCase()==='row'?'row-reverse':'row'}`);
    // flex-flow: swap row/row-reverse within the shorthand
    out = out.replace(/flex\-flow\s*:\s*([^;{}]*)/gi, (m, values) => {
      let v = values;
      v = v.replace(/row\-reverse/gi, '__TMP_ROW_REV__');
      v = v.replace(/\brow\b/gi, 'row-reverse');
      v = v.replace(/__TMP_ROW_REV__/g, 'row');
      return `flex-flow: ${v}`;
    });

    // Flip four-value shorthands: margin/padding: T R B L -> T L B R
    out = out.replace(/\b(margin|padding)\s*:\s*([^;{}]*)/gi, (m, prop, values) => {
      const parts = values.trim().split(/\s+/);
      if (parts.length === 4) {
        const [t, r, b, l] = parts;
        return `${prop}: ${t} ${l} ${b} ${r}`;
      }
      return m;
    });

    return out;
  }

  function negateLength(token) {
    // Handle numbers with optional units and signs, percentages, calc() left as-is
    // If token is calc(...) we prepend a unary minus to the first numeric term safely by wrapping
    if (/^calc\(/i.test(token)) {
      return `calc(-1 * ${token.slice(5)}`; // naive but keeps semantics for simple cases
    }
    const m = token.match(/^([+-]?)(\d*\.?\d+)([a-z%]*)$/i);
    if (!m) return token.startsWith('-') ? token.replace(/^\-\s*/, '') : `-${token}`;
    const sign = m[1];
    const num = m[2];
    const unit = m[3] || '';
    const newSign = sign === '-' ? '' : '-';
    return `${newSign}${num}${unit}`;
  }

  function negateNumber(token) {
    const m = token.match(/^([+-]?)(\d*\.?\d+)$/);
    if (!m) return token.startsWith('-') ? token.replace(/^\-\s*/, '') : `-${token}`;
    const sign = m[1];
    const num = m[2];
    const newSign = sign === '-' ? '' : '-';
    return `${newSign}${num}`;
  }

  function negateAngle(token) {
    const m = token.match(/^([+-]?)(\d*\.?\d+)(deg|rad|grad|turn)$/i);
    if (!m) return token.startsWith('-') ? token.replace(/^\-\s*/, '') : `-${token}`;
    const sign = m[1];
    const num = m[2];
    const unit = m[3];
    const newSign = sign === '-' ? '' : '-';
    return `${newSign}${num}${unit}`;
  }

  function mirrorPercentOrKeep(token) {
    // 0% -> 100%, 10% -> 90%, 100% -> 0%; leave lengths as-is (lack of container width)
    const m = token.match(/^(\d*\.?\d+)%$/);
    if (!m) return token;
    const val = parseFloat(m[1]);
    const mirrored = Math.max(0, Math.min(100, 100 - val));
    return `${mirrored}%`;
  }

  function mirrorAngle(value, unit) {
    switch ((unit || 'deg').toLowerCase()) {
      case 'deg':
        return (value + 180) % 360;
      case 'rad':
        return (value + Math.PI) % (Math.PI * 2);
      case 'grad':
        return (value + 200) % 400;
      case 'turn':
        return (value + 0.5) % 1;
      default:
        return value;
    }
  }

  function update() {
    const ltrCss = input.value;
    const rtlCss = convert(ltrCss);
    output.value = rtlCss;
    // Scope styles so each preview applies only its own rules
    styleLtr.textContent = scopeCss(ltrCss, '#previewLtr');
    styleRtl.textContent = scopeCss(rtlCss, '#previewRtl');
    updateChangeBadges(ltrCss, rtlCss);
    persistState();
    renderGutters(ltrCss, rtlCss);
    autoResizeEditors();
  }

  function initSample() {
    if (input.value.trim()) return;
    input.value = [
      '.demo {',
      '  padding: 16px;',
      '  margin-left: 24px;',
      '  text-align: left;',
      '}',
      '.demo h4 {',
      '  border-left: 4px solid #6ea8fe;',
      '  padding-left: 8px;',
      '}',
      '.demo button {',
      '  float: right;',
      '  margin-top: 8px;',
      '}',
    ].join('\n');
  }

  function updateChangeBadges(ltr, rtl) {
    const changed = countChangedLines(ltr, rtl);
    const label = `تغییرات: ${changed}`;
    if (badgeLtr) badgeLtr.textContent = label;
    if (badgeRtl) badgeRtl.textContent = label;
  }

  function countChangedLines(a, b) {
    const al = a.split(/\n/);
    const bl = b.split(/\n/);
    const max = Math.max(al.length, bl.length);
    let c = 0;
    for (let i = 0; i < max; i++) {
      if ((al[i] || '') !== (bl[i] || '')) c++;
    }
    return c;
  }

  function persistState() {
    try {
      const state = {
        input: input.value,
        swap: !!(swapLogical && swapLogical.checked),
        preserve: !!(preserveUrls && preserveUrls.checked),
      };
      localStorage.setItem('rtltool-state', JSON.stringify(state));
      // also reflect in URL
      const params = new URLSearchParams();
      if (state.swap) params.set('swap', '1');
      if (state.preserve) params.set('preserve', '1');
      if (state.input) params.set('code', btoa(unescape(encodeURIComponent(state.input))).slice(0, 200000));
      const newUrl = `${location.pathname}?${params.toString()}`;
      history.replaceState(null, '', newUrl);
    } catch (_) {}
  }

  function restoreStateFromUrlOrStorage() {
    try {
      const params = new URLSearchParams(location.search);
      const ls = localStorage.getItem('rtltool-state');
      const saved = ls ? JSON.parse(ls) : {};
      const codeParam = params.get('code');
      if (codeParam) input.value = decodeURIComponent(escape(atob(codeParam)));
      else if (saved.input) input.value = saved.input;
      if (swapLogical) swapLogical.checked = params.has('swap') ? true : (saved.swap ?? true);
      if (preserveUrls) preserveUrls.checked = params.has('preserve') ? true : (saved.preserve ?? true);
    } catch (_) {}
  }

  function bindUi() {
    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => toggleModal(helpModal, true));
      document.querySelectorAll('[data-close="helpModal"]').forEach((el) => {
        el.addEventListener('click', () => toggleModal(helpModal, false));
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleModal(helpModal, false);
      });
    }
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const text = await file.text();
        input.value = text;
        update();
      });
    }
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const blob = new Blob([output.value], { type: 'text/css;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'style-rtl-chapakidoon.css';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        persistState();
        try {
          await navigator.clipboard.writeText(location.href);
          shareBtn.textContent = 'کپی شد';
          setTimeout(() => (shareBtn.textContent = 'اشتراک'), 1200);
        } catch (_) {}
      });
    }
    // keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        copyBtn.click();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        downloadBtn && downloadBtn.click();
      }
    });

    // sync gutters with scroll and input
    input.addEventListener('scroll', syncGutters);
    output.addEventListener('scroll', syncGutters);
    input.addEventListener('input', renderGutters);
  }

  function toggleModal(el, show) {
    el.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  document.addEventListener('input', (e) => {
    if (e.target === input || e.target === swapLogical || e.target === preserveUrls) {
      update();
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target === swapLogical || e.target === preserveUrls) {
      update();
    }
  });

  copyBtn.addEventListener('click', () => {
    output.select();
    document.execCommand('copy');
    copyBtn.textContent = 'کپی شد';
    setTimeout(() => (copyBtn.textContent = 'کپی'), 1200);
  });

  // Wait for cssjanus to be available if loading deferred
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    restoreStateFromUrlOrStorage();
    initSample();
    update();
    bindUi();
  });

  function autoResizeEditors() {
    [input, output].forEach((ta) => {
      if (!ta) return;
      ta.style.height = 'auto';
      // extra padding to avoid clipping bottom lines
      const extra = 8;
      ta.style.height = (ta.scrollHeight + extra) + 'px';
    });
  }

  function renderGutters(ltrCss, rtlCss) {
    if (!gutterLtr || !gutterRtl) return;
    const changed = computeChangedLineSet(ltrCss ?? input.value, rtlCss ?? output.value);
    drawGutter(gutterLtr, input, (input.value.match(/\n/g) || []).length + 1, changed);
    drawGutter(gutterRtl, output, (output.value.match(/\n/g) || []).length + 1, changed);
  }

  function buildLines() { /* deprecated (canvas gutter) */ }

  function computeChangedLineSet(a, b) {
    const al = a.split(/\n/);
    const bl = b.split(/\n/);
    const max = Math.max(al.length, bl.length);
    const set = new Set();
    for (let i = 0; i < max; i++) {
      if ((al[i] || '') !== (bl[i] || '')) set.add(i + 1);
    }
    return set;
  }

  let redrawScheduled = false;
  function syncGutters() {
    if (redrawScheduled) return;
    redrawScheduled = true;
    requestAnimationFrame(() => {
      renderGutters();
      redrawScheduled = false;
    });
  }

  function ensureCanvas(container) {
    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.innerHTML = '';
      container.appendChild(canvas);
    }
    // Match gutter background to avoid flicker
    const gutterBg = getComputedStyle(container).backgroundColor;
    canvas.style.backgroundColor = gutterBg;
    return canvas;
  }

  function drawGutter(container, textarea, lineCount, changedSet) {
    const canvas = ensureCanvas(container);
    const dpr = window.devicePixelRatio || 1;
    // Keep gutter container the same height as textarea content
    const contentHeight = Math.max(1, textarea.scrollHeight);
    container.style.height = contentHeight + 'px';
    const rect = container.getBoundingClientRect();
    const width = Math.max(30, Math.round(rect.width));
    const height = Math.max(1, Math.round(contentHeight));
    // resize canvas backing store
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // styles
    const cs = getComputedStyle(textarea);
    const padTop = parseFloat(cs.paddingTop) || 0;
    const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.4);
    const bg = getComputedStyle(container).backgroundColor || 'rgba(255,255,255,0.03)';
    const textColor = '#9aa3b2';
    const changedColor = '#ffd479';
    // clear only (canvas has CSS background color set)
    ctx.clearRect(0, 0, width, height);
    // numbers
    ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    const scroll = textarea.scrollTop;
    // find first visible line index
    const firstLineOffset = (scroll % lineHeight);
    let y = padTop - firstLineOffset;
    let lineIndex = Math.floor(scroll / lineHeight) + 1;
    const rightPad = 6;
    while (y < height && lineIndex <= lineCount + 1) {
      ctx.fillStyle = changedSet && changedSet.has(lineIndex) ? changedColor : textColor;
      const text = String(lineIndex);
      ctx.fillText(text, width - rightPad, y);
      y += lineHeight;
      lineIndex++;
    }
  }

  // Very small CSS scoper: prefixes top-level selectors and those inside @media/@supports.
  // Leaves @keyframes content untouched.
  function scopeCss(css, scope) {
    try {
      return scopeBlocks(css, scope);
    } catch (_) {
      // Fallback: naive line-based prefix
      return css.replace(/(^|\})\s*([^@}{][^{]+)\{/g, (m, pre, sel) => `${pre} ${prefixSelectorList(sel, scope)}{`);
    }
  }

  function scopeBlocks(css, scope) {
    let i = 0;
    const n = css.length;
    let out = '';
    while (i < n) {
      const at = css.slice(i).match(/^\s*@([a-zA-Z\-]+)\b/);
      if (at) {
        const name = at[1].toLowerCase();
        const start = i + at.index;
        // Find block start '{'
        const braceIdx = css.indexOf('{', start);
        if (braceIdx === -1) { out += css.slice(i); break; }
        const header = css.slice(i, braceIdx + 1);
        const [block, endIdx] = readBalanced(css, braceIdx + 1);
        if (name === 'media' || name === 'supports') {
          out += header + scopeBlocks(block, scope) + '}';
        } else if (name === 'keyframes' || name.endsWith('keyframes')) {
          out += header + block + '}';
        } else {
          out += header + scopeBlocks(block, scope) + '}';
        }
        i = endIdx + 1;
      } else {
        // Regular rule
        const selEnd = css.indexOf('{', i);
        if (selEnd === -1) { out += css.slice(i); break; }
        const selectors = css.slice(i, selEnd).trim();
        const [block, endIdx] = readBalanced(css, selEnd + 1);
        if (selectors.startsWith('@')) {
          // Unknown at-rule without block (e.g., @import)
          out += css.slice(i, endIdx + 1);
        } else {
          out += prefixSelectorList(selectors, scope) + '{' + block + '}';
        }
        i = endIdx + 1;
      }
    }
    return out;
  }

  function prefixSelectorList(list, scope) {
    return list.split(',').map(s => {
      const sel = s.trim();
      if (!sel) return sel;
      // Do not prefix :root to avoid conflicting direction
      if (/^:root\b/.test(sel)) return sel;
      return `${scope} ${sel}`;
    }).join(', ');
  }

  function readBalanced(s, start) {
    // start at first char after '{'
    let depth = 1;
    let i = start;
    const n = s.length;
    while (i < n) {
      const ch = s[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
      // Skip strings to avoid counting braces inside
      if (ch === '"' || ch === "'") {
        const q = ch; i++;
        while (i < n) { if (s[i] === q && s[i-1] !== '\\') break; i++; }
      }
      i++;
    }
    const content = s.slice(start, i);
    return [content, i];
  }
})();



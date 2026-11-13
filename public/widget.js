/*
 * SECRA — private voice assistant widget.
 * A business adds ONE line to its website:
 *
 *   <script src="https://YOUR-ASSISTANT-HOST/widget.js" data-biz="clinic" data-lang="en" async></script>
 *
 * It shows a round button in the corner; tapping it opens the assistant in a panel.
 * The assistant runs from our origin in an iframe, so the host website never sees the conversation:
 * not the voice, not the documents, not the answers. data-biz picks public/biz/<id>.json.
 */
(function () {
  if (window.__sirNearWidget) return; window.__sirNearWidget = true;
  var me = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var origin = new URL(me.src, location.href).origin;
  var biz = (me.getAttribute('data-biz') || '').replace(/[^a-z0-9_-]/gi, '');
  var lang = me.getAttribute('data-lang') || (navigator.language || 'en').slice(0, 2);
  var label = me.getAttribute('data-label') || (lang === 'ru' ? 'Приватный помощник' : 'Private assistant');
  var src = origin + '/?embed=1' + (biz ? '&biz=' + biz : '') + '&lang=' + (lang === 'ru' ? 'ru' : 'en');
  var idle = new URLSearchParams(location.search).get('idle'); if (idle) src += '&idle=' + encodeURIComponent(idle);   // demo/testing only

  var css = document.createElement('style');
  css.textContent =
    '.snw-btn{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:10px;border:0;cursor:pointer;' +
    'background:#0d1a3d;color:#fff;border-radius:999px;padding:6px 16px 6px 6px;font:600 15px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
    'box-shadow:0 8px 28px rgba(9,20,60,.35)}' +
    '.snw-btn img{width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:50% 18%;background:#1d3b8a}' +
    '.snw-btn small{display:block;font-weight:500;opacity:.75;font-size:12px}' +
    '.snw-panel{position:fixed;right:18px;bottom:18px;z-index:2147483001;width:400px;height:min(720px,calc(100vh - 36px));border-radius:22px;overflow:hidden;' +
    'box-shadow:0 18px 60px rgba(9,20,60,.45);background:#0b1530;display:none}' +
    '.snw-panel iframe{width:100%;height:100%;border:0}' +
    '.snw-x{position:absolute;top:8px;left:8px;z-index:2;width:34px;height:34px;border-radius:50%;border:0;cursor:pointer;background:rgba(255,255,255,.14);color:#fff;font-size:18px}' +
    '@media (max-width:520px){.snw-panel{right:0;bottom:0;width:100vw;height:100dvh;border-radius:0}}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.className = 'snw-btn'; btn.type = 'button';
  btn.innerHTML = '<img alt="" src="' + origin + '/img/idle.webp?v=secra10"><span>' + label + '<small>🔒 ' + (lang === 'ru' ? 'проверяемо приватно' : 'verifiably private') + '</small></span>';
  var panel = document.createElement('div'); panel.className = 'snw-panel';
  var close = document.createElement('button'); close.className = 'snw-x'; close.type = 'button'; close.textContent = '✕'; close.setAttribute('aria-label', 'Close');
  panel.appendChild(close);
  var frame = null;

  btn.onclick = function () {
    if (!frame) {      // the assistant loads only when the visitor asks for it
      frame = document.createElement('iframe');
      frame.src = src; frame.title = label;
      frame.allow = 'microphone; autoplay; clipboard-write';
      panel.appendChild(frame);
    }
    panel.style.display = 'block'; btn.style.display = 'none';
  };
  close.onclick = function () { panel.style.display = 'none'; btn.style.display = 'flex'; };
  document.body.appendChild(btn); document.body.appendChild(panel);
})();

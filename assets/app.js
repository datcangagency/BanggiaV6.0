/* Trang giới thiệu dịch vụ và giỏ hàng Đất Cảng V6.1. Thuần HTML/JS, không gọi máy chủ riêng, không lưu dữ liệu người dùng.
   Video tham khảo nhúng từ YouTube (youtube-nocookie.com) và chỉ tải khi khách bấm phát. */
(function () {
  'use strict';
  var D = window.PRICE_DATA, CFG = window.SITE_CONFIG || {};
  if (!D) { document.body.innerHTML = '<p style="padding:20px">Không tải được dữ liệu giá (assets/data.js).</p>'; return; }

  var state = { menu: false, tab: D.lines[0].n, sel: {}, vsel: {}, vplay: {}, name: '' };
  var LINE = {}, PKG = {}, TOP = {};
  D.lines.forEach(function (l) {
    LINE[l.n] = l;
    l.opts.forEach(function (o) { PKG[o.id] = o; o._line = l.n; });
    l.tops.forEach(function (t) { TOP[t.id] = t; });
  });
  var UNIT = { 'tháng': '/tháng', 'video': '/video', 'TVC': '/TVC', 'bộ': '/bộ', 'trang': '/trang', 'website': '/website', 'địa điểm': '/địa điểm', 'gói': ' trọn gói' };
  var ICON = {
    5: '<path d="M4 5h16v11H9l-5 4z"/>',
    3: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 9l4 3-4 3z"/>',
    1: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
    2: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 6l3 4M13 6l3 4"/>',
    4: '<path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    6: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z"/>',
    8: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3M3 13h18"/>',
    10: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    7: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>',
    9: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 016 0"/>',
    11: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>'
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICON[n] || ICON[1]) + '</svg>'; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function money(n) { return fmt(n) + 'đ'; }
  function $(s, r) { return (r || document).querySelector(s); }
  function clamp(v, lo, hi) { v = parseInt(v, 10); if (isNaN(v)) v = lo; return Math.max(lo, Math.min(hi, v)); }
  function ul(a) { return '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }

  /* ---------- tính tiền ---------- */
  function lineCalc(l) {
    var s = state.sel[l.n]; if (!s) return null;
    var p = PKG[s.pkg], rows = [], sum = p.price, info = [];
    rows.push({ name: p.name, amt: p.price, from: p.from });
    l.tops.forEach(function (t) {
      var q = s.tops[t.id]; if (!q) return;
      if (t.pct != null) { var a = Math.round(p.price * t.pct); rows.push({ name: t.name + ' (+' + Math.round(t.pct * 100) + '% giá gói)', amt: a }); sum += a; }
      else if (t.price != null) { var b = t.price * q; rows.push({ name: t.name + (q > 1 ? ' × ' + q + ' ' + t.unit : ''), amt: b }); sum += b; }
      else info.push(t.name + ': ' + t.info);
    });
    return { line: l, pkg: p, rows: rows, sum: sum, info: info, monthly: p.unit === 'tháng' };
  }
  function totals() {
    var items = [], sub = 0, from = false;
    D.lines.forEach(function (l) { var c = lineCalc(l); if (c) { items.push(c); sub += c.sum; if (c.pkg.from) from = true; } });
    var vat = Math.round(sub * D.vat);
    return { items: items, sub: sub, vat: vat, total: sub + vat, from: from };
  }

  /* ---------- link chia sẻ giỏ hàng (chỉ chứa mã gói, không có thông tin cá nhân) ---------- */
  function encodeCart() {
    var parts = [];
    D.lines.forEach(function (l) {
      var s = state.sel[l.n]; if (!s) return;
      var tops = Object.keys(s.tops).map(function (id) { return id + '*' + s.tops[id]; });
      parts.push([l.n, s.pkg].concat(tops).join(':'));
    });
    return parts.join(';');
  }
  function decodeCart(str) {
    var out = {};
    String(str || '').split(';').forEach(function (seg) {
      var f = seg.split(':'), n = parseInt(f[0], 10), l = LINE[n], p = PKG[f[1]];
      if (!l || !p || p._line !== n) return;               // bỏ mọi mã không có trong danh mục
      var tops = {};
      f.slice(2).forEach(function (x) {
        var y = x.split('*'), t = TOP[y[0]];
        if (t && l.tops.indexOf(t) >= 0) tops[t.id] = t.pct != null ? 1 : clamp(y[1], t.min, t.max);
      });
      out[n] = { pkg: p.id, tops: tops };
    });
    return out;
  }
  function shareUrl() { var c = encodeCart(); return location.href.split('#')[0] + (c ? '#g=' + c : ''); }
  function syncHash() { try { var c = encodeCart(); history.replaceState(null, '', location.pathname + location.search + (c ? '#g=' + c : '')); } catch (e) { } }

  /* ---------- hiển thị: tab ---------- */
  function renderTabs() {
    var cur = LINE[state.tab];
    $('#tabMenu').innerHTML = '<button type="button" class="tm-btn" id="tabMenuBtn" aria-haspopup="true" aria-expanded="' + state.menu + '"><span class="tm-l">' + svg(cur.n) + '<span><small>Nhóm dịch vụ</small>' + esc(cur.name) + '</span></span><i class="tm-ar" aria-hidden="true"></i></button>' +
      '<ul class="tm-list"' + (state.menu ? '' : ' hidden') + '>' + D.lines.map(function (l) {
        return '<li><button type="button" class="tm-it" data-tab="' + l.n + '"' + (l.n === state.tab ? ' aria-current="true"' : '') + '>' + svg(l.n) + '<span>' + esc(l.name) + '</span>' + (state.sel[l.n] ? '<i class="dot" title="Đã có trong giỏ"></i>' : '') + '</button></li>';
      }).join('') + '</ul>';
    $('#tabs').innerHTML = D.lines.map(function (l) {
      return '<button type="button" role="tab" class="tab" data-tab="' + l.n + '" aria-selected="' + (state.tab === l.n) + '">' + svg(l.n) + '<span>' + esc(l.name) + '</span>' + (state.sel[l.n] ? '<i class="dot" title="Đã có trong giỏ"></i>' : '') + '</button>';
    }).join('');
  }

  /* ---------- video ---------- */
  function thumb(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }
  function videoHTML(o) {
    var i = state.vsel[o.id] || 0, v = o.vids[i], playing = !!state.vplay[o.id];
    var main = playing
      ? '<iframe src="https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&modestbranding=1" title="' + esc(v.t) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
      : '<img src="' + thumb(v.id) + '" alt="" loading="lazy"><button type="button" class="vplay" data-vplay="' + o.id + '" aria-label="Phát video: ' + esc(v.t) + '"><i></i></button>';
    var th = o.vids.map(function (x, k) { return '<button type="button" class="vt' + (k === i ? ' on' : '') + '" data-vsel="' + o.id + '|' + k + '" aria-label="Chọn video ' + (k + 1) + ': ' + esc(x.t) + '"><img src="' + thumb(x.id) + '" alt="" loading="lazy"></button>'; }).join('');
    return '<div class="vid" data-vid="' + o.id + '"><div class="vmain">' + main + '</div><div class="vthumbs">' + th + '</div></div>';
  }

  /* ---------- hiển thị: gói ---------- */
  function priceHTML(o) {
    return '<div class="price">' + (o.from ? '<small>Từ </small>' : '') + '<b>' + money(o.price) + '</b><span>' + esc(UNIT[o.unit] || '') + '</span></div>';
  }
  function actHTML(l, o) {
    var s = state.sel[l.n];
    if (s && s.pkg === o.id) return '<span class="incart">✓ Đã trong giỏ hàng</span><button type="button" class="btn ghost" data-pick="' + o.id + '">Bỏ khỏi giỏ</button>';
    return '<button type="button" class="btn" data-pick="' + o.id + '">' + (s ? 'Đổi sang gói này' : 'Thêm vào giỏ hàng') + '</button>';
  }
  function detHTML(o) {
    var h = '<h5>Nội dung chi tiết</h5>' + ul(o.inc);
    if (o.out) h += '<h5>Bàn giao</h5><p>' + esc(o.out) + '</p>';
    if (o.cp && o.cp.length) h += '<h5>Cần bạn chuẩn bị</h5>' + ul(o.cp);
    if (o.ex && o.ex.length) h += '<h5>Chưa bao gồm</h5>' + ul(o.ex);
    return h;
  }
  function pkgHTML(l, o) {
    var s = state.sel[l.n], on = s && s.pkg === o.id;
    var tag = o.promo ? ['promo', 'Ưu đãi tháng 11'] : o.kind === 'base' ? ['base', 'Khởi điểm'] : o.kind === 'upgrade' ? ['', 'Nâng cấp gói'] : ['', 'Gói khác'];
    var h = '<article class="pk' + (on ? ' in' : '') + '" data-pk="' + o.id + '"><span class="tag ' + tag[0] + '">' + tag[1] + '</span><h3>' + esc(o.name) + '</h3><p class="sum">' + esc(o.sum) + '</p>';
    if (o.vids.length) h += videoHTML(o);
    h += priceHTML(o) + '<h4>Bạn nhận được</h4><ul class="gets">' + o.gets.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul>';
    if (o.delta.length && !/^Gói nhỏ nhất/.test(o.delta[0])) h += '<div class="up"><b>So với gói nhỏ hơn, bạn được thêm</b>' + ul(o.delta.slice(0, 4)) + '</div>';
    h += '<button type="button" class="lnk" data-det="' + o.id + '" aria-expanded="false">Xem chi tiết và lưu ý</button><div class="det" hidden>' + detHTML(o) + '</div>';
    return h + '<div class="pkact">' + actHTML(l, o) + '</div></article>';
  }

  /* ---------- hiển thị: dịch vụ thêm ---------- */
  function topPrice(t) { return t.pct != null ? '+' + Math.round(t.pct * 100) + '% giá gói' : (t.price != null ? '+' + money(t.price) + '/' + t.unit : t.info); }
  function extrasHTML(l) {
    if (!l.tops.length && !l.ext.length) return '';
    var s = state.sel[l.n], h = '';
    if (l.tops.length) {
      h += '<div class="extras' + (s ? '' : ' off') + '"><h3>Dịch vụ thêm <small style="font-weight:400;color:var(--muted)">(không bắt buộc)</small></h3>';
      h += '<p class="hint">' + (s ? 'Chọn thêm những gì bạn cần cho gói đã chọn.' : 'Thêm một gói ở trên vào giỏ hàng trước, sau đó bạn chọn được dịch vụ thêm (một số mục tính theo % giá gói).') + '</p><div class="xo-list">';
      l.tops.forEach(function (t) {
        var q = s && s.tops[t.id] ? s.tops[t.id] : 0, on = q > 0;
        h += '<div class="xo' + (on ? ' on' : '') + '"><input type="checkbox" data-top="' + t.id + '" id="t_' + t.id + '"' + (on ? ' checked' : '') + (s ? '' : ' disabled') + '>' +
          '<label for="t_' + t.id + '"><b>' + esc(t.name) + '</b>' + (t.fit ? '<small>' + esc(t.fit) + '</small>' : '') +
          (on && !t.one && t.price != null ? '<span class="qty"><button type="button" data-dec="' + t.id + '" aria-label="Bớt">−</button><input inputmode="numeric" data-q="' + t.id + '" value="' + q + '" aria-label="Số lượng"><button type="button" data-inc="' + t.id + '" aria-label="Thêm">+</button></span>' : '') +
          '</label><span class="p">' + esc(topPrice(t)) + '</span></div>';
      });
      h += '</div></div>';
    }
    if (l.ext.length) h += '<p class="note"><b>' + esc(l.ext.join('; ')) + '</b>: tính theo thực tế, bạn duyệt dự toán trước khi chi; không cộng vào giá tạm tính.</p>';
    return h;
  }
  function renderExtras() { var e = $('#extras'); if (e) e.innerHTML = extrasHTML(LINE[state.tab]); }

  /* ---------- hiển thị: nội dung một tab ---------- */
  function renderPanel() {
    var l = LINE[state.tab];
    var h = '<div class="lh"><div class="ico">' + svg(l.n) + '</div><div><h2>' + esc(l.name) + '</h2><p class="lead">' + esc(l.lead) + '</p></div></div>';
    h += '<ul class="bens">' + l.bens.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>';
    h += '<p class="when"><b>Phù hợp khi:</b> ' + l.when.map(esc).join(' · ') + '</p>';
    if (l.opts.some(function (o) { return o.vids.length; })) h += '<div class="vbanner"><span aria-hidden="true">ℹ️</span><span>Các video bên dưới là <b>video tham khảo mức chất lượng, không phải sản phẩm cuối cùng</b>.</span></div>';
    if (!l.opts.length) {
      h += '<div class="info-box"><p class="contact"><b>Liên hệ để nhận báo giá:</b> ' + l.contacts.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</p>';
      (l.info || []).forEach(function (i) { h += '<p class="note">' + esc(i) + '</p>'; });
      h += '<p class="note">Nhóm này chưa có giá niêm yết nên không cộng vào giỏ hàng. Nhân viên Đất Cảng sẽ báo giá sau khi trao đổi nhu cầu với bạn.</p></div>';
    } else {
      h += '<div class="pkgs" id="pkgs">' + l.opts.map(function (o) { return pkgHTML(l, o); }).join('') + '</div>';
      h += '<div id="extras">' + extrasHTML(l) + '</div>';
    }
    $('#panel').innerHTML = h;
  }
  function refreshPkgs() {
    var l = LINE[state.tab], s = state.sel[l.n];
    l.opts.forEach(function (o) {
      var c = $('[data-pk="' + o.id + '"]'); if (!c) return;
      c.classList.toggle('in', !!(s && s.pkg === o.id));
      $('.pkact', c).innerHTML = actHTML(l, o);
    });
  }

  /* ---------- hiển thị: giỏ hàng ---------- */
  function renderCart() {
    var t = totals(), h = '<h3>Giỏ hàng của bạn</h3>';
    if (!t.items.length) h += '<p class="sum-empty">Chưa có dịch vụ nào. Chọn một nhóm dịch vụ, xem bạn nhận được gì, rồi bấm "Thêm vào giỏ hàng".</p>';
    t.items.forEach(function (c) {
      h += '<div class="sl"><div class="h"><span>' + esc(c.line.name) + '</span><span>' + money(c.sum) + (c.monthly ? '/tháng' : '') + '</span></div>';
      c.rows.forEach(function (r) { h += '<div class="r"><span>' + esc(r.name) + '</span><span>' + (r.from ? 'từ ' : '') + money(r.amt) + '</span></div>'; });
      c.info.forEach(function (i) { h += '<div class="r"><span>' + esc(i) + '</span><span>tính riêng</span></div>'; });
      h += '<button type="button" class="rm" data-remove="' + c.line.n + '">Bỏ khỏi giỏ</button> <button type="button" class="rm" data-goto="' + c.line.n + '">Xem lại</button></div>';
    });
    if (t.items.length) {
      h += '<div class="tot"><div><span>Cộng (chưa VAT)</span><b>' + (t.from ? 'từ ' : '') + money(t.sub) + '</b></div><div><span>VAT ' + Math.round(D.vat * 100) + '%</span><span>' + money(t.vat) + '</span></div>' +
        '<div class="big"><span>Tổng (có VAT)</span><span>' + (t.from ? 'từ ' : '') + money(t.total) + '</span></div></div>';
      if (t.items.some(function (c) { return !c.monthly; })) h += '<p class="sep">Dự án: thanh toán 50% khi ký hợp đồng, 50% khi nghiệm thu.</p>';
      if (t.items.some(function (c) { return c.monthly; })) h += '<p class="sep">Gói hằng tháng tính cho 1 tháng, thanh toán theo tháng.</p>';
      h += '<p class="sep">Đây là giá tạm tính theo giá niêm yết, chưa phải báo giá chính thức. Chi phí bên thứ ba tính riêng.</p>';
      h += '<input class="name" id="cname" placeholder="Tên của bạn hoặc doanh nghiệp (không bắt buộc)" value="' + esc(state.name) + '" maxlength="80">';
      h += '<div class="acts">';
      if (CFG.zalo) h += '<button type="button" class="btn" id="sendZalo">Gửi qua Zalo</button>';
      if (CFG.email) h += '<button type="button" class="btn" id="sendMail">Gửi email</button>';
      h += '<button type="button" class="btn' + (CFG.zalo || CFG.email ? ' ghost' : '') + '" id="copy">Sao chép nội dung</button><button type="button" class="btn ghost" id="copyLink">Sao chép link giỏ hàng</button><button type="button" class="btn ghost" id="print">In / lưu PDF</button><button type="button" class="btn ghost" id="clear">Xóa hết</button></div><div class="toast" id="toast" role="status"></div>';
    }
    $('#cartBody').innerHTML = h;
    $('#cartCount').textContent = t.items.length;
    $('#barCount').textContent = t.items.length ? '(' + t.items.length + ')' : '';
    $('#barTotal').textContent = t.items.length ? (t.from ? 'từ ' : '') + money(t.total) : '0đ';
  }
  function afterCartChange() { renderTabs(); refreshPkgs(); renderExtras(); renderCart(); syncHash(); }

  /* ---------- văn bản sao chép, gửi và in ---------- */
  function textSummary() {
    var t = totals(), L = ['ĐẤT CẢNG AGENCY — Giỏ hàng tạm tính (bảng giá ' + D.version + ', ' + D.date + ')'];
    if (state.name) L.push('Khách: ' + state.name);
    t.items.forEach(function (c) {
      L.push(''); L.push('• ' + c.line.name + ': ' + money(c.sum) + (c.monthly ? '/tháng' : ''));
      c.rows.forEach(function (r) { L.push('   - ' + r.name + ': ' + (r.from ? 'từ ' : '') + money(r.amt)); });
      c.info.forEach(function (i) { L.push('   - ' + i + ' (tính riêng)'); });
    });
    L.push(''); L.push('Cộng (chưa VAT): ' + (t.from ? 'từ ' : '') + money(t.sub)); L.push('VAT ' + Math.round(D.vat * 100) + '%: ' + money(t.vat)); L.push('Tổng (có VAT): ' + (t.from ? 'từ ' : '') + money(t.total));
    L.push('Giá tạm tính, chưa phải báo giá chính thức. Chi phí bên thứ ba tính theo thực tế.');
    L.push('Xem lại giỏ hàng: ' + shareUrl());
    return L.join('\n');
  }
  function doPrint() {
    var t = totals(), h = '<h2>Đất Cảng Agency — Giỏ hàng tạm tính</h2><p>Bảng giá ' + esc(D.version) + ' · ' + esc(D.date) + (state.name ? ' · Khách: ' + esc(state.name) : '') + '</p><table><tr><th>Dịch vụ / hạng mục</th><th class="num">Thành tiền (chưa VAT)</th></tr>';
    t.items.forEach(function (c) {
      c.rows.forEach(function (r, i) { h += '<tr><td>' + (i === 0 ? '<b>' + esc(c.line.name) + '</b>: ' : '&nbsp;&nbsp;+ ') + esc(r.name) + '</td><td class="num">' + (r.from ? 'từ ' : '') + money(r.amt) + '</td></tr>'; });
      c.info.forEach(function (x) { h += '<tr><td>&nbsp;&nbsp;+ ' + esc(x) + '</td><td class="num">tính riêng</td></tr>'; });
    });
    h += '<tr><td>Cộng (chưa VAT)</td><td class="num">' + money(t.sub) + '</td></tr><tr><td>VAT</td><td class="num">' + money(t.vat) + '</td></tr><tr><td><b>Tổng (có VAT)</b></td><td class="num"><b>' + money(t.total) + '</b></td></tr></table>';
    h += '<p>Giá tạm tính theo giá niêm yết, chưa phải báo giá chính thức. Chi phí bên thứ ba tính theo thực tế. ' + (CFG.contact && CFG.contact.length ? esc(CFG.contact.join(' · ')) : 'Liên hệ nhân viên kinh doanh của Đất Cảng.') + '</p>';
    $('#printArea').innerHTML = h; window.print();
  }
  function toast(m) { var e = $('#toast'); if (e) { e.textContent = m; setTimeout(function () { if (e) e.textContent = ''; }, 3000); } }
  function copyText(txt, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast(okMsg); }, function () { window.prompt('Sao chép nội dung dưới đây:', txt); });
    else window.prompt('Sao chép nội dung dưới đây:', txt);
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-tab],[data-pick],[data-det],[data-vplay],[data-vsel],[data-remove],[data-goto],[data-inc],[data-dec],#copy,#copyLink,#print,#clear,#sendZalo,#sendMail,#cartBar,#cartBtn,#tabMenuBtn');
    if (!el) return;
    var d = el.dataset;
    if (d.tab) { state.tab = +d.tab; state.menu = false; renderTabs(); renderPanel(); var tb = $('.tabs'); if (window.scrollY > tb.offsetTop) window.scrollTo({ top: tb.offsetTop - 60, behavior: 'smooth' }); return; }
    if (el.id === 'tabMenuBtn') { state.menu = !state.menu; renderTabs(); return; }
    if (d.goto) { state.tab = +d.goto; state.menu = false; renderTabs(); renderPanel(); $('#cart').classList.remove('open'); $('#cartBar').setAttribute('aria-expanded', 'false'); $('.tabs').scrollIntoView({ behavior: 'smooth' }); return; }
    if (d.pick) { var o = PKG[d.pick], n = o._line, s = state.sel[n]; if (s && s.pkg === o.id) delete state.sel[n]; else if (s) s.pkg = o.id; else state.sel[n] = { pkg: o.id, tops: {} }; afterCartChange(); return; }
    if (d.det) { var box = el.nextElementSibling, open = box.hidden; box.hidden = !open; el.setAttribute('aria-expanded', String(open)); el.textContent = open ? 'Ẩn chi tiết' : 'Xem chi tiết và lưu ý'; return; }
    if (d.vplay) { state.vplay[d.vplay] = true; var c = $('[data-pk="' + d.vplay + '"] .vid'); if (c) c.outerHTML = videoHTML(PKG[d.vplay]); return; }
    if (d.vsel) { var z = d.vsel.split('|'); state.vsel[z[0]] = +z[1]; state.vplay[z[0]] = false; var c2 = $('[data-pk="' + z[0] + '"] .vid'); if (c2) c2.outerHTML = videoHTML(PKG[z[0]]); return; }
    if (d.remove) { delete state.sel[+d.remove]; afterCartChange(); return; }
    if (d.inc || d.dec) { var id = d.inc || d.dec, ss = state.sel[state.tab], tp = TOP[id]; ss.tops[id] = clamp((ss.tops[id] || 0) + (d.inc ? 1 : -1), tp.min, tp.max); afterCartChange(); return; }
    if (el.id === 'copy') { copyText(textSummary(), 'Đã sao chép. Dán vào Zalo hoặc email để gửi.'); return; }
    if (el.id === 'copyLink') { copyText(shareUrl(), 'Đã sao chép link. Gửi link này, người nhận sẽ thấy đúng giỏ hàng của bạn.'); return; }
    if (el.id === 'sendZalo') { copyText(textSummary(), 'Đã sao chép nội dung. Dán vào cuộc trò chuyện Zalo vừa mở.'); window.open('https://zalo.me/' + encodeURIComponent(String(CFG.zalo).replace(/\D/g, '')), '_blank', 'noopener'); return; }
    if (el.id === 'sendMail') { location.href = 'mailto:' + encodeURIComponent(CFG.email) + '?subject=' + encodeURIComponent('Giỏ hàng tạm tính từ bảng giá Đất Cảng') + '&body=' + encodeURIComponent(textSummary().slice(0, 1800)); return; }
    if (el.id === 'print') { doPrint(); return; }
    if (el.id === 'clear') { state.sel = {}; afterCartChange(); return; }
    if (el.id === 'cartBar' || el.id === 'cartBtn') { var sm = $('#cart'); sm.classList.toggle('open'); $('#cartBar').setAttribute('aria-expanded', sm.classList.contains('open')); if (el.id === 'cartBtn' && window.innerWidth > 900) sm.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target, l = LINE[state.tab], s = state.sel[l.n];
    if (el.dataset.top && s) {
      var t = TOP[el.dataset.top], tops = s.tops;
      if (el.checked) { if (t.grp) l.tops.forEach(function (o) { if (o.grp === t.grp) delete tops[o.id]; }); tops[t.id] = t.min; } else delete tops[t.id];
      afterCartChange(); return;
    }
    if (el.dataset.q && s) { var tp = TOP[el.dataset.q]; s.tops[tp.id] = clamp(el.value, tp.min, tp.max); afterCartChange(); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'cname') state.name = e.target.value.slice(0, 80); });
  document.addEventListener('click', function (e) { if (state.menu && !e.composedPath().some(function (n) { return n.id === 'tabMenu'; })) { state.menu = false; renderTabs(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.menu) { state.menu = false; renderTabs(); var b = $('#tabMenuBtn'); if (b) b.focus(); } });
  document.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') e.target.classList.add('fail'); }, true);

  /* ---------- khởi tạo ---------- */
  $('#cond').innerHTML = D.cond.map(function (c) { return '<dt>' + esc(c.k) + '</dt><dd>' + esc(c.v) + '</dd>'; }).join('');
  $('#feesBox').innerHTML = '<h2 class="h2">Phí phát sinh (nếu có)</h2><div class="fees">' + D.fees.map(function (f) { return '<p><b>' + esc(f.name) + ':</b> ' + esc(f.how) + '</p>'; }).join('') + '</div>';
  $('#foot').innerHTML = '<p><b>' + esc(CFG.brandName || 'Đất Cảng Agency') + '</b> · Giải pháp marketing</p>' + (CFG.contact && CFG.contact.length ? CFG.contact.map(function (c) { return '<p>' + esc(c) + '</p>'; }).join('') : '<p>Liên hệ nhân viên kinh doanh của Đất Cảng để nhận báo giá chính thức.</p>') + '<p>Bảng giá ' + esc(D.version) + ' · ' + esc(D.date) + '. Giá chưa VAT. Giá tạm tính trên trang này chưa phải báo giá chính thức.</p>';
  var m = /[#&]g=([^&]*)/.exec(location.hash);
  if (m) {
    try { state.sel = decodeCart(decodeURIComponent(m[1])); } catch (err) { state.sel = {}; }
    var first = D.lines.filter(function (l) { return state.sel[l.n]; })[0];
    if (first) { state.tab = first.n; var sh = $('#shared'); sh.hidden = false; sh.textContent = 'Giỏ hàng này đã được chọn sẵn cho bạn. Bạn có thể xem lại từng gói và điều chỉnh. Đây là giá tạm tính, chưa phải báo giá chính thức.'; }
  }
  renderTabs(); renderPanel(); renderCart();
})();

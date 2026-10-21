(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2400); }

  /* ---------- manzillar ---------- */
  var phone = S.phone || "+998881919090", tgUser = S.telegram || "Luxmebel01", SITE_URL = "https://luxmebel.uz/";
  function tg(text) { return "https://t.me/" + tgUser + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function money(n, cur) { return Number(n).toLocaleString("ru-RU").replace(/,/g, " ") + " " + (cur || S.currency || "y.e."); }
  function thumb(src) { return src.replace(/^images\//, "images/t/").replace(/\.(jpe?g|png)$/i, ".webp"); }
  function imgEl(src, alt, opts) {
    opts = opts || {};
    var i = new Image(); i.alt = alt || ""; i.decoding = "async";
    if (!opts.eager) i.loading = "lazy";
    i.onerror = function () { if (!i.dataset.fb) { i.dataset.fb = 1; i.src = src; } };
    i.src = opts.full ? src : thumb(src);
    return i;
  }

  /* ---------- sozlamalar ---------- */
  $("hdrPhone").href = "tel:" + phone; $("hdrPhoneTxt").textContent = S.phoneShow || phone;
  $("hdrPhone").setAttribute("aria-label", "Qo'ng'iroq qilish: " + (S.phoneShow || phone));
  $("ftPhone").href = "tel:" + phone; $("ftPhone").textContent = S.phoneShow || phone; $("ftCall").href = "tel:" + phone;
  $("barPhone").href = "tel:" + phone;
  ["heroTg", "ftTg", "barTg"].forEach(function (id) { $(id).href = tg("Salom! Lux mebel saytidan yozyapman."); });
  $("hours").textContent = (S.address ? S.address + " · " : "") + (S.hours || "");
  if (S.since) $("since").textContent = S.since;
  if (S.mapUrl) { $("mapLink").href = S.mapUrl; $("mapLink").hidden = false; }
  $("year").textContent = new Date().getFullYear();

  /* ---------- sarlavha va pastki panel ---------- */
  var top = $("top"), bar = $("bar"), heroEl = document.querySelector(".hero");
  function onScroll() {
    top.classList.toggle("stuck", scrollY > 8);
    var past = heroEl ? heroEl.getBoundingClientRect().bottom < 0 : scrollY > 500;
    bar.classList.toggle("on", past);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- hero slayder ---------- */
  (function () {
    var list = (S.heroImages || []).slice(0, 5), box = $("slides"), dots = $("slideDots"), cur = 0, timer;
    if (list.length < 2) { dots.hidden = true; return; }
    var imgs = [box.querySelector("img")];
    imgs[0].dataset.src = list[0];
    for (var i = 1; i < list.length; i++) {
      var im = new Image(); im.alt = "Lux mebel mebellari"; im.decoding = "async"; im.loading = "lazy"; im.src = list[i]; im.width = 1280; im.height = 1280; box.appendChild(im); imgs.push(im);
    }
    list.forEach(function (_, k) { var b = el("button"); b.type = "button"; b.setAttribute("aria-label", (k + 1) + "-rasm"); b.onclick = function () { go(k); restart(); }; dots.appendChild(b); });
    function go(k) { cur = k; imgs.forEach(function (m, j) { m.classList.toggle("on", j === k); }); [].forEach.call(dots.children, function (d, j) { d.classList.toggle("on", j === k); }); }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go((cur + 1) % imgs.length); }, 5200); }
    go(0); restart();
    box.addEventListener("pointerenter", function () { clearInterval(timer); });
    box.addEventListener("pointerleave", restart);
  })();

  /* ---------- mahsulotlarni tozalash ---------- */
  function cleanName(raw) {
    var s = String(raw || "");
    var m = s.match(/Model\s*:\s*([^\n\r]+?)(?:\s{2,}|\s*(?:Матрас|Цена|Narx)|$)/i);
    if (m) s = m[1];
    s = s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F} ]/gu, " ").replace(/\s+/g, " ").trim();
    s = s.replace(/^Kamod\b/i, "Komod");
    if (s.length > 48) s = s.slice(0, 48).replace(/\s\S*$/, "") + "…";
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Mebel";
  }
  var ROOM_CAT = { "Yotoqxona": "Spalnya", "Oshxona": "Oshxona garnituri", "Bolalar xonasi": "Bolalar to'plami", "Mehmonxona": "Mehmonxona mebeli" };
  function normalize(o, i) {
    var cat = String(o.category || "").trim();
    if (/[а-яё]/i.test(cat)) cat = ROOM_CAT[o.room] || "Mebel";
    return {
      id: String(o.id || i + 1), name: cleanName(o.name), category: cat, room: String(o.room || "").trim(),
      price: Number(o.price) || 0, oldPrice: Number(o.oldPrice) || 0, isNew: !!o.isNew, currency: o.currency || "",
      images: (o.images && o.images.length ? o.images : []).slice(), desc: o.desc ? String(o.desc) : "", idx: i
    };
  }
  var ALL = [], BYID = {};

  /* ---------- saqlanganlar ---------- */
  var likes = [];
  try { likes = JSON.parse(safeGet("lux_likes") || "[]"); } catch (e) { likes = []; }
  if (!Array.isArray(likes)) likes = [];
  function isLiked(id) { return likes.indexOf(id) > -1; }
  function saveLikes() { safeSet("lux_likes", JSON.stringify(likes)); var c = $("likesCount"); c.textContent = likes.length; c.hidden = !likes.length; }
  function toggleLike(id) {
    var k = likes.indexOf(id); if (k > -1) likes.splice(k, 1); else likes.push(id);
    saveLikes();
    [].forEach.call(document.querySelectorAll('.heart[data-id="' + id + '"]'), function (h) { h.setAttribute("aria-pressed", isLiked(id)); });
    if ($("mLike").dataset.id === id) $("mLike").textContent = isLiked(id) ? "Saqlangan ✓" : "Saqlash";
    if (!$("drawer").hidden) renderDrawer();
    if ($("onlyLiked").getAttribute("aria-pressed") === "true") render(true);
    toast(isLiked(id) ? "Saqlandi" : "Olib tashlandi");
  }
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 5 6.2 5c1.9 0 3.4 1 4.3 2.4h3C14.4 6 15.9 5 17.8 5 21 5 23.1 8.3 21.6 11.8 19.5 16.4 12 21 12 21z" stroke-linejoin="round"/></svg>';
  var PHONE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>';
  function msgFor(p) { return "Salom! Shu mahsulot qiziqtirdi: " + p.name + (p.price ? " (" + money(p.price, p.currency) + ")" : "") + "\n" + SITE_URL + "#m=" + p.id; }

  /* ---------- kartochka ---------- */
  function priceNode(p, cls) {
    var d = el("div", cls || "pr");
    if (p.price) { d.appendChild(document.createTextNode(money(p.price, p.currency))); if (p.oldPrice > p.price) d.appendChild(el("span", "old", money(p.oldPrice, p.currency))); }
    else d.appendChild(el("span", "ask", "Narxini so'rang"));
    return d;
  }
  function card(p, eager, opts_desc) {
    var c = el("article", "card"), pic = el("div", "pic");
    var rail = el("div", "rail");
    var imgs = p.images.length ? p.images : [];
    imgs.forEach(function (src, k) {
      var im = imgEl(src, p.name + (imgs.length > 1 ? " — " + (k + 1) + "-rasm" : ""), { eager: eager && k === 0 });
      im.onclick = function () { openModal(p.id); };
      rail.appendChild(im);
    });
    pic.appendChild(rail);
    if (p.oldPrice > p.price && p.price > 0) pic.appendChild(el("span", "badge sale", "−" + Math.round((1 - p.price / p.oldPrice) * 100) + "%"));
    else if (p.isNew) pic.appendChild(el("span", "badge", "Yangi"));
    var h = el("button", "heart"); h.type = "button"; h.dataset.id = p.id; h.innerHTML = HEART;
    h.setAttribute("aria-label", "Saqlash: " + p.name); h.setAttribute("aria-pressed", isLiked(p.id));
    h.onclick = function () { toggleLike(p.id); }; pic.appendChild(h);
    if (imgs.length > 1) {
      var cn = el("span", "cnt2", "1/" + imgs.length); pic.appendChild(cn);
      var raf; rail.addEventListener("scroll", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { cn.textContent = (Math.round(rail.scrollLeft / rail.clientWidth) + 1) + "/" + imgs.length; }); }, { passive: true });
    }
    c.appendChild(pic);
    var b = el("div", "body");
    b.appendChild(el("div", "cat-l", p.category));
    var nm = el("button", "nm", p.name); nm.type = "button"; nm.onclick = function () { openModal(p.id); }; b.appendChild(nm);
    b.appendChild(priceNode(p));
    if (p.desc && opts_desc) b.appendChild(el("p", "desc", p.desc));
    var a = el("div", "acts");
    var t = el("a", "btn btn-pri"); t.innerHTML = '<span class="long">Telegramda so\'rash</span><span class="short">So\'rash</span>'; t.href = tg(msgFor(p)); t.target = "_blank"; t.rel = "noopener";
    var tel = el("a", "btn btn-out tel"); tel.href = "tel:" + phone; tel.innerHTML = PHONE_SVG; tel.setAttribute("aria-label", "Qo'ng'iroq qilish");
    a.appendChild(t); a.appendChild(tel); b.appendChild(a); c.appendChild(b);
    return c;
  }

  /* ---------- filtr va katalog ---------- */
  var F = { room: "", cat: "", q: "", sort: "", liked: false }, PAGE = S.pageSize || 24, shown = PAGE, CUR = [];
  function matches(p, skipCat) {
    if (F.room && p.room !== F.room) return false;
    if (!skipCat && F.cat && p.category !== F.cat) return false;
    if (F.liked && !isLiked(p.id)) return false;
    if (F.q) { var s = (p.name + " " + p.category + " " + p.room).toLowerCase(); if (s.indexOf(F.q) < 0) return false; }
    return true;
  }
  function buildTabs() {
    var box = $("roomTabs"); box.innerHTML = "";
    var rooms = []; ALL.forEach(function (p) { if (p.room && rooms.indexOf(p.room) < 0) rooms.push(p.room); });
    rooms.sort(function (a, b) { return ALL.filter(function (p) { return p.room === b; }).length - ALL.filter(function (p) { return p.room === a; }).length; });
    function mk(label, val, n) {
      var b = el("button", "tab" + (F.room === val ? " on" : ""), label); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", F.room === val);
      b.appendChild(el("small", "", String(n))); b.onclick = function () { setRoom(val); }; box.appendChild(b);
    }
    mk("Hammasi", "", ALL.length); rooms.forEach(function (r) { mk(r, r, ALL.filter(function (p) { return p.room === r; }).length); });
  }
  function buildCats() {
    var sel = $("cat"), cats = {}; ALL.forEach(function (p) { if (matches(p, true) && p.category) cats[p.category] = (cats[p.category] || 0) + 1; });
    sel.innerHTML = ""; var o = el("option", "", "Barcha turlar"); o.value = ""; sel.appendChild(o);
    Object.keys(cats).sort().forEach(function (k) { var x = el("option", "", k + " (" + cats[k] + ")"); x.value = k; sel.appendChild(x); });
    if (F.cat && !cats[F.cat]) F.cat = ""; sel.value = F.cat;
  }
  function setRoom(r) { F.room = r; F.cat = ""; shown = PAGE; buildTabs(); buildCats(); render(true); }
  function sorted(list) {
    var l = list.slice();
    if (F.sort === "asc") l.sort(function (a, b) { return (a.price || 9e9) - (b.price || 9e9); });
    else if (F.sort === "desc") l.sort(function (a, b) { return b.price - a.price; });
    else if (F.sort === "new") l.sort(function (a, b) { return (b.isNew - a.isNew) || (b.idx - a.idx); });
    return l;
  }
  var revObs = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" }) : null;
  function reveal(n) { if (reduce || !revObs) return; n.classList.add("rv"); revObs.observe(n); }
  function render(reset) {
    CUR = sorted(ALL.filter(function (p) { return matches(p); }));
    var grid = $("grid"); if (reset) { grid.innerHTML = ""; shown = Math.max(shown, PAGE); }
    var from = reset ? 0 : grid.children.length, to = Math.min(CUR.length, shown);
    for (var i = from; i < to; i++) { var c = card(CUR[i], i < 4); grid.appendChild(c); }
    $("more").hidden = to >= CUR.length; $("empty").hidden = CUR.length > 0;
    $("total").textContent = CUR.length + " ta mahsulot";
  }
  $("more").onclick = function () { shown += PAGE; render(false); };
  $("q").oninput = function () { F.q = this.value.trim().toLowerCase(); shown = PAGE; clearTimeout(render._t); render._t = setTimeout(function () { render(true); }, 160); };
  $("cat").onchange = function () { F.cat = this.value; shown = PAGE; render(true); };
  $("sort").onchange = function () { F.sort = this.value; shown = PAGE; render(true); };
  $("onlyLiked").onclick = function () { F.liked = !F.liked; this.setAttribute("aria-pressed", F.liked); shown = PAGE; render(true); };

  /* ---------- xonalar, yangilar ---------- */
  function buildRooms() {
    var box = $("rooms"); box.innerHTML = "";
    (S.rooms || []).forEach(function (r) {
      var n = ALL.filter(function (p) { return p.room === r.name; }).length; if (!n) return;
      var a = el("button", "room"); a.type = "button"; a.setAttribute("aria-label", r.name + ": " + n + " ta model");
      a.appendChild(imgEl(r.image, "")); var t = el("div", "tx"); t.appendChild(el("b", "", r.name)); t.appendChild(el("span", "", n + " ta model")); a.appendChild(t);
      a.onclick = function () { setRoom(r.name); $("katalog").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };
      box.appendChild(a); reveal(a);
    });
  }
  function buildNew() {
    var fresh = ALL.filter(function (p) { return p.isNew; }).sort(function (a, b) { return b.idx - a.idx; }).slice(0, 4);
    if (!fresh.length) return;
    var g = $("newGrid"); g.innerHTML = ""; g.className = "newgrid" + (fresh.length === 1 ? " one" : "");
    fresh.forEach(function (p) { g.appendChild(card(p, false, true)); }); $("yangi").hidden = false;
  }

  /* ---------- modal ---------- */
  var modalP = null, mi = 0, lastFocus = null;
  function lockBody(on) { document.documentElement.style.overflow = on ? "hidden" : ""; }
  function showM(k) {
    var p = modalP; if (!p || !p.images.length) return; mi = (k + p.images.length) % p.images.length;
    var im = $("mImg"); im.src = p.images[mi]; im.alt = p.name + " — " + (mi + 1) + "-rasm";
    $("mCount").textContent = (mi + 1) + " / " + p.images.length; $("mCount").hidden = p.images.length < 2;
    [].forEach.call($("mThumbs").children, function (b, j) { b.classList.toggle("on", j === mi); });
    $("mPrev").hidden = $("mNext").hidden = p.images.length < 2;
  }
  function openModal(id, keepHash) {
    var p = BYID[id]; if (!p) return; modalP = p; lastFocus = document.activeElement;
    $("mCat").textContent = p.category; $("mName").textContent = p.name;
    var pr = $("mPrice"); pr.innerHTML = ""; if (p.price) { pr.appendChild(document.createTextNode(money(p.price, p.currency))); if (p.oldPrice > p.price) pr.appendChild(el("span", "old", money(p.oldPrice, p.currency))); } else pr.textContent = "Narxini so'rang";
    $("mDesc").textContent = p.desc; $("mDesc").hidden = !p.desc;
    $("mTg").href = tg(msgFor(p)); $("mTg").target = "_blank"; $("mTg").rel = "noopener"; $("mTel").href = "tel:" + phone;
    $("mLike").dataset.id = p.id; $("mLike").textContent = isLiked(p.id) ? "Saqlangan ✓" : "Saqlash";
    var th = $("mThumbs"); th.innerHTML = ""; th.hidden = p.images.length < 2;
    p.images.forEach(function (src, k) { var b = el("button"); b.type = "button"; b.setAttribute("aria-label", (k + 1) + "-rasm"); b.appendChild(imgEl(src, "")); b.onclick = function () { showM(k); }; th.appendChild(b); });
    showM(0); $("modal").hidden = false; lockBody(true);
    if (!keepHash) { try { history.replaceState(null, "", "#m=" + p.id); } catch (e) { } }
    document.title = p.name + " — Lux mebel";
    $("modal").querySelector(".m-close").focus();
  }
  function closeModal() {
    if ($("modal").hidden) return; $("modal").hidden = true; lockBody(false); modalP = null;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { }
    document.title = "Lux mebel — Toshkentda spalnya, mehmonxona va oshxona mebellari";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("mPrev").onclick = function () { showM(mi - 1); }; $("mNext").onclick = function () { showM(mi + 1); };
  $("mImg").onclick = function () { if (modalP) openViewer(modalP.images, mi, true); };
  $("mLike").onclick = function () { if (modalP) toggleLike(modalP.id); };
  $("mShare").onclick = function () {
    if (!modalP) return; var url = SITE_URL + "#m=" + modalP.id;
    if (navigator.share) navigator.share({ title: modalP.name + " — Lux mebel", url: url }).catch(function () { });
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("Havola nusxalandi"); }, function () { toast(url); });
    else toast(url);
  };
  [].forEach.call($("modal").querySelectorAll("[data-close]"), function (b) { b.onclick = closeModal; });

  /* ---------- rasm ko'rgich (kattalashtirish) ---------- */
  var vList = [], vi = 0, vFull = false;
  function showV() { var im = $("vImg"); im.src = vList[vi]; $("vCount").textContent = vList.length > 1 ? (vi + 1) + " / " + vList.length : ""; $("vPrev").hidden = $("vNext").hidden = vList.length < 2; }
  function openViewer(list, i, full) { vList = list; vi = i; vFull = !!full; $("viewer").hidden = false; lockBody(true); showV(); $("viewer").querySelector(".v-close").focus(); }
  function closeViewer() { if ($("viewer").hidden) return; $("viewer").hidden = true; if ($("modal").hidden) lockBody(false); }
  $("vPrev").onclick = function (e) { e.stopPropagation(); vi = (vi - 1 + vList.length) % vList.length; showV(); };
  $("vNext").onclick = function (e) { e.stopPropagation(); vi = (vi + 1) % vList.length; showV(); };
  $("viewer").onclick = function (e) { if (e.target === this || e.target.hasAttribute("data-vclose")) closeViewer(); };
  var tx0 = null;
  $("viewer").addEventListener("touchstart", function (e) { tx0 = e.touches[0].clientX; }, { passive: true });
  $("viewer").addEventListener("touchend", function (e) { if (tx0 == null) return; var dx = e.changedTouches[0].clientX - tx0; tx0 = null; if (Math.abs(dx) > 50 && vList.length > 1) { vi = (vi + (dx < 0 ? 1 : -1) + vList.length) % vList.length; showV(); } });

  /* ---------- saqlanganlar paneli ---------- */
  function renderDrawer() {
    var box = $("drList"); box.innerHTML = ""; var items = likes.map(function (id) { return BYID[id]; }).filter(Boolean);
    if (!items.length) { box.appendChild(el("p", "drawer-empty", "Hali hech narsa saqlanmagan. Mahsulotdagi yurak belgisini bosing.")); $("drSend").hidden = true; $("drClear").hidden = true; return; }
    $("drSend").hidden = false; $("drClear").hidden = false;
    items.forEach(function (p) {
      var r = el("div", "li"); r.appendChild(imgEl(p.images[0] || "", p.name));
      var m = el("div"); var b = el("b", "", p.name); m.appendChild(b); m.appendChild(el("small", "", p.price ? money(p.price, p.currency) : "Narxini so'rang")); r.appendChild(m);
      var x = el("button", "", "✕"); x.type = "button"; x.setAttribute("aria-label", "Olib tashlash: " + p.name); x.onclick = function () { toggleLike(p.id); }; r.appendChild(x);
      box.appendChild(r);
    });
    var txt = "Salom! Menga shu mahsulotlar yoqdi:\n" + items.map(function (p) { return "• " + p.name + (p.price ? " (" + money(p.price, p.currency) + ")" : ""); }).join("\n") + "\n" + SITE_URL;
    $("drSend").href = tg(txt); $("drSend").target = "_blank"; $("drSend").rel = "noopener";
  }
  function openDrawer() { lastFocus = document.activeElement; renderDrawer(); $("drawer").hidden = false; lockBody(true); $("drawer").querySelector(".ico-btn").focus(); }
  function closeDrawer() { if ($("drawer").hidden) return; $("drawer").hidden = true; lockBody(false); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $("likesBtn").onclick = openDrawer;
  [].forEach.call($("drawer").querySelectorAll("[data-close]"), function (b) { b.onclick = closeDrawer; });
  $("drClear").onclick = function () { likes = []; saveLikes(); renderDrawer(); [].forEach.call(document.querySelectorAll(".heart"), function (h) { h.setAttribute("aria-pressed", "false"); }); if (F.liked) render(true); };

  /* ---------- ishlar galereyasi ---------- */
  var worksList = [], wShown = 0, WP = 8;
  function moreWorks() {
    var end = Math.min(worksList.length, wShown + WP);
    for (var i = wShown; i < end; i++) (function (i) {
      var b = el("button", "w"); b.type = "button"; b.setAttribute("aria-label", "Ish " + (i + 1) + " rasmini kattalashtirish");
      b.appendChild(imgEl(worksList[i], "Lux mebel ishi " + (i + 1))); b.onclick = function () { openViewer(worksList, i, true); }; $("works").appendChild(b); reveal(b);
    })(i);
    wShown = end; $("moreWorks").hidden = wShown >= worksList.length;
  }
  function setWorks(list) { worksList = list || []; wShown = 0; $("works").innerHTML = ""; $("ishlar").hidden = !worksList.length; $("navWorks").hidden = !worksList.length; if (worksList.length) moreWorks(); }
  $("moreWorks").onclick = moreWorks;
  setWorks(S.works || []);
  fetch("works.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (l) { if (l && l.length) setWorks(l); }).catch(function () { });

  /* ---------- sharhlar ---------- */
  (function () {
    var rv = S.reviews || []; if (!rv.length) return; var box = $("reviews");
    rv.forEach(function (r) { var d = el("div", "rev"); d.appendChild(el("p", "", "«" + (r.text || r.matn || "") + "»")); d.appendChild(el("span", "", r.name || r.ism || "")); box.appendChild(d); });
    $("sharhlar").hidden = false;
  })();

  /* ---------- ma'lumotni yuklash ---------- */
  function applyHash() { var m = /^#m=([^&]+)/.exec(location.hash || ""); if (m && BYID[decodeURIComponent(m[1])]) openModal(decodeURIComponent(m[1]), true); }
  fetch("products.json?v=" + Math.floor(Date.now() / 600000)).then(function (r) { return r.json(); }).then(function (list) {
    ALL = (Array.isArray(list) ? list : (list.products || [])).map(normalize).filter(function (p) { return p.images.length; });
    ALL.forEach(function (p) { BYID[p.id] = p; });
    buildTabs(); buildCats(); buildRooms(); buildNew(); render(true); saveLikes(); applyHash();
    try {
      var ld = document.createElement("script"); ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "Lux mebel katalogi", itemListElement: ALL.slice(0, 40).map(function (p, i) { return { "@type": "ListItem", position: i + 1, name: p.name + " (" + p.category + ")", url: SITE_URL + "#m=" + p.id, image: SITE_URL + p.images[0] }; }) });
      document.head.appendChild(ld);
    } catch (e) { }
  }).catch(function () { $("empty").hidden = false; $("empty").textContent = "Katalogni yuklab bo'lmadi. Sahifani yangilang yoki bizga qo'ng'iroq qiling."; });
  addEventListener("hashchange", applyHash);

  /* ---------- klaviatura ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!$("viewer").hidden) closeViewer(); else if (!$("modal").hidden) closeModal(); else closeDrawer(); return; }
    if (!$("viewer").hidden) { if (e.key === "ArrowLeft") $("vPrev").onclick(e); if (e.key === "ArrowRight") $("vNext").onclick(e); return; }
    if (!$("modal").hidden) { if (e.key === "ArrowLeft") showM(mi - 1); if (e.key === "ArrowRight") showM(mi + 1);
      if (e.key === "Tab") { var f = $("modal").querySelectorAll("a[href],button:not([hidden])"); f = [].filter.call(f, function (n) { return n.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === z) { a.focus(); e.preventDefault(); } } }
  });
})();

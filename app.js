(function () {
  var S = window.SITE, $ = function (id) { return document.getElementById(id); };
  var all = [], cat = "", flag = "", room = "", query = "", shown = 0;
  var tg = function (text) { return "https://t.me/" + S.telegram + (text ? "?text=" + encodeURIComponent(text) : ""); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var img = function (src, alt) { var i = el("img", "cover"); i.src = src; i.alt = alt || ""; i.loading = "lazy"; i.decoding = "async"; return i; };

  // --- animatsiya yordamchilari
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }) : null;
  function reveal(node, i) {
    if (reduceMotion) { node.classList.add("in"); return; }
    node.classList.add("reveal");
    node.style.transitionDelay = (Math.min(i || 0, 8) * 0.06) + "s";
    if (io) io.observe(node); else node.classList.add("in");
  }
  function countUp(node, fullText, target, numStr) {
    var started = false;
    var run = function () {
      if (started) return; started = true;
      var start = null, dur = 900;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1), val = Math.round(target * (1 - Math.pow(1 - p, 3)));
        node.textContent = fullText.replace(numStr, String(val));
        if (p < 1) requestAnimationFrame(step); else node.textContent = fullText;
      }
      requestAnimationFrame(step);
    };
    if (io) { var obs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(); obs.disconnect(); } }); }, { threshold: 0.4 }); obs.observe(node); }
    else run();
  }

  // --- statik qismlar
  document.title = S.brand + " — mebel katalogi";
  $("brand").textContent = S.brand;
  $("since").textContent = S.since;
  $("heroTitle").textContent = S.heroTitle;
  $("heroAccent").textContent = S.heroTitleAccent;
  var heroImgs = (S.heroImages && S.heroImages.length) ? S.heroImages : (S.heroImage ? [S.heroImage] : []);
  if (heroImgs.length) {
    var hb = $("heroBg"); hb.hidden = false; hb.innerHTML = "";
    var heroEls = heroImgs.map(function (src, i) { var im = img(src); im.style.opacity = i === 0 ? "1" : "0"; im.style.transition = "opacity 1s ease"; hb.appendChild(im); return im; });
    var heroIdx = 0;
    var showHero = function (i) {
      heroIdx = (i + heroImgs.length) % heroImgs.length;
      heroEls.forEach(function (el2, j) { el2.style.opacity = j === heroIdx ? "1" : "0"; });
      $("heroCount").textContent = String(heroIdx + 1).padStart(2, "0") + " / " + String(heroImgs.length).padStart(2, "0");
    };
    if (heroImgs.length > 1) {
      $("heroNav").hidden = false;
      $("heroPrev").onclick = function () { showHero(heroIdx - 1); };
      $("heroNext").onclick = function () { showHero(heroIdx + 1); };
      if (!reduceMotion) setInterval(function () { showHero(heroIdx + 1); }, 6000);
    }
    showHero(0);
  }
  ["hdrPhone", "ftPhone", "barPhone"].forEach(function (id) { $(id).href = "tel:" + S.phone; });
  $("hdrPhone").textContent = S.phoneShow; $("ftPhone").textContent = S.phoneShow;
  ["heroTg", "barTg", "ftTg"].forEach(function (id) { $(id).href = tg(); });
  var adr = $("addr"); adr.textContent = S.address + " · " + S.hours;
  if (S.mapUrl) { var m = el("a", "", "Xaritada ochish"); m.href = S.mapUrl; m.target = "_blank"; m.rel = "noopener"; adr.appendChild(document.createTextNode(" · ")); adr.appendChild(m); }

  $("trust").innerHTML = "";
  (S.trust || []).forEach(function (t, i) {
    var d = el("div"), big = el("div", "big k"); big.textContent = t.big; d.appendChild(big);
    d.appendChild(el("div", "small t")).textContent = t.small; $("trust").appendChild(d);
    reveal(d, i);
    var m = (t.big || "").match(/\d+/);
    if (m && !reduceMotion) countUp(big, t.big, parseInt(m[0], 10), m[0]);
  });

  $("rooms").innerHTML = "";
  var roomBtns = [];
  (S.rooms || []).forEach(function (r, i) {
    var b = el("button", "room ph"); b.type = "button";
    if (r.image) b.appendChild(img(r.image, r.name));
    b.appendChild(el("span", "nm k")).textContent = r.name;
    b.onclick = function () { room = room === r.name ? "" : r.name; roomBtns.forEach(function (x) { x.classList.toggle("on", x === b && room); }); render(true); document.getElementById("katalog").scrollIntoView(); };
    roomBtns.push(b); $("rooms").appendChild(b); reveal(b, i);
  });
  if (!(S.rooms || []).length) $("kolleksiyalar").hidden = true;

  var worksList = [], worksShown = 0, WORKS_PAGE = 8;
  function showMoreWorks() {
    var end = Math.min(worksList.length, worksShown + WORKS_PAGE);
    for (var i = worksShown; i < end; i++) (function (i) {
      var d = el("div", "ph work"); d.appendChild(img(worksList[i], "Ish " + (i + 1)));
      d.onclick = function () { lbOpen(worksList, i); };
      $("works").appendChild(d); reveal(d, i % WORKS_PAGE);
    })(i);
    worksShown = end;
    $("moreWorks").hidden = worksShown >= worksList.length;
  }
  function renderWorks(list) {
    worksList = list || []; worksShown = 0; $("works").innerHTML = "";
    if (worksList.length) {
      $("ishlar").hidden = false; $("navWorks").hidden = false; showMoreWorks();
    } else {
      $("ishlar").hidden = true; $("navWorks").hidden = true; $("moreWorks").hidden = true;
    }
  }
  $("moreWorks").onclick = showMoreWorks;
  renderWorks(S.works || []);
  fetch("works.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (list) { if (list) renderWorks(list); }).catch(function () { });

  var rev = S.reviews || [];
  $("qNav").innerHTML = "";
  if (rev.length) {
    $("sharhlar").hidden = false;
    var quoteEl = document.querySelector("#sharhlar .quote");
    reveal(quoteEl, 0);
    var idx = 0, show = function (i) {
      idx = i;
      var apply = function () { $("qText").textContent = "“" + rev[i].text + "”"; $("qWho").textContent = rev[i].name + (rev[i].city ? " · " + rev[i].city : ""); [].forEach.call($("qNav").children, function (b, j) { b.classList.toggle("on", j === i); }); quoteEl.classList.remove("fade"); };
      if (reduceMotion) { apply(); return; }
      quoteEl.classList.add("fade"); setTimeout(apply, 380);
    };
    if (rev.length > 1) rev.forEach(function (_, i) { var b = el("button"); b.setAttribute("aria-label", "Sharh " + (i + 1)); b.onclick = function () { show(i); }; $("qNav").appendChild(b); });
    show(0); if (rev.length > 1) setInterval(function () { show((idx + 1) % rev.length); }, 8000);
  }

  // --- katalog
  function parseCsv(t) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    var head = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
    var num = function (s) { return Number((s || "0").replace(/[^\d]/g, "")); };
    return rows.filter(function (r) { return r.join("").trim(); }).map(function (r, i) {
      var o = {}; head.forEach(function (h, j) { o[h] = (r[j] || "").trim(); });
      var yangi = (o.yangi || o.new || "").toLowerCase();
      return { id: o.id || String(i + 1), name: o.nomi || o.name || "", category: o.kategoriya || o.category || "", room: o.xona || o.room || "", price: num(o.narx || o.price), oldPrice: num(o.eski_narx || o.oldprice), isNew: ["ha", "yes", "1", "true", "+"].indexOf(yangi) > -1, image: o.rasm || o.image || "" };
    });
  }
  function load() {
    var fallback = fetch("products.json").then(function (r) { return r.json(); });
    if (!S.sheetCsvUrl) return fallback;
    return fetch(S.sheetCsvUrl).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(parseCsv).catch(function () { return fallback; });
  }
  function money(n, cur) { return n.toLocaleString("ru-RU").replace(/,/g, " ") + " " + (cur || S.currency); }
  function isSale(p) { return p.oldPrice > p.price && p.price > 0; }
  function imgsOf(p) { return (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []); }

  // --- lightbox (mahsulotning barcha suratlarini ko'rish)
  var lbImgs = [], lbIdx = 0, lbSwiped = false, lbOpenedAt = 0;
  function lbShow(i) {
    lbIdx = (i + lbImgs.length) % lbImgs.length;
    $("lbImg").src = lbImgs[lbIdx];
    $("lbCount").textContent = String(lbIdx + 1).padStart(2, "0") + " / " + String(lbImgs.length).padStart(2, "0");
  }
  function lbOpen(imgs, start) {
    if (!imgs || !imgs.length) return;
    lbImgs = imgs; lbOpenedAt = Date.now(); $("lightbox").hidden = false; document.body.style.overflow = "hidden"; lbShow(start || 0);
  }
  function lbClose() { $("lightbox").hidden = true; document.body.style.overflow = ""; }
  $("lbClose").onclick = lbClose;
  $("lightbox").onclick = function (e) { if (Date.now() - lbOpenedAt < 450) return; if (lbSwiped) { lbSwiped = false; return; } if (e.target.id === "lightbox") lbClose(); };
  $("lbPrev").onclick = function () { lbShow(lbIdx - 1); };
  $("lbNext").onclick = function () { lbShow(lbIdx + 1); };
  (function () {
    var box = $("lightbox"), im = $("lbImg"), sx = 0, dx = 0, on = false;
    box.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button") || (e.pointerType === "mouse" && e.button !== 0)) return;
      on = true; sx = e.clientX; dx = 0; box.setPointerCapture(e.pointerId);
    });
    box.addEventListener("pointermove", function (e) {
      if (!on) return; dx = e.clientX - sx;
      if (Math.abs(dx) > 6) { im.style.transition = "none"; im.style.transform = "translateX(" + dx + "px)"; }
    });
    function end() {
      if (!on) return; on = false; im.style.transition = ""; im.style.transform = "";
      if (Math.abs(dx) > 50) { lbSwiped = true; lbShow(lbIdx + (dx < 0 ? 1 : -1)); }
      else if (Math.abs(dx) > 6) lbSwiped = true;
    }
    box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end);
  })();
  document.addEventListener("keydown", function (e) {
    if ($("lightbox").hidden) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowLeft") lbShow(lbIdx - 1);
    else if (e.key === "ArrowRight") lbShow(lbIdx + 1);
  });
  // --- "Yoqdi" (saqlangan mahsulotlar) + ro'yxatdan o'tish
  // Eslatma: localStorage preview-sandboxda har doim ham ishonchli saqlanmaydi,
  // shuning uchun joriy tashrif davomida asosiy manba — xotiradagi o'zgaruvchilar
  // (sessionUser/sessionLikes); localStorage faqat keyingi tashrif uchun "bonus" sifatida ishlatiladi.
  var LS_USER = "lm_user", LS_LIKES = "lm_likes";
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  var sessionUser = (function () { try { return JSON.parse(safeGet(LS_USER) || "null"); } catch (e) { return null; } })();
  var sessionLikes = (function () { try { return JSON.parse(safeGet(LS_LIKES) || "[]"); } catch (e) { return []; } })();
  function getUser() { return sessionUser; }
  function getLikes() { return sessionLikes; }
  function isLiked(id) { return sessionLikes.indexOf(id) > -1; }
  function updateLikesCount() { var c = $("likesCount"); if (c) c.textContent = String(sessionLikes.length); }
  function toggleLike(id) {
    var i = sessionLikes.indexOf(id);
    if (i > -1) sessionLikes.splice(i, 1); else sessionLikes.push(id);
    safeSet(LS_LIKES, JSON.stringify(sessionLikes));
    updateLikesCount();
    return i === -1;
  }
  function likeClick(id, btn) {
    var on = toggleLike(id);
    btn.classList.toggle("on", on);
    btn.innerHTML = on ? "♥" : "♡";
    if (flag === "liked") render(true);
    renderArizaLikes();
  }

  // --- Ariza qoldirish (pastki forma) ---
  var ARIZA_URL = "https://api.luxmebel.uz/ariza";
  function renderArizaLikes() {
    var box = $("arizaLikesList");
    if (!box) return;
    box.innerHTML = "";
    var likedProducts = sessionLikes.map(function (id) { return all.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
    if (!likedProducts.length) { box.innerHTML = '<div class="t" style="color:var(--muted)">Hali hech narsa yoqtirilmagan</div>'; return; }
    likedProducts.forEach(function (p) { box.appendChild(el("div", "ariza-item t", p.name)); });
  }
  if ($("arizaSubmit")) {
    $("arizaSubmit").onclick = function () {
      var name = $("arizaName").value.trim(), phone = $("arizaPhone").value.trim();
      var msg = $("arizaMsg");
      if (!name || !phone) { msg.hidden = false; msg.textContent = "Ism va raqamni to'liq kiriting"; msg.style.color = "var(--red)"; return; }
      var likedProducts = sessionLikes.map(function (id) { return all.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
      var payload = { name: name, phone: phone, likes: likedProducts.map(function (p) { return { id: p.id, name: p.name }; }) };
      $("arizaSubmit").disabled = true;
      fetch(ARIZA_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function () {
          msg.hidden = false; msg.style.color = "var(--gold)"; msg.textContent = "Qabul qilindi! Tez orada bog'lanamiz.";
          $("arizaName").value = ""; $("arizaPhone").value = "";
        })
        .catch(function () { msg.hidden = false; msg.style.color = "var(--red)"; msg.textContent = "Xatolik yuz berdi, qayta urinib ko'ring yoki Telegram/qo'ng'iroq orqali bog'laning."; })
        .finally(function () { $("arizaSubmit").disabled = false; });
    };
  }

  function filtered() {
    var q = query.toLowerCase();
    return all.filter(function (p) {
      if (flag === "liked" && !isLiked(p.id)) return false;
      if (cat && p.category !== cat) return false;
      if (room && p.room !== room) return false;
      if (flag === "new" && !p.isNew) return false;
      if (flag === "sale" && !isSale(p)) return false;
      return !q || (p.name + " " + p.category + " " + p.room).toLowerCase().indexOf(q) > -1;
    });
  }
  // --- kartochkada rasmlarni aylantirish (barmoq bilan surish / strelka / klaviatura)
  function multiPic(pic, imgs, name) {
    var track = el("div", "track"), dots = el("div", "dots"), cnt = el("span", "badge count t"), ims = [], idx = 0;
    pic.classList.add("multi"); pic.tabIndex = 0; pic.setAttribute("aria-label", name + " — rasmlar");
    imgs.forEach(function (s, i) {
      var im = i === 0 ? img(s, name) : el("img", "cover");
      if (i > 0) { im.alt = name; im.decoding = "async"; im.setAttribute("data-src", s); }
      im.draggable = false; ims.push(im); track.appendChild(im);
      if (imgs.length <= 8) dots.appendChild(el("i"));
    });
    var prev = el("button", "arrow l", "←"), next = el("button", "arrow r", "→");
    prev.type = next.type = "button"; prev.setAttribute("aria-label", "Oldingi rasm"); next.setAttribute("aria-label", "Keyingi rasm");
    pic.appendChild(track); pic.appendChild(dots); pic.appendChild(cnt); pic.appendChild(prev); pic.appendChild(next);
    function ensure(i) { var im = ims[i]; if (im && !im.getAttribute("src") && im.getAttribute("data-src")) im.src = im.getAttribute("data-src"); }
    function go(i) {
      idx = Math.max(0, Math.min(imgs.length - 1, i)); ensure(idx); ensure(idx + 1);
      track.style.transform = "translateX(-" + idx * 100 + "%)";
      cnt.textContent = (idx + 1) + " / " + imgs.length;
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle("on", j === idx); });
      prev.disabled = idx === 0; next.disabled = idx === imgs.length - 1;
    }
    prev.onclick = function (e) { e.stopPropagation(); go(idx - 1); };
    next.onclick = function (e) { e.stopPropagation(); go(idx + 1); };
    pic.addEventListener("pointerenter", function () { ensure(1); });
    pic.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(idx + 1); else if (e.key === "ArrowLeft") go(idx - 1); else if (e.key === "Enter") lbOpen(imgs, idx);
    });
    var sx = 0, dx = 0, down = false, moved = false;
    pic.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".arrow, .like-btn") || (e.pointerType === "mouse" && e.button !== 0)) return;
      down = true; moved = false; sx = e.clientX; dx = 0; ensure(idx + 1); pic.setPointerCapture(e.pointerId);
    });
    pic.addEventListener("pointermove", function (e) {
      if (!down) return; dx = e.clientX - sx;
      if (Math.abs(dx) > 6) { moved = true; pic.classList.add("drag"); }
      if (moved) {
        var edge = (idx === 0 && dx > 0) || (idx === imgs.length - 1 && dx < 0);
        track.style.transform = "translateX(calc(-" + idx * 100 + "% + " + (edge ? dx * 0.35 : dx) + "px))";
      }
    });
    pic.addEventListener("pointerup", function () {
      if (!down) return; down = false; pic.classList.remove("drag");
      if (moved) { go(Math.abs(dx) > pic.clientWidth * 0.18 ? idx + (dx < 0 ? 1 : -1) : idx); } else lbOpen(imgs, idx);
    });
    pic.addEventListener("pointercancel", function () { down = false; pic.classList.remove("drag"); go(idx); });
    go(0);
  }
  function card(p) {
    var a = el("article", "card"), pic = el("div", "pic ph"), imgs = imgsOf(p);
    if (imgs.length > 1) multiPic(pic, imgs, p.name);
    else if (imgs.length) {
      pic.appendChild(img(imgs[0], p.name));
      pic.style.cursor = "pointer";
      pic.onclick = function () { lbOpen(imgs, 0); };
    }
    if (isSale(p)) pic.appendChild(el("span", "badge sale t", "−" + Math.round((1 - p.price / p.oldPrice) * 100) + "%"));
    else if (p.isNew) pic.appendChild(el("span", "badge new t", "Yangi"));
    var liked = isLiked(p.id), likeBtn = el("button", "like-btn" + (liked ? " on" : ""), liked ? "♥" : "♡");
    likeBtn.type = "button"; likeBtn.setAttribute("aria-label", "Yoqdi");
    likeBtn.onclick = function (e) { e.stopPropagation(); likeClick(p.id, likeBtn); };
    pic.appendChild(likeBtn);
    a.appendChild(pic);
    var b = el("div"); b.appendChild(el("div", "cat t")).textContent = p.category;
    b.appendChild(el("div", "name k")).textContent = p.name;
    var pr = el("div", "price"); pr.appendChild(document.createTextNode(p.price ? money(p.price, p.currency) : "Narxi so'rang"));
    if (isSale(p)) pr.appendChild(el("span", "old")).textContent = money(p.oldPrice, p.currency);
    b.appendChild(pr); a.appendChild(b);
    var act = el("div", "act t", '<a>Qo\'ng\'iroq</a><a>Telegram</a>'), l = act.children;
    l[0].href = "tel:" + S.phone;
    l[1].href = tg("Salom! Shu mahsulot qiziqtirdi: " + p.name + (p.price ? " (" + money(p.price, p.currency) + ")" : ""));
    a.appendChild(act); return a;
  }
  function render(reset) {
    var list = filtered(), g = $("grid");
    if (reset) { g.innerHTML = ""; shown = 0; }
    list.slice(shown, shown + S.pageSize).forEach(function (p, i) { var c = card(p); g.appendChild(c); reveal(c, i % 8); });
    shown = Math.min(list.length, shown + S.pageSize);
    if (!list.length) g.innerHTML = '<div class="empty">Hech narsa topilmadi</div>';
    $("more").hidden = shown >= list.length;
  }
  function chips() {
    var box = $("chips"), cats = [], btns = [];
    box.innerHTML = "";
    all.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    var defs = [["Hammasi", "", ""], ["Yangi", "new", "new"], ["Chegirma", "sale", "sale"], ["♥ Saqlanganlar", "liked", "new"]].map(function (d) { return { label: d[0], flag: d[1], cls: d[2] }; })
      .concat(cats.map(function (c) { return { label: c, cat: c }; }));
    defs.forEach(function (d, i) {
      if (d.flag === "new" && !all.some(function (p) { return p.isNew; })) return;
      if (d.flag === "sale" && !all.some(isSale)) return;
      var b = el("button", "chip " + (d.cls || "") + (i === 0 ? " on" : "")); b.type = "button"; b.textContent = d.label;
      b.onclick = function () { cat = d.cat || ""; flag = d.flag || ""; btns.forEach(function (x) { x.classList.toggle("on", x === b); }); render(true); };
      btns.push(b); box.appendChild(b);
    });
  }
  [].forEach.call(document.querySelectorAll(".sec .head"), function (h) { reveal(h, 0); });

  function renderFeatured() {
    if (!all.length) return;
    var fresh = all.filter(function (p) { return p.isNew; });
    var p = fresh.length ? fresh[0] : all[0];
    $("tanlangan").hidden = false;
    $("featName").textContent = p.name;
    $("featCat").textContent = p.category + (p.room ? " · " + p.room : "");
    $("featPrice").textContent = p.price ? money(p.price, p.currency) : "Narxi so'rang";
    $("featTel").href = "tel:" + S.phone;
    $("featTg").href = tg("Salom! Shu mahsulot qiziqtirdi: " + p.name + (p.price ? " (" + money(p.price, p.currency) + ")" : ""));
    var pic = $("featPic"); pic.innerHTML = "";
    var fimgs = imgsOf(p);
    if (fimgs.length) { pic.appendChild(img(fimgs[0], p.name)); pic.style.cursor = "pointer"; pic.onclick = function () { lbOpen(fimgs, 0); }; }
    reveal(document.querySelector("#tanlangan .feat-copy"), 0);
    reveal(pic, 1);
  }

  updateLikesCount();
  $("q").oninput = function (e) { query = e.target.value; render(true); };
  $("more").onclick = function () { render(false); };
  load().then(function (d) { all = d; chips(); render(true); renderFeatured(); renderArizaLikes(); }).catch(function () { $("grid").innerHTML = '<div class="empty">Katalogni yuklab bo\'lmadi</div>'; });
})();

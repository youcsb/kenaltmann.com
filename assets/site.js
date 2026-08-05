/* ==========================================================================
   Ken Altmann Photography

   Three jobs:
     1. Build the masthead, menu and footer once, so every page stays in sync.
     2. Lay photographs out in justified rows — each row's images share an
        exact height because flex-grow is set to the aspect ratio.
     3. Run the lightbox.
   ========================================================================== */

(function () {
  "use strict";

  var KA = window.KA;
  if (!KA) return;

  var page = document.body.dataset.page || "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function collectionList() {
    return KA.order.map(function (slug) {
      return {
        slug: slug,
        href: slug + ".html",
        name: KA.collections[slug].name,
        count: KA.collections[slug].photos.length,
        cover: KA.collections[slug].photos[0]
      };
    });
  }

  /* ------------------------------------------------------------------------
     Masthead, menu, footer
     ------------------------------------------------------------------------ */

  function buildChrome() {
    var collections = collectionList();

    var bar = el("header", "masthead");
    bar.setAttribute("data-solid", page === "home" ? "false" : "true");

    var mark = el("a", "wordmark");
    mark.href = "index.html";
    mark.innerHTML = 'Ken Altmann <span>Photography</span>';
    bar.appendChild(mark);

    var nav = el("nav", "nav");
    nav.setAttribute("aria-label", "Collections");

    collections.forEach(function (item) {
      var link = el("a", null, item.name);
      link.href = item.href;
      if (page === item.slug) link.setAttribute("aria-current", "page");
      nav.appendChild(link);
    });

    nav.appendChild(el("span", "nav-divide"));

    [["About", "about.html", "about"], ["Contact", "contact.html", "contact"]]
      .forEach(function (pair) {
        var link = el("a", null, pair[0]);
        link.href = pair[1];
        if (page === pair[2]) link.setAttribute("aria-current", "page");
        nav.appendChild(link);
      });

    bar.appendChild(nav);

    var toggle = el("button", "menu-toggle", "Menu");
    toggle.setAttribute("aria-expanded", "false");
    bar.appendChild(toggle);

    /* Full-screen menu */
    var menu = el("div", "menu");
    menu.setAttribute("data-open", "false");
    menu.setAttribute("aria-hidden", "true");

    var close = el("button", "menu-close", "Close");
    menu.appendChild(close);

    collections.forEach(function (item) {
      var link = el("a", "menu-link");
      link.href = item.href;
      if (page === item.slug) link.setAttribute("aria-current", "page");
      link.appendChild(el("span", null, item.name));
      link.appendChild(el("em", null, String(item.count)));
      menu.appendChild(link);
    });

    var foot = el("div", "menu-foot");
    [["About", "about.html"], ["Contact", "contact.html"]].forEach(function (pair) {
      var link = el("a", null, pair[0]);
      link.href = pair[1];
      foot.appendChild(link);
    });
    menu.appendChild(foot);

    function setMenu(open) {
      menu.setAttribute("data-open", String(open));
      menu.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("is-locked", open);
      if (open) menu.querySelector(".menu-link").focus();
      else toggle.focus();
    }

    toggle.addEventListener("click", function () { setMenu(true); });
    close.addEventListener("click", function () { setMenu(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.dataset.open === "true") setMenu(false);
    });

    document.body.insertBefore(menu, document.body.firstChild);
    document.body.insertBefore(bar, document.body.firstChild);

    /* Solid bar once the hero is behind us. */
    if (page === "home") {
      var onScroll = function () {
        bar.setAttribute("data-solid", window.scrollY > window.innerHeight * 0.7);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function buildFooter() {
    var host = document.querySelector("[data-footer]");
    if (!host) return;

    var foot = el("footer", "site-foot wrap");

    var name = el("span", "mono", "Ken Altmann Photography");
    var place = el("span", "mono", "Seattle, Washington");

    var mail = el("a", "mono", "ken@kenaltmann.com");
    mail.href = "mailto:ken@kenaltmann.com";

    var blog = el("a", "mono", "Travel journal");
    blog.href = "https://globe-trottingtrio.blogspot.com/";
    blog.rel = "noopener";
    blog.target = "_blank";

    var spacer = el("span", "mono spacer",
      "© " + new Date().getFullYear());

    [name, place, mail, blog, spacer].forEach(function (node) {
      foot.appendChild(node);
    });

    host.replaceWith(foot);
  }

  /* ------------------------------------------------------------------------
     The hang

     Photographs are grouped into rows until their aspect ratios add up to
     roughly TARGET. Inside a row, flex-grow: <aspect> makes the widths
     proportional to the shapes, which lands every image on the same height.
     ------------------------------------------------------------------------ */

  var TARGET = 2.75;
  var MAX_PER_ROW = 3;

  function makeRows(photos) {
    var rows = [];
    var current = [];
    var sum = 0;

    photos.forEach(function (photo, i) {
      var aspect = photo.w / photo.h;

      // A panorama earns the whole row to itself, and so does every seventh
      // frame — it keeps the wall from settling into a rhythm.
      var wantsSolo = current.length === 0 && (aspect >= 1.95 || i % 7 === 0);
      if (wantsSolo) {
        rows.push([photo]);
        return;
      }

      current.push(photo);
      sum += aspect;

      // A tall frame hung beside two wide ones ends up a sliver. Once a
      // portrait is in the row, stop at two.
      var hasPortrait = current.some(function (p) { return p.w / p.h < 0.85; });
      var limit = hasPortrait ? 2 : MAX_PER_ROW;

      if (sum >= TARGET || current.length >= limit) {
        rows.push(current);
        current = [];
        sum = 0;
      }
    });

    if (current.length) rows.push(current);
    return rows;
  }

  // `meta` is the small note to the right of the title. It's only passed on
  // the home page, where photographs come from different collections and
  // saying which one is actually useful.
  function makePlate(photo, index, meta) {
    var plate = el("figure", "plate");
    plate.style.flexGrow = String(photo.w / photo.h);
    plate.dataset.seen = reduceMotion ? "true" : "false";
    plate.dataset.index = String(index);

    var frame = el("button", "plate-frame");
    frame.type = "button";
    frame.setAttribute("aria-label", "View " + photo.t + " full screen");

    var img = new Image();
    img.src = photo.s;
    img.alt = photo.t;
    img.width = photo.w;
    img.height = photo.h;
    img.loading = "lazy";
    img.decoding = "async";
    frame.appendChild(img);
    plate.appendChild(frame);

    var label = el("figcaption", "plate-label");
    label.appendChild(el("span", "plate-title", photo.t));
    if (meta) label.appendChild(el("span", "mono plate-index", meta));
    plate.appendChild(label);

    return plate;
  }

  function renderHang(host, photos, meta, onOpen) {
    var rows = makeRows(photos);
    var index = 0;

    rows.forEach(function (row) {
      var node = el("div", "hang-row");
      if (row.length === 1) node.dataset.solo = "true";

      row.forEach(function (photo) {
        var i = index++;
        var plate = makePlate(photo, i, meta);
        plate.querySelector(".plate-frame")
          .addEventListener("click", function () { onOpen(i); });
        node.appendChild(plate);
      });

      host.appendChild(node);
    });

    watchPlates(host);
  }

  function watchPlates(host) {
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.dataset.seen = "true";
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });

    host.querySelectorAll(".plate").forEach(function (plate) {
      observer.observe(plate);
    });
  }

  /* ------------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------------ */

  function createLightbox() {
    var photos = [];
    var at = 0;
    var lastFocus = null;
    var groupLabel = "";

    var box = el("div", "lightbox");
    box.setAttribute("data-open", "false");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Photograph");

    var bar = el("div", "lightbox-bar");
    var close = el("button", "mono", "Close");
    close.style.color = "var(--paper)";
    bar.appendChild(close);

    var stage = el("div", "lightbox-stage");
    var img = new Image();
    img.alt = "";
    stage.appendChild(img);

    var prev = el("button", "lightbox-nav");
    prev.dataset.dir = "prev";
    prev.setAttribute("aria-label", "Previous photograph");

    var next = el("button", "lightbox-nav");
    next.dataset.dir = "next";
    next.setAttribute("aria-label", "Next photograph");

    stage.appendChild(prev);
    stage.appendChild(next);

    var foot = el("div", "lightbox-foot");
    var title = el("span", "lightbox-title");
    var where = el("span", "mono");
    var count = el("span", "mono lightbox-count");
    foot.appendChild(title);
    foot.appendChild(where);
    foot.appendChild(count);

    box.appendChild(bar);
    box.appendChild(stage);
    box.appendChild(foot);
    document.body.appendChild(box);

    function show(i) {
      at = (i + photos.length) % photos.length;
      var photo = photos[at];
      img.style.opacity = "0";
      var loader = new Image();
      loader.onload = function () {
        img.src = photo.s;
        img.alt = photo.t;
        img.style.opacity = "1";
      };
      loader.src = photo.s;
      title.textContent = photo.t;
      where.textContent = photo.from || groupLabel;
      count.textContent = (at + 1) + " / " + photos.length;

      // Warm the neighbours so arrowing through feels instant.
      [at + 1, at - 1].forEach(function (n) {
        var neighbour = photos[(n + photos.length) % photos.length];
        if (neighbour) new Image().src = neighbour.s;
      });
    }

    function open(list, i, label) {
      photos = list;
      groupLabel = label || "";
      lastFocus = document.activeElement;
      box.setAttribute("data-open", "true");
      document.body.classList.add("is-locked");
      show(i);
      close.focus();
    }

    function shut() {
      box.setAttribute("data-open", "false");
      document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }

    close.addEventListener("click", shut);
    prev.addEventListener("click", function () { show(at - 1); });
    next.addEventListener("click", function () { show(at + 1); });

    document.addEventListener("keydown", function (event) {
      if (box.dataset.open !== "true") return;
      if (event.key === "Escape") shut();
      if (event.key === "ArrowLeft") show(at - 1);
      if (event.key === "ArrowRight") show(at + 1);
      if (event.key === "Tab") {
        // Keep focus inside the dialog.
        event.preventDefault();
        var stops = [close, prev, next];
        var i = stops.indexOf(document.activeElement);
        stops[(i + (event.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
      }
    });

    return { open: open };
  }

  /* ------------------------------------------------------------------------
     Home page: the collections index
     ------------------------------------------------------------------------ */

  function renderIndex(host) {
    var collections = collectionList();

    var grid = el("div", "index-grid");
    var list = el("div", "index-list");
    var stage = el("div", "index-stage");

    var stageLabel = el("span", "mono index-stage-label");
    var frames = [];

    collections.forEach(function (item, i) {
      var row = el("a", "index-row");
      row.href = item.href;

      var thumb = new Image();
      thumb.className = "index-thumb";
      thumb.src = item.cover.s;
      thumb.alt = "";
      thumb.loading = "lazy";
      row.appendChild(thumb);

      row.appendChild(el("span", "index-name", item.name));
      row.appendChild(el("span", "mono index-count",
        item.count + (item.count === 1 ? " frame" : " frames")));

      var frame = new Image();
      frame.src = item.cover.s;
      frame.alt = "";
      frame.loading = i === 0 ? "eager" : "lazy";
      frame.dataset.active = String(i === 0);
      frames.push(frame);
      stage.appendChild(frame);

      function activate() {
        frames.forEach(function (f, n) { f.dataset.active = String(n === i); });
        stageLabel.textContent = item.name + " — " + item.cover.t;
      }

      row.addEventListener("mouseenter", activate);
      row.addEventListener("focus", activate);
      list.appendChild(row);
    });

    stageLabel.textContent =
      collections[0].name + " — " + collections[0].cover.t;
    stage.appendChild(stageLabel);

    grid.appendChild(list);
    grid.appendChild(stage);
    host.appendChild(grid);
  }

  /* ------------------------------------------------------------------------
     Wire up whichever page we're on
     ------------------------------------------------------------------------ */

  buildChrome();
  buildFooter();

  var lightbox = createLightbox();

  var indexHost = document.querySelector("[data-index]");
  if (indexHost) renderIndex(indexHost);

  var galleryHost = document.querySelector("[data-gallery]");
  if (galleryHost) {
    var slug = galleryHost.dataset.gallery;
    var collection = KA.collections[slug];
    if (collection) {
      renderHang(galleryHost, collection.photos, "", function (i) {
        lightbox.open(collection.photos, i, collection.name);
      });

      var countHost = document.querySelector("[data-count]");
      if (countHost) {
        countHost.textContent = collection.photos.length + " photographs";
      }

      var blurbHost = document.querySelector("[data-blurb]");
      if (blurbHost) blurbHost.textContent = collection.blurb;

      // "Next collection" at the foot of the page.
      var onward = document.querySelector("[data-onward]");
      if (onward) {
        var order = KA.order;
        var nextSlug = order[(order.indexOf(slug) + 1) % order.length];
        var nextCollection = KA.collections[nextSlug];
        var link = el("a");
        link.href = nextSlug + ".html";
        link.appendChild(el("span", "mono", "Next collection"));
        link.appendChild(el("span", "onward-name", nextCollection.name));
        onward.appendChild(link);
      }
    }
  }

  /* Selected work on the home page — a few frames from across the archive. */
  var selectedHost = document.querySelector("[data-selected]");
  if (selectedHost) {
    var picks = [];
    KA.order.forEach(function (slug) {
      var c = KA.collections[slug];
      c.photos.slice(0, 2).forEach(function (p) {
        picks.push({ t: p.t, s: p.s, w: p.w, h: p.h, from: c.name });
      });
    });

    var rows = makeRows(picks);
    var i = 0;
    rows.forEach(function (row) {
      var node = el("div", "hang-row");
      if (row.length === 1) node.dataset.solo = "true";
      row.forEach(function (photo) {
        var n = i++;
        var plate = makePlate(photo, n, photo.from);
        plate.querySelector(".plate-frame").addEventListener("click", function () {
          lightbox.open(picks, n, picks[n].from);
        });
        node.appendChild(plate);
      });
      selectedHost.appendChild(node);
    });
    watchPlates(selectedHost);
  }
})();

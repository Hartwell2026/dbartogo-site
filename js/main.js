/* D'BarToGo — interactions */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- sticky nav state ---------- */
  const nav = document.getElementById("nav");
  const floatCta = document.querySelector(".float-cta");
  const calFab = document.getElementById("calFab");
  const progress = document.getElementById("scrollProgress");
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (progress) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (docH > 0 ? Math.min(1, y / docH) * 100 : 0) + "%";
    }
    if (floatCta) floatCta.classList.toggle("show", y > 700);
    // booking button: appears once the viewport crosses into the 2nd half, stays to the bottom
    if (calFab) {
      const docH = document.documentElement.scrollHeight;
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      calFab.classList.toggle("show", y + vh > docH * 0.5);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Request-a-Call modal ---------- */
  (function () {
    const modal = document.getElementById("callModal");
    if (!modal || !calFab) return;
    const form = document.getElementById("callmForm");
    const done = document.getElementById("callmDone");
    let lastFocus = null;

    const open = () => {
      lastFocus = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const first = modal.querySelector("#callmName");
      if (first) setTimeout(() => first.focus(), 60);
    };
    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    calFab.addEventListener("click", open);
    modal.querySelectorAll("[data-callm-close]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameEl = document.getElementById("callmName");
        const phoneEl = document.getElementById("callmPhone");
        const whenEl = document.getElementById("callmWhen");
        const name = (nameEl.value || "").trim();
        const phone = (phoneEl.value || "").trim();
        if (!name || !phone) {
          (!name ? nameEl : phoneEl).focus();
          return;
        }
        const btn = form.querySelector(".callm__submit");
        if (btn) { btn.textContent = "Sending…"; btn.disabled = true; }
        try {
          await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "call", name, phone, when: (whenEl && whenEl.value || "").trim() }),
          });
        } catch (_) { /* show confirmation regardless */ }
        form.hidden = true;
        if (done) done.hidden = false;
      });
    }
  })();

  /* ---------- mobile menu ---------- */
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }

  /* ---------- Olá chat (custom UI -> /api/retell-chat proxy) ---------- */
  (function () {
    const fab = document.getElementById("olaFab");
    const panel = document.getElementById("olaChat");
    if (!fab || !panel) return;
    const closeb = document.getElementById("olaClose");
    const form = document.getElementById("olaForm");
    const input = document.getElementById("olaInput");
    const msgs = document.getElementById("olaMsgs");
    let chatId = null, greeted = false, busy = false;
    const add = (text, who) => {
      const d = document.createElement("div");
      d.className = "ola-msg ola-msg--" + who;
      d.textContent = text;
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
      return d;
    };
    const open = () => {
      panel.classList.add("open"); panel.setAttribute("aria-hidden", "false"); fab.style.display = "none";
      if (!greeted) { greeted = true; add("Hi, I'm Olá 👋 — your D'Bar To Go concierge. Planning something special? Ask me about packages, quotes, dates, or our luxury yacht rentals…", "bot"); }
      setTimeout(() => input.focus(), 250);
    };
    const close = () => { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); fab.style.display = ""; };
    fab.addEventListener("click", open);
    closeb.addEventListener("click", close);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || busy) return;
      input.value = ""; add(text, "me"); busy = true;
      const t = add("Olá is typing…", "bot"); t.classList.add("ola-msg--typing");
      try {
        const r = await fetch("/api/retell-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, chatId }) });
        const data = await r.json();
        t.remove();
        if (data && data.reply) { chatId = data.chatId || chatId; add(data.reply, "bot"); }
        else { add("Sorry — I couldn't reach the booking desk just now. Please call/text +1 786-461-7940 or tap “Book Appointment.”", "bot"); }
      } catch (err) {
        t.remove(); add("Connection hiccup — please try again, or call/text +1 786-461-7940.", "bot");
      }
      busy = false;
    });
  })();

  /* ---------- cinematic scroll background (crossfade per section) ---------- */
  (function () {
    const sbg = document.querySelector(".scroll-bg");
    if (!sbg) return;
    const layers = [sbg.querySelector(".scroll-bg__img--a"), sbg.querySelector(".scroll-bg__img--b")];
    const secs = Array.from(document.querySelectorAll("[data-scrollbg]"));
    if (!secs.length) return;
    const url = (n) => "assets/backgrounds/" + n + ".jpg";
    // preload
    secs.forEach((s) => { const i = new Image(); i.src = url(s.dataset.scrollbg); });
    let active = 0, current = "";
    const setBg = (name) => {
      if (!name || name === current) return;
      current = name;
      const next = 1 - active;
      layers[next].style.backgroundImage = `url('${url(name)}')`;
      layers[next].classList.add("is-active");
      layers[active].classList.remove("is-active");
      active = next;
    };
    // scroll-based selection (robust against viewport/IO quirks): pick the section
    // whose centre is closest to the viewport centre
    let queued = false;
    const pick = () => {
      queued = false;
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      const mid = vh / 2;
      let best = null, bestDist = Infinity;
      for (const s of secs) {
        const r = s.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = s; }
      }
      if (best) setBg(best.dataset.scrollbg);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(pick); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", pick);
    window.addEventListener("load", pick);
    setBg(secs[0].dataset.scrollbg); // initial background present immediately
    pick();
  })();

  /* ---------- satellite coverage map (Palm Beach -> Key West) ---------- */
  (function () {
    const el = document.getElementById("coverageMap");
    if (!el || !window.L) return;
    const L = window.L;
    const map = L.map(el, {
      zoomControl: false, attributionControl: true, scrollWheelZoom: false,
      dragging: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false, tap: false,
    });
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri", maxZoom: 18,
    }).addTo(map);
    // service-territory border (Palm Beach -> Miami-Dade -> the Keys -> Key West)
    const coverage = [
      [26.95, -80.30], [26.95, -79.92], [25.70, -80.02], [25.35, -80.22], [25.10, -80.40],
      [24.78, -80.92], [24.52, -81.86], [24.62, -81.92], [25.05, -80.98], [25.45, -80.55],
      [26.10, -80.45], [26.95, -80.46],
    ];
    const poly = L.polygon(coverage, {
      color: "#e6b35a", weight: 2.5, opacity: 0.95, dashArray: "8 8",
      fillColor: "#e0913f", fillOpacity: 0.13,
    }).addTo(map);
    [["West Palm Beach", 26.715, -80.053], ["Fort Lauderdale", 26.122, -80.137], ["Miami", 25.7617, -80.1918], ["Key West", 24.5551, -81.78]]
      .forEach(([n, la, lo]) => L.marker([la, lo], {
        interactive: false,
        icon: L.divIcon({ className: "cov-pin", html: '<i class="cov-pin__dot"></i><b class="cov-pin__label">' + n + "</b>", iconSize: [0, 0] }),
      }).addTo(map));
    const fit = () => map.fitBounds(poly.getBounds().pad(0.14));
    fit();
    setTimeout(() => { map.invalidateSize(); fit(); }, 250);
    window.addEventListener("load", () => { map.invalidateSize(); fit(); });
    window.addEventListener("resize", fit);
  })();

  /* ---------- reveal on scroll (GSAP if present, else IntersectionObserver) ---------- */
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  // progressive enhancement: only enable the hidden-then-reveal behavior now that JS runs
  document.documentElement.classList.add("reveal-on");
  revealEls.forEach((el) => {
    const d = parseFloat(el.dataset.delay || "0");
    if (d) el.style.transitionDelay = d + "s";
  });

  if (prefersReduced) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    // bulletproof vanilla reveal — no dependency on GSAP/IntersectionObserver/viewport quirks
    let scheduled = false;
    const reveal = () => {
      scheduled = false;
      const h = window.innerHeight || document.documentElement.clientHeight || 800;
      for (const el of revealEls) {
        if (el.classList.contains("is-visible")) continue;
        if (el.getBoundingClientRect().top < h * 0.92) el.classList.add("is-visible");
      }
    };
    const onScroll = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(reveal); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", reveal);
    window.addEventListener("load", reveal);
    reveal();
    // ultimate safety net: content must never stay hidden
    window.addEventListener("load", () => setTimeout(() => revealEls.forEach((el) => el.classList.add("is-visible")), 3500));
    setTimeout(() => revealEls.forEach((el) => el.classList.add("is-visible")), 6000);
  }

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCount(e.target);
            co.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => co.observe(c));
  }

  /* ---------- single-open accordion ---------- */
  const accs = document.querySelectorAll(".acc");
  accs.forEach((acc) => {
    acc.addEventListener("toggle", () => {
      if (acc.open) accs.forEach((o) => { if (o !== acc) o.open = false; });
    });
  });

  /* ---------- quote form (emails the team via /api/lead) ---------- */
  const form = document.getElementById("quoteForm");
  const note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      const get = (id) => (document.getElementById(id) || {}).value || "";
      submitBtn.textContent = "Sending…";
      submitBtn.disabled = true;
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "quote",
            name: get("name"), email: get("email"), phone: get("phone"),
            date: get("date"), guests: get("guests"), details: get("details"),
          }),
        });
      } catch (_) { /* show success regardless — lead UX shouldn't break */ }
      if (note) note.hidden = false;
      submitBtn.textContent = "Request Sent ✓";
      form.querySelectorAll("input, textarea, button").forEach((el) => (el.disabled = true));
    });
  }

  /* ---------- gallery lightbox ---------- */
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const lbImg = document.getElementById("lightboxImg");
    const items = Array.from(document.querySelectorAll(".gallery__item"));
    const sources = items.map((b) => ({ src: b.dataset.full, alt: b.querySelector("img").alt }));
    let current = 0;

    const show = (i) => {
      current = (i + sources.length) % sources.length;
      lbImg.src = sources[current].src;
      lbImg.alt = sources[current].alt;
    };
    const open = (i) => {
      show(i);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    items.forEach((b, i) => b.addEventListener("click", () => open(i)));
    document.getElementById("lightboxClose").addEventListener("click", close);
    document.getElementById("lightboxPrev").addEventListener("click", () => show(current - 1));
    document.getElementById("lightboxNext").addEventListener("click", () => show(current + 1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- Miami map: start animations when in view ---------- */
  const map = document.querySelector(".miami-map");
  if (map) {
    if (prefersReduced) {
      map.classList.add("is-live");
    } else {
      const mo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { map.classList.add("is-live"); mo.unobserve(map); }
          });
        },
        { threshold: 0.35 }
      );
      mo.observe(map);
    }
  }

  /* ---------- extra motion (pointer-fine, motion-allowed only) ---------- */
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (!prefersReduced) {
    /* hero background parallax */
    if (window.gsap && window.ScrollTrigger) {
      const bg = document.querySelector(".hero__bg");
      if (bg) {
        gsap.to(bg, {
          yPercent: 16,
          scale: 1.08,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });
      }
    }

    if (finePointer) {
      /* magnetic primary CTAs */
      document.querySelectorAll(".hero__actions .btn--gold, .nav__cta").forEach((btn) => {
        btn.addEventListener("mousemove", (e) => {
          const r = btn.getBoundingClientRect();
          const mx = e.clientX - r.left - r.width / 2;
          const my = e.clientY - r.top - r.height / 2;
          btn.style.transform = "translate(" + mx * 0.18 + "px," + my * 0.32 + "px)";
        });
        btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
      });

      /* cursor spotlight + subtle 3D tilt on cards & packages */
      document.querySelectorAll(".card, .pkg").forEach((el) => {
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", e.clientX - r.left + "px");
          el.style.setProperty("--my", e.clientY - r.top + "px");
          const rx = ((e.clientY - r.top) / r.height - 0.5) * -6; // tilt up/down
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;  // tilt left/right
          el.classList.add("is-tilting");
          el.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
        });
        el.addEventListener("mouseleave", () => {
          el.classList.remove("is-tilting");
          el.style.transform = "";
        });
      });
    }
  }

  /* ---------- hero video: sound toggle + pause when off-screen ---------- */
  const heroVideo = document.querySelector(".hero__video");
  const soundBtn = document.getElementById("heroSound");
  if (heroVideo && soundBtn) {
    const txt = soundBtn.querySelector(".hero__sound-txt");
    let userPaused = false;

    const setLabel = () => {
      const on = !heroVideo.muted;
      // icon (SVG) swap + styling handled in CSS via the .is-on class
      soundBtn.classList.toggle("is-on", on);
      soundBtn.setAttribute("aria-pressed", String(on));
      soundBtn.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
      if (txt) txt.textContent = on ? "Sound on" : "Tap for sound";
    };
    setLabel();

    const toggleSound = () => {
      heroVideo.muted = !heroVideo.muted;
      if (!heroVideo.muted) {
        userPaused = false;
        heroVideo.volume = 1;
        heroVideo.play().catch(() => {});
      }
      setLabel();
    };
    soundBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleSound(); });
    // clicking the video itself also toggles sound (bigger, obvious target)
    heroVideo.addEventListener("click", toggleSound);

    // pause the ad (and its music) when the hero is scrolled away; resume when back
    const hero = document.getElementById("hero");
    if (hero && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              if (!userPaused) heroVideo.play().catch(() => {});
            } else {
              heroVideo.pause();
            }
          });
        },
        { threshold: 0.35 }
      );
      io.observe(hero);
    }
  }

  /* ---------- smooth-scroll offset for sticky nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#" || id === "#top") return;
      const tgt = document.querySelector(id);
      if (!tgt) return;
      e.preventDefault();
      const top = tgt.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });
})();

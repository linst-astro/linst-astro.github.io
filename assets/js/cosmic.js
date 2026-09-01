/*!
 * cosmic.js — minimal premium effects for the astronomy homepage
 *
 *   1. canvas starfield (slow drift + faint twinkle + gentle mouse parallax + occasional meteors)
 *   2. refined typewriter for the hero
 *   3. calm scroll-reveal via IntersectionObserver
 *
 * No dependencies. Respects prefers-reduced-motion and pauses when the tab is hidden.
 * Scope: progressive enhancement only — without JS the page is fully visible.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ==========================================================================
     1. Subtle starfield
     ========================================================================== */
  function initStarfield() {
    var canvas = document.getElementById('starfield');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0, stars = [];
    var COUNT = 120;            // restrained — premium, not busy
    var mx = 0, my = 0, tx = 0, ty = 0;
    var raf = null, running = false;
    var meteors = [], frameNo = 0, nextMeteor = 240 + Math.floor(Math.random() * 360);

    function build() {
      stars = [];
      for (var i = 0; i < COUNT; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 1.1 + 0.3) * dpr,
          a: Math.random() * 0.45 + 0.12,
          t: Math.random() * Math.PI * 2,
          ts: Math.random() * 0.5 + 0.15,   // twinkle speed
          vx: (Math.random() - 0.5) * 0.035 * dpr,
          vy: -(Math.random() * 0.03 + 0.005) * dpr, // gentle upward drift
          gold: Math.random() < 0.16        // a few champagne-gold stars
        });
      }
    }

    function resize() {
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      build();
      if (reduceMotion) drawStatic();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? 'rgba(201,169,110,' + (s.a * 0.7) + ')'
          : 'rgba(232,230,225,' + (s.a * 0.7) + ')';
        ctx.fill();
      }
    }

    function spawnMeteor() {
      var dir = Math.random() < 0.5 ? -1 : 1;
      var sp = (5 + Math.random() * 3) * dpr;
      meteors.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.45,
        vx: dir * sp,
        vy: (2 + Math.random() * 1.6) * dpr,
        len: (90 + Math.random() * 70) * dpr,
        life: 0,
        max: 60 + Math.floor(Math.random() * 30)
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      tx += (mx - tx) * 0.035;
      ty += (my - ty) * 0.035;
      var ox = tx * 10 * dpr, oy = ty * 10 * dpr;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx; s.y += s.vy; s.t += s.ts * 0.02;
        if (s.x < -2) s.x += w + 4; else if (s.x > w + 2) s.x -= w + 4;
        if (s.y < -2) { s.y += h + 4; s.x = Math.random() * w; } else if (s.y > h + 2) s.y -= h + 4;
        var tw = Math.sin(s.t) * 0.5 + 0.5;
        var alpha = s.a * (0.35 + tw * 0.65);
        ctx.beginPath();
        ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? 'rgba(201,169,110,' + alpha + ')'
          : 'rgba(232,230,225,' + alpha + ')';
        ctx.fill();
      }

      // occasional meteors
      frameNo++;
      if (frameNo >= nextMeteor) {
        spawnMeteor();
        nextMeteor = frameNo + 240 + Math.floor(Math.random() * 360);
      }
      for (var j = meteors.length - 1; j >= 0; j--) {
        var m = meteors[j];
        m.x += m.vx; m.y += m.vy; m.life++;
        var spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        var tX = m.x - (m.vx / spd) * m.len;
        var tY = m.y - (m.vy / spd) * m.len;
        var op = Math.sin(Math.PI * (m.life / m.max));
        if (op < 0) op = 0;
        var g = ctx.createLinearGradient(m.x, m.y, tX, tY);
        g.addColorStop(0, 'rgba(255,255,255,' + (op * 0.95) + ')');
        g.addColorStop(0.35, 'rgba(232,230,225,' + (op * 0.45) + ')');
        g.addColorStop(1, 'rgba(201,169,110,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6 * dpr;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tX, tY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + op + ')';
        ctx.fill();
        if (m.life >= m.max || m.x < -m.len || m.x > w + m.len || m.y > h + m.len) {
          meteors.splice(j, 1);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop()  { running = false; if (raf) cancelAnimationFrame(raf); }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (!reduceMotion) start();
    });

    resize();
    if (!reduceMotion) start();
  }

  /* ==========================================================================
     2. Role rotator — clean vertical slide between roles (no horizontal jitter)
     ========================================================================== */
  function initRotator() {
    var el = document.querySelector('[data-rotator]');
    if (!el) return;
    var lines = [];
    try { lines = JSON.parse(el.getAttribute('data-lines') || '[]'); } catch (e) {}
    if (!lines.length) return;
    el.textContent = lines[0];
    if (reduceMotion || lines.length === 1) return;

    var idx = 0;
    var DUR = 450;
    var T = 'transform ' + DUR + 'ms ease, opacity ' + DUR + 'ms ease';

    function step() {
      // slide current up & out
      el.style.transition = T;
      el.style.transform = 'translateY(-100%)';
      el.style.opacity = '0';
      setTimeout(function () {
        idx = (idx + 1) % lines.length;
        el.textContent = lines[idx];
        // reposition below without animating
        el.style.transition = 'none';
        el.style.transform = 'translateY(100%)';
        el.style.opacity = '0';
        void el.offsetWidth;            // force reflow
        el.style.transition = T;
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
      }, DUR);
    }

    setInterval(step, 2800);
  }

  /* ==========================================================================
     3. Calm scroll-reveal
     ========================================================================== */
  function initReveal() {
    var els = document.querySelectorAll('.page__content > *:not(.anchor)');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('is-visible');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (var i = 0; i < els.length; i++) {
      els[i].style.transitionDelay = ((i % 4) * 60) + 'ms';
      io.observe(els[i]);
    }
  }

  /* ==========================================================================
     4. Wrap sections — group the content under each anchor into
        <section class="sec"> so the frameless grouping + running numbers
        apply. Progressive: if it fails the raw content stays as direct
        children and still reveals fine.
     ========================================================================== */
  function initWrap() {
    var content = document.querySelector('.page__content');
    if (!content) return;
    var nodes = Array.prototype.slice.call(content.childNodes);
    var groups = [];
    var cur = null;
    nodes.forEach(function (n) {
      if (n.nodeType === 3 && !n.textContent.trim()) return; // drop whitespace-only text
      if (n.nodeType === 1 && n.classList && n.classList.contains('anchor')) {
        cur = [];
        groups.push(cur);
        cur.push(n);
      } else {
        if (!cur) { cur = []; groups.push(cur); } // leading group before any anchor
        cur.push(n);
      }
    });
    groups.forEach(function (g) {
      if (!g.length) return;
      var sec = document.createElement('section');
      sec.className = 'sec';
      content.insertBefore(sec, g[0]);
      g.forEach(function (n) { sec.appendChild(n); });
    });
  }

  /* ==========================================================================
     boot — wrap, then reveal. reveal-on is added here (not in <head>) so that
     if this script ever fails to load, content is never left hidden.
     ========================================================================== */
  ready(function () {
    document.documentElement.classList.add('reveal-on');
    try { initWrap(); } catch (e) {}
    try { initReveal(); } catch (e) {}
    try { initStarfield(); } catch (e) {}
    try { initRotator(); } catch (e) {}
  });
})();

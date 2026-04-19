/**
 * Floral cursor trail — roses, leaves, and soft sparkles.
 * window.VineTrail.init(canvas?) → destroy()
 */
(function () {
  // ============ TUNING (edit freely) ============
  /** Max simultaneous sprite items (leaf | rose | sparkle) */
  const MAX_TRAIL_ITEMS = 110;

  /** Pointer travel (CSS px) before a new placement — lower = denser trail */
  const SPAWN_DISTANCE_MIN = 5;
  const SPAWN_DISTANCE_MAX = 9;

  /** Draw width (CSS px) at scale 1 — height follows aspect ratio */
  const ROSE_SIZE_MIN = 56;
  const ROSE_SIZE_MAX = 88;
  const ROSE_BLOOM_SIZE_MIN = 96;
  const ROSE_BLOOM_SIZE_MAX = 118;
  /** Among rose placements, chance to use a larger “bloom” size */
  const ROSE_BLOOM_CHANCE = 0.12;

  const LEAF_SIZE_MIN = 36;
  const LEAF_SIZE_MAX = 64;

  const SPARKLE_SIZE_MIN = 34;
  const SPARKLE_SIZE_MAX = 52;

  /**
   * Main placement roll (sums to 1):
   * SPARKLE_PATH_CHANCE — tight sparkle cluster (replaces former vine connector)
   */
  const SPARKLE_PATH_CHANCE = 0.42;
  const LEAF_CHANCE = 0.32;
  const SPARKLE_CHANCE = 0.16;
  /* remainder ~0.10 = rose */

  /** Sparkles placed along former “vine” band (per placement) */
  const SPARKLE_PATH_COUNT_MIN = 2;
  const SPARKLE_PATH_COUNT_MAX = 3;

  /** Life ranges (frames @ ~60fps) */
  const LIFE_LEAF_MIN = 36;
  const LIFE_LEAF_MAX = 54;
  const LIFE_ROSE_MIN = 42;
  const LIFE_ROSE_MAX = 68;
  const LIFE_SPARKLE_MIN = 24;
  const LIFE_SPARKLE_MAX = 40;

  /** Sprite URLs — filenames match your edited assets (typo RSparlkles preserved) */
  const roseSprites = ["R1.png", "R2.png", "R3.png"];
  const leafSprites = ["RLeaves1.png", "RLeave2.png", "RLeaves3.png"];
  const sparkleSprites = ["RSparlkles3.png"];

  /** Trail sprite PNGs live under /sprites/ (not /public/ — Vercel static builds only that folder). */
  const SPRITE_BASE = new URL("sprites/", window.location.href);

  function spriteUrl(name) {
    return new URL(name, SPRITE_BASE).href;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  /** Alpha curve: stay strong most of life, ease out near the end */
  function lifeAlpha(life, maxLife) {
    const t = Math.max(0, Math.min(1, life / maxLife));
    return Math.pow(t, 0.38);
  }

  function loadImages(urls) {
    const images = urls.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
    return Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    ).then(() => images);
  }

  function sparkleWidthForIndex(index) {
    const t = index / Math.max(1, sparkleSprites.length - 1);
    return SPARKLE_SIZE_MIN + t * (SPARKLE_SIZE_MAX - SPARKLE_SIZE_MIN);
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  function init(canvas) {
    const el =
      canvas && canvas.getContext
        ? canvas
        : document.getElementById("vine-trail");
    if (!el || !el.getContext) {
      return function noop() {};
    }

    const ctx = el.getContext("2d", { alpha: true });
    let rafId = 0;
    let running = false;
    let imagesReady = false;

    /** @type {HTMLImageElement[]} */
    let roseImgs = [];
    /** @type {HTMLImageElement[]} */
    let leafImgs = [];
    /** @type {HTMLImageElement[]} */
    let sparkleImgs = [];

    /**
     * @type {{
     *   x: number;
     *   y: number;
     *   life: number;
     *   maxLife: number;
     *   type: "leaf" | "rose" | "sparkle";
     *   spriteIndex: number;
     *   rotation: number;
     *   rotationSpeed: number;
     *   scale: number;
     *   driftX: number;
     *   driftY: number;
     *   swayPhase: number;
     *   swayAmp: number;
     *   targetWidth: number;
     *   pulsePhase: number;
     *   isBloom: boolean;
     * }[]}
     */
    const items = [];

    let lastMoveX = null;
    let lastMoveY = null;
    let distSinceSpawn = 0;
    let nextSpawnThreshold = rand(SPAWN_DISTANCE_MIN, SPAWN_DISTANCE_MAX);

    function trimSprites() {
      while (items.length > MAX_TRAIL_ITEMS) {
        items.shift();
      }
    }

    function addSprite(type, x, y, overrides) {
      const base = {
        x,
        y,
        life: 0,
        maxLife: 0,
        type,
        spriteIndex: 0,
        rotation: rand(0, Math.PI * 2),
        rotationSpeed: rand(-0.007, 0.007),
        scale: rand(0.96, 1.06),
        driftX: rand(-0.35, 0.35),
        driftY: rand(-0.35, 0.35),
        swayPhase: rand(0, Math.PI * 2),
        swayAmp:
          type === "leaf" ? rand(2.2, 5.5) : type === "sparkle" ? rand(1.2, 2.8) : rand(1.2, 3.2),
        targetWidth: 40,
        pulsePhase: rand(0, Math.PI * 2),
        isBloom: false,
      };

      if (type === "rose") {
        base.spriteIndex = randInt(0, roseSprites.length - 1);
        const bloom = Math.random() < ROSE_BLOOM_CHANCE;
        base.isBloom = bloom;
        base.targetWidth = bloom
          ? rand(ROSE_BLOOM_SIZE_MIN, ROSE_BLOOM_SIZE_MAX)
          : rand(ROSE_SIZE_MIN, ROSE_SIZE_MAX);
        base.life = randInt(LIFE_ROSE_MIN, LIFE_ROSE_MAX);
      } else if (type === "leaf") {
        base.spriteIndex = randInt(0, leafSprites.length - 1);
        base.targetWidth = rand(LEAF_SIZE_MIN, LEAF_SIZE_MAX);
        base.life = randInt(LIFE_LEAF_MIN, LIFE_LEAF_MAX);
      } else {
        base.spriteIndex = randInt(0, sparkleSprites.length - 1);
        const w0 = sparkleWidthForIndex(base.spriteIndex);
        base.targetWidth = rand(w0 * 0.88, w0 * 1.08);
        base.life = randInt(LIFE_SPARKLE_MIN, LIFE_SPARKLE_MAX);
      }

      Object.assign(base, overrides);
      base.maxLife = base.life;
      items.push(base);
      trimSprites();
    }

    /** Soft sparkle band along pointer path. */
    function addSparklePathBand(cx, cy) {
      const n = randInt(SPARKLE_PATH_COUNT_MIN, SPARKLE_PATH_COUNT_MAX);
      for (let i = 0; i < n; i++) {
        const w0 = sparkleWidthForIndex(0);
        addSprite("sparkle", cx + rand(-10, 10), cy + rand(-10, 10), {
          spriteIndex: 0,
          targetWidth: rand(w0 * 0.92, w0 * 1.05),
          life: randInt(LIFE_SPARKLE_MIN + 4, LIFE_SPARKLE_MAX + 8),
          driftX: rand(-0.12, 0.12),
          driftY: rand(-0.12, 0.12),
        });
      }
    }

    function placeCluster(x, y) {
      const r = Math.random();

      if (r < SPARKLE_PATH_CHANCE) {
        addSparklePathBand(x, y);
      } else if (r < SPARKLE_PATH_CHANCE + LEAF_CHANCE) {
        addSprite("leaf", x, y, {});
        if (Math.random() < 0.38) {
          addSprite("leaf", x + rand(-20, 20), y + rand(-20, 20), {});
        }
        if (Math.random() < 0.35) {
          addSprite("sparkle", x + rand(-14, 14), y + rand(-14, 14), {});
        }
      } else if (r < SPARKLE_PATH_CHANCE + LEAF_CHANCE + SPARKLE_CHANCE) {
        addSprite("sparkle", x, y, {});
        if (Math.random() < 0.22) {
          const n = randInt(1, 3);
          for (let i = 0; i < n; i++) {
            addSprite("sparkle", x + rand(-22, 22), y + rand(-22, 22), {});
          }
        }
      } else {
        addSprite("rose", x, y, {});
        if (Math.random() < 0.45) {
          addSprite("leaf", x + rand(-20, 18), y + rand(-20, 18), {
            targetWidth: rand(LEAF_SIZE_MIN, LEAF_SIZE_MAX * 0.92),
          });
        }
        if (Math.random() < 0.3) {
          addSprite("sparkle", x + rand(-16, 16), y + rand(-16, 16), {});
        }
      }

      if (Math.random() < 0.08) {
        addSparklePathBand(x + rand(-4, 4), y + rand(-4, 4));
      }
    }

    function onPointerMove(clientX, clientY) {
      if (!imagesReady) return;

      if (lastMoveX !== null && lastMoveY !== null) {
        distSinceSpawn += Math.hypot(clientX - lastMoveX, clientY - lastMoveY);
      }
      lastMoveX = clientX;
      lastMoveY = clientY;

      let spawnBursts = 0;
      while (distSinceSpawn >= nextSpawnThreshold && spawnBursts < 4) {
        spawnBursts += 1;
        distSinceSpawn -= nextSpawnThreshold;
        nextSpawnThreshold = rand(SPAWN_DISTANCE_MIN, SPAWN_DISTANCE_MAX);
        placeCluster(clientX, clientY);
      }
    }

    function onMove(ev) {
      onPointerMove(ev.clientX, ev.clientY);
    }

    function onTouch(ev) {
      const t = ev.touches && ev.touches[0];
      if (!t) return;
      onPointerMove(t.clientX, t.clientY);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      el.width = Math.floor(w * dpr);
      el.height = Math.floor(h * dpr);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawSpriteItem(it, now) {
      const imgList =
        it.type === "rose" ? roseImgs : it.type === "leaf" ? leafImgs : sparkleImgs;
      const img = imgList[it.spriteIndex];
      if (!img || !img.complete || !img.naturalWidth) return;

      const tLife = it.life / it.maxLife;
      const baseAlpha = lifeAlpha(it.life, it.maxLife);
      const sway =
        Math.sin(now * 0.0028 + it.swayPhase) * it.swayAmp +
        Math.cos(now * 0.0019 + it.swayPhase * 0.7) * (it.swayAmp * 0.35);

      let alpha = baseAlpha;
      let scaleMul = it.scale;

      if (it.type === "rose") {
        scaleMul *= 0.88 + 0.12 * tLife;
      } else if (it.type === "leaf") {
        scaleMul *= 0.9 + 0.1 * tLife;
      } else {
        const pulse = 0.9 + 0.1 * Math.sin(now * 0.005 + it.pulsePhase);
        alpha = Math.min(1, baseAlpha * pulse);
        scaleMul *= 0.97 + 0.03 * pulse;
      }

      const tw = it.targetWidth * scaleMul;
      const th = tw * (img.naturalHeight / img.naturalWidth);
      const drawX = it.x + it.driftX * 0.25 + sway * 0.08;
      const drawY = it.y + it.driftY * 0.25 + sway * 0.06;

      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(it.rotation);
      ctx.globalAlpha = alpha;

      if (it.type === "rose") {
        ctx.shadowBlur = it.isBloom ? 22 : 16;
        ctx.shadowColor = "rgba(255, 175, 120, 0.45)";
        ctx.drawImage(img, -tw / 2, -th / 2, tw, th);
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      } else if (it.type === "leaf") {
        ctx.drawImage(img, -tw / 2, -th / 2, tw, th);
      } else {
        ctx.shadowBlur = 5;
        ctx.shadowColor = "rgba(255, 216, 180, 0.2)";
        ctx.drawImage(img, -tw / 2, -th / 2, tw, th);
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      ctx.restore();
    }

    function tick() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const now = performance.now();

      if (imagesReady) {
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.x += it.driftX;
          it.y += it.driftY;
          it.rotation += it.rotationSpeed;
          it.life -= 1;
          if (it.life <= 0) items.splice(i, 1);
        }

        for (let pass = 0; pass < 3; pass++) {
          const want =
            pass === 0 ? "leaf" : pass === 1 ? "rose" : "sparkle";
          for (let i = 0; i < items.length; i++) {
            if (items[i].type === want) drawSpriteItem(items[i], now);
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    }

    function stopLoop() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const roseUrls = roseSprites.map(spriteUrl);
    const leafUrls = leafSprites.map(spriteUrl);
    const sparkleUrls = sparkleSprites.map(spriteUrl);

    Promise.all([
      loadImages(roseUrls),
      loadImages(leafUrls),
      loadImages(sparkleUrls),
    ]).then(([r, l, s]) => {
      roseImgs = r;
      leafImgs = l;
      sparkleImgs = s;
      imagesReady = true;
    });

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    start();

    return function destroy() {
      stopLoop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      items.length = 0;
      lastMoveX = null;
      lastMoveY = null;
      distSinceSpawn = 0;
      imagesReady = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }

  window.VineTrail = { init };
})();

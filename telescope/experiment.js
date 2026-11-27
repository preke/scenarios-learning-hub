(() => {
  "use strict";

  const WIDTH = 720;
  const HEIGHT = 360;
  const SPEED = 6;
  const TIMES = [4, 16, 28];
  const EXPOSURES = [0.5, 1, 3, 5];
  const direction = { x: 2 / Math.sqrt(5), y: -1 / Math.sqrt(5) };
  const mounted = new WeakMap();

  function generator(seed) {
    let value = seed;
    return () => {
      value = (Math.imul(1664525, value) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  // Use the same reference stars and detector coordinates for all exposures.
  const starSignal = new Float32Array(WIDTH * HEIGHT);
  function addPoint(signal, x, y, flux, sigma) {
    const radius = Math.ceil(3 * sigma);
    for (let row = Math.max(0, Math.floor(y) - radius); row <= Math.min(HEIGHT - 1, Math.ceil(y) + radius); row++) {
      for (let col = Math.max(0, Math.floor(x) - radius); col <= Math.min(WIDTH - 1, Math.ceil(x) + radius); col++) {
        const d2 = (row - y) ** 2 + (col - x) ** 2;
        signal[row * WIDTH + col] += flux * Math.exp(-d2 / (2 * sigma * sigma));
      }
    }
  }

  const stars = generator(18423);
  for (let i = 0; i < 620; i++) {
    const x = stars() * WIDTH;
    const y = stars() * HEIGHT;
    const brightness = 0.04 + 2.2 * stars() ** 5;
    addPoint(starSignal, x, y, brightness, 0.63 + stars() * 0.35);
    if (brightness > 1) addPoint(starSignal, x, y, brightness * 0.037, 2.5);
  }

  function targetPosition(frame) {
    const travel = (TIMES[frame] - TIMES[0]) * SPEED;
    return { x: 206 + travel * direction.x, y: 213 + travel * direction.y };
  }

  function renderImage(context, frame, exposure) {
    const target = targetPosition(frame);
    const length = exposure * SPEED;
    const signal = new Float32Array(WIDTH * HEIGHT);
    // Integrate the same point-spread function along a short linear path.
    const samples = Math.ceil(length * 3);
    for (let i = 0; i < samples; i++) {
      const offset = ((i + 0.5) / samples - 0.5) * length;
      addPoint(signal, target.x + offset * direction.x, target.y + offset * direction.y, 5.3 * exposure / samples, 0.98);
    }

    const noise = generator(8237 + frame * 181);
    const image = context.createImageData(WIDTH, HEIGHT);
    for (let i = 0; i < signal.length; i++) {
      const light = starSignal[i] * exposure + signal[i];
      const tone = 1 - Math.exp(-light);
      const background = 10 + 3 * exposure ** 0.45 + (noise() + noise() - 1) * (9 + exposure);
      const k = i * 4;
      image.data[k] = background + 222 * tone;
      image.data[k + 1] = background + 3 + 227 * tone;
      image.data[k + 2] = background + 9 + 221 * tone;
      image.data[k + 3] = 255;
    }
    return image;
  }

  function drawLocator(ctx, x, y, radius) {
    ctx.strokeStyle = "#91c8d4";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ctx.moveTo(x + sx * (radius - 5), y + sy * radius);
        ctx.lineTo(x + sx * radius, y + sy * radius);
        ctx.lineTo(x + sx * radius, y + sy * (radius - 5));
      }
    }
    ctx.stroke();
  }

  const btn = (action, label) => '<button type="button" data-' + action + '>' + label + '</button>';
  const frameNumber = i => String(i + 1).padStart(2, "0");

  window.createExposureLab = function createExposureLab(host, { saved, onChange } = {}) {
    mounted.get(host)?.();
    const records = {
      short: [0.5, 1].includes(saved?.short) ? saved.short : null,
      long: [3, 5].includes(saved?.long) ? saved.long : null
    };
    let exposure = records.short || 0.5;
    let frame = 0;
    let timer = null;

    host.innerHTML = `<section class="tel-exp" aria-label="曝光对照实验">
      <div class="tel-exp-grid">
        <div class="tel-exp-view">
          <div class="tel-exp-viewhead"><div><span class="tel-exp-overline">FOCAL PLANE</span><h2>焦平面星图</h2></div><span class="tel-exp-chip">模拟底片</span></div>
          <div class="tel-exp-picture">
            <canvas class="tel-exp-sky" width="${WIDTH}" height="${HEIGHT}" role="img">三张模拟照片中的恒星位置相同，一个候选体向右上方移动。</canvas>
            <div class="tel-exp-inset" aria-hidden="true"><canvas width="156" height="96"></canvas><span>候选体局部 ×3</span></div>
          </div>
          <div class="tel-exp-film"><div role="group" aria-label="选择底片">${TIMES.map((time, index) => btn('frame="' + index + '" aria-label="底片 ' + frameNumber(index) + '，曝光中点 ' + time + ' 秒"', frameNumber(index))).join("")}</div>
          ${btn("play", '<span aria-hidden="true">▷</span> 轮播底片')}</div>
          <div class="tel-exp-legend"><span data-time></span><label><input type="checkbox" data-locator checked> 显示位置框</label></div>
        </div>
        <div class="tel-exp-controls">
          <h2>同一片天空，两次曝光</h2>
          <p>望远镜跟随恒星转动。保持像面速度相同，各记录一次短曝光和长曝光，比较候选体留下的拖线。</p>
          <fieldset><legend>单张曝光时间</legend>
            <div class="tel-exp-options">${EXPOSURES.map(t => btn('exposure="' + t + '"', t + ' 秒')).join("")}</div>
          </fieldset>
          <dl class="tel-exp-readings"><div><dt>模拟像面速度</dt><dd>6 <small>像素/秒</small></dd></div><div><dt>曝光期间位移</dt><dd><span data-length></span> <small>像素</small></dd></div></dl>
          <button type="button" class="tel-exp-record" data-save>记录这次曝光</button>
          <details><summary>怎样读这张底片？</summary><p>每张底片都有相同的背景恒星。位置框标出模拟候选体，右下角放大它周围的原始像素。拖线的方向和长度反映它在一次曝光期间的移动。</p></details>
        </div>
      </div>
      <section class="tel-exp-log"><h3>曝光对照记录</h3><div class="tel-exp-entries">
        <div><span>短曝光</span><b data-short></b></div><div><span>长曝光</span><b data-long></b></div>
      </div><p data-feedback role="status"></p></section>
    </section>`;

    const root = host.querySelector(".tel-exp");
    const find = selector => root.querySelector(selector);
    const field = find(".tel-exp-sky");
    const context = field.getContext("2d");
    const zoom = find(".tel-exp-inset canvas");
    const zoomContext = zoom.getContext("2d");
    const locator = find("[data-locator]");
    const playButton = find("[data-play]");
    const cache = new Map();
    function showFrame() {
      const point = targetPosition(frame);
      if (context && zoomContext) {
        const key = exposure + "/" + frame;
        if (!cache.has(key)) cache.set(key, renderImage(context, frame, exposure));
        context.putImageData(cache.get(key), 0, 0);
        zoomContext.imageSmoothingEnabled = false;
        zoomContext.drawImage(field, Math.round(point.x) - 26, Math.round(point.y) - 16, 52, 32, 0, 0, zoom.width, zoom.height);
        if (locator.checked) drawLocator(context, Math.round(point.x) + 0.5, Math.round(point.y) + 0.5, 23);
      }
      field.setAttribute("aria-label", '底片 ' + frameNumber(frame) + '，曝光中点 ' + TIMES[frame] + ' 秒。曝光 ' + exposure + ' 秒。恒星位置固定，候选体向右上方划过 ' + exposure * SPEED + ' 像素。');
      find("[data-time]").textContent = "曝光中点  +" + TIMES[frame] + " 秒";
      root.querySelectorAll("[data-frame]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.frame === frame));
    }

    function updateRecords() {
      for (const group of ["short", "long"]) {
        const t = records[group];
        find('[data-' + group + ']').textContent = t === null ? (group === "short" ? "待记录 · 0.5 或 1 秒" : "待记录 · 3 或 5 秒") : t + " 秒  /  位移 " + t * SPEED + " 像素";
      }
      const group = exposure <= 1 ? "short" : "long";
      const saveButton = find("[data-save]");
      saveButton.disabled = records[group] === exposure;
      saveButton.textContent = saveButton.disabled ? "已记录这次曝光" : (records[group] ? "更新" : "记录") + (group === "short" ? "短曝光" : "长曝光");
      const feedback = find("[data-feedback]");
      feedback.classList.toggle("tel-exp-complete", records.short !== null && records.long !== null);
      if (records.short && records.long) {
        const ratio = Number((records.long / records.short).toFixed(1));
        feedback.textContent = "两组记录齐了。曝光时间增加到 " + ratio + " 倍，候选体划过的距离也增加到 " + ratio + " 倍。比较底片会看到，长曝光把运动信号铺在更多像素上。";
      } else if (records.short) {
        feedback.textContent = "短曝光已记录。把曝光改为 3 秒或 5 秒，观察局部放大图，再记录一次。";
      } else if (records.long) {
        feedback.textContent = "长曝光已记录。再用 0.5 秒或 1 秒拍摄同一星场，看看拖线有多短。";
      } else {
        feedback.textContent = "先选一次曝光，观察右下角的放大图，再把结果记下来。";
      }
    }

    function updateExposure() {
      root.querySelectorAll("[data-exposure]").forEach(b => b.setAttribute("aria-pressed", +b.dataset.exposure === exposure));
      find("[data-length]").textContent = exposure * SPEED;
      showFrame();
      updateRecords();
    }

    function setPlaying(playing) {
      window.clearInterval(timer);
      timer = null;
      if (playing) {
        timer = window.setInterval(() => {
          if (!root.isConnected || !root.getClientRects().length || document.hidden) {
            setPlaying(false);
            return;
          }
          frame = (frame + 1) % TIMES.length;
          showFrame();
        }, 950);
      }
      playButton.setAttribute("aria-pressed", playing);
      playButton.innerHTML = playing ? '<span aria-hidden="true">Ⅱ</span> 暂停轮播' : '<span aria-hidden="true">▷</span> 轮播底片';
    }

    root.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-exposure")) {
        exposure = +b.dataset.exposure;
        updateExposure();
      } else if (b.hasAttribute("data-frame")) {
        setPlaying(false);
        frame = +b.dataset.frame;
        showFrame();
      } else if (b.hasAttribute("data-play")) {
        setPlaying(timer === null);
      } else if (b.hasAttribute("data-save")) {
        records[exposure <= 1 ? "short" : "long"] = exposure;
        updateRecords();
        onChange?.({ ...records }, Boolean(records.short && records.long));
      }
    });
    locator.addEventListener("change", showFrame);
    updateExposure();
    setPlaying(false);
    const cleanup = () => {
      setPlaying(false);
      cache.clear();
      root.remove();
      mounted.delete(host);
    };
    mounted.set(host, cleanup);
    return cleanup;
  };
})();

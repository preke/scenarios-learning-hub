(() => {
  "use strict";
  const $ = selector => document.querySelector(selector), $$ = selector => [...document.querySelectorAll(selector)];
  const glyph = name => '<i data-icon="' + name + '"></i>';
  const parts = {
    supply: {
      title: "直流电源",
      en: "DC POWER SUPPLY",
      icon: "power",
      desc:
          "电源让正负两端保持 5.0 V 电势差。红色端子是正极，深色端子是负极。闭合回路后，常规电流从正极流出，经过元件回到负极。",
      tags: ["5.0 V", "直流输出"]
    },
    resistor: {
      title: "限流电阻",
      en: "SERIES RESISTOR",
      icon: "resistor",
      desc:
          "电阻可以从任一端接入。它与 LED 串联后，两者流过相同的电流。电源和 LED 压降给定时，选用更大的电阻，回路电流就会变小。",
      tags: ["R1", "无极性"]
    },
    led: {
      title: "红色 LED",
      en: "LIGHT-EMITTING DIODE",
      icon: "solar",
      desc:
          "电流从阳极 A 流入、从阴极 K 流出时，LED 可以发光。常见全新直插式 LED 的长引脚是阳极，外壳平边通常标示阴极；辨认具体器件时应核对数据表。",
      tags: ["正向压降约 2.0 V", "有极性"]
    },
    board: {
      title: "面包板",
      en: "SOLDERLESS BREADBOARD",
      icon: "layers",
      desc:
          "板内的金属夹片把同一列、同一侧的五个插孔相连。中央凹槽把两侧隔开。导线与元件引脚插在同一组连通孔里，就能建立电气连接。",
      tags: ["五孔一组", "免焊连接"]
    }
  };
  const pins = {
    p: ["+", "电源正极"],
    n: ["−", "电源负极"],
    r1: ["1", "电阻端 1"],
    r2: ["2", "电阻端 2"],
    a: ["A", "LED 阳极"],
    k: ["K", "LED 阴极"]
  };
  const reference = [["p", "r1"], ["r2", "a"], ["k", "n"]], resistors = [100, 150, 220, 270, 330, 470, 680, 1000];
  const labels = ["认识元件", "连接电路", "测量与选型"];
  const prompts = [
    ["电阻接在 LED 的阴极一侧，还能限流吗？", "可以。只要电阻和 LED 位于同一条串联回路中，两者流过的电流就相同。"],
    [
      "电路已经连成一圈，为什么指示灯仍可能不亮？",
      "还需要检查 LED 的极性。常规电流沿阳极 A 到阴极 K 的方向通过 LED，反向连接时，本实验模型中的电流为零。"
    ],
    [
      "为什么用 3 V 除以电阻，而不是直接用 5 V？",
      "LED 正向工作时约占去 2.0 V，余下约 3.0 V 加在电阻两端。欧姆定律中的电压应取电阻自身两端的电压。"
    ]
  ];
  const storage = "scenarios.circuit.v1";
  function check(connections) {
    const links = new Map();
    for (const [a, b] of connections) {
      links.set(a, b);
      links.set(b, a);
    }
    let entry = links.get("p"), hasResistor = false, hasLed = false, reversed = false;
    for (let i = 0; i < 3; i++) {
      if (!entry) return "open";
      if (entry === "n") {
        if (!hasResistor && !hasLed) return "short";
        if (!hasResistor) return "unlimited";
        if (!hasLed) return "bypass";
        return reversed ? "reverse" : "good";
      }
      if (entry === "r1" || entry === "r2") {
        hasResistor = true;
        entry = links.get(entry === "r1" ? "r2" : "r1");
      } else if (entry === "a" || entry === "k") {
        hasLed = true;
        reversed = entry === "k";
        entry = links.get(reversed ? "a" : "k");
      } else
        return "open";
    }
    return "bypass";
  }
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storage)) || {};
  } catch {
  }
  const seen = new Set((Array.isArray(saved.seen) ? saved.seen : []).filter(x => Object.hasOwn(parts, x)));
  const used = new Set(), connections = [];
  for (const pair of Array.isArray(saved.wires) ? saved.wires : []) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const [a, b] = pair;
    if (a === b || !Object.hasOwn(pins, a) || !Object.hasOwn(pins, b) || used.has(a) || used.has(b)) continue;
    used.add(a);
    used.add(b);
    connections.push([a, b]);
  }
  const readings = [...new Set((Array.isArray(saved.readings) ? saved.readings : []).filter(r => resistors.includes(r)))];
  let resistance = resistors.includes(saved.resistance) ? saved.resistance : 220;
  let powered = saved.powered === true && check(connections) === "good";
  let wiredBefore = powered || saved.wiredBefore === true;
  let stage = [0, 1, 2].includes(saved.stage) ? saved.stage : 0, page = "studio",
      mode = stage === 1 || (stage === 2 && !window.benchModel) ? "diagram" : "model",
      part = Object.hasOwn(parts, saved.part) ? saved.part : "supply", pending = null;
  let wiringMessage = powered ? "回路已接通，红灯点亮。" : "", measurementMessage = "";
  seen.add(part);
  const current = r => 3000 / r, inRange = r => current(r) >= 8 && current(r) <= 12;
  const complete = () => [seen.size === 4, wiredBefore, readings.some(inRange)];
  function persist() {
    try {
      localStorage.setItem(
          storage,
          JSON.stringify({seen: [...seen], wires: connections, resistance, powered, wiredBefore, readings, part, stage}));
    } catch {
    }
  }
  function describe(name) {
    part = name;
    seen.add(part);
    render();
  }
  $("#parts").innerHTML =
      Object.entries(parts)
          .map(([id, p]) => '<button class="part" data-part="' + id + '">' + glyph(p.icon) + p.title + '</button>')
          .join("");
  $("#pins").innerHTML = Object.entries(pins)
                             .map(
                                 ([id, [short, label]]) => '<button class="part" data-pin="' + id +
                                     '"><span class="pin-id">' + short + '</span>' + label + '</button>')
                             .join("");
  $("#resistance").innerHTML = resistors.map(r => '<option value="' + r + '">' + r + ' Ω</option>').join("");
  const diagramNodes = {p: [124, 105], n: [124, 242], r1: [292, 96], r2: [474, 96], a: [567, 134], k: [567, 226]};
  function diagram(pairs, power, currentValue, r, ref) {
    const C = "#b7e6d9",
          text = (x, y, v, size = 13, anchor = "middle", fill = "#ccebe2") => '<text x="' + x + '" y="' + y + '" fill="' +
        fill + '" font-size="' + size + '" text-anchor="' + anchor + '">' + v + '</text>';
    // Lead each wire away from its terminal before routing around the components.
    const routes = {
      "p-n": [[124, 81], [66, 81], [66, 263], [124, 263]],
      "p-r1": [[124, 96]],
      "p-r2": [[124, 52], [513, 52], [513, 96]],
      "p-a": [[124, 39], [567, 39]],
      "p-k": [[124, 78], [62, 78], [62, 259], [567, 259]],
      "n-r1": [[124, 260], [247, 260], [247, 96]],
      "n-r2": [[124, 275], [517, 275], [517, 96]],
      "n-a": [[124, 282], [46, 282], [46, 49], [567, 49]],
      "n-k": [[124, 279], [567, 279]],
      "r1-r2": [[257, 96], [257, 49], [502, 49], [502, 96]],
      "r1-a": [[261, 96], [261, 56], [567, 56]],
      "r1-k": [[263, 96], [263, 250], [567, 250]],
      "r2-a": [[567, 96]],
      "r2-k": [[501, 96], [501, 258], [567, 258]],
      "a-k": [[567, 112], [630, 112], [630, 251], [567, 251]]
    };
    function wirePath(a, b) {
      const ids = Object.keys(pins);
      if (ids.indexOf(a) > ids.indexOf(b)) [a, b] = [b, a];
      const points = [diagramNodes[a], ...routes[a + "-" + b], diagramNodes[b]];
      return '<polyline points="' + points.map(p => p.join(",")).join(" ") + '" fill="none" stroke="' +
          (a === "p"                  ? "#f69e85" :
               a === "n" || b === "n" ? "#88b6d5" :
                                        "#e1c078") +
          '" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    const wires = pairs.map(([a, b]) => wirePath(a, b)).join("");
    const interactive = stage === 1;
    const nodes = Object.entries(diagramNodes)
                      .map(([id, [x, y]]) => {
                        const selected = interactive && pending === id, linked = interactive && used.has(id);
                        const fill = selected ? "#f6ce60" : linked ? "#91bfb3" : "#183435";
                        const ring = '<circle cx="' + x + '" cy="' + y + '" r="' + (interactive ? 7 : 5) + '" fill="' +
                            fill + '" stroke="' + (selected ? "#fff6c1" : C) + '" stroke-width="2.8"/>';
                        if (!interactive) return ring;
                        return '<g class="diagram-pin" data-terminal="' + id + '" role="button" tabindex="' +
                            (linked ? -1 : 0) + '" aria-label="' + pins[id][1] + '" aria-pressed="' + selected +
                            '" aria-disabled="' + linked + '"><title>' + pins[id][1] + '</title><circle class="hit" cx="' +
                            x + '" cy="' + y + '" r="23"/>' + ring + '</g>';
                      })
                      .join("");
    $("#circuit-diagram").innerHTML = '<svg viewBox="0 0 700 330" role="' + (interactive ? "group" : "img") +
        '" aria-label="' + (ref ? "参考串联电路" : "当前接线图，已接 " + pairs.length + " 根导线") +
        '"><g font-family="Menlo,Consolas,monospace">' + wires + '<g fill="none" stroke="' + C +
        '" stroke-width="3"><path d="M124 105v55m0 18v64m-21-82h42m-33 18h24M292 96h37m109 0h36"/><rect x="329" y="83" width="109" height="26" rx="2"/><path d="M567 134v25m0 30v37m-17-38h34"/><path d="M550 159h34l-17 28z" fill="' +
        (power ? "#f47b60" : "#38605b") + '"/><path d="M590 169l18-16m-6 1l7-2-2 7m-12 20l18-16m-6 1l7-2-2 7"/></g>' +
        text(86, 152, "+", 17) + text(86, 190, "−", 17) + text(79, 172, "5.0 V", 14) +
        text(383, 67, "R1 · " + r + " Ω", 16) + text(292, 121, "1", 14) + text(474, 121, "2", 14) + text(124, 78, "+", 15) +
        text(124, 266, "−", 15) + text(605, 134, "A", 14) + text(605, 230, "K", 14) + text(641, 194, "LED", 16) +
        text(350, 315, power ? ("I = " + currentValue.toFixed(2) + " mA") : (ref ? "参考回路" : "输出断开"), 15) + nodes +
        '</g></svg>';
  }
  const pinText = id => pins[id][1];
  function render() {
    const isRef = stage === 0, activePower = isRef || powered, activeR = isRef ? 330 : resistance,
          amp = activePower ? current(activeR) : 0;
    $("#studio").hidden = page !== "studio";
    $("#notes").hidden = page !== "notes";
    for (const b of $$("[data-page]")) {
      if (b.dataset.page === page)
        b.setAttribute("aria-current", "page");
      else
        b.removeAttribute("aria-current");
    }
    for (const b of $$(".step")) {
      const n = Number(b.dataset.stage);
      if (stage === n)
        b.setAttribute("aria-current", "step");
      else
        b.removeAttribute("aria-current");
      b.classList.toggle("done", complete()[n] && stage !== n);
    }
    ["inspect-panel", "wiring-panel", "measure-panel"].forEach((id, index) => $("#" + id).hidden = stage !== index);
    const done = complete().filter(Boolean).length;
    $("#progress-count").textContent = done + " / 3";
    $("#progress-ring").style.setProperty("--p", (done * 120) + "deg");
    for (const b of $$("[data-part]")) b.setAttribute("aria-pressed", String(b.dataset.part === part));
    const detail = parts[part];
    $("#part-en").textContent = detail.en;
    $("#part-title").textContent = detail.title;
    $("#part-copy").textContent = detail.desc;
    $("#part-tags").innerHTML = detail.tags.map(t => "<span>" + t + "</span>").join("");
    for (const b of $$("[data-pin]")) {
      const id = b.dataset.pin;
      b.disabled = used.has(id);
      b.setAttribute("aria-pressed", String(pending === id));
    }
    $("#wire-count").textContent = connections.length + " / 3 根";
    $("#wire-list").innerHTML =
        connections
            .map(
                ([a, b], i) => '<li><span>' + pinText(a) + ' ↔ ' + pinText(b) + '</span><button data-remove="' + i +
                    '" aria-label="拆除' + pinText(a) + '到' + pinText(b) + '的导线">拆除</button></li>')
            .join("");
    $("#wire-feedback").textContent = pending ? "已选" + pinText(pending) + "，请选择另一端。" : wiringMessage;
    $("#wire-feedback").classList.toggle("good", powered);
    $("#resistance").value = String(resistance);
    $("#ammeter").textContent = powered ? amp.toFixed(2) : "—";
    $("#measure").disabled = !powered;
    $("#resistance").disabled = !powered;
    $("#measure-feedback").textContent =
        powered ? (measurementMessage || "电路已接通。改变阻值，比较电流。") : "先在「连接电路」中接线并通过通电检查。";
    $("#measure-feedback").classList.toggle("good", powered && measurementMessage.startsWith("达到目标"));
    for (const b of $$("[data-mode]")) b.setAttribute("aria-pressed", String(mode === b.dataset.mode));
    $("#circuit-diagram").hidden = mode !== "diagram";
    $("#model-mount").hidden = mode !== "model";
    $("#view-tools").hidden = mode !== "model" || !window.benchModel;
    $("#view-title").textContent = mode === "diagram" ? "串联电路图" : "直流实验台";
    $("#view-tip").textContent = !window.benchModel && mode === "model" ? "参考装配照片 · 330 Ω" :
        stage === 1 && mode === "diagram" ? (powered ? "回路已接通" : "选择图中两个端子接线") :
        isRef ? (mode === "diagram" ? "参考装配 · 330 Ω" : "参考装配 · " + (window.benchModel ? "拖动旋转" : "实物示意")) :
                ((powered ? "回路已接通" : "输出断开") + (mode === "model" && window.benchModel ? " · 拖动旋转" : ""));
    diagram(isRef ? reference : connections, activePower, amp, activeR, isRef);
    window.benchModel?.update({
      connections: isRef ? reference : connections,
      resistance: activeR,
      current: amp,
      powered: activePower,
      part: isRef ? part : null,
      label: detail.title,
      active: page === "studio" && mode === "model"
    });
    $("#prompt").textContent = prompts[stage][0];
    $("#answer").textContent = prompts[stage][1];
    $("#stage-status").textContent = [
      seen.size + " / 4 个元件已探索", connections.length + " / 3 根导线已连接", readings.length + " 个阻值已记录"
    ][stage];
    $("#advance").textContent = ["进入连接电路 →", "进入测量与选型 →", "查看学习进度 →"][stage];
    $("#records").hidden = stage !== 2 || !readings.length;
    $("#records-body").innerHTML =
        readings
            .map(
                r => "<tr><td>" + r + " Ω</td><td>5.0 V</td><td>" + current(r).toFixed(2) + " mA</td><td>" +
                    (inRange(r)          ? "达标" :
                         current(r) > 12 ? "偏高" :
                                           "偏低") +
                    "</td></tr>")
            .join("");
    window.fillWorkbenchIcons?.();
    persist();
  }
  function goStage(n) {
    stage = n;
    page = "studio";
    pending = null;
    mode = n === 1 || (n === 2 && !window.benchModel) ? "diagram" : "model";
    $("#answer").hidden = true;
    $("#answer-toggle").setAttribute("aria-expanded", "false");
    $("#answer-toggle").innerHTML = "查看解析 " + glyph("down");
    render();
  }
  function editWires() {
    powered = false;
    measurementMessage = "";
    wiringMessage = "接线变动，输出已断开。";
    render();
  }
  function openInfo(progress) {
    $("#dialog-body").innerHTML = progress ?
        '<span class="dialog-kicker">实验进度</span><h2 id="dialog-heading">你的实验记录</h2><ul class="status-lines">' +
            labels.map((l, i) => '<li>' + l + '<b>' + (complete()[i] ? "已完成" : "待完成") + '</b></li>').join("") +
            '</ul><p>探索四个元件、验证串联回路，再记录一个满足目标的阻值，即可完成课程。</p>' :
        '<span class="dialog-kicker">实验任务</span><h2 id="dialog-heading">控制面板上的红色指示灯</h2><p>控制器有一个 5.0 V 直流输出，面板需要一盏工作电流在 8–12 mA 的红色指示灯。</p><ol class="brief-list"><li>辨认电源、电阻、LED 与面包板。</li><li>用三根导线接通 LED 串联回路。</li><li>调换电阻并记录一项达标的电流读数。</li></ol>';
    $("#info-dialog").showModal();
  }
  $$(".step, .handbook [data-stage], .measure-actions [data-stage]")
      .forEach(b => b.addEventListener("click", () => goStage(Number(b.dataset.stage))));
  $$("[data-page]").forEach(b => b.addEventListener("click", () => {
    page = b.dataset.page;
    render();
  }));
  $$("[data-part]").forEach(b => b.addEventListener("click", () => describe(b.dataset.part)));
  $("#model-mount").addEventListener("benchpick", e => {
    if (stage === 0) describe(e.detail);
  });
  $$("[data-mode]").forEach(b => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    render();
  }));
  function pickPin(id) {
    if (used.has(id)) return;
    if (pending === id) {
      pending = null;
      render();
      return;
    }
    if (pending === null) {
      pending = id;
      render();
      return;
    }
    connections.push([pending, id]);
    used.add(pending);
    used.add(id);
    pending = null;
    editWires();
  }
  $$("[data-pin]").forEach(b => b.addEventListener("click", () => pickPin(b.dataset.pin)));
  function diagramPick(e) {
    const node = e.target.closest("[data-terminal]");
    if (!node || stage !== 1) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const id = node.dataset.terminal;
    pickPin(id);
    if (e.type === "keydown") $('#circuit-diagram [data-terminal="' + id + '"]').focus();
  }
  $("#circuit-diagram").addEventListener("click", diagramPick);
  $("#circuit-diagram").addEventListener("keydown", diagramPick);
  $("#wire-list").addEventListener("click", e => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    const i = Number(b.dataset.remove);
    const [removed] = connections.splice(i, 1);
    removed.forEach(id => used.delete(id));
    pending = null;
    editWires();
    $('[data-pin="' + removed[0] + '"]').focus();
  });
  $("#test-circuit").addEventListener("click", () => {
    pending = null;
    const result = check(connections);
    powered = result === "good";
    if (powered) wiredBefore = true;
    wiringMessage = {
      short: "电源正、负极被导线直接短接，模拟电源保持断开。拆除这根导线，让电流流经电阻和 LED。",
      open: "回路尚未闭合。每个端子各接一根导线，再检查回路。",
      reverse: "LED 接反了。沿电源正极走到 LED，应先到阳极 A。拆除 LED 两端的导线后重接。",
      unlimited: "LED 路径绕开了限流电阻，模拟电源保持断开。请将电阻串入同一回路。",
      bypass: "电流路径绕过了元件，模拟电源保持断开。从正极出发，依次经过电阻和 LED 再回到负极。",
      good: "回路已接通，红灯点亮。现在可以测量电流并调整电阻。"
    }[result];
    render();
  });
  $("#resistance").addEventListener("change", e => {
    resistance = Number(e.target.value);
    measurementMessage = "";
    render();
  });
  $("#measure").addEventListener("click", () => {
    if (!powered) return;
    if (!readings.includes(resistance)) readings.push(resistance);
    measurementMessage = inRange(resistance) ?
        "达到目标。" + resistance + " Ω 时电流为 " + current(resistance).toFixed(2) + " mA，已记录这组设计。" :
        current(resistance) > 12 ? "电流超过 12 mA。试试更大的电阻，再记录读数。" :
                                   "电流低于 8 mA。试试更小的电阻，再记录读数。";
    render();
  });
  $("#answer-toggle").addEventListener("click", () => {
    const closed = $("#answer").hidden;
    $("#answer").hidden = !closed;
    $("#answer-toggle").setAttribute("aria-expanded", String(closed));
    $("#answer-toggle").innerHTML = (closed ? "收起解析 " : "查看解析 ") + glyph("down");
    window.fillWorkbenchIcons?.();
  });
  $("#advance").addEventListener("click", () => {
    if (stage < 2) {
      goStage(stage + 1);
      $(".steps").scrollIntoView({block: "start"});
    } else
      openInfo(true);
  });
  $("#brief-open").addEventListener("click", () => openInfo(false));
  $("#progress-open").addEventListener("click", () => openInfo(true));
  $("#dialog-close").addEventListener("click", () => $("#info-dialog").close());
  $("#dialog-ok").addEventListener("click", () => $("#info-dialog").close());
  $("#zoom-out").addEventListener("click", () => window.benchModel?.changeZoom(1 / 1.15));
  $("#zoom-in").addEventListener("click", () => window.benchModel?.changeZoom(1.15));
  $("#reset-view").addEventListener("click", () => window.benchModel?.reset());
  render();
})();

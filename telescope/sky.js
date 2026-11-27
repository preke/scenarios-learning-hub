(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const parts = {
    tube: {
      name: '光学镜筒',
      en: 'OPTICAL TUBE',
      icon: 'scope',
      tags: ['主镜', '聚光'],
      text: '暗弱碎片反射的太阳光从筒口进入。镜筒里的主镜收集这些光，再由镜面把光汇聚到相机的焦面。',
      question: '同样的曝光时间，更大口径的望远镜能带来什么？',
      answer: '在光学效率相近时，更大的有效集光面积能收集更多光子，让暗弱目标更容易从背景噪声中显现。'
    },
    mount: {
      name: '跟踪架台',
      en: 'TRACKING MOUNT',
      icon: 'mount',
      tags: ['指向', '恒星跟踪'],
      text: '叉式架台支撑镜筒，让望远镜沿两个轴转动。在本次练习里，架台跟随背景恒星，星点在短时间内保持在近似相同的位置。',
      question: '为什么让架台跟随恒星，反而容易看出其他目标在移动？',
      answer: '背景星点提供了稳定的参照。同一段时间里，沿不同路径运动的物体会相对这些星点发生位移。'
    },
    camera: {
      name: '科学相机',
      en: 'SCIENCE CAMERA',
      icon: 'camera',
      tags: ['像素阵列', '曝光计时'],
      text: '焦面上的传感器逐像素记录落下的光。快门打开得越久，移动物体在一次曝光期间经过的像素就越多。',
      question: '星图上一条较长的光迹能告诉你碎片的实际长度吗？',
      answer: '光迹主要记录目标在曝光期间的像面位移。判断物体的实际尺寸还需要距离、成像分辨率等信息。'
    },
    finder: {
      name: '导星镜',
      en: 'GUIDE SCOPE',
      icon: 'adcs',
      tags: ['参考恒星', '跟踪修正'],
      text: '主镜筒旁的小望远镜监测参考恒星。如果参考星偏离原位置，导星系统就向架台反馈修正量，帮助主相机获得稳定的图像。',
      question: '导星图像中多颗恒星一起偏移时，应先检查什么？',
      answer: '先检查望远镜的跟踪状态。许多恒星同向偏移，往往反映整个视场发生了移动。'
    }
  };
  const phases = {explore: '探索望远镜', experiment: '曝光实验', readout: '星图判读'};
  const storageKey = 'scenarios.sky-lab.v1';
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
  }
  const visited = new Set(Array.isArray(saved.visited) ? saved.visited.filter(id => Object.hasOwn(parts, id)) : []);
  const seenFrames = new Set(Array.isArray(saved.frames) ? saved.frames.filter(f => [0, 1, 2].includes(f)) : []);
  let exposure = saved.exposure || {};
  let submitted = saved.submitted === true && seenFrames.size === 3;
  let viewer, exposureReady = false;
  let phase = 'explore', selected = 'tube', frame = 0;

  function store() {
    try {
      localStorage.setItem(
          storageKey, JSON.stringify({visited: [...visited], frames: [...seenFrames], exposure, submitted}));
    } catch {
    }
  }
  function completion() {
    return {
      explore: visited.size === Object.keys(parts).length,
      experiment: [0.5, 1].includes(exposure.short) && [3, 5].includes(exposure.long),
      readout: submitted
    };
  }
  function updateProgress() {
    const done = completion();
    const count = Object.values(done).filter(Boolean).length;
    $('#progress-count').textContent = count + ' / 3';
    $('#progress-ring').style.setProperty('--p', count * 120 + 'deg');
    $('#progress-open').setAttribute('aria-label', '查看学习进度，已完成 ' + count + ' 个阶段，共 3 个');
    $$('.step').forEach(button => button.classList.toggle('done', done[button.dataset.stage]));
    $('#visit-count').textContent = visited.size + ' / 4';
  }
  function showView(view) {
    for (const id of ['studio', 'map', 'resources']) $('#' + id + '-view').hidden = id !== view;
    $$('.primary-nav button').forEach(button => {
      if (button.dataset.nav === view)
        button.setAttribute('aria-current', 'page');
      else
        button.removeAttribute('aria-current');
    });
    if (view === 'studio' && phase === 'explore') viewer?.resize();
  }
  function switchPhase(id) {
    phase = id;
    showView('studio');
    Object.keys(phases).forEach(key => {
      $('#' + key).hidden = key !== id;
    });
    $$('.step').forEach(button => {
      if (button.dataset.stage === id)
        button.setAttribute('aria-current', 'step');
      else
        button.removeAttribute('aria-current');
    });
    if (id === 'explore') viewer?.resize();
    if (id === 'experiment' && !exposureReady) {
      window.createExposureLab($('#exposure-lab'), {
        saved: exposure,
        onChange(data) {
          exposure = data;
          store();
          updateProgress();
        }
      });
      exposureReady = true;
    }
    if (id === 'readout') showFrame(frame);
  }
  function choosePart(key) {
    const part = parts[key];
    if (!part) return;
    selected = key;
    visited.add(key);
    $$('#part-grid button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === key)));
    $('#part-en').textContent = part.en;
    $('#part-title').textContent = part.name;
    $('#part-desc').textContent = part.text;
    $('#part-tags').replaceChildren(...part.tags.map(text => {
      const tag = document.createElement('span');
      tag.textContent = text;
      return tag;
    }));
    $('#question').textContent = part.question;
    $('#answer').textContent = part.answer;
    $('#answer').hidden = true;
    $('#answer-toggle').setAttribute('aria-expanded', 'false');
    $('#answer-toggle').firstChild.textContent = '查看解析 ';
    viewer?.select(key);
    store();
    updateProgress();
  }
  $('#part-grid').innerHTML = Object.entries(parts)
                                  .map(
                                      ([key, part]) => '<button class="part" data-part="' + key + '"><i data-icon="' +
                                          part.icon + '"></i>' + part.name + '</button>')
                                  .join('');
  window.fillWorkbenchIcons($('#part-grid'));
  $('#answer-toggle').addEventListener('click', event => {
    const open = $('#answer').hidden;
    $('#answer').hidden = !open;
    event.currentTarget.setAttribute('aria-expanded', String(open));
    event.currentTarget.firstChild.textContent = open ? '收起解析 ' : '查看解析 ';
  });
  function setExploded(exploded) {
    viewer?.setExploded(exploded);
    $('#assembled').setAttribute('aria-pressed', String(!exploded));
    $('#exploded').setAttribute('aria-pressed', String(exploded));
  }
  $('#assembled').onclick = () => setExploded(false);
  $('#exploded').onclick = () => setExploded(true);
  $('#zoom-in').onclick = () => viewer?.zoom(1.16);
  $('#zoom-out').onclick = () => viewer?.zoom(1 / 1.16);
  $('#reset-view').onclick = () => {
    setExploded(false);
    viewer?.reset();
    viewer?.select(selected);
  };

  const windows = [
    {id: 'A', x: 156, y: 173, positions: [[153, 172], [153, 172], [153, 172]]},
    {id: 'B', x: 353, y: 103, positions: [null, [361, 111], null]},
    {id: 'C', x: 534, y: 244, positions: [[499, 265], [533, 244], [567, 223]]}
  ];
  const elapsed = [0, 4, 8];
  const stars = [];
  let seed = 93217;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < 490; i++) {
    const x = random() * 720, y = random() * 370;
    if (!windows.some(w => Math.abs(w.x - x) < 51 && Math.abs(w.y - y) < 38)) {
      stars.push({x, y, r: 0.43 + random() ** 3 * 1.45, brightness: 0.23 + random() * .68});
    }
  }
  function paintPlate(index) {
    const ctx = $('#plate').getContext('2d');
    if (!ctx) return;
    const background = ctx.createRadialGradient(370, 150, 10, 350, 170, 430);
    background.addColorStop(0, '#202d42');
    background.addColorStop(1, '#0b1221');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 720, 370);
    function dot(x, y, r, alpha) {
      ctx.fillStyle = 'rgba(228,237,255,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    stars.forEach(s => dot(s.x, s.y, s.r, s.brightness));
    for (const w of windows) {
      const p = w.positions[index];
      if (p) {
        dot(p[0], p[1], 6, .09);
        dot(p[0], p[1], 3.2, .48);
        dot(p[0], p[1], 1.9, 1);
      }
      ctx.strokeStyle = '#a4b7cd';
      ctx.lineWidth = 1.3;
      for (const dx of [-1, 1])
        for (const dy of [-1, 1]) {
          const x = w.x + dx * 53, y = w.y + dy * 37;
          ctx.beginPath();
          ctx.moveTo(x - dx * 12, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y - dy * 12);
          ctx.stroke();
        }
      ctx.fillStyle = '#ecf1ff';
      ctx.font = '600 18px monospace';
      ctx.fillText(w.id, w.x - 52, w.y - 46);
    }
  }
  function showFrame(index) {
    frame = index;
    seenFrames.add(index);
    $('#plate-time').textContent = 'T + ' + String(elapsed[index]).padStart(2, '0') + ' s';
    $$('#frame-buttons button')
        .forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.frame) === index)));
    $('#position-rows').innerHTML =
        windows
            .map(w => {
              const p = w.positions[index];
              return '<tr><th scope="row">' + w.id + '</th>' +
                  (p ? '<td>' + p[0] + '</td><td>' + p[1] + '</td>' : '<td colspan="2">未检出</td>') + '</tr>';
            })
            .join('');
    paintPlate(index);
    if (!submitted)
      $('#report-feedback').textContent =
          seenFrames.size === 3 ? '已翻阅三帧，可以提交判断。' : '已翻阅 ' + seenFrames.size + ' / 3 帧，请继续比较。';
    store();
  }
  const successText =
      '已记录窗口 C 为疑似空间碎片。在 0、4、8 秒，它相对恒星连续向右上方移动。确认身份还需要后续观测和轨道比对。';
  function reportMessage(text, success = false) {
    $('#report-feedback').textContent = text;
    $('#report-feedback').classList.toggle('success', success);
  }
  $('#report').addEventListener('change', () => {
    submitted = false;
    store();
    updateProgress();
    reportMessage('选择已更新，提交记录即可核对。');
  });
  $('#report').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (seenFrames.size < 3) return reportMessage('请先翻阅三帧，检查这个亮点是否持续移动。');
    if (!form.get('candidate') || !form.get('reason')) return reportMessage('请选一个候选窗口，再选一条支持判断的依据。');
    if (form.get('candidate') === 'A')
      return reportMessage('窗口 A 的星点在三帧中都停在相同坐标。再找找相对它发生位移的目标。');
    if (form.get('candidate') === 'B') return reportMessage('窗口 B 的亮点只出现在第二帧，单次亮点无法提供连续运动的证据。');
    if (form.get('reason') !== 'moving')
      return reportMessage('你选中的窗口有连续位移。查看三帧的像素读数，再选与读数一致的依据。');
    submitted = true;
    reportMessage(successText, true);
    store();
    updateProgress();
  });
  if (submitted) {
    $('#candidates input[value=C]').checked = true;
    $('#report input[value=moving]').checked = true;
    reportMessage(successText, true);
  }

  const dialog = $('#info-dialog');
  function openDialog(kind) {
    if (kind === 'brief') {
      $('#dialog-body').innerHTML =
          '<span class="dialog-kicker">ST-01 · 任务简报</span><h2 id="dialog-title">找到下一班要复查的光点</h2><p>你收到一组夜间巡测星图。先熟悉观测设备，再做一次曝光对照，最后写下哪个窗口有移动光点，以及你采用的判据。</p><ul class="brief-list"><li><b>设备</b><span>反射式望远镜、跟踪架台、科学相机及导星镜。</span></li><li><b>交班材料</b><span>一组长短曝光记录，以及一条有多帧位移支撑的候选体记录。</span></li></ul>';
    } else {
      const done = completion();
      $('#dialog-body').innerHTML = '<h2 id="dialog-title">你的观测进度</h2><p>已完成 ' +
          Object.values(done).filter(Boolean).length +
          ' / 3 个阶段。点击阶段名称可回到相应任务。</p><ul class="progress-list">' +
          Object.entries(phases)
              .map(
                  ([key, name]) => '<li><button data-stage="' + key + '">' + name + '</button><span>' +
                      (done[key] ? '已完成' : '待完成') + '</span></li>')
              .join('') +
          '</ul>';
    }
    $('#dialog-action').textContent = '关闭';
    dialog.showModal();
  }
  $('#brief-open').onclick = () => openDialog('brief');
  $('#progress-open').onclick = () => openDialog('progress');
  $('#close-dialog').onclick = $('#dialog-action').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const {nav, stage, part, frame: targetFrame} = button.dataset;
    if (nav) showView(nav);
    if (stage) {
      if (dialog.open) dialog.close();
      switchPhase(stage);
      const step = $('.step[aria-current="step"]');
      if (!button.classList.contains('step')) {
        step.focus({preventScroll: true});
        step.closest('nav').scrollIntoView({block: 'nearest'});
      }
    }
    if (part) {
      if (button.closest('#map-view')) {
        switchPhase('explore');
        $('#part-grid [data-part="' + part + '"]').focus();
      }
      choosePart(part);
    }
    if (targetFrame !== undefined && button.closest('#frame-buttons')) showFrame(Number(targetFrame));
    if (button.hasAttribute('data-progress')) openDialog('progress');
  });
  viewer = window.createTelescopeViewer($('#model-mount'), {
    onSelect: choosePart,
    onFallback() {
      // The viewer supplies an annotated alternative when WebGL is unavailable.
      const tip = $('.stage-tip');
      tip.textContent = '组件示意图 · 可切换分解视图';
    }
  });
  choosePart(selected);
})();

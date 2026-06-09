/* =================================================================
 * CAPEX detail page — 10-stage investment process
 * Reuses master-data design system patterns (bi-block-title / form-grid /
 * aniInput / hoo-table / hBtn / modal.search-modal / glass-panel).
 * ================================================================= */

/* ----- URL params ----- */
const params = new URLSearchParams(window.location.search);
const pCurrentNode = params.get('currentNode') || capexCase.currentNode || 'request';

/* ----- Smooth scroll (master-data pattern) ----- */
function smoothScrollTo(target, offset) {
  if (!target) return;
  const HEADER = offset || 100;
  const startTop = window.pageYOffset || document.documentElement.scrollTop;
  const targetTop = target.getBoundingClientRect().top + startTop - HEADER;
  const distance = targetTop - startTop;
  if (Math.abs(distance) < 2) return;
  const duration = Math.max(250, Math.min(450, Math.abs(distance) * 0.45));
  const startTime = performance.now();
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    window.scrollTo(0, startTop + distance * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ----- Section title (master-data buildSectionTitleHtml 재사용) ----- */
function buildSectionTitleHtml(icon, titleText, st, dateStr) {
  const stCls = st === 'done' ? 'st-approved'
              : st === 'current' ? 'st-inprogress'
              : st === 'rejected' ? 'st-rejected' : '';
  const stLbl = st === 'done' ? 'Completed'
              : st === 'current' ? 'In Progress'
              : st === 'rejected' ? 'Rejected' : 'Pending';
  const showDate = (st === 'done' || st === 'rejected') && dateStr;
  const pillHtml = stCls
    ? `<span class="mr-status mr-pill-sm ${stCls}">${stLbl}</span>`
    : '';
  const dateHtml = showDate ? `<span class="section-date">${dateStr}</span>` : '';
  return `<h3 class="section-title">
    <span class="section-title-left"><i class="material-icons">${icon}</i>${titleText}</span>
    <span class="title-bar-meta">${pillHtml}${dateHtml}</span>
  </h3>`;
}

/* ----- Title bar updater ----- */
function applyTitleBar(opts) {
  const { badgeText, idText, descText, lastModText } = opts;
  const badge = document.querySelector('.detail-type-badge');
  if (badge) badge.textContent = badgeText || '';
  const idEl = document.getElementById('dHeadId');
  if (idEl) idEl.textContent = `[${idText}]`;
  const descEl = document.getElementById('dHeadDesc');
  if (descEl) descEl.textContent = descText || '';
  const lm = document.getElementById('titleLastMod');
  if (lm) lm.textContent = lastModText || '';
}

/* =================================================================
 * 좌측 네비 — Stage 핵심 정보 라인 (rt-card 안에 여러 줄로 표시)
 *   참조 HTML(nav-output)의 "핵심 한눈" 정보 선택을 우리 데이터로 매핑.
 *   왼쪽만 읽어도 프로젝트 핵심을 다 취득하는 개념.
 *   라인 { k?: 라벨, v: 값, sub?: 보조표기, tone?: good|warn|accent|hl }
 * ================================================================= */
function stageKeyLines(key) {
  const c = capexCase;
  switch (key) {
    case 'request': return [
      { k: 'Budget',   v: `$ ${c.stage1.estBudget}`, tone: 'hl' },
      { k: 'Priority', v: c.stage1.priority },
    ];
    case 'feasibility': {
      const s2 = calcStage2();
      return [
        { k: 'ROI',     v: `${s2.roi.toFixed(1)}%`, tone: 'hl' },
        { k: 'Payback', v: s2.payback != null ? `${s2.payback.toFixed(1)} yr` : '—' },
      ];
    }
    case 'approval': return [
      { v: c.stage3.capexNo, tone: 'hl' },
      { k: c.stage3.status, v: c.stage3.approvedAmount },
    ];
    case 'spec': return [
      { k: 'Ref.', v: c.stage4.referenceEquip.split(' ')[0], tone: 'hl' },
      { v: 'CMMS reviewed · findings derived' },
    ];
    case 'tbe': {
      const w = c.stage5.vendors.find(v => v.winner);
      return [
        { v: `${w.name} — preferred` },
        { k: 'Score', v: w.score, tone: 'hl' },
      ];
    }
    case 'cbe': {
      const w = c.stage6.vendors.find(v => v.winner);
      return [
        { v: `${w.name} — selected` },
        { k: 'Contract', v: w.negotiated, tone: 'hl' },
      ];
    }
    case 'contract': return [
      { k: 'Amount', v: c.stage7.contractAmount, tone: 'hl' },
      { v: c.stage7.poNo },
    ];
    case 'execution': {
      /* 원본처럼 4개 단계별 진행 상태 — 라벨(단계)+값(상태). 상태는 간결화('2 days'→'2d', 부연 제거) */
      const phase = { design: 'Design', procure: 'Procurement', fab: 'Fabrication', install: 'Installation' };
      const short = (st) => st.replace(/(\d)\s*days?/, '$1d').replace(' (parallel accel.)', '');
      return c.stage8.subCharts.map(s => ({
        k: phase[s.key] || s.title,
        v: short(s.status),
        tone: /delay/i.test(s.status) ? 'danger' : '',
      }));
    }
    case 'commission': {
      const goLive = c.stage9.qualifications.find(q => q.label === 'Go-Live');
      return [
        { v: 'FAT·SAT·IQ·OQ·PQ — all passed' },
        { k: 'Go-Live', v: goLive.date, tone: 'hl' },
      ];
    }
    case 'actual': {
      /* Exp 는 패널과 동일하게 calcStage2() live 산출 (Stage 2 입력 바뀌어도 드리프트 X) */
      const s2  = calcStage2();
      const roi = c.stage10.roiCompare.find(r => r.label === 'ROI (%)');
      const pb  = c.stage10.roiCompare.find(r => r.label === 'Payback Period');
      const expPb = s2.payback != null ? `${s2.payback.toFixed(1)} yr` : '—';
      return [
        { k: 'ROI',     v: roi.actual, sub: `Exp ${s2.roi.toFixed(1)}%`, tone: 'hl' },
        { k: 'Payback', v: pb.actual,  sub: `Exp ${expPb}` },
      ];
    }
  }
  return [];
}
function keyLineHtml(L) {
  return `<div class="rt-key">`
    + (L.k ? `<span class="rt-k">${L.k}</span>` : '')
    + `<span class="rt-v${L.tone ? ' rt-v-' + L.tone : ''}">${L.v}</span>`
    + (L.sub ? `<span class="rt-vsub">${L.sub}</span>` : '')
    + `</div>`;
}

/* =================================================================
 * Left routing-timeline — master-data Request stage compact 패턴
 *   각 Stage = .rt-group.rt-group-compact
 *     .rt-stage > .rt-circle  (큰 동그라미, 상태 아이콘)
 *     .rt-cards > .rt-card    (Stage 번호 배지 + 라벨 + 책임자 한 줄)
 *   10개가 위→아래 일직선 타임라인. 임의 그룹(Initiation 등) 폐기.
 * ================================================================= */
function renderRouting() {
  const wrap = document.getElementById('routingTimeline');
  if (!wrap) return;
  const states = calcNodeStates(capexFlow, pCurrentNode);

  let html = '';
  states.forEach((n, idx) => {
    const ico = n.state === 'done'    ? 'check_circle'
              : n.state === 'current' ? 'play_circle'
              :                         'radio_button_unchecked';
    const cls = n.state === 'done'    ? ' done'
              : n.state === 'current' ? ' active'
              : '';
    const subCls = n.state === 'done'    ? ' rt-sub-done'
                 : n.state === 'current' ? ' rt-sub-current'
                 : '';

    const role = n.label;
    const keyLines = stageKeyLines(n.key).map(keyLineHtml).join('');

    html += `<div class="rt-group rt-group-compact">
      <div class="rt-stage">
        <div class="rt-circle${cls}"><i class="material-icons">${ico}</i></div>
        <div class="rt-stage-label">${role}</div>
      </div>
      <div class="rt-cards">
        <div class="rt-card rt-card-keys waves-effect${subCls}" data-stage-key="${n.key}" data-section="${idx}">
          <div class="rt-card-info">
            <span class="rt-role">${role}</span>
          </div>
          <div class="rt-keys">${keyLines}</div>
        </div>
      </div>
    </div>`;
  });

  wrap.innerHTML = html;

  /* Click → smooth scroll to corresponding stage section */
  wrap.querySelectorAll('.rt-card[data-stage-key]').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.stageKey;
      const tgt = document.querySelector(`.detail-section[data-stage-key="${key}"]`);
      smoothScrollTo(tgt, 120);
      /* Waves 리플 잔상 방어 — Materialize Waves 가 정리 못 한 .waves-ripple 강제 제거
         (클릭 → 스크롤 중 mouseup 유실 시 리플이 영구 잔류. 리플 fade 1.2s 보다 늦게 청소) */
      setTimeout(() => {
        wrap.querySelectorAll('.waves-ripple').forEach(r => r.remove());
      }, 1300);
    });
  });
}

/* =================================================================
 * Routing 글래스 — .rt-card mousemove → --rt-gx/--rt-gy
 *   (master-data initCustRtCardGlass, line 4211-4219 그대로)
 * ================================================================= */
function bindRoutingGlass() {
  document.querySelectorAll('.rt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--rt-gx', ((e.clientX - rect.left) / rect.width)  * 100 + '%');
      card.style.setProperty('--rt-gy', ((e.clientY - rect.top)  / rect.height) * 100 + '%');
    });
  });
}

/* =================================================================
 * Stage Card Glow — .detail-section mousemove → --ds-gx/--ds-gy
 *   (master-data initStageCardGlow, line 284-295 그대로)
 *   우측 패널 카드들의 글래스 효과 (사용자가 본 master-data 글래스의 일부)
 * ================================================================= */
function initStageCardGlow(root) {
  const scope = root || document;
  scope.querySelectorAll('.detail-section').forEach(card => {
    if (card._glowInit) return;
    card._glowInit = true;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--ds-gx', ((e.clientX - r.left) / r.width)  * 100 + '%');
      card.style.setProperty('--ds-gy', ((e.clientY - r.top)  / r.height) * 100 + '%');
    });
  });
}

/* =================================================================
 * 스크롤 스파이 — master-data 패턴 (window.scroll + 즉시 updateSpy 호출)
 *   우측 detail-section의 boundingClientRect().top <= 150 인 가장 마지막
 *   인덱스를 activeIdx로 보고, 좌측 rt-card[data-section=idx]에 .spy-active 부여.
 *   common.css 의 .rt-card.spy-active::before 가 그제서야 opacity:1 → 색수차 + 글래스.
 * ================================================================= */
function bindRoutingSpy() {
  const sections = Array.from(document.querySelectorAll('.detail-section[data-stage-key]'));
  if (!sections.length) return;
  const allCards = document.querySelectorAll('.rt-card[data-section]');
  const OFFSET = 150;

  function updateSpy() {
    let activeIdx = 0;
    sections.forEach((sec, i) => {
      if (sec.getBoundingClientRect().top <= OFFSET) activeIdx = i;
    });
    allCards.forEach(card => {
      card.classList.toggle('spy-active', parseInt(card.dataset.section) === activeIdx);
    });
  }
  window.addEventListener('scroll', updateSpy, { passive: true });
  /* 페이지 로드 직후 즉시 1회 — 첫 보이는 stage에 spy-active 주입 (master-data 패턴) */
  updateSpy();
}

/* =================================================================
 * Right stage sections — render all 10 with content
 * ================================================================= */
function renderStages() {
  const wrap = document.getElementById('stageSections');
  if (!wrap) return;
  const states = calcNodeStates(capexFlow, pCurrentNode);

  let html = '';
  states.forEach(n => {
    const body = renderStageBody(n.key);
    const stForTitle = (capexCase.status === 'completed') ? 'done' : n.state;
    const date = stageDateFor(n.key);
    html += `<section class="detail-section glass-panel stage-${n.key}" data-stage-key="${n.key}" data-stage-no="${n.no}">
      ${buildSectionTitleHtml(n.icon, `Stage ${n.no}. ${n.label}`, stForTitle, date)}
      <div class="stage-body">${body}</div>
    </section>`;
  });
  wrap.innerHTML = html;
}

function stageDateFor(key) {
  const c = capexCase;
  switch (key) {
    case 'request':     return c.stage1?.requestDate;
    case 'feasibility': return null;
    case 'approval':    return c.stage3?.date;
    case 'spec':        return null;
    case 'tbe':         return null;
    case 'cbe':         return null;
    case 'contract':    return null;
    case 'execution':   return null;
    case 'commission':  return c.stage9?.qualifications?.find(q => q.label === 'Go-Live')?.date;
    case 'actual':      return c.stage10?.reviewDate;
  }
  return null;
}

/* =================================================================
 * Stage body dispatcher
 * ================================================================= */
function renderStageBody(key) {
  switch (key) {
    case 'request':     return renderStage1();
    case 'feasibility': return renderStage2();
    case 'approval':    return renderStage3();
    case 'spec':        return renderStage4();
    case 'tbe':         return renderStage5();
    case 'cbe':         return renderStage6();
    case 'contract':    return renderStage7();
    case 'execution':   return renderStage8();
    case 'commission':  return renderStage9();
    case 'actual':      return renderStage10();
  }
  return '';
}

/* =================================================================
 * Stage 1 — Investment Request (full implementation)
 * ================================================================= */

function renderStage1() {
  const d = capexCase.stage1;
  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>Basic Information</h5>
    <div class="form-grid">

      <div class="form-group span-2">
        <label>Title</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.title}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>Type</label>
        <div class="bi-select-wrap">
          <select class="bi-select browser-default">
            <option value="">Select…</option>
            <option ${d.type.startsWith('New') ? 'selected' : ''}>New Equipment — Capacity Expansion</option>
            <option>Replacement</option>
            <option>Upgrade</option>
            <option>Maintenance</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Classification</label>
        <div class="bi-select-wrap">
          <select class="bi-select browser-default">
            <option value="">Select…</option>
            <option ${d.classification === 'Strategic Growth' ? 'selected' : ''}>Strategic Growth</option>
            <option>Regulatory</option>
            <option>Cost Reduction</option>
            <option>Maintenance</option>
          </select>
        </div>
      </div>

      <div class="form-group span-2">
        <label>Background</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.background}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group span-2">
        <label>Purpose</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.purpose}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>Site / Business Unit</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.site}" data-master="sites" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Request Dept.</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.dept}" data-master="depts" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Requester</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.requester}" data-master="users" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Est. Budget</label>
        <div class="aniInput cpx-money-field">
          <span class="cpx-money-unit">$</span>
          <input type="text" id="cpxEstBudget" class="browser-default cpx-money" value="${d.estBudget}" inputmode="numeric">
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Request Date</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.requestDate}" readonly><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>Priority</label>
        <div class="bi-select-wrap">
          <select class="bi-select browser-default">
            <option value="">Select…</option>
            <option ${d.priority === 'High' ? 'selected' : ''}>High</option>
            <option ${d.priority === 'Medium' ? 'selected' : ''}>Medium</option>
            <option ${d.priority === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Target Completion</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.targetCompletion}"><span class="focus-border"></span></div>
      </div>

    </div>

    <div class="bi-block-head">
      <h5 class="bi-block-title"><span class="bi-bar"></span>Sign-off Chain</h5>
      <div class="bi-block-meta">
        <a href="javascript:;" class="hBtn hBtn-sm hOrange waves-effect" id="cpxSignoffAdd"><i class="material-icons">add</i><span class="label">Add row</span></a>
      </div>
    </div>
    <div class="hoo-spec-table cpx-signoff-table">
      <table class="hoo-table" id="cpxSignoffTable">
        <colgroup><col style="width:48px"><col style="width:34%"><col><col style="width:44px"></colgroup>
        <thead><tr><th>No.</th><th class="hoo-th-key">Role <span class="hoo-req">*</span></th><th class="hoo-th-key">Name</th><th></th></tr></thead>
        <tbody id="cpxSignoffBody">
          ${d.signoffChain.map((r, i) => signoffRowHtml(r, i)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* =================================================================
 * Stage 1 — Sign-off Chain (담당자 지정)
 *   Role = combo(CPX_MASTER.signoffRoles) / Name = 퀵서치(CPX_MASTER.users)
 *   행 추가(우상단 Add row) / 행 삭제(hoo-x) — hoo-table 양식 그대로
 * ================================================================= */
function signoffRoleOptions(selected) {
  const roles = (window.CPX_MASTER || CPX_MASTER).signoffRoles || [];
  return ['<option value="">Select…</option>']
    .concat(roles.map(r => `<option ${r === selected ? 'selected' : ''}>${r}</option>`))
    .join('');
}
function signoffRowHtml(row, i) {
  const r = row || {};
  return `
    <tr>
      <td class="hoo-no">${i + 1}</td>
      <td>
        <div class="bi-select-wrap">
          <select class="bi-select browser-default cpx-signoff-role">${signoffRoleOptions(r.role)}</select>
        </div>
      </td>
      <td>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch cpx-signoff-name" value="${r.name || ''}" data-master="users" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </td>
      <td class="hoo-x"><i class="material-icons">close</i></td>
    </tr>`;
}
function renumberSignoff(tbody) {
  tbody.querySelectorAll(':scope > tr').forEach((tr, i) => {
    const no = tr.querySelector('.hoo-no');
    if (no) no.textContent = i + 1;
  });
}
function bindSignoffChain() {
  const table = document.getElementById('cpxSignoffTable');
  const tbody = document.getElementById('cpxSignoffBody');
  const addBtn = document.getElementById('cpxSignoffAdd');
  if (!table || !tbody) return;

  /* 행 추가 — 빈 행 append 후 해당 행만 퀵서치/셀렉트 재바인딩 */
  addBtn?.addEventListener('click', () => {
    tbody.insertAdjacentHTML('beforeend', signoffRowHtml({}, tbody.children.length));
    const tr = tbody.lastElementChild;
    bindQuickSearch(tr);
    bindSelectChevron(tr);
    renumberSignoff(tbody);
  });

  /* 행 삭제 — hoo-x 이벤트 위임 */
  tbody.addEventListener('click', (e) => {
    const x = e.target.closest('.hoo-x');
    if (!x) return;
    x.closest('tr')?.remove();
    renumberSignoff(tbody);
  });
}

/* =================================================================
 * Stage 4 — Key Findings WYSIWYG 에디터 (Quill) + AI 추천 (2026-06-09)
 *   개념: 이 카드의 모든 정보(Spec / Installed Base / Breakdown / Upgrade History)를
 *         근거로 AI 가 "최종 신규 스펙"을 추천. 에디터는 빈 상태로 시작 →
 *         타이틀 우측 "AI Recommend" 클릭 시 생성 연출 후 추천 내용이 스트리밍 채움.
 *   ※ Materialize 외 라이브러리(Quill) — CLAUDE.md 예외(사용자 요청). CDN 은 detail.html. */
let keyFindingsQuill = null;
let keyFindingsGenTimer = null;

/* Quill 커스텀 블롯 — figure 쌍을 '편집 불가 블록 임베드'로 등록해, Quill 정규화에도
   제거되지 않고 에디터 콘텐츠 안에 그대로 유지되게 함 (img/svg 도 임베드 내부라 안전). */
function registerKfFigureBlot() {
  if (typeof Quill === 'undefined' || Quill._kfFigReg) return;
  const BlockEmbed = Quill.import('blots/block/embed');
  class KfFigureBlot extends BlockEmbed {
    static create(value) {
      const node = super.create();
      node.setAttribute('data-fig', value);
      node.setAttribute('contenteditable', 'false');
      node.innerHTML = kfFigure(Number(value));
      return node;
    }
    static value(node) { return node.getAttribute('data-fig'); }
  }
  KfFigureBlot.blotName = 'kffigure';
  KfFigureBlot.tagName = 'div';
  KfFigureBlot.className = 'cpx-kf-figblot';
  Quill.register(KfFigureBlot);
  Quill._kfFigReg = true;
}
function kfRecommendedItems() {
  /* keyFindings("관찰 → 신규 스펙") 를 번호 단락 배열로 (블록 임베드 끼우기 쉽게). act <strong> bronze */
  return capexCase.stage4.keyFindings.map((s, i) => {
    const idx = s.lastIndexOf(' → ');
    const obs = idx >= 0 ? s.slice(0, idx) : s;
    const act = idx >= 0 ? s.slice(idx + 3) : '';
    return `<p>${i + 1}. ${obs}${act ? ` → <strong>${act}</strong>` : ''}</p>`;
  });
}
function bindKeyFindingsEditor() {
  const el = document.getElementById('cpxKeyFindingsEditor');
  if (!el || typeof Quill === 'undefined') return;
  registerKfFigureBlot();
  keyFindingsQuill = new Quill(el, {
    theme: 'snow',
    placeholder: 'Click "AI Recommend" to draft the new specification from this stage’s data…',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    },
  });
  document.getElementById('cpxKfAiBtn')?.addEventListener('click', generateKeyFindings);
  document.getElementById('cpxKfFigBtn')?.addEventListener('click', addKeyFindingFigures);
}
function generateKeyFindings() {
  const q = keyFindingsQuill;
  const btn = document.getElementById('cpxKfAiBtn');
  if (!q || keyFindingsGenTimer) return;   /* 생성 중 재진입 방지 */
  const items = kfRecommendedItems();
  const steps = [
    'Analyzing breakdown &amp; failure history…',
    'Reviewing improvement &amp; upgrade history…',
    'Cross-checking engineering spec &amp; utilities…',
    'Drafting recommended new specification…',
  ];
  const setLabel = (t) => { const l = btn && btn.querySelector('.label'); if (l) l.textContent = t; };
  /* innerHTML 직접 주입 시 Quill 이 .ql-blank 를 못 떼서 placeholder 가 겹침 → 수동 제거 */
  const setHtml = (html) => { q.root.innerHTML = html; q.root.classList.remove('ql-blank'); };
  const genLine = (txt) => setHtml(`<p class="cpx-kf-gen"><span class="cpx-kf-spark">✦</span> ${txt}</p>`);

  if (btn) btn.classList.add('cpx-ai-loading');
  setLabel('Generating…');
  q.disable();
  genLine(steps[0]);

  let si = 0, shown = 0;
  const stepTick = () => {
    si++;
    if (si < steps.length) {
      genLine(steps[si]);
      keyFindingsGenTimer = setTimeout(stepTick, 540);
    } else {
      keyFindingsGenTimer = setTimeout(streamTick, 360);
    }
  };
  const streamTick = () => {
    shown++;
    setHtml(items.slice(0, shown).join(''));
    if (shown < items.length) {
      keyFindingsGenTimer = setTimeout(streamTick, 440);
    } else {
      keyFindingsGenTimer = null;
      q.enable();
      if (btn) btn.classList.remove('cpx-ai-loading');
      setLabel('Regenerate');
      document.getElementById('cpxKfFigBtn')?.classList.remove('cpx-hidden');   /* 초안 생성 후 노출 */
    }
  };
  keyFindingsGenTimer = setTimeout(stepTick, 480);
}

/* 사용자 단계 — AI 가 텍스트 초안을 잡으면, 사용자가 Figure(사진 + 기술 다이어그램)를
   에디터 콘텐츠 안 각 finding(li) 아래에 추가해 완성. 참조 도식 이식, 사진은 외부 URL+폴백.
   kfFigure(i): finding i 의 figure 쌍 HTML (0·1 만 도식 보유). */
function kfFigure(i) {
  if (i > 1) return '';
  const fig1svg = `
    <svg class="cpx-kf-figsvg" viewBox="0 0 320 160">
      <defs>
        <linearGradient id="kfSteelG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#A0AEC0"/><stop offset="50%" stop-color="#CBD5E1"/><stop offset="100%" stop-color="#94A3B8"/></linearGradient>
        <linearGradient id="kfGlassG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#93C5FD"/><stop offset="50%" stop-color="#BFDBFE"/><stop offset="100%" stop-color="#93C5FD"/></linearGradient>
        <marker id="kfArrDown" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto"><path d="M0,0 L6,0 L3,6 Z" fill="#DC2626"/></marker>
        <marker id="kfArrUp" markerWidth="6" markerHeight="6" refX="3" refY="1" orient="auto"><path d="M0,6 L6,6 L3,0 Z" fill="#2563EB"/></marker>
      </defs>
      <path d="M60 15 L60 130 Q60 145 80 145 L240 145 Q260 145 260 130 L260 15" fill="url(#kfSteelG)" stroke="#64748B" stroke-width="1.5"/>
      <text x="50" y="80" text-anchor="end" font-size="8" fill="#64748B" transform="rotate(-90,50,80)">Steel Shell (25mm)</text>
      <path d="M72 15 L72 125 Q72 138 88 138 L232 138 Q248 138 248 125 L248 15" fill="url(#kfGlassG)" stroke="#3B82F6" stroke-width="1" stroke-dasharray="4,2"/>
      <text x="160" y="28" text-anchor="middle" font-size="9" fill="#1E40AF" font-weight="600">Glass Lining (2.0mm)</text>
      <rect x="80" y="50" width="160" height="82" rx="4" fill="#DBEAFE" opacity="0.5"/>
      <text x="160" y="95" text-anchor="middle" font-size="8" fill="#3B82F6" opacity="0.7">Process Fluid</text>
      <path d="M155 32 L160 45 L152 58 L158 72 L150 88 L156 100 L148 115" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="155" cy="32" r="3" fill="#DC2626"/><circle cx="148" cy="115" r="3" fill="#DC2626"/>
      <line x1="158" y1="70" x2="215" y2="52" stroke="#DC2626" stroke-width="0.8" stroke-dasharray="3,2"/>
      <rect x="215" y="42" width="90" height="22" rx="3" fill="#FEF2F2" stroke="#DC2626" stroke-width="1"/>
      <text x="260" y="56" text-anchor="middle" font-size="8" fill="#DC2626" font-weight="700">CRACK — $ 82K</text>
      <text x="95" y="46" font-size="8" fill="#DC2626" font-weight="700">250°C</text>
      <path d="M92 48 L92 62" stroke="#DC2626" stroke-width="1.5" marker-end="url(#kfArrDown)"/>
      <text x="205" y="46" font-size="8" fill="#2563EB" font-weight="700">25°C</text>
      <path d="M220 62 L220 48" stroke="#2563EB" stroke-width="1.5" marker-end="url(#kfArrUp)"/>
      <text x="160" y="148" text-anchor="middle" font-size="7" fill="#888">ΔT = 225°C — Thermal Shock Zone</text>
    </svg>`;
  const fig2svg = `
    <svg class="cpx-kf-figsvg" viewBox="0 0 320 160">
      <text x="160" y="16" text-anchor="middle" font-size="9" fill="#1B365D" font-weight="700">Vibration Trend — RX-1001 Agitator Bearing</text>
      <line x1="45" y1="25" x2="45" y2="125" stroke="#CBD5E1" stroke-width="1"/>
      <line x1="45" y1="125" x2="305" y2="125" stroke="#CBD5E1" stroke-width="1"/>
      <text x="40" y="130" text-anchor="end" font-size="7" fill="#94A3B8">0</text>
      <text x="40" y="105" text-anchor="end" font-size="7" fill="#94A3B8">1.0</text>
      <text x="40" y="80" text-anchor="end" font-size="7" fill="#94A3B8">2.0</text>
      <text x="40" y="55" text-anchor="end" font-size="7" fill="#94A3B8">3.0</text>
      <text x="12" y="80" text-anchor="middle" font-size="7" fill="#64748B" font-weight="600" transform="rotate(-90,12,80)">mm/s</text>
      <text x="65" y="138" text-anchor="middle" font-size="6.5" fill="#94A3B8">2021</text>
      <text x="130" y="138" text-anchor="middle" font-size="6.5" fill="#94A3B8">2022</text>
      <text x="195" y="138" text-anchor="middle" font-size="6.5" fill="#94A3B8">2023</text>
      <text x="260" y="138" text-anchor="middle" font-size="6.5" fill="#94A3B8">2024</text>
      <line x1="45" y1="62" x2="305" y2="62" stroke="#DC2626" stroke-width="1.2" stroke-dasharray="6,3"/>
      <rect x="255" y="53" width="50" height="14" rx="2" fill="#FEF2F2" stroke="#DC2626" stroke-width="0.8"/>
      <text x="280" y="63" text-anchor="middle" font-size="7" fill="#DC2626" font-weight="700">2.5 ALARM</text>
      <line x1="45" y1="75" x2="305" y2="75" stroke="#F59E0B" stroke-width="0.8" stroke-dasharray="4,3"/>
      <text x="300" y="73" text-anchor="end" font-size="6" fill="#F59E0B">2.0 Warning</text>
      <polyline points="65,112 95,108 130,100 160,95 195,88 225,82 260,78 285,73" fill="none" stroke="#E87502" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="65" cy="112" r="3" fill="#E87502" stroke="#fff" stroke-width="1.5"/>
      <circle cx="130" cy="100" r="3" fill="#E87502" stroke="#fff" stroke-width="1.5"/>
      <circle cx="195" cy="88" r="3" fill="#E87502" stroke="#fff" stroke-width="1.5"/>
      <circle cx="260" cy="78" r="3" fill="#E87502" stroke="#fff" stroke-width="1.5"/>
      <circle cx="285" cy="73" r="4" fill="#DC2626" stroke="#fff" stroke-width="1.5"/>
      <rect x="232" y="59" width="22" height="14" rx="2" fill="#DC2626"/>
      <text x="243" y="69" text-anchor="middle" font-size="7" fill="#fff" font-weight="700">2.1</text>
      <line x1="253" y1="68" x2="283" y2="73" stroke="#DC2626" stroke-width="0.8"/>
      <polyline points="285,73 300,68 310,63" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="310" y="58" font-size="6" fill="#DC2626" font-weight="600">→ Failure</text>
      <text x="160" y="152" text-anchor="middle" font-size="7" fill="#888">Bearing vibration approaching alarm threshold — replacement required</text>
    </svg>`;
  /* 1차 URL 실패 시 폴백 URL 순차 시도 → 모두 실패하면 플레이스홀더 div (사진 누락 방지) */
  const photo = (urls, alt, ph) => {
    let h = `this.outerHTML='<div class=&quot;cpx-kf-figph&quot;>${ph}</div>'`;
    for (let k = urls.length - 1; k >= 1; k--) h = `this.onerror=function(){${h}};this.src='${urls[k]}'`;
    return `<img class="cpx-kf-figimg" src="${urls[0]}" alt="${alt}" onerror="${h}">`;
  };
  if (i === 0) return `<div class="cpx-kf-figpair">`
    + `<figure class="cpx-kf-fig">${photo(['https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=220&fit=crop', 'https://images.pexels.com/photos/25858432/pexels-photo-25858432.jpeg?auto=compress&w=400&h=220'], 'Glass lined reactor', 'Glass Lined Reactor — reference photo')}`
    + `<figcaption class="cpx-kf-figcap"><b class="cpx-kf-fignum">Fig 1.</b> Glass lined reactor vessel — crack at thermal stress zone</figcaption></figure>`
    + `<figure class="cpx-kf-fig">${fig1svg}</figure></div>`;
  return `<div class="cpx-kf-figpair">`
    + `<figure class="cpx-kf-fig">${photo(['https://upload.wikimedia.org/wikipedia/commons/6/6a/Chemical_reactor_CSTR_AISI_316.JPG', 'https://images.pexels.com/photos/33514501/pexels-photo-33514501.jpeg?auto=compress&w=400&h=220'], 'CSTR reactor agitator RX-1001', 'RX-1001 agitator — reference photo')}`
    + `<figcaption class="cpx-kf-figcap"><b class="cpx-kf-fignum">Fig 2.</b> Reactor agitator bearing housing — vibration monitoring point (RX-1001)</figcaption></figure>`
    + `<figure class="cpx-kf-fig">${fig2svg}</figure></div>`;
}
function addKeyFindingFigures() {
  const q = keyFindingsQuill;
  if (!q || typeof Quill === 'undefined') return;
  /* AI 초안 텍스트를 Quill Delta 로 재구성하면서 finding 1·2 뒤에 figure 블록 임베드 삽입.
     임베드라 Quill 정규화에도 살아남고, 텍스트는 그대로 편집 가능. */
  const D = Quill.import('delta');
  const delta = new D();
  capexCase.stage4.keyFindings.forEach((s, i) => {
    const idx = s.lastIndexOf(' → ');
    const obs = idx >= 0 ? s.slice(0, idx) : s;
    const act = idx >= 0 ? s.slice(idx + 3) : '';
    delta.insert(`${i + 1}. ${obs}`);
    if (act) { delta.insert(' → '); delta.insert(act, { bold: true }); }
    delta.insert('\n');
    if (i <= 1) delta.insert({ kffigure: String(i) });   /* finding 1·2 뒤 figure 임베드 */
  });
  q.setContents(delta, 'api');
  q.root.classList.remove('ql-blank');
  document.getElementById('cpxKfFigBtn')?.remove();
}

/* =================================================================
 * Stage 2 — 산출식 (PDF p.4 명세 그대로)
 *   Net Benefit = Savings + Revenue − Operating Cost Increase
 *   ROI (%)     = Net Benefit ÷ Total Investment × 100
 *   Payback     = Total Investment ÷ Annual Net Benefit
 *   NPV         = Σ(CF ÷ (1+r)ⁿ) − Investment   (r=10%, n=5yr)
 *   IRR         = NPV 가 0 이 되는 할인율 (이분법 수치해)
 *   Total Investment ← Stage 1 Est. Budget
 * ================================================================= */
function parseMoneyNum(v) {
  return Number(String(v == null ? '' : v).replace(/[^\d.-]/g, '')) || 0;
}
function fmtUsd(n) {
  const sign = n < 0 ? '− ' : '';
  return `${sign}$ ${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

function calcStage2(vals) {
  const d = capexCase.stage2;
  const savings = vals ? vals.savings : d.costSavings;
  const revenue = vals ? vals.revenue : d.revenueImpact;
  const opCost  = vals ? vals.opCost  : d.opCostIncrease;
  const invest  = vals ? vals.invest  : parseMoneyNum(capexCase.stage1.estBudget);
  const cogs    = vals ? vals.cogs    : d.annualCogs;
  const dio     = vals ? vals.dio     : d.dioReduction;
  const r = d.discountRate, n = d.horizonYears;

  const annualBenefit = savings + revenue;
  const netBenefit    = annualBenefit - opCost;
  const roi     = invest > 0 ? netBenefit / invest * 100 : 0;
  const payback = netBenefit > 0 ? invest / netBenefit : null;

  /* NPV — 5년 동일 CF 가정 */
  let pv = 0;
  for (let i = 1; i <= n; i++) pv += netBenefit / Math.pow(1 + r, i);
  const npv = pv - invest;

  /* IRR — NPV(rate)=0 이분법. horizon 내 회수 불가(netBenefit*n ≤ invest)면 미정의 */
  let irr = null;
  if (netBenefit > 0 && netBenefit * n > invest) {
    const f = (rate) => {
      let s = 0;
      for (let i = 1; i <= n; i++) s += netBenefit / Math.pow(1 + rate, i);
      return s - invest;
    };
    let lo = 0, hi = 10; /* 0% ~ 1000% */
    for (let k = 0; k < 80; k++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) lo = mid; else hi = mid;
    }
    irr = (lo + hi) / 2 * 100;
  }

  /* CCC — WC Savings = Daily COGS × DIO days saved (PDF 명세) */
  const wcSavings = cogs / 365 * dio;

  return { savings, revenue, opCost, invest, annualBenefit, netBenefit, roi, payback, irr, npv, cogs, dio, wcSavings };
}

/* 표시 포맷 */
function fmtStage2(c) {
  return {
    roi:     `${c.roi.toFixed(1)}%`,
    payback: c.payback != null ? `${c.payback.toFixed(1)} years` : '—',
    irr:     c.irr != null ? `${c.irr.toFixed(1)}%` : '—',
    npv:     fmtUsd(c.npv),
    annualBenefit: fmtUsd(c.annualBenefit),
    netBenefit:    fmtUsd(c.netBenefit),
    invest:        fmtUsd(c.invest),
    wcSavings:     `${fmtUsd(c.wcSavings)} /yr`,
  };
}

/* 현재 입력값으로 재계산 → 화면 갱신 (Stage 1 Est. Budget 변경에도 반응) */
function refreshStage2Calc() {
  const get = id => document.getElementById(id);
  if (!get('cpxRoi')) return;
  const c = calcStage2({
    savings: parseMoneyNum(get('cpxSavings')?.value),
    revenue: parseMoneyNum(get('cpxRevenue')?.value),
    opCost:  capexCase.stage2.opCostIncrease, /* 원본에 입력 필드 없음 — mock 고정값 */
    invest:  parseMoneyNum(get('cpxEstBudget')?.value),
    cogs:    parseMoneyNum(get('cpxCogs')?.value),
    dio:     capexCase.stage2.dioReduction, /* 표시 전용 — mock 고정값 */
  });
  const f = fmtStage2(c);
  get('cpxRoi').textContent           = f.roi;
  get('cpxAnnualBenefit').textContent = f.annualBenefit;
  get('cpxOpCostView').textContent    = fmtUsd(c.opCost);
  get('cpxNetBenefit').textContent    = f.netBenefit;
  get('cpxTotalInv').textContent      = f.invest;
  get('cpxRoiBasis').textContent      = f.roi;
  get('cpxPayback').textContent       = f.payback;
  get('cpxIrr').textContent           = f.irr;
  get('cpxNpv').textContent           = f.npv;
  get('cpxWcSavings').textContent     = f.wcSavings;

  /* Stage 10 Expected 컬럼도 같은 계산 결과로 동기화 */
  refreshStage10Expected(c);
}

function bindStage2Calc() {
  ['cpxSavings', 'cpxRevenue', 'cpxEstBudget', 'cpxCogs'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', refreshStage2Calc);
  });
}

/* =================================================================
 * Stage 2 — Feasibility & Expected ROI (full implementation)
 *   PDF p.4: 입력(Cost Savings/Productivity/Revenue + Risk 선택·기술)
 *           자동산출(ROI/Payback/IRR/NPV/CCC — r=10%, n=5yr)
 *   원본 HTML 순서 유지: 입력+ROI → Basis 표 → Payback·IRR·NPV
 *                      → CCC 표 → Risk & Review
 * ================================================================= */
/* 계산식/설명 ? 툴팁 — Materialize M.Tooltip 그대로 (bindTooltips 에서 init). Stage 공용 */
const tip = (text) => `<i class="material-icons cpx-tip tooltipped" data-position="bottom" data-tooltip="${text}">help_outline</i>`;

/* 첨부 행 — dropzone dz-file 패턴. kind: 'file'(체크+용량) | 'link'(링크 아이콘, CMMS 등) */
function dzFileRow(a) {
  const isLink = a.kind === 'link';
  return `
    <div class="dz-file${isLink ? ' cpx-dz-link' : ''}">
      <span class="f-mark"><i class="material-icons icon-sm-16">${isLink ? 'link' : 'check'}</i></span>
      <span class="f-name">${a.label}</span>
      <span class="f-meta">${isLink ? 'CMMS' : (a.size || '')}</span>
      <button class="f-rm" title="Remove"><i class="material-icons icon-sm-16">close</i></button>
    </div>`;
}

/* 첨부 zone 공통 마크업 */
function attachZoneHtml(attachments) {
  return `
    <div class="dropzone cpx-attach-zone">
      <div class="dz-body">
        <div class="dz-file-list">${attachments.map(dzFileRow).join('')}</div>
        <div class="dz-hint"><b>Drag &amp; drop files here</b><span class="dz-or">or click to browse</span></div>
      </div>
      <input type="file" hidden multiple>
    </div>`;
}

function renderStage2() {
  const d = capexCase.stage2;
  const c = calcStage2();
  const f = fmtStage2(c);

  /* CCC — 입력 1(COGS) + 표시 2(DIO/Lead) + WC Savings auto-calc.
     설명은 별도 행 대신 라벨 옆 인라인(muted) */
  const cccBody = `
    <tr class="cpx-row-main"><td>Annual COGS (Cost of Goods Sold)<span class="cpx-inline-note">— Basis for Daily COGS (Annual COGS ÷ 365)</span></td>
      <td class="hoo-num">
        <div class="aniInput cpx-money-field">
          <span class="cpx-money-unit">$</span>
          <input type="text" id="cpxCogs" class="browser-default cpx-money" value="${d.annualCogs.toLocaleString('en-US')}" inputmode="numeric">
          <span class="cpx-money-suffix">/yr</span>
          <span class="focus-border"></span>
        </div>
      </td></tr>
    <tr class="cpx-row-main"><td>DIO (Days Inventory Outstanding) Reduction${tip('DIO = (Avg Inventory ÷ Annual COGS) × 365')}<span class="cpx-inline-note">— Average days inventory stays in warehouse, reduced by this investment</span></td>
      <td class="hoo-num">-${d.dioReduction.toFixed(1)} days</td></tr>
    <tr class="cpx-row-main"><td>Lead Time Reduction<span class="cpx-inline-note">— Time saved from production start to finished goods shipment</span></td>
      <td class="hoo-num">-${d.leadTimeReduction.toFixed(1)} days</td></tr>
    <tr class="cpx-row-main cpx-result-row"><td>Working Capital Savings${tip('WC Savings = Daily COGS × DIO days saved')}<span class="cpx-inline-note">— Cash freed up by holding less inventory (Daily COGS × DIO days saved)</span></td>
      <td class="hoo-num" id="cpxWcSavings">${f.wcSavings}</td></tr>`;

  /* Review Result — 이 카드의 결재 결과 (선택 아님) → mr-status 필 */
  const rrCls = d.reviewResult === 'Approved' ? 'st-approved'
              : d.reviewResult === 'Rejected' ? 'st-rejected' : 'st-inprogress';

  /* 금액 입력 — Est. Budget 과 동일한 cpx-money 패턴 + /yr 단위 고정 */
  const moneyInput = (id, value) => `
    <div class="aniInput cpx-money-field">
      <span class="cpx-money-unit">$</span>
      <input type="text" id="${id}" class="browser-default cpx-money" value="${value.toLocaleString('en-US')}" inputmode="numeric">
      <span class="cpx-money-suffix">/yr</span>
      <span class="focus-border"></span>
    </div>`;

  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>Expected CCC (Cash Conversion Cycle) Improvement</h5>
    <div class="hoo-spec-table">
      <table class="hoo-table cpx-basis-table">
        <colgroup><col><col style="width:180px"></colgroup>
        <tbody>${cccBody}</tbody>
      </table>
    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Feasibility & Expected ROI</h5>
    <div class="form-grid">

      <div class="form-group">
        <label>Cost Savings (Expected)</label>
        ${moneyInput('cpxSavings', d.costSavings)}
      </div>

      <div class="form-group">
        <label>Productivity Gain</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.productivityGain}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>Revenue Impact</label>
        ${moneyInput('cpxRevenue', d.revenueImpact)}
      </div>

      <div class="form-group">
        <label>Expected ROI (Annual)${tip('ROI (%) = Net Benefit ÷ Total Investment × 100')}</label>
        <div class="form-static cpx-calc cpx-calc-roi" id="cpxRoi">${f.roi}</div>
      </div>

    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>ROI Calculation Basis</h5>
    <div class="hoo-spec-table">
      <table class="hoo-table cpx-basis-table">
        <colgroup><col><col style="width:200px"></colgroup>
        <tbody>
          <tr><td>Annual Benefit (Savings + Revenue)${tip('Annual Benefit = Savings + Revenue')}</td><td class="hoo-num" id="cpxAnnualBenefit">${f.annualBenefit}</td></tr>
          <tr><td>(−) Annual Operating Cost Increase</td><td class="hoo-num" id="cpxOpCostView">${fmtUsd(c.opCost)}</td></tr>
          <tr><td>Net Annual Benefit${tip('Net Benefit = Savings + Revenue − Operating Cost Increase')}</td><td class="hoo-num" id="cpxNetBenefit">${f.netBenefit}</td></tr>
          <tr><td>Total Investment${tip('Linked to Stage 1 Est. Budget')}</td><td class="hoo-num" id="cpxTotalInv">${f.invest}</td></tr>
          <tr class="cpx-result-row"><td>Annual ROI = Net Benefit / Investment${tip('ROI (%) = Net Benefit ÷ Total Investment × 100')}</td><td class="hoo-num" id="cpxRoiBasis">${f.roi}</td></tr>
          <tr class="cpx-result-row"><td>Payback Period${tip('Payback = Total Investment ÷ Annual Net Benefit')}</td><td class="hoo-num" id="cpxPayback">${f.payback}</td></tr>
          <tr class="cpx-result-row"><td>IRR (Internal Rate of Return)${tip('IRR = discount rate at which NPV = 0  (Excel IRR)')}</td><td class="hoo-num" id="cpxIrr">${f.irr}</td></tr>
          <tr class="cpx-result-row"><td>NPV (Net Present Value)${tip('NPV = Σ(CF ÷ (1+r)ⁿ) − Investment  (r=10%, n=5yr)')}</td><td class="hoo-num" id="cpxNpv">${f.npv}</td></tr>
        </tbody>
      </table>
    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Risk & Review</h5>
    <div class="form-grid">

      <div class="form-group">
        <label>Risk</label>
        <div class="bi-select-wrap">
          <select class="bi-select browser-default">
            <option value="">Select…</option>
            <option ${d.riskLevel === 'High' ? 'selected' : ''}>High</option>
            <option ${d.riskLevel === 'Medium' ? 'selected' : ''}>Medium</option>
            <option ${d.riskLevel === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
      </div>

      <div class="form-group span-2">
        <label>Risk Description</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.riskNote}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group span-2">
        <label>Attachments</label>
        ${attachZoneHtml(d.attachments)}
      </div>

    </div>

    <!-- 카드 최종 산출 — 이 단계의 결재 결과 (맨 아래 단독 밴드) -->
    <div class="cpx-review-band">
      <span class="cpx-review-band-label">Review Result</span>
      <span class="mr-status ${rrCls}">${d.reviewResult}</span>
    </div>
  `;
}

/* =================================================================
 * Stage 3 — CAPEX Approval (full implementation)
 *   PDF p.5: CAPEX#(auto) / Status / Approved Amount / Date(auto)
 *           Grade A·B·C → 결재 레벨 결정 (금액 구간별: 이하 VP까지 / 이상 CFO까지)
 *           Budget Code(BUDGET MASTERDATA) / Approval Chain 4단계 / Conditions
 * ================================================================= */
/* Priority → 결재 단계 수 (Stage 1 Priority 를 그대로 재확인. High=CFO까지 / Medium=VP까지 / Low=Finance까지) */
const CPX_GRADE_LEVELS = { High: 4, Medium: 3, Low: 2 };

function apprChainHtml(priority) {
  const steps = capexCase.stage3.approvalChain.slice(0, CPX_GRADE_LEVELS[priority] || 4);
  /* 상태별 유리판: done(초록)/rejected(빨강)/current(파랑)/pending(흰 유리)
     상태 배지는 박스 우측 상단 원형 */
  const badgeIco = { done: 'check', rejected: 'close', current: 'hourglass_top' };
  return steps.map((s, i) => {
    const st = s.st || 'done'; /* 본 케이스는 전체 완료 */
    return `
    ${i ? '<div class="cpx-appr-arrow"><i class="material-icons">arrow_forward</i></div>' : ''}
    <div class="cpx-appr-step ${st}">
      ${badgeIco[st] ? `<span class="cpx-appr-badge"><i class="material-icons">${badgeIco[st]}</i></span>` : ''}
      <div class="cpx-appr-role">${s.role}</div>
      <div class="cpx-appr-name">${s.name}</div>
      <div class="cpx-appr-date">${st === 'current' ? 'In progress' : (s.date || '—')}</div>
    </div>`;
  }).join('');
}

function renderStage3() {
  const d = capexCase.stage3;
  const priority = capexCase.stage1.priority; /* Stage 1 Priority 를 그대로 재확인 (단일 출처) */

  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>CAPEX Approval</h5>
    <div class="form-grid">

      <div class="form-group">
        <label>CAPEX #</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.capexNo}" readonly><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>Status</label>
        <div class="bi-select-wrap">
          <select class="bi-select browser-default">
            <option value="">Select…</option>
            <option ${d.status === 'Approved' ? 'selected' : ''}>Approved</option>
            <option ${d.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            <option ${d.status === 'Pending' ? 'selected' : ''}>Pending</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Approved Amount</label>
        <div class="aniInput cpx-money-field">
          <span class="cpx-money-unit">$</span>
          <input type="text" class="browser-default cpx-money" value="${parseMoneyNum(d.approvedAmount).toLocaleString('en-US')}" inputmode="numeric">
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Date</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.date}" readonly><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>Priority</label>
        <div class="bi-select-wrap">
          <select class="bi-select browser-default" id="cpxGrade">
            <option value="">Select…</option>
            <option ${priority === 'High' ? 'selected' : ''}>High</option>
            <option ${priority === 'Medium' ? 'selected' : ''}>Medium</option>
            <option ${priority === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Budget Code</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.budgetCode}" data-master="budgetCodes" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>

    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Approval Chain</h5>
    <div class="cpx-appr-chain" id="cpxApprChain">${apprChainHtml(priority)}</div>

    <div class="form-grid">
      <div class="form-group span-2">
        <label>Conditions</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.conditions}"><span class="focus-border"></span></div>
      </div>
    </div>
  `;
}

/* Approval Chain 유리판 — 색수차/spotlight 마우스 추적 (--ap-gx/--ap-gy) + 소각도 3D 틸트
   ※ 과거 jitter 원인 = 기울어진 rect 로 좌표 재계산하는 피드백 루프 (feedback_narrow_card_jitter)
     → mouseenter 시점 rect 캐시로 루프 차단 + 소각도(±3°) 한정. 재발 시 틸트만 제거할 것 */
function bindApprGlass(root) {
  const TILT = 6; /* (x-0.5)*6 → 최대 ±3deg */
  (root || document).querySelectorAll('.cpx-appr-step').forEach(card => {
    if (card._apGlass) return;
    card._apGlass = true;
    card.addEventListener('mouseenter', () => {
      card._apRect = card.getBoundingClientRect(); /* 틸트 전 rect 고정 */
    });
    card.addEventListener('mousemove', (e) => {
      const r = card._apRect || card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top)  / r.height;
      card.style.setProperty('--ap-gx', x * 100 + '%');
      card.style.setProperty('--ap-gy', y * 100 + '%');
      card.style.transform = `perspective(600px) rotateX(${((0.5 - y) * TILT).toFixed(2)}deg) rotateY(${((x - 0.5) * TILT).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card._apRect = null;
      card.style.transition = 'transform .3s ease';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 300);
    });
  });
}

/* =================================================================
 * (date) 필드 — Materialize Datepicker
 *   날짜 컨벤션: 미국식 + 연도 'Feb 10, 2026' → format 'mmm d, yyyy'
 *   NodeList 통째 init 금지 — element별 try/catch (Materialize 1.0 방어 컨벤션)
 *   container: body — 카드 overflow/backdrop 클리핑 회피
 * ================================================================= */
function bindDatepickers(root) {
  if (!(window.M && M.Datepicker)) return;
  (root || document).querySelectorAll('input.cpx-date').forEach(el => {
    if (el.M_Datepicker) return;
    const cur = new Date(el.value);
    try {
      const inst = M.Datepicker.init(el, {
        format: 'mmm d, yyyy',
        defaultDate: isNaN(cur) ? null : cur,
        setDefaultDate: !isNaN(cur),
        autoClose: true,
        container: document.body,
        yearRange: 6,
      });
      /* 유리판 마우스 추적 색수차 — cpx-appr-step 어법 (transform 없음, spotlight 추적만) */
      const modal = inst && inst.modalEl;
      if (modal && !modal._dpGlass) {
        modal._dpGlass = true;
        modal.addEventListener('mousemove', (e) => {
          const r = modal.getBoundingClientRect();
          modal.style.setProperty('--dp-gx', ((e.clientX - r.left) / r.width)  * 100 + '%');
          modal.style.setProperty('--dp-gy', ((e.clientY - r.top)  / r.height) * 100 + '%');
        });
      }
    } catch (e) {
      console.warn('[capex] datepicker init 실패:', e);
    }
  });
}

/* Grade 변경 → 결재 체인 단계 수 즉시 반영 (재렌더 후 글래스 재바인딩) */
function bindStage3Grade() {
  const sel = document.getElementById('cpxGrade');
  const chain = document.getElementById('cpxApprChain');
  if (!sel || !chain) return;
  sel.addEventListener('change', () => {
    chain.innerHTML = apprChainHtml(sel.value || 'High');
    bindApprGlass(chain);
  });
}

/* =================================================================
 * Stage 4 — Requirement & Specification (full implementation)
 *   PDF p.6: 기술사양/품질EHS/유틸리티 (text) 입력 3종
 *           Installed Base Review — CMMS 연동(auto):
 *             비교 대상 설비 선택(EQUIP MASTERDATA 퀵서치)
 *             최근 3년 고장 이력 + 개선/업그레이드 이력 테이블 (read-only)
 *           Key Findings → New Spec 반영 (text) — "이력 → 신규 스펙" 구조가 핵심
 * ================================================================= */
function renderStage4() {
  const d = capexCase.stage4;

  /* 고장 이력 — downtime 심각도 색 (48hrs 이상 danger / 미만 terracotta) */
  const bdRows = d.breakdownHistory.map(r => {
    const sevCls = parseInt(r.downtime, 10) >= 48 ? 'cpx-sev-high' : 'cpx-sev-low';
    return `
      <tr>
        <td class="hoo-date">${r.date}</td>
        <td><a href="javascript:;" class="cpx-wo-link">${r.wo}</a></td>
        <td>${r.desc}</td>
        <td class="hoo-num ${sevCls}">${r.downtime}</td>
        <td class="hoo-num">${r.cost}</td>
      </tr>`;
  }).join('');

  /* 개선 이력 — Result 효과 색 (Partially → terracotta / 그 외 sage) */
  const upRows = d.upgradeHistory.map(r => {
    const resCls = r.result.startsWith('Partially') ? 'cpx-res-part' : 'cpx-res-good';
    return `
      <tr>
        <td class="hoo-date">${r.date}</td>
        <td><a href="javascript:;" class="cpx-wo-link">${r.desc}</a></td>
        <td class="hoo-num">${r.cost}</td>
        <td class="${resCls}">${r.result}</td>
      </tr>`;
  }).join('');

  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>Requirement &amp; Specification</h5>
    <div class="form-grid">

      <div class="form-group span-2">
        <label>Engineering Spec</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.engSpec}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group span-2">
        <label>Quality / EHS</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.quality}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group span-2">
        <label>Utilities</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.utilities}"><span class="focus-border"></span></div>
      </div>

    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Installed Base Review <small>(from CMMS)</small></h5>
    <div class="form-grid">
      <div class="form-group span-2">
        <label>Reference Equipment</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.referenceEquip}" data-master="equipment" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>
    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Breakdown &amp; Failure History <small>(Recent 3 years, from CMMS Work Orders)</small></h5>
    <div class="hoo-spec-table">
      <table class="hoo-table">
        <colgroup>
          <col style="width:110px"><col style="width:140px"><col><col style="width:90px"><col style="width:100px">
        </colgroup>
        <thead>
          <tr><th>Date</th><th>Work Order #</th><th>Failure Description</th><th class="hoo-th-num">Downtime</th><th class="hoo-th-num">Cost</th></tr>
        </thead>
        <tbody>${bdRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="hoo-tfoot-label">Total (3 years)</td>
            <td class="hoo-num hoo-tfoot-value cpx-sev-high">${d.breakdownTotal.downtime}</td>
            <td class="hoo-num hoo-tfoot-value">${d.breakdownTotal.cost}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Improvement &amp; Upgrade History</h5>
    <div class="hoo-spec-table">
      <table class="hoo-table">
        <colgroup>
          <col style="width:110px"><col><col style="width:100px"><col style="width:180px">
        </colgroup>
        <thead>
          <tr><th>Date</th><th>Description</th><th class="hoo-th-num">Cost</th><th>Result</th></tr>
        </thead>
        <tbody>${upRows}</tbody>
      </table>
    </div>

    <div class="bi-block-head">
      <h5 class="bi-block-title"><span class="bi-bar"></span>Key Findings → Reflected in New Specification</h5>
      <div class="bi-block-meta">
        <a href="javascript:;" class="hBtn hBtn-sm hOrange waves-effect cpx-hidden" id="cpxKfFigBtn"><i class="material-icons">add_photo_alternate</i><span class="label">Add Figures</span></a>
        <span class="cpx-ai-aura-wrap"><a href="javascript:;" class="hBtn hBtn-sm hViva waves-effect" id="cpxKfAiBtn"><i class="material-icons">auto_awesome</i><span class="label">AI Recommend</span></a></span>
      </div>
    </div>
    <div class="cpx-findings-editor">
      <div id="cpxKeyFindingsEditor"></div>
    </div>

    <div class="form-grid">
      <div class="form-group span-2">
        <label>Attachments</label>
        ${attachZoneHtml(d.attachments)}
      </div>
    </div>
  `;
}

/* =================================================================
 * Stage 5 — TBE / Technical Bid Evaluation (full implementation)
 *   PDF p.7: 순수 기술 관점 벤더 평가 (가격 제외)
 *           평가 테이블 — Vendor / Score(100점) / Compliance(Pass·Conditional·Fail)
 *                        / Lead Time(납기) / Comment
 *           출력 — 기술적으로 가장 적합한 벤더 선정, 최고 점수 벤더 하이라이트 표시
 * ================================================================= */
/* 외부 구매 프로그램 진입 URL — TBE/CBE 가 아직 작성 안 됐을 때 바로 가서 신청.
   ※ 데모 플레이스홀더 — 실제 소싱 시스템 주소로 교체 */
const CPX_PURCHASING_URL = 'https://purchasing.mpm.com/rfq/new';

function renderStage5() {
  const d = capexCase.stage5;

  /* Compliance 색 — Stage 4 Result 색 클래스 재사용 (Pass sage / Conditional terracotta / Fail danger) */
  const compCls = (c) => c === 'Pass' ? 'cpx-res-good'
                       : c === 'Conditional' ? 'cpx-res-part' : 'cpx-res-bad';

  /* 평가 행 — 최고 점수 벤더(winner)는 bronze 틴트 행 + 벤더명 옆 트로피 + Score 강조 (PDF 명세: 하이라이트 표시)
     ※ 칩은 컬럼 폭에서 줄바꿈으로 행 높이 깨짐 (2026-06-05) — 같은 줄 인라인 아이콘으로 */
  const rows = d.vendors.map(v => `
    <tr${v.winner ? ' class="cpx-winner-row"' : ''}>
      <td><b>${v.name}</b>${v.winner ? '<i class="material-icons cpx-winner-ico" title="Technically preferred">emoji_events</i>' : ''}</td>
      <td class="hoo-num${v.winner ? ' cpx-win-strong' : ''}">${v.score}</td>
      <td class="${compCls(v.compliance)}">${v.compliance}</td>
      <td class="hoo-num">${v.leadTime}</td>
      <td>${v.comment}</td>
    </tr>`).join('');

  return `
    <div class="bi-block-head">
      <h5 class="bi-block-title"><span class="bi-bar"></span>Technical Bid Evaluation <small>(Technical merit only — pricing evaluated in Stage 6 CBE)</small></h5>
      <div class="bi-block-meta">
        <a href="${CPX_PURCHASING_URL}" target="_blank" rel="noopener" class="hBtn hBtn-sm hViva waves-effect"><i class="material-icons">open_in_new</i><span class="label">Create in Purchasing System</span></a>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group span-2">
        <label>Reference RFQ</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.rfqNo}" data-master="rfqNumbers" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>
    </div>
    <div class="hoo-spec-table">
      <table class="hoo-table">
        <colgroup>
          <col style="width:170px"><col style="width:110px"><col style="width:120px"><col style="width:100px"><col>
        </colgroup>
        <thead>
          <tr><th>Vendor</th><th class="hoo-th-num">Score</th><th>Compliance</th><th class="hoo-th-num">Lead Time</th><th>Comment</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="form-grid">
      <div class="form-group span-2">
        <label>Decision / Review Comments</label>
        <textarea class="browser-default detail-textarea" placeholder="Enter technical review comments and the selection rationale…">${d.decision}</textarea>
      </div>
    </div>
  `;
}

/* =================================================================
 * Stage 6 — CBE / Commercial Bid Evaluation (full implementation)
 *   PDF p.7: 가격·조건·보증 관점 평가
 *           평가 테이블 — Score / Quoted / Negotiated / Payment Terms / Warranty / Decision
 *           Payment Terms = 계약금 / FAT 후 / SAT 후 / 최종 비율 (예: 30/40/20/10)
 *           출력 — 최종 선정 벤더 + 계약 금액 확정 (TBE 와 CBE 종합하여 의사결정)
 * ================================================================= */
function renderStage6() {
  const d = capexCase.stage6;
  const winner = d.vendors.find(v => v.winner);

  /* Decision 색 — Selected sage / Not selected muted / Excluded danger */
  const decCls = (x) => x === 'Selected' ? 'cpx-res-good'
                      : x === 'Excluded' ? 'cpx-res-bad' : 'cpx-res-mute';

  /* 평가 행 — winner 는 Stage 5 와 동일 어법 (bronze 틴트 + 트로피 + 핵심 값 강조)
     CBE 의 핵심 값 = Score 와 계약 확정 금액(Negotiated) */
  const rows = d.vendors.map(v => `
    <tr${v.winner ? ' class="cpx-winner-row"' : ''}>
      <td><b>${v.name}</b>${v.winner ? '<i class="material-icons cpx-winner-ico" title="Final selection">emoji_events</i>' : ''}</td>
      <td class="hoo-num${v.winner ? ' cpx-win-strong' : ''}">${v.score}</td>
      <td class="hoo-num">${v.quoted}</td>
      <td class="hoo-num${v.winner ? ' cpx-win-strong' : ''}">${v.negotiated}</td>
      <td class="hoo-num">${v.terms}</td>
      <td class="hoo-num">${v.warranty}</td>
      <td class="${decCls(v.decision)}">${v.decision}</td>
    </tr>`).join('');

  return `
    <div class="bi-block-head">
      <h5 class="bi-block-title"><span class="bi-bar"></span>Commercial Bid Evaluation <small>(Price · terms · warranty — combined with TBE Stage 5 for final decision)</small></h5>
      <div class="bi-block-meta">
        <a href="${CPX_PURCHASING_URL}" target="_blank" rel="noopener" class="hBtn hBtn-sm hViva waves-effect"><i class="material-icons">open_in_new</i><span class="label">Create in Purchasing System</span></a>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group span-2">
        <label>Reference RFQ</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.rfqNo}" data-master="rfqNumbers" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>
    </div>
    <div class="hoo-spec-table">
      <table class="hoo-table">
        <colgroup>
          <col style="width:170px"><col style="width:80px"><col style="width:110px"><col style="width:120px"><col style="width:155px"><col style="width:100px"><col>
        </colgroup>
        <thead>
          <tr>
            <th>Vendor</th>
            <th class="hoo-th-num">Score</th>
            <th class="hoo-th-num">Quoted</th>
            <th class="hoo-th-num">Negotiated</th>
            <th class="hoo-th-num">Payment Terms${tip('Down payment / After FAT / After SAT / Final (%)')}</th>
            <th class="hoo-th-num">Warranty</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="form-grid">
      <div class="form-group span-2">
        <label>Negotiation Result</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.negotiation}"><span class="focus-border"></span></div>
      </div>
    </div>

    <div class="form-grid">
      <div class="form-group span-2">
        <label>Final Selection / Review Comments</label>
        <textarea class="browser-default detail-textarea" placeholder="Enter the final selection rationale and commercial review comments…">${winner.name} — Contract Amount ${winner.negotiated}</textarea>
      </div>
    </div>
  `;
}

/* =================================================================
 * Stage 7 — Contract & PO (full implementation)
 *   PDF p.8: Contract Information — Vendor(VENDOR MASTERDATA) / Contract Amount(text)
 *            / ERP PO#(ERP MASTERDATA) / Contract Date(date) / Warranty(text)
 *           Payment Schedule — 분할 지급 M1~M4 (합계 100%)
 *            FAT = 벤더 공장 출하 전 검수 시험 / SAT = 현장 설치 후 최종 성능 시험
 *           Contract Conditions(text) — 지체상금·품질보증·환경관리 등 특수 조건
 *   ※ Contract Date / Warranty / Conditions 는 원본 HTML 에 없는 PDF 전용 필드 (2026-06-05 추가)
 * ================================================================= */
function renderStage7() {
  const d = capexCase.stage7;

  /* 지급 마일스톤 — Approval Chain 유리판 체인 어법 재사용 (M1→M4 순차 구조 동일)
     상태: Paid → done(sage 틴트+체크 뱃지) / 미지급 → current(blue+모래시계) */
  const paySteps = d.payments.map((p, i) => {
    const st = p.status === 'Paid' ? 'done' : 'current';
    return `
    ${i ? '<div class="cpx-appr-arrow"><i class="material-icons">arrow_forward</i></div>' : ''}
    <div class="cpx-appr-step ${st}">
      <span class="cpx-appr-badge"><i class="material-icons">${st === 'done' ? 'check' : 'hourglass_top'}</i></span>
      <div class="cpx-appr-role">${p.ms}</div>
      <div class="cpx-appr-name cpx-pay-amount">${p.amount}</div>
      <div class="cpx-appr-date">${p.status === 'Paid' ? `Paid ${p.paidOn}` : 'In progress'}</div>
    </div>`;
  }).join('');

  /* 합계 — 데이터에서 산출 (M1~M4 = 계약 금액 100%) */
  const payTotal = d.payments.reduce((s, p) => s + Number(p.amount.replace(/[^0-9]/g, '')), 0);

  /* Key Dates — FAT/SAT 는 PDF 정의, Warranty Expiry 는 파생식(SAT+24mo)을 ? 툴팁으로 */
  const dateTips = {
    'FAT (Factory Acceptance Test)': 'Inspection test at vendor factory before shipment',
    'SAT (Site Acceptance Test)':    'Final performance test after on-site installation',
    'Warranty Expiry':               'SAT date + warranty period (24 mo from SAT)',
  };
  const keyDateFields = d.keyDates.map(k => `
    <div class="form-group">
      <label>${k.label}${dateTips[k.label] ? tip(dateTips[k.label]) : ''}</label>
      <div class="aniInput"><input type="text" class="browser-default cpx-date" value="${k.date}"><span class="focus-border"></span></div>
    </div>`).join('');

  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>Contract Information</h5>
    <div class="form-grid">

      <div class="form-group">
        <label>Contract #</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.contractNo}" readonly><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>ERP PO #</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.poNo}" data-master="poNumbers" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Vendor</label>
        <div class="aniInput cpx-qs-field input-field">
          <input type="text" class="browser-default cpx-quicksearch" value="${d.vendor}" data-master="vendors" placeholder="Quick search…" autocomplete="off">
          <i class="material-icons cpx-qs-ico">search</i>
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Contract Amount</label>
        <div class="aniInput cpx-money-field">
          <span class="cpx-money-unit">$</span>
          <input type="text" class="browser-default cpx-money" value="${parseMoneyNum(d.contractAmount).toLocaleString('en-US')}" inputmode="numeric">
          <span class="focus-border"></span>
        </div>
      </div>

      <div class="form-group">
        <label>Contract Date</label>
        <div class="aniInput"><input type="text" class="browser-default cpx-date" value="${d.contractDate}"><span class="focus-border"></span></div>
      </div>

      <div class="form-group">
        <label>Warranty</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.warranty}"><span class="focus-border"></span></div>
      </div>

    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Payment Schedule <small>(Installment payments — total 100% = $ ${payTotal.toLocaleString('en-US')}K)</small></h5>
    <div class="cpx-appr-chain cpx-pay-chain">${paySteps}</div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Key Dates</h5>
    <div class="form-grid">
      ${keyDateFields}
    </div>

    <div class="form-grid">
      <div class="form-group span-2">
        <label>Contract Conditions</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.conditions}"><span class="focus-border"></span></div>
      </div>
    </div>
  `;
}

/* =================================================================
 * Stage 8 — Design / Fabrication / Installation (full implementation)
 *   PDF p.9: S-Curve Progress Charts 5개 (Overall + Design/Procurement/Fabrication/Installation)
 *            Plan vs Actual + 편차 % (툴팁) + 지연 구간 하이라이트 + 이벤트 라벨 + 마일스톤
 *           Milestone Timeline — 9개, On time / Delayed / Ahead 3색
 *           Change Log & Issues — CHG-### / ISS-###
 *   차트: Highcharts (Canvas 엔진 이식 대신 — 2026-06-05 사용자 결정)
 * ================================================================= */
function renderStage8() {
  const d = capexCase.stage8;

  /* 공용 범례 — Plan / Actual / 지연·선행 영역 (HTML 범례, 차트 내 legend 비활성) */
  const legend = `
    <div class="cpx-chart-legend">
      <span><i class="cpx-lg-line cpx-lg-plan"></i>Plan</span>
      <span><i class="cpx-lg-line cpx-lg-actual"></i>Actual</span>
      <span><i class="cpx-lg-area cpx-lg-behind"></i>Gap Area (Behind)</span>
      <span><i class="cpx-lg-area cpx-lg-ahead"></i>Gap Area (Ahead)</span>
      <span><i class="cpx-lg-area cpx-lg-dzone"></i>Delay Zone${tip('Background highlight where Actual lags Plan by 10%p or more')}</span>
    </div>`;

  /* 진도 데이터 입력 에디터 — 차트 카드 안 토글 (원작에 없는 입력 화면, 2026-06-05 사용자 요청)
     입력 즉시 차트 반영 (calcStage2 실시간 연동 어법). 테이블은 hoo-table 양식 + aniInput 셀 (basis 표 어법) */
  const edCell = (series, v, i, isText) => `
    <td><div class="aniInput"><input type="text" class="browser-default${isText ? ' cpx-ed-text' : ''}"${isText ? '' : ' inputmode="numeric"'} data-series="${series}" data-i="${i}" value="${v}"><span class="focus-border"></span></div></td>`;
  const editorHtml = (key, cfg) => `
    <div class="cpx-chart-editor" data-chart-key="${key}">
      <div class="hoo-spec-table">
        <table class="hoo-table cpx-ed-table">
          <colgroup><col style="width:90px">${cfg.labels.map(() => '<col>').join('')}</colgroup>
          <thead><tr><th></th>${cfg.labels.map(l => `<th>${l}</th>`).join('')}</tr></thead>
          <tbody>
            <tr><td class="cpx-ed-label">Plan (%)</td>${cfg.plan.map((v, i) => edCell('plan', v, i)).join('')}</tr>
            <tr><td class="cpx-ed-label">Actual (%)</td>${cfg.actual.map((v, i) => edCell('actual', v, i)).join('')}</tr>
            <tr><td class="cpx-ed-label">Event</td>${cfg.labels.map((_, i) => edCell('events', (cfg.events || [])[i] || '', i, true)).join('')}</tr>
          </tbody>
        </table>
      </div>
    </div>`;

  const editBtn = `<a href="javascript:;" class="cpx-chart-edit" title="Edit progress data"><i class="material-icons">edit</i><span class="cpx-chart-edit-lbl">Edit</span></a>`;

  /* 서브 차트 4개 — 상태 톤: success(sage) / accent(blue) / warn(terracotta) */
  const subCards = d.subCharts.map(c => `
    <div class="cpx-chart-card">
      <div class="cpx-chart-head">
        <span class="cpx-chart-title">${c.title}</span>
        <span class="cpx-chart-head-r">
          <span class="cpx-chart-status t-${c.tone}">${c.tone === 'warn' ? '▲' : '✔'} ${c.status}</span>
          ${editBtn}
        </span>
      </div>
      <div id="cpxChart-${c.key}" class="cpx-chart-box"></div>
      ${editorHtml(c.key, c)}
    </div>`).join('');

  /* Milestone Timeline — 3색 dot (on-time sage / delayed danger / ahead blue) */
  const tlNote = { 'on-time': 'On time', delayed: '', ahead: '' };
  const tlItems = d.milestones.map(m => `
    <div class="cpx-tl-item">
      <div class="cpx-tl-dot ${m.status}"></div>
      <div class="cpx-tl-date">${m.date}</div>
      <div class="cpx-tl-label">${m.label}</div>
      <div class="cpx-tl-note n-${m.status}">${m.note || tlNote[m.status] || ''}</div>
    </div>`).join('');

  /* Change Log / Issues — 사용자 추가/삭제 편집형 테이블. 빌더는 top-level
     cpxLogTableHtml (ID·Status 컬럼 제거, Description 입력 + ✕ 삭제) */

  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>S-Curve Progress Charts <small>(Plan vs Actual — cumulative %)</small></h5>
    ${legend}
    <div class="cpx-charts-grid">
      <div class="cpx-chart-card cpx-chart-full">
        <div class="cpx-chart-head">
          <span class="cpx-chart-title">Overall Project Progress</span>
          <span class="cpx-chart-head-r">
            <span class="cpx-chart-status t-success">✔ ${d.overall.status}</span>
            ${editBtn}
          </span>
        </div>
        <div id="cpxChart-overall" class="cpx-chart-box cpx-chart-box-lg"></div>
        ${editorHtml('overall', d.overall)}
      </div>
      ${subCards}
    </div>

    <h5 class="bi-block-title"><span class="bi-bar"></span>Milestone Timeline</h5>
    <div class="cpx-tl">
      <div class="cpx-tl-line"></div>
      <div class="cpx-tl-items">${tlItems}</div>
    </div>

    ${cpxLogTableHtml('Change Log', d.changes, 'changes')}
    ${cpxLogTableHtml('Issues', d.issues, 'issues')}
  `;
}

/* =================================================================
 * Stage 8 — Change Log / Issues 편집형 테이블 (2026-06-09 사용자 요청)
 *   ID·Status 컬럼 제거 · 사용자가 직접 행 추가/삭제. Sign-off Chain 어법 재사용.
 *   Description=입력 / ✕ 삭제 / 우상단 Add row · No.=renumberHooNo
 * ================================================================= */
function cpxLogRowHtml(row, i) {
  const r = row || {};
  return `
    <tr>
      <td class="hoo-no">${i + 1}</td>
      <td><div class="aniInput"><input type="text" class="browser-default" value="${r.desc || ''}" placeholder="Description…"><span class="focus-border"></span></div></td>
      <td class="hoo-x"><i class="material-icons">close</i></td>
    </tr>`;
}
function cpxLogTableHtml(title, rows, key) {
  return `
    <div class="bi-block-head">
      <h5 class="bi-block-title"><span class="bi-bar"></span>${title}</h5>
      <div class="bi-block-meta">
        <a href="javascript:;" class="hBtn hBtn-sm hOrange waves-effect cpx-log-add" data-log="${key}"><i class="material-icons">add</i><span class="label">Add row</span></a>
      </div>
    </div>
    <div class="hoo-spec-table">
      <table class="hoo-table">
        <colgroup><col style="width:48px"><col><col style="width:44px"></colgroup>
        <thead><tr><th>No.</th><th>Description</th><th></th></tr></thead>
        <tbody id="cpxLog-${key}">${(rows || []).map(cpxLogRowHtml).join('')}</tbody>
      </table>
    </div>`;
}
function renumberHooNo(tbody) {
  tbody.querySelectorAll(':scope > tr').forEach((tr, i) => {
    const no = tr.querySelector('.hoo-no');
    if (no) no.textContent = i + 1;
  });
}
function bindLogEditors() {
  document.querySelectorAll('.cpx-log-add').forEach(btn => {
    const tbody = document.getElementById('cpxLog-' + btn.dataset.log);
    if (!tbody) return;
    /* 행 추가 — 빈 행 append + 번호 재계산 */
    btn.addEventListener('click', () => {
      tbody.insertAdjacentHTML('beforeend', cpxLogRowHtml({}, tbody.children.length));
      renumberHooNo(tbody);
    });
    /* 행 삭제 — hoo-x 이벤트 위임 */
    tbody.addEventListener('click', (e) => {
      if (!e.target.closest('.hoo-x')) return;
      e.target.closest('tr')?.remove();
      renumberHooNo(tbody);
    });
  });
}

/* =================================================================
 * Summary 보고서 모달 — 좌측 초요약과 본문 사이의 1~2장 요약 (2026-06-09)
 *   데이터/지표는 본문과 동일 소스(calcStage2 live + capexCase). PDF 느낌의 문서 레이아웃.
 * ================================================================= */
let summaryGenTimer = null;
let summaryChart = null;
function buildSummaryHtml() {
  const c = capexCase;
  const s2 = calcStage2();
  const pbExp = s2.payback != null ? `${s2.payback.toFixed(1)} yr` : '—';

  const approved   = parseMoneyNum(c.stage3.approvedAmount);
  const actualCost = parseUsdC(c.stage10.budget.actual);
  const variance   = approved - actualCost;
  const varRate    = approved > 0 ? Math.abs(variance / approved * 100) : 0;
  const under      = variance >= 0;

  const roiRow = c.stage10.roiCompare.find(r => r.label === 'ROI (%)');
  const pbRow  = c.stage10.roiCompare.find(r => r.label === 'Payback Period');
  const npvRow = c.stage10.roiCompare.find(r => r.label === 'NPV');
  const tbeW   = c.stage5.vendors.find(v => v.winner);
  const cbeW   = c.stage6.vendors.find(v => v.winner);
  const goLive = c.stage9.qualifications.find(q => q.label === 'Go-Live');

  const kpis = [
    { label: 'Investment',   plan: fmtUsdAuto(approved),       act: c.stage10.budget.actual },
    { label: 'ROI (annual)', plan: `${s2.roi.toFixed(1)}%`,    act: roiRow.actual },
    { label: 'Payback',      plan: pbExp,                      act: pbRow.actual },
    { label: 'NPV (5yr)',    plan: fmtUsdK(s2.npv),            act: npvRow.actual },
  ];
  const kpiHtml = kpis.map(k => `
    <div class="cpx-sum-kpi">
      <div class="cpx-sum-kpi-label">${k.label}</div>
      <div class="cpx-sum-kpi-act">${k.act}</div>
      <div class="cpx-sum-kpi-plan">Plan ${k.plan}</div>
    </div>`).join('');

  const phases = [
    ['1',  'Investment Request',     `$ ${c.stage1.estBudget} budget · ${c.stage1.priority} priority · ${c.stage1.requester} (${c.stage1.requestDate})`],
    ['2',  'Feasibility &amp; ROI',  `Expected ROI ${s2.roi.toFixed(1)}%, payback ${pbExp} · ${c.stage2.reviewResult}`],
    ['3',  'CAPEX Approval',         `${c.stage3.approvedAmount} approved · ${c.stage3.approvalChain.slice(-1)[0].role} (${c.stage3.date})`],
    ['4',  'Requirement &amp; Spec', `Ref. ${c.stage4.referenceEquip.split(' ')[0]} · CMMS history reviewed → reflected in new spec`],
    ['5',  'Technical Bid Eval.',    `${tbeW.name} technically preferred (${tbeW.score})`],
    ['6',  'Commercial Bid Eval.',   `${cbeW.name} selected · ${cbeW.negotiated} (from ${cbeW.quoted})`],
    ['7',  'Contract &amp; PO',      `${c.stage7.contractAmount} · ${c.stage7.poNo} · ${c.stage7.vendor}`],
    ['8',  'Design / Fab / Install', `Overall ${c.stage8.overall.status} · fabrication 3d delayed then recovered`],
    ['9',  'Commissioning',          `FAT·SAT·IQ·OQ·PQ all passed · Go-Live ${goLive.date}`],
    ['10', 'Actual ROI Analysis',    `ROI ${roiRow.actual} (vs ${s2.roi.toFixed(1)}%) · payback ${pbRow.actual} · ${varRate.toFixed(1)}% ${under ? 'under' : 'over'} budget`],
  ];
  const phaseHtml = phases.map(p => `
    <div class="cpx-sum-phase">
      <span class="cpx-sum-phase-no">${p[0]}</span>
      <div class="cpx-sum-phase-body">
        <div class="cpx-sum-phase-name">${p[1]}</div>
        <div class="cpx-sum-phase-desc">${p[2]}</div>
      </div>
    </div>`).join('');

  return `
    <div class="cpx-summary cpx-sum-reveal">
      <div class="cpx-sum-head">
        <div class="cpx-sum-head-l">
          <div class="cpx-sum-kicker">MPM CAPEX · Investment Summary</div>
          <h1 class="cpx-sum-title">${c.title}</h1>
          <div class="cpx-sum-meta">${c.id} · ${c.stage1.site} · ${c.stage1.dept} · ${c.classification}</div>
        </div>
        <div class="cpx-sum-stamp">
          <span class="cpx-sum-status">Completed</span>
          <span class="cpx-sum-asof">${c.lastMod.replace('Last Mod. ', 'as of ')}</span>
        </div>
      </div>

      <div class="cpx-sum-section">
        <h2 class="cpx-sum-h">Executive Summary</h2>
        <p class="cpx-sum-p">${c.stage1.purpose} ${c.stage10.assessment}</p>
      </div>

      <div class="cpx-sum-section">
        <h2 class="cpx-sum-h">Key Outcomes <small>(Plan vs Actual)</small></h2>
        <div class="cpx-sum-kpis">${kpiHtml}</div>
        <div class="cpx-sum-note">${under ? 'Under' : 'Over'} budget by ${varRate.toFixed(1)}% (${c.stage10.budget.actual} vs ${fmtUsdAuto(approved)} approved).</div>
      </div>

      <div class="cpx-sum-section">
        <h2 class="cpx-sum-h">Annual Benefit — Plan vs Actual <small>($ thousand / yr)</small></h2>
        <div class="cpx-sum-chart" id="cpxSumChart"></div>
      </div>

      <div class="cpx-sum-section">
        <h2 class="cpx-sum-h">Process Digest <small>(10 stages)</small></h2>
        <div class="cpx-sum-phases">${phaseHtml}</div>
      </div>

      <div class="cpx-sum-section">
        <h2 class="cpx-sum-h">Lessons Learned</h2>
        <p class="cpx-sum-p">${c.stage10.lessons}</p>
      </div>
    </div>`;
}

/* AI 생성 연출 — 모달 오픈 시 "생성 중" 단계 애니메이션 후 보고서 reveal */
function openSummaryModal() {
  const m = document.getElementById('summaryModal');
  const host = document.getElementById('summaryBody');
  if (!m || !host || !window.M) return;
  M.Modal.getInstance(m)?.open();
  runSummaryGeneration(host);
}
function runSummaryGeneration(host) {
  if (summaryGenTimer) clearTimeout(summaryGenTimer);
  const steps = [
    'Reading project data…',
    'Analyzing 10 process stages…',
    'Computing ROI, payback & NPV…',
    'Drafting executive summary…',
    'Finalizing report…',
  ];
  host.innerHTML = `
    <div class="cpx-gen">
      <div class="cpx-gen-orb"><i class="material-icons">auto_awesome</i></div>
      <div class="cpx-gen-title">Generating AI Summary</div>
      <div class="cpx-gen-step" id="cpxGenStep">${steps[0]}</div>
      <div class="cpx-gen-bar"><div class="cpx-gen-bar-fill" id="cpxGenBar"></div></div>
    </div>`;
  const stepEl = host.querySelector('#cpxGenStep');
  const barEl  = host.querySelector('#cpxGenBar');
  const total  = steps.length;
  let i = 0;
  if (barEl) barEl.style.width = `${Math.round((1 / total) * 100)}%`;
  const tick = () => {
    i++;
    if (i < total) {
      if (stepEl) stepEl.textContent = steps[i];
      if (barEl)  barEl.style.width = `${Math.round(((i + 1) / total) * 100)}%`;
      summaryGenTimer = setTimeout(tick, 380 + Math.random() * 260);
    } else {
      if (barEl) barEl.style.width = '100%';
      summaryGenTimer = setTimeout(() => {
        host.innerHTML = buildSummaryHtml();
        renderSummaryChart();
      }, 380);
    }
  };
  summaryGenTimer = setTimeout(tick, 460);
}

/* 보고서 차트 — Annual Benefit Plan vs Actual (Highcharts column, 본문 톤 재사용) */
function renderSummaryChart() {
  const el = document.getElementById('cpxSumChart');
  if (!el || typeof Highcharts === 'undefined') return;
  const c = capexCase;
  const s2 = calcStage2();
  const k = (n) => Math.round(n / 1000);
  const plan = [k(s2.savings), k(s2.revenue), k(s2.netBenefit)];
  const actual = [
    k(parseUsdC(c.stage10.savings.actual)),
    k(parseUsdC(c.stage10.revenue.actual)),
    k(parseUsdC((c.stage10.netBenefit.find(r => r.total) || {}).actual || '0')),
  ];
  summaryChart = Highcharts.chart('cpxSumChart', {
    chart: { type: 'column', backgroundColor: 'transparent', height: 215,
             spacing: [10, 6, 4, 6], style: { fontFamily: "'SUIT', sans-serif" } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: true, itemStyle: { fontSize: '11px', color: '#6b6e65', fontWeight: '600' },
              symbolRadius: 2, symbolHeight: 9, margin: 8 },
    xAxis: { categories: ['Cost Savings', 'Revenue', 'Net Benefit'],
             lineColor: '#eee9dc', tickLength: 0,
             labels: { style: { fontSize: '12px', color: '#9AA09A' } } },
    yAxis: { min: 0, title: { text: null }, gridLineColor: '#f7f5ef',
             labels: { format: '${value}K', style: { fontSize: '11px', color: '#9AA09A' } } },
    tooltip: {
      shared: true, backgroundColor: 'rgba(255,255,255,0.94)',
      borderColor: 'rgba(184,150,86,0.30)', borderRadius: 8, style: { fontSize: '12px' },
      formatter() {
        const pt = {}; this.points.forEach(p => { pt[p.series.name] = p.y; });
        const dev = (pt.Actual ?? 0) - (pt.Plan ?? 0);
        const col = dev >= 0 ? '#5d80a3' : '#d97757';
        return `<b>${this.x}</b><br>Plan $${pt.Plan}K · Actual $${pt.Actual}K<br>` +
               `<span style="color:${col};font-weight:700;">Δ ${dev >= 0 ? '+' : ''}$${dev}K</span>`;
      },
    },
    plotOptions: { column: { borderRadius: 3, borderWidth: 0, pointPadding: 0.07,
                             groupPadding: 0.2, animation: { duration: 600 } } },
    series: [
      { name: 'Plan',   data: plan,   color: '#5d80a3' },
      { name: 'Actual', data: actual, color: '#B89656' },
    ],
  });
}

/* =================================================================
 * Stage 8 차트 — Highcharts S-Curve 공통 빌더
 *   Plan(점선 muted) vs Actual(bronze 실선)
 *   지연 구간(actual < plan) terracotta / 선행 구간(actual > plan) baltic blue arearange
 *   overall 에는 마일스톤 plotLine + 라벨 (PDF: 이벤트 라벨, 마일스톤 표시)
 * ================================================================= */
/* 편차 밴드 — 같은 인덱스 구간만 채움, 해당 없으면 null (밴드 끊김) */
function scurveBands(cfg) {
  return {
    behind: cfg.plan.map((p, i) => cfg.actual[i] < p ? [i, cfg.actual[i], p] : [i, null, null]),
    ahead:  cfg.plan.map((p, i) => cfg.actual[i] > p ? [i, p, cfg.actual[i]] : [i, null, null]),
  };
}

/* 지연 구간 배경 하이라이트 — 원본 delayZone 이식 (xAxis plotBand)
   하드코딩 대신 편차 ≥10%p 구간 자동 산출 — 에디터 편집 시 음영도 실시간 추종
   (원본 수치와 대조: Fab [1,2] 일치 / Overall [2,5] ≈ 자동 [3,6]) */
const CPX_DELAY_MIN = 10;
function scurveDelayZones(cfg) {
  const zones = [];
  let start = null;
  cfg.plan.forEach((p, i) => {
    const lag = (p - cfg.actual[i]) >= CPX_DELAY_MIN;
    if (lag && start === null) start = i;
    if (!lag && start !== null) { zones.push({ from: start - 0.5, to: i - 0.5 }); start = null; }
  });
  if (start !== null) zones.push({ from: start - 0.5, to: cfg.plan.length - 0.5 });
  /* Gap Area(terracotta)와 구분 — Delay Zone 은 --c-warn khaki(#D4CC82) 배경 띠 (2026-06-05 색 분리) */
  return zones.map(z => ({ ...z, color: 'rgba(212, 204, 130, 0.15)' }));
}

/* Actual 포인트 — dataLabel 2종 (배열 지원)
   ① 이벤트 라벨 (원본 eventLabels: 지연 포인트는 아래, 나머지 위)
   ② 편차 숫자 필 (원본 annotations: '-17%' 등) — |Δ| ≥ 10%p 자동 산출, 점 우측에 틴트 필 */
function scurveActualPoints(cfg) {
  const last = cfg.actual.length - 1;
  return cfg.actual.map((v, i) => {
    const ev = (cfg.events || [])[i];
    const dev = v - cfg.plan[i];
    /* 라벨 상/하 — 기본은 원본 배치(지연 = 점 아래), 단 겹침 회피 보정:
       바닥 근처(≤10%)는 위로(x축 라벨 충돌), 천장 근처(≥95%)는 아래로(플롯 상단 클리핑) */
    let above = dev >= 0;
    if (v <= 10) above = true;
    if (v >= 95) above = false;
    const labels = [];
    if (ev) {
      labels.push({
        enabled: true,
        format: ev,
        y: above ? -6 : 18,
        verticalAlign: above ? 'bottom' : 'top',
        /* 가장자리 포인트 — 차트 밖으로 안 나가게 안쪽으로 펼침 */
        align: i === 0 ? 'left' : i === last ? 'right' : 'center',
        crop: false, overflow: 'allow', allowOverlap: true,
        style: { fontSize: '11px', fontWeight: '600', color: '#8B6F40', textOutline: '2px rgba(255,255,255,0.85)' }, /* 차트 안 11px — 13px 룰 예외 (2026-06-05 사용자 지시) */
      });
    }
    if (Math.abs(dev) >= CPX_DELAY_MIN) {
      const behind = dev < 0;
      labels.push({
        enabled: true,
        format: `${dev > 0 ? '+' : ''}${dev}%`,
        align: 'left', x: 10, verticalAlign: 'middle', y: 0, /* 점 우측 — 이벤트 라벨(상/하)과 충돌 회피 */
        crop: false, overflow: 'allow', allowOverlap: true,
        /* 지연 숫자는 viva magenta(--c-danger #BB2649) — terracotta(Gap Area 면적색)보다 강한 경고
           배경 필 대신 흰 테두리 텍스트 — 이벤트 라벨과 같은 어법 (2026-06-05) */
        style: { fontSize: '13px', fontWeight: '700', color: behind ? '#BB2649' : '#5d80a3', textOutline: '2px rgba(255, 255, 255, 0.85)' },
      });
    }
    return { y: v, dataLabels: labels.length ? labels : { enabled: false } };
  });
}

function buildSCurve(containerId, cfg) {
  const { behind, ahead } = scurveBands(cfg);

  return Highcharts.chart(containerId, {
    chart: { backgroundColor: 'transparent', height: cfg.height, spacing: [15, 10, 10, 10],
             style: { fontFamily: "'SUIT', sans-serif" } },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: cfg.labels,
      lineColor: '#eee9dc', tickLength: 0,
      labels: { style: { fontSize: '13px', color: '#9AA09A' } },
      plotBands: scurveDelayZones(cfg), /* 지연 구간 배경 하이라이트 */
    },
    yAxis: {
      min: 0, max: 100, tickInterval: 25, title: { text: null },
      gridLineColor: '#f7f5ef',
      labels: { format: '{value}%', style: { fontSize: '13px', color: '#9AA09A' } },
    },
    tooltip: {
      shared: true,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      borderColor: 'rgba(184, 150, 86, 0.30)',
      borderRadius: 8,
      style: { fontSize: '13px' },
      formatter() {
        const pt = {};
        this.points.forEach(p => { pt[p.series.name] = p.y; });
        const dev = (pt.Actual ?? 0) - (pt.Plan ?? 0);
        const devTxt = dev === 0 ? '±0' : (dev > 0 ? `+${dev}` : `${dev}`);
        const devColor = dev < 0 ? '#d97757' : dev > 0 ? '#5d80a3' : '#9AA09A';
        return `<b>${this.x}</b><br>Plan ${pt.Plan}% · Actual ${pt.Actual}%<br>` +
               `<span style="color:${devColor};font-weight:700;">Δ ${devTxt}%p</span>`;
      },
    },
    plotOptions: {
      series: { marker: { radius: 3, symbol: 'circle' }, animation: { duration: 500 } },
      arearange: { lineWidth: 0, marker: { enabled: false }, enableMouseTracking: false },
    },
    series: [
      { name: 'Behind', type: 'arearange', data: behind, color: 'rgba(217, 119, 87, 0.16)' },
      { name: 'Ahead',  type: 'arearange', data: ahead,  color: 'rgba(139, 168, 196, 0.18)' },
      { name: 'Plan',   type: 'line', data: cfg.plan,                 color: '#5d80a3', dashStyle: 'Dash', lineWidth: 2 }, /* baltic-sea 진한 톤 — muted 회색에서 변경 (2026-06-05) */
      { name: 'Actual', type: 'line', data: scurveActualPoints(cfg),  color: '#B89656', lineWidth: 2.5 },
    ],
  });
}

function bindStage8Charts() {
  if (typeof Highcharts === 'undefined') return;
  const d = capexCase.stage8;
  /* ※ 마일스톤 세로 plotLine(CAPEX Approval 등)은 원본 차트에 없는 요소라 제거 (2026-06-05)
       — 마일스톤은 아래 Milestone Timeline 섹션이 전담 */

  const charts = {};
  charts.overall = buildSCurve('cpxChart-overall', { ...d.overall, height: 290 });
  d.subCharts.forEach(c => { charts[c.key] = buildSCurve(`cpxChart-${c.key}`, { ...c, height: 220 }); });

  /* 진도 입력 에디터 — edit 토글 + 입력 즉시 차트 setData 반영 */
  document.querySelectorAll('.cpx-chart-card').forEach(card => {
    const btn    = card.querySelector('.cpx-chart-edit');
    const editor = card.querySelector('.cpx-chart-editor');
    if (!btn || !editor || editor._cpxEdInit) return;
    editor._cpxEdInit = true;

    btn.addEventListener('click', () => {
      const open = editor.classList.toggle('is-open');
      btn.classList.toggle('is-on', open);
      const lbl = btn.querySelector('.cpx-chart-edit-lbl');
      if (lbl) lbl.textContent = open ? 'Done' : 'Edit';
    });

    editor.addEventListener('input', (e) => {
      const inp = e.target.closest('input[data-series]');
      if (!inp) return;
      const key = editor.dataset.chartKey;
      const cfg = key === 'overall' ? d.overall : d.subCharts.find(s => s.key === key);
      if (!cfg || !charts[key]) return;
      if (inp.dataset.series === 'events') {
        if (!cfg.events) cfg.events = [];
        cfg.events[+inp.dataset.i] = inp.value.trim();
      } else {
        /* 0~100 클램프 (% 진도율) — 빈 칸/비숫자는 0 */
        cfg[inp.dataset.series][+inp.dataset.i] = Math.max(0, Math.min(100, parseInt(inp.value, 10) || 0));
      }
      const { behind, ahead } = scurveBands(cfg);
      const ch = charts[key];
      ch.xAxis[0].update({ plotBands: scurveDelayZones(cfg) }, false); /* 지연 음영(Delay Zone) 실시간 추종 */
      ch.series[0].setData(behind, false);
      ch.series[1].setData(ahead, false);
      ch.series[2].setData(cfg.plan.slice(), false);
      /* Actual 은 updatePoints=false 필수 — 기본 merge 모드면 이전 dataLabels(편차 필/이벤트)가
         새 옵션에 합쳐져 stale 필이 잔류 (2026-06-05 발견). 포인트 재생성으로 갱신 */
      ch.series[3].setData(scurveActualPoints(cfg), true, undefined, false);
    });
  });
}

/* =================================================================
 * Stage 9 — Commissioning & Verification (full implementation)
 *   PDF p.10: Qualification Steps — FAT/SAT/IQ/OQ/PQ/Go-Live
 *             각 항목 Pass/Fail + 날짜, 모두 Pass → Handover
 *   Qualification 은 순차 검증 → 유리판 체인(cpx-appr-step) 어법 재사용
 *   (Stage 3 결재 / Stage 7 지급과 같은 "순차 진행" 시각 언어)
 * ================================================================= */
function renderStage9() {
  const d = capexCase.stage9;

  /* PDF 정의 — 카드 title 툴팁 (작은 카드라 ? 아이콘 대신 native title) */
  const qualDefs = {
    'FAT': 'Pre-shipment inspection at vendor factory',
    'SAT': 'Final performance verification on site',
    'IQ':  'Installed as designed',
    'OQ':  'Operates correctly under normal conditions',
    'PQ':  'Meets required performance criteria',
    'Go-Live': 'Production start after handover',
  };

  /* 검증 체인 — Passed → done(sage+체크) / Live → live(bronze+로켓) / Failed → rejected / 대기 → pending */
  const qualSteps = d.qualifications.map((q, i) => {
    const m = q.label.match(/^([^(]+?)(?:\s*\((.+)\))?$/); /* 'FAT (Factory...)' → 약칭 + 풀네임 */
    const abbr = m[1].trim();
    const full = m[2] || '';
    const st = q.status === 'Passed' ? 'done'
             : q.status === 'Live'   ? 'live'
             : q.status === 'Failed' ? 'rejected' : '';
    const badge = st === 'done' ? 'check' : st === 'live' ? 'rocket_launch' : st === 'rejected' ? 'close' : '';
    return `
    ${i ? '<div class="cpx-appr-arrow"><i class="material-icons">arrow_forward</i></div>' : ''}
    <div class="cpx-appr-step ${st}" title="${qualDefs[abbr] || ''}">
      ${badge ? `<span class="cpx-appr-badge"><i class="material-icons">${badge}</i></span>` : ''}
      <div class="cpx-appr-role">${abbr}</div>
      <div class="cpx-appr-name">${full || '&nbsp;'}</div>
      <div class="cpx-appr-date">${q.status === 'Live' ? `Live · ${q.date}` : `${q.status} · ${q.date}`}</div>
    </div>`;
  }).join('');

  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>Qualification Steps <small>(All must pass before handover)</small></h5>
    <div class="cpx-appr-chain cpx-qual-chain">${qualSteps}</div>

    <div class="form-grid">
      <div class="form-group span-2">
        <label>Result</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.result}"><span class="focus-border"></span></div>
      </div>
    </div>
  `;
}

/* =================================================================
 * Stage 10 — Actual ROI Analysis (full implementation)
 *   PDF p.11: Budget vs Actual (Variance/Rate) · Performance Expected vs Actual(초과달성률)
 *            Net Benefit(①+②−③) · ROI Formulas(Expected vs Actual) · CCC Improvement
 *            Lessons Learned(text)
 *   ※ Stage 2 와 동일 항목 구조 — Expected 컬럼·네비 Exp 모두 calcStage2() 실계산값 연동
 *     (data.js 의 expected 하드코딩은 제거됨 — actual 만 보관, Expected 는 전부 live)
 * ================================================================= */

/* 컴팩트 USD — 원본 표기: 박스는 ≥1M 이면 M, 테이블은 K 고정 */
function fmtUsdAuto(n) {
  return Math.abs(n) >= 1e6 ? `$ ${(n / 1e6).toFixed(2)}M` : `$ ${Math.round(n / 1e3)}K`;
}
function fmtUsdK(n) {
  return `$ ${Math.round(n / 1e3).toLocaleString('en-US')}K`;
}
/* '$ 412K' / '$ 1.38M' / '-$ 0.22M' / '$ 210K /yr' → 숫자 (data.js actual 문자열 파싱) */
function parseUsdC(s) {
  const m = String(s).replace(/,/g, '').match(/(-?)\s*\$?\s*(-?[\d.]+)\s*([KM])?/i);
  if (!m) return 0;
  const mul = m[3] ? (m[3].toUpperCase() === 'M' ? 1e6 : 1e3) : 1;
  return (m[1] === '-' ? -1 : 1) * parseFloat(m[2]) * mul;
}
const fmtPct = (x) => `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`;

/* Stage 10 산식 밴드 expr — render 와 refreshStage10Expected 가 공유 (drift 방지).
   Expected 측 값은 calcStage2 연동이라 Stage 2 입력 변경 시 live 갱신 대상 */
function s10FbExpr(c, d) {
  const d2 = capexCase.stage2;
  const savA = parseUsdC(d.savings.actual);
  const revA = parseUsdC(d.revenue.actual);
  const savPct = c.savings > 0 ? (savA - c.savings) / c.savings * 100 : 0;
  const revPct = c.revenue > 0 ? (revA - c.revenue) / c.revenue * 100 : 0;
  const pb = c.payback != null ? `${c.payback.toFixed(1)} yr` : '—';
  return {
    sav: `= (Actual − Expected) ÷ Expected × 100 = (${d.savings.actual} − ${fmtUsdAuto(c.savings)}) ÷ ${fmtUsdAuto(c.savings)} × 100 = <b>${fmtPct(savPct)}</b>`,
    rev: `= (Actual − Expected) ÷ Expected × 100 = (${d.revenue.actual} − ${fmtUsdAuto(c.revenue)}) ÷ ${fmtUsdAuto(c.revenue)} × 100 = <b>${fmtPct(revPct)}</b>`,
    nbE: `= ① + ② − ③ = ${fmtUsdK(c.savings)} + ${fmtUsdK(c.revenue)} − ${fmtUsdK(c.opCost)} = <b>${fmtUsdK(c.netBenefit)}</b>`,
    /* ROI / CCC Expected — calc 연동 */
    roiE:     `= Net Benefit ÷ Investment × 100 = ${fmtUsdK(c.netBenefit)} ÷ ${fmtUsdK(c.invest)} × 100 = <b>${c.roi.toFixed(1)}%</b>`,
    paybackE: `= Investment ÷ Net Benefit = ${fmtUsdK(c.invest)} ÷ ${fmtUsdK(c.netBenefit)} = <b>${pb}</b>`,
    npvE:     `= Σ (Net Benefit ÷ (1 + 0.1)ⁿ) − Investment ≈ <b>${fmtUsdK(c.npv)}</b>  (r = 10%, n = 5yr)`,
    wcE:      `= Daily COGS × DIO Reduction = (${fmtUsdAuto(c.cogs)} ÷ 365) × ${d2.dioReduction.toFixed(1)} days ≈ <b>${fmtUsdK(c.wcSavings)} /yr</b>`,
  };
}

function renderStage10() {
  const d  = capexCase.stage10;
  const d2 = capexCase.stage2;
  const c  = calcStage2();
  const f  = fmtStage2(c);

  /* ---- Budget vs Actual — 3-box (Approved 는 Stage 3 Approved Amount 연동) ---- */
  const approved   = parseMoneyNum(capexCase.stage3.approvedAmount);
  const actualCost = parseUsdC(d.budget.actual);
  const variance   = approved - actualCost;
  const varRate    = approved > 0 ? variance / approved * 100 : 0;
  const under      = variance >= 0;

  /* ---- Performance — Savings/Revenue (Expected ← calc, 초과달성률 산출) ---- */
  const savA = parseUsdC(d.savings.actual);
  const revA = parseUsdC(d.revenue.actual);
  const savPct = c.savings > 0 ? (savA - c.savings) / c.savings * 100 : 0;
  const revPct = c.revenue > 0 ? (revA - c.revenue) / c.revenue * 100 : 0;

  const cmpBox = (num, lbl, mod, numId) => `
    <div class="cpx-cmp-box${mod ? ' ' + mod : ''}">
      <div class="cpx-cmp-num"${numId ? ` id="${numId}"` : ''}>${num}</div>
      <div class="cpx-cmp-lbl">${lbl}</div>
    </div>`;

  /* 산식 풀이 밴드 — 원본 formula-box 웜톤 복원. rows: [label, exprHtml, exprId?] */
  const fb   = s10FbExpr(c, d);
  const fbox = (rows) => `
    <div class="cpx-fbox">
      ${rows.map(r => `<span class="cpx-flabel">${r[0]}</span><span class="cpx-fexpr"${r[2] ? ` id="${r[2]}"` : ''}>${r[1]}</span>`).join('')}
    </div>`;
  const nbA = d.netBenefit.map(r => r.actual);  /* [savings, revenue, opCost, total] actual */

  /* ---- Net Benefit 표 — Expected ← calc (①savings ②revenue ③opCost, 합계 netBenefit) ---- */
  const nbExpected = [fmtUsdK(c.savings), fmtUsdK(c.revenue), fmtUsdK(c.opCost), fmtUsdK(c.netBenefit)];
  const nbRows = d.netBenefit.map((r, i) => `
    <tr${r.total ? ' class="cpx-row-main cpx-result-row"' : ''}>
      <td>${r.label}</td>
      <td class="hoo-num" id="cpxS10NbE${i}">${nbExpected[i]}</td>
      <td class="hoo-num cpx-s10-actual">${r.actual}</td>
    </tr>`).join('');

  /* ---- ROI 표 — Expected ← calc (Formula 컬럼은 원본 그대로) ---- */
  const roiExpected = [f.roi, c.payback != null ? `${c.payback.toFixed(1)} yr` : '—', f.irr, fmtUsdK(c.npv)];
  const roiRows = d.roiCompare.map((r, i) => `
    <tr>
      <td>${r.label}</td>
      <td class="hoo-num" id="cpxS10RoiE${i}">${roiExpected[i]}</td>
      <td class="hoo-num cpx-s10-actual">${r.actual}</td>
      <td class="cpx-formula-cell">${r.formula}</td>
    </tr>`).join('');

  /* ---- CCC 표 — Expected ← Stage 2 (DIO/LeadTime 입력값, WC 는 calc) ---- */
  const cccExpected = [
    `-${d2.dioReduction.toFixed(1)} days`,
    `-${d2.leadTimeReduction.toFixed(1)} days`,
    `${fmtUsdK(c.wcSavings)} /yr`,
  ];
  const cccRows = d.cccCompare.map((r, i) => `
    <tr>
      <td>${r.label}</td>
      <td class="hoo-num" id="cpxS10CccE${i}">${cccExpected[i]}</td>
      <td class="hoo-num cpx-s10-actual">${r.actual}</td>
      <td class="cpx-formula-cell">${r.formula}</td>
    </tr>`).join('');

  const cmpTableHead = (withFormula) => `
    <thead><tr><th></th><th class="hoo-th-num">Expected</th><th class="hoo-th-num">Actual</th>${withFormula ? '<th>Formula</th>' : ''}</tr></thead>`;

  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>Budget vs Actual</h5>
    <div class="cpx-cmp-row">
      ${cmpBox(fmtUsdAuto(approved), 'Approved Budget', '', 'cpxS10BudA')}
      ${cmpBox(d.budget.actual, 'Actual Cost', 'is-actual')}
      ${cmpBox(`${under ? '−' : '+'} ${fmtUsdAuto(Math.abs(variance))}`,
               `${under ? 'Under' : 'Over'} Budget (${Math.abs(varRate).toFixed(1)}%)`,
               `is-delta ${under ? 'pos' : 'neg'}`, 'cpxS10BudD')}
    </div>
    ${fbox([
      ['Budget Variance', `= Approved Budget − Actual Cost = ${fmtUsdAuto(approved)} − ${d.budget.actual} = <b>${fmtUsdAuto(Math.abs(variance))}</b>`],
      ['Variance Rate (%)', `= Variance ÷ Approved Budget × 100 = ${fmtUsdAuto(Math.abs(variance))} ÷ ${fmtUsdAuto(approved)} × 100 = <b>${Math.abs(varRate).toFixed(1)}%</b>`],
    ])}

    <h5 class="bi-block-title"><span class="bi-bar"></span>Performance <small>(6-Month Review — ${d.reviewDate})</small></h5>
    <div class="cpx-cmp-row">
      ${cmpBox(fmtUsdAuto(c.savings), 'Expected Savings/yr', '', 'cpxS10SavE')}
      ${cmpBox(d.savings.actual, 'Actual Savings/yr', 'is-actual')}
      ${cmpBox(fmtPct(savPct), `Exceeded`, `is-delta ${savPct >= 0 ? 'pos' : 'neg'}`, 'cpxS10SavPct')}
    </div>
    <div class="cpx-cmp-row">
      ${cmpBox(fmtUsdAuto(c.revenue), 'Expected Revenue/yr', '', 'cpxS10RevE')}
      ${cmpBox(d.revenue.actual, 'Actual Revenue/yr', 'is-actual')}
      ${cmpBox(fmtPct(revPct), `Exceeded`, `is-delta ${revPct >= 0 ? 'pos' : 'neg'}`, 'cpxS10RevPct')}
    </div>
    ${fbox([
      ['Savings Exceeded (%)', fb.sav, 'cpxS10FbSav'],
      ['Revenue Exceeded (%)', fb.rev, 'cpxS10FbRev'],
    ])}

    <h5 class="bi-block-title"><span class="bi-bar"></span>Annual Net Benefit <small>(① Savings + ② Revenue − ③ OpCost)</small></h5>
    <div class="hoo-spec-table">
      <table class="hoo-table cpx-basis-table">
        <colgroup><col><col style="width:130px"><col style="width:130px"></colgroup>
        ${cmpTableHead(false)}
        <tbody>${nbRows}</tbody>
      </table>
    </div>
    ${fbox([
      ['Net Benefit (Expected)', fb.nbE, 'cpxS10FbNbE'],
      ['Net Benefit (Actual)', `= ${nbA[0]} + ${nbA[1]} − ${nbA[2]} = <b>${nbA[3]}</b>`],
    ])}

    <h5 class="bi-block-title"><span class="bi-bar"></span>ROI — Expected vs Actual <small>(Annual)</small></h5>
    <div class="hoo-spec-table">
      <table class="hoo-table">
        <colgroup><col style="width:220px"><col style="width:110px"><col style="width:110px"><col></colgroup>
        ${cmpTableHead(true)}
        <tbody>${roiRows}</tbody>
      </table>
    </div>
    ${fbox([
      ['ROI (Expected)', fb.roiE, 'cpxS10FbRoiE'],
      ['ROI (Actual)', `= ${nbA[3]} ÷ ${fmtUsdK(actualCost)} × 100 = <b>${d.roiCompare[0].actual}</b>`],
      ['Payback (Expected)', fb.paybackE, 'cpxS10FbPbE'],
      ['Payback (Actual)', `= ${fmtUsdK(actualCost)} ÷ ${nbA[3]} = <b>${d.roiCompare[1].actual}</b>`],
      ['IRR', `= Discount rate that makes NPV = 0 over 5-year cash flow (Excel IRR function)`],
      ['NPV (Expected)', fb.npvE, 'cpxS10FbNpvE'],
    ])}

    <h5 class="bi-block-title"><span class="bi-bar"></span>CCC Improvement <small>(Cash Conversion Cycle — Expected vs Actual)</small></h5>
    <div class="hoo-spec-table">
      <table class="hoo-table">
        <colgroup><col style="width:220px"><col style="width:110px"><col style="width:110px"><col></colgroup>
        ${cmpTableHead(true)}
        <tbody>${cccRows}</tbody>
      </table>
    </div>
    ${fbox([
      ['DIO (Days Inventory Outstanding)', `= (Avg Inventory ÷ Annual COGS) × 365`],
      ['Working Capital Savings (Expected)', fb.wcE, 'cpxS10FbWcE'],
      ['CCC (Cash Conversion Cycle)', `= DIO + DSO (Days Sales Outstanding) − DPO (Days Payable Outstanding)`],
    ])}

    <h5 class="bi-block-title"><span class="bi-bar"></span>Summary &amp; Lessons Learned</h5>
    <div class="form-grid">
      <div class="form-group span-2">
        <label>Assessment</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.assessment}"><span class="focus-border"></span></div>
      </div>
      <div class="form-group span-2">
        <label>Lessons Learned</label>
        <div class="aniInput"><input type="text" class="browser-default" value="${d.lessons}"><span class="focus-border"></span></div>
      </div>
      <div class="form-group">
        <label>Review Date</label>
        <div class="aniInput"><input type="text" class="browser-default cpx-date" value="${d.reviewDate}"><span class="focus-border"></span></div>
      </div>
      <div class="form-group span-2">
        <label>Attachments</label>
        ${attachZoneHtml(d.attachments)}
      </div>
    </div>
  `;
}

/* Stage 2 입력 변경 → Stage 10 Expected 컬럼 동기화 (같은 데이터 모델 양쪽 렌더 — PDF 명세) */
function refreshStage10Expected(c) {
  const get = (id) => document.getElementById(id);
  if (!get('cpxS10BudA')) return;
  const d  = capexCase.stage10;
  const d2 = capexCase.stage2;
  const f  = fmtStage2(c);

  get('cpxS10SavE').textContent = fmtUsdAuto(c.savings);
  get('cpxS10RevE').textContent = fmtUsdAuto(c.revenue);
  const savA = parseUsdC(d.savings.actual);
  const revA = parseUsdC(d.revenue.actual);
  get('cpxS10SavPct').textContent = fmtPct(c.savings > 0 ? (savA - c.savings) / c.savings * 100 : 0);
  get('cpxS10RevPct').textContent = fmtPct(c.revenue > 0 ? (revA - c.revenue) / c.revenue * 100 : 0);

  [fmtUsdK(c.savings), fmtUsdK(c.revenue), fmtUsdK(c.opCost), fmtUsdK(c.netBenefit)]
    .forEach((v, i) => { get(`cpxS10NbE${i}`).textContent = v; });
  [f.roi, c.payback != null ? `${c.payback.toFixed(1)} yr` : '—', f.irr, fmtUsdK(c.npv)]
    .forEach((v, i) => { get(`cpxS10RoiE${i}`).textContent = v; });
  [`-${d2.dioReduction.toFixed(1)} days`, `-${d2.leadTimeReduction.toFixed(1)} days`, `${fmtUsdK(c.wcSavings)} /yr`]
    .forEach((v, i) => { get(`cpxS10CccE${i}`).textContent = v; });

  /* 산식 풀이 밴드 (Expected 측) 도 같이 갱신 — 안 하면 박스 숫자만 바뀌고 산식은 stale */
  const fb = s10FbExpr(c, d);
  get('cpxS10FbSav').innerHTML  = fb.sav;
  get('cpxS10FbRev').innerHTML  = fb.rev;
  get('cpxS10FbNbE').innerHTML  = fb.nbE;
  get('cpxS10FbRoiE').innerHTML = fb.roiE;
  get('cpxS10FbPbE').innerHTML  = fb.paybackE;
  get('cpxS10FbNpvE').innerHTML = fb.npvE;
  get('cpxS10FbWcE').innerHTML  = fb.wcE;
}

/* =================================================================
 * Stage placeholder (Stage 2~10)
 * 다음 턴에 각각 완전 구현. master-data 패턴 유지하면서 채워나갈 것.
 * ================================================================= */
function renderStagePlaceholder(no, title, summary) {
  return `
    <h5 class="bi-block-title"><span class="bi-bar"></span>${title}</h5>
    <div class="cpx-placeholder">
      <div class="cpx-placeholder-ico"><i class="material-icons">pending</i></div>
      <div class="cpx-placeholder-body">
        <div class="cpx-placeholder-title">Stage ${no} — 다음 단계에서 구현 예정</div>
        <div class="cpx-placeholder-desc">${summary}</div>
        <div class="cpx-placeholder-ref">ref/CAPEX_Investment_Process.html 의 Stage ${no} 섹션 그대로 master-data 패턴(bi-block-title / form-grid / hoo-table / hBtn)으로 이식.</div>
      </div>
    </div>
  `;
}

/* =================================================================
 * 금액 인풋 — 숫자만 입력 + 천단위 콤마 자동
 *   keydown: 비숫자 키 차단 (단, 컨트롤·내비게이션 키는 허용)
 *   input:   현재 값을 콤마 형식으로 다시 그리고 커서 위치 보정
 * ================================================================= */
function formatMoney(str) {
  const digits = String(str || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function bindMoneyInputs(root) {
  const scope = root || document;
  scope.querySelectorAll('input.cpx-money').forEach(input => {
    if (input._cpxMoneyInit) return;
    input._cpxMoneyInit = true;

    /* 초기값 정규화 (data.js에서 들어온 "2,800,000" 등 그대로 통과) */
    input.value = formatMoney(input.value);

    /* 영문/특수문자 차단 (컨트롤·내비게이션 키는 허용) */
    input.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const ctrl = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter','Home','End'];
      if (ctrl.includes(e.key)) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    /* 입력될 때마다 콤마 다시 그리고 커서 위치 보정 */
    input.addEventListener('input', (e) => {
      const el = e.target;
      const before = el.value;
      const caretBefore = el.selectionStart;
      const formatted = formatMoney(before);
      el.value = formatted;
      const diff = formatted.length - before.length;
      const newPos = Math.max(0, caretBefore + diff);
      el.setSelectionRange(newPos, newPos);
    });

    /* paste 시에도 input 이벤트가 자동 트리거 → 별도 핸들러 불필요 */
  });
}

/* =================================================================
 * 첨부 등록 — master-data dropzone 패턴의 다중 파일 변형 (.cpx-attach-zone 공통)
 *   클릭 → file browse / drag&drop 추가 / f-rm 삭제. mock-only (업로드 없음)
 * ================================================================= */
function bindAttachZones(root) {
  (root || document).querySelectorAll('.dropzone.cpx-attach-zone').forEach(zone => {
    if (zone._cpxAttachInit) return;
    zone._cpxAttachInit = true;

    const input = zone.querySelector('input[type="file"]');
    const list  = zone.querySelector('.dz-file-list');
    if (!input || !list) return;

    const fmtSize = (b) => b >= 1048576
      ? (b / 1048576).toFixed(1) + ' MB'
      : Math.max(1, Math.round(b / 1024)) + ' KB';

    const addFile = (name, meta) => {
      const row = document.createElement('div');
      row.innerHTML = dzFileRow({ kind: 'file', label: name, size: meta });
      list.appendChild(row.firstElementChild);
    };

    zone.addEventListener('click', (e) => {
      const rm = e.target.closest('.f-rm');
      if (rm) { rm.closest('.dz-file').remove(); return; }
      if (e.target.closest('.dz-file')) return; /* 파일 행 클릭은 browse 미발동 */
      input.click();
    });

    input.addEventListener('change', () => {
      Array.from(input.files).forEach(f => addFile(f.name, fmtSize(f.size)));
      input.value = '';
    });

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      Array.from(e.dataTransfer.files).forEach(f => addFile(f.name, fmtSize(f.size)));
    });
  });
}

/* =================================================================
 * 계산식 툴팁 — Materialize M.Tooltip 그대로 사용
 *   .tooltipped + data-tooltip (Materialize 1.0 NodeList 에러 방어: element별 init)
 * ================================================================= */
function bindTooltips(root) {
  if (!(window.M && M.Tooltip)) return;
  (root || document).querySelectorAll('.tooltipped').forEach(el => {
    if (el.M_Tooltip) return;
    try {
      M.Tooltip.init(el, { enterDelay: 100 });
    } catch (e) {
      console.warn('[capex] tooltip init 실패:', e);
    }
  });
}

/* =================================================================
 * MASTERDATA quick search — Materialize M.Autocomplete 그대로 사용
 *   input.cpx-quicksearch + data-master="sites|depts|users" (CPX_MASTER 키)
 *   minLength 0 → 포커스만 해도 후보 드롭다운 노출
 *   ※ Materialize 컴포넌트 자체 구현 금지 — init + CSS 스킨만 (capex.css §7)
 * ================================================================= */
function bindQuickSearch(root) {
  const scope = root || document;
  if (!(window.M && M.Autocomplete)) return;
  scope.querySelectorAll('input.cpx-quicksearch').forEach(input => {
    if (input._cpxQsInit) return;
    input._cpxQsInit = true;

    const list = (window.CPX_MASTER || CPX_MASTER || {})[input.dataset.master] || [];
    const data = {};
    list.forEach(v => { data[v] = null; });

    try {
      M.Autocomplete.init(input, { data, minLength: 0, limit: 8 });
    } catch (e) {
      /* Materialize 1.0 element별 init 에러 방어 (NodeList toLowerCase 계열) */
      console.warn('[capex] autocomplete init 실패:', e);
    }
  });
}

/* =================================================================
 * Select chevron — 드롭다운 "열림" 상태를 JS로 추적
 *   native select는 옵션을 골라도 focus가 유지되므로 :focus만으로는
 *   chevron이 안 돌아옴 → .bi-select-wrap.is-open 클래스로 관리.
 *   열림: mousedown 토글 / Space / Alt+↑↓
 *   닫힘: change(옵션 선택) / blur / Escape / Enter
 * ================================================================= */
function bindSelectChevron(root) {
  const scope = root || document;
  scope.querySelectorAll('.bi-select-wrap select').forEach(sel => {
    if (sel._cpxChevronInit) return;
    sel._cpxChevronInit = true;

    const wrap = sel.closest('.bi-select-wrap');
    const close = () => wrap.classList.remove('is-open');

    /* 클릭으로 열고, 열린 상태에서 다시 클릭하면 native가 닫으므로 토글 */
    sel.addEventListener('mousedown', () => {
      wrap.classList.toggle('is-open');
    });

    sel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') close();
      else if (e.key === ' ' || (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp'))) {
        wrap.classList.add('is-open');
      }
    });

    sel.addEventListener('change', close); /* 옵션 선택 → 닫힘 */
    sel.addEventListener('blur', close);   /* 포커스 아웃 → 닫힘 */
  });
}

/* =================================================================
 * Init — master-data 패턴 그대로
 *   순서: title → routing → stages → Modal → hoo-table overlay → hBtn glass
 *        → routing 글래스/스파이 → stage card glow
 * ================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  applyTitleBar({
    badgeText: capexCase.classification,
    idText:    capexCase.id,
    descText:  capexCase.title,
    lastModText: capexCase.lastMod,
  });

  renderRouting();
  renderStages();

  /* Materialize Modal — 각 element 별도 init (NodeList + options 콜백은 Materialize 1.0에서 에러) */
  if (window.M && M.Modal) {
    document.querySelectorAll('.modal').forEach(el => {
      M.Modal.init(el, {
        onOpenStart() {
          document.querySelector('.app-header')?.classList.add('content-blur');
          document.querySelector('.detail-layout')?.classList.add('content-blur');
        },
        onCloseEnd() {
          document.querySelector('.app-header')?.classList.remove('content-blur');
          document.querySelector('.detail-layout')?.classList.remove('content-blur');
        },
      });
    });
  }

  if (typeof initAllHooTableOverlays === 'function') initAllHooTableOverlays();
  if (typeof initHBtnGlass === 'function') initHBtnGlass();

  bindRoutingGlass();
  bindRoutingSpy();
  initStageCardGlow();

  /* 금액 인풋: 숫자만 + 천단위 콤마 */
  bindMoneyInputs();

  /* select chevron: 드롭다운 열림/닫힘에 맞춰 회전 */
  bindSelectChevron();

  /* MASTERDATA 퀵서치 (M.Autocomplete) */
  bindQuickSearch();

  /* Stage 1 Sign-off Chain — 행 추가/삭제 (initial 행은 위 퀵서치/셀렉트가 처리) */
  bindSignoffChain();

  /* Stage 4 Key Findings — Quill WYSIWYG 에디터 */
  bindKeyFindingsEditor();

  /* Stage 8 Change Log / Issues — 행 추가/삭제 (initial 셀렉트는 위 bindSelectChevron 처리) */
  bindLogEditors();

  /* AI Summary 모달 — 클릭 시 생성 연출 후 보고서 reveal (모달 자체는 위 .modal 루프에서 init) */
  document.getElementById('btnSummary')?.addEventListener('click', openSummaryModal);
  document.getElementById('btnSummaryPrint')?.addEventListener('click', () => window.print());
  /* 프린트 시 차트를 1페이지에 맞게 짧게(150px) 줄였다가 출력 후 복원 (SVG라 CSS만으론 안 줄어듦) */
  const sizeSummaryChart = (h) => {
    if (!summaryChart) return;
    const el = document.getElementById('cpxSumChart');
    try { summaryChart.setSize(el ? el.offsetWidth : summaryChart.chartWidth, h, false); } catch (_) {}
  };
  window.addEventListener('beforeprint', () => sizeSummaryChart(185));
  window.addEventListener('afterprint',  () => sizeSummaryChart(215));

  /* Stage 2 산출식 — 입력(cpxSavings/cpxRevenue/cpxOpCost/cpxEstBudget) 변경 시 재계산 */
  bindStage2Calc();

  /* 계산식 ? 툴팁 (M.Tooltip) */
  bindTooltips();

  /* 첨부 등록 zone 공통 (dropzone) */
  bindAttachZones();

  /* (date) 필드 — Materialize 캘린더 */
  bindDatepickers();

  /* Stage 8 S-Curve 차트 (Highcharts) */
  bindStage8Charts();

  /* Stage 3 Grade → 결재 체인 레벨 연동 + 체인 유리 글래스 추적 */
  bindStage3Grade();
  bindApprGlass();
});

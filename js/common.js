/* ===== 스플래시 로딩 (현재 비활성 — 즉시 제거) =====
   되살리려면 아래 블록을 주석해제하고 'splash off' 블록을 주석처리. */
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  if (splash) splash.remove();
});
/*
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  setTimeout(() => splash.classList.add('hide'), 1600);
  setTimeout(() => splash.remove(), 2600);
});
*/

/* ===== 마우스 기반 글래스 조명 ===== */
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  document.documentElement.style.setProperty('--gx', x + '%');
  document.documentElement.style.setProperty('--gy', y + '%');
});

/* ===== hBtn 글래스 + 색수차 + 3D 틸트 (mousemove 추적) =====
 * 동적으로 추가된 hBtn에도 적용 가능하도록 idempotent.
 * 호출 시점: 페이지 로드 후, 그리고 동적 렌더(예: stageContent) 후 한번 더. */
window.initHBtnGlass = function initHBtnGlass(root) {
  const scope = root || document;
  scope.querySelectorAll('.hBtn:not(.hBtn-init)').forEach(btn => {
    btn.classList.add('hBtn-init');
    btn.addEventListener('mousemove', (e) => {
      btn.classList.remove('hBtn-rest');   /* 마우스 다시 올라오면 hover 효과 복구 */
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty('--btn-gx', x + '%');
      btn.style.setProperty('--btn-gy', y + '%');
      /* hBtn-sm은 틸트 생략 (작은 버튼은 과한 효과 방지) */
      if (btn.classList.contains('hBtn-sm')) return;
      const rotY = ((x - 50) / 50) * 8;
      const rotX = ((50 - y) / 50) * 8;
      btn.style.transform = `perspective(400px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform .3s ease';
      btn.style.transform = '';
      setTimeout(() => { btn.style.transition = ''; }, 300);
    });
    /* 클릭(특히 모달 오픈) 시 커서가 안 움직여 :hover 가 잔류 → 배경(::before) 채워진 채 남음.
       클릭 즉시 hBtn-rest 로 hover 시각효과 강제 해제 + 포커스/틸트/리플 정리. 다음 mousemove 에서 복구. */
    btn.addEventListener('click', () => {
      btn.classList.add('hBtn-rest');
      btn.style.transform = '';
      btn.blur();
      setTimeout(() => btn.querySelectorAll('.waves-ripple').forEach(r => r.remove()), 600);
    });
  });
  /* Materialize Waves 재바인딩 — NodeList 통째 attach 가 toLowerCase 에러로 죽는 케이스
     (Modal과 동일 패턴). element별 호출 + try/catch 로 격리. */
  if (typeof Waves !== 'undefined' && Waves.attach) {
    scope.querySelectorAll('.waves-effect').forEach(el => {
      try { Waves.attach(el); } catch (_) { /* skip individual fails */ }
    });
  }
};
/* 페이지 로드 시 1회 — 정적 hBtn 처리 */
document.addEventListener('DOMContentLoaded', () => initHBtnGlass());

/* ===== Glass Row Overlay (hoo-table 행 호버 효과) =====
 * siliconeFormula 의 글래스 테이블을 master-data 디테일로 이식.
 * container: position:relative + overflow:hidden 인 래퍼 (예: .hoo-spec-table)
 * tbodyEl  : <tbody> 노드. 동적 재렌더로 노드가 교체되면 자동으로 깨끗.
 * idempotent — 같은 container 에 다시 호출하면 이전 overlay/mousemove 정리 후 재등록. */
window.initGlassOverlay = function initGlassOverlay(container, tbodyEl) {
  if (!container || !tbodyEl) return;

  /* 이전 호출 정리 (idempotent) */
  const existing = container.querySelector(':scope > .glassRowOverlay');
  if (existing) existing.remove();
  if (container._glassMoveHandler) {
    container.removeEventListener('mousemove', container._glassMoveHandler);
  }

  const overlay = document.createElement('div');
  overlay.className = 'glassRowOverlay';
  const caustic = document.createElement('div');
  caustic.className = 'glassCaustic';
  overlay.appendChild(caustic);
  container.appendChild(overlay);
  let currentRow = null;

  tbodyEl.addEventListener('mouseover', (e) => {
    const tr = e.target.closest('tbody tr');
    if (!tr || tr === currentRow) return;
    currentRow = tr;
    const containerRect = container.getBoundingClientRect();
    const trRect = tr.getBoundingClientRect();
    overlay.style.top = (trRect.top - containerRect.top + container.scrollTop - 1) + 'px';
    overlay.style.left = (trRect.left - containerRect.left + container.scrollLeft) + 'px';
    overlay.style.width = trRect.width + 'px';
    overlay.style.height = (trRect.height + 2) + 'px';
    overlay.classList.add('active');
  });

  const moveHandler = (e) => {
    if (!currentRow) return;
    const olRect = overlay.getBoundingClientRect();
    const x = ((e.clientX - olRect.left) / olRect.width) * 100;
    const yPx = e.clientY - olRect.top;
    const angle = Math.atan2(
      e.clientY - (olRect.top + olRect.height / 2),
      e.clientX - (olRect.left + olRect.width / 2)
    ) * 180 / Math.PI;
    overlay.style.setProperty('--olx', x + '%');
    overlay.style.setProperty('--oly', yPx + 'px');
    overlay.style.setProperty('--ol-angle', angle + 'deg');
    caustic.style.left = (e.clientX - olRect.left - 40) + 'px';
    caustic.style.bottom = '-8px';
  };
  container.addEventListener('mousemove', moveHandler);
  container._glassMoveHandler = moveHandler;

  tbodyEl.addEventListener('mouseleave', () => {
    currentRow = null;
    overlay.classList.remove('active');
  });
};

/* 페이지 안의 모든 .hoo-spec-table 에 글래스 오버레이를 일괄 적용.
 * 호출 시점: 초기 렌더 후, 그리고 동적 섹션이 새로 끼워질 때. idempotent. */
window.initAllHooTableOverlays = function initAllHooTableOverlays(root) {
  const scope = root || document;
  scope.querySelectorAll('.hoo-spec-table').forEach(container => {
    const tbody = container.querySelector('.hoo-table tbody');
    if (tbody) window.initGlassOverlay(container, tbody);
  });
};

/* ===== 필터 칩 토글 ===== */
document.querySelectorAll('.filter-chips').forEach(group => {
  group.querySelectorAll('.chip-glass').forEach(chip => {
    chip.addEventListener('click', () => {
      group.querySelectorAll('.chip-glass').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const ev = new CustomEvent('chipchange', { detail: { value: chip.dataset.value || chip.textContent.trim() } });
      group.dispatchEvent(ev);
    });
  });
});

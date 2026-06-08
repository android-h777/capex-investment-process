# Master Data Design System — UI Kit

KCC Master Data 화면 UI 디자인 시스템. 정적 사이트 (HTML + CSS + Vanilla JS, Materialize 1.0). 페이지: `index.html` (요청 리스트), `detail.html` (요청 상세 — Material / Customer 분기), `md_intro.html` (시스템 소개).

---

## ⛔️ 절대 룰 — 새 양식 만들지 말고 기존 패턴 그대로 재사용

이 프로젝트의 **가장 중요한 룰**. 새 페이지 / 새 섹션 / 새 컴포넌트를 만들 때 — **기존에 동일/유사한 양식이 있는지 먼저 확인하고 그대로 가져다 쓴다**. 새 클래스, 새 스타일, 새 토큰을 도입하지 않는다.

**작업 전 체크리스트 (반드시 순서대로):**
1. 비슷한 UI가 이미 있나? → `index.html`, `detail.html`, `md_intro.html`을 먼저 본다
2. 같은 역할의 클래스/패턴이 `css/common.css`에 정의되어 있나? → grep으로 확인
3. 그대로 복붙 후 데이터/텍스트만 교체. 마크업 구조 / 클래스명 / 색상 / 간격 변경 금지
4. 정말로 기존에 없는 게 분명할 때만 사용자에게 보고하고 새 패턴 추가 합의

**위반 사례 (하지 말 것):**
- 새 색상 hex 값을 CSS에 박는 것 → `:root` 변수 (`css/common.css:9-49`)에서만 가져온다
- 새 modal 스타일 정의 → `.modal.search-modal` 패턴 그대로 (`css/common.css:365-`)
- 새 table 스타일 정의 → `.hoo-spec-table > .hoo-table` 그대로 (`css/common.css:5038-`)
- 새 button 정의 → `.hBtn` + variant 클래스 (`.hViolet`/`.hOrange`/`.hBlue`/`.hGrey`/`.hViva`) 그대로 (`css/common.css:234-`)
- inline `style="..."` 추가 → 절대 금지. 기존 utility 클래스로 해결

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 요청 리스트 페이지. Material / Customer 탭, 검색·필터, 신규 요청 모달 |
| `detail.html` | 요청 상세 페이지의 shell. 실제 콘텐츠는 `js/detail.js`가 렌더 |
| `md_intro.html` | 디자인 시스템 소개 (애니메이션 카드 그리드) |
| `css/common.css` | 단일 CSS 파일. 모든 스타일 여기. 다른 CSS 추가 금지 |
| `js/common.js` | 공유 헬퍼 — `initHBtnGlass`, `initAllHooTableOverlays`, `initGlassOverlay` |
| `js/detail.js` | 상세 페이지 로직. `if (!isCust) {}` Material / `if (isCust) {}` Customer 분기. 헬퍼: `applyTitleBar` (line 73), `buildSectionTitleHtml` (line 37), `buildPmNodeHtml` (line 57) |
| `js/data.js` | Material master mock 데이터 |
| `js/customer-data.js` | Customer master mock 데이터 |

---

## Design tokens — `css/common.css:9-49` 의 `:root` 만 사용

| 용도 | 토큰 |
|---|---|
| 배경 | `--c-bg`, `--c-bg-soft`, `--c-surface`, `--c-surface-strong` |
| 보더 | `--c-border`, `--c-border-strong` |
| 강조색 | `--c-primary` (violet), `--c-primary-d` (deep violet), `--c-accent` (blue) |
| 상태 | `--c-success` (sage green), `--c-warn` (khaki), `--c-danger` (red) |
| 텍스트 | `--c-text`, `--c-text-soft`, `--c-text-mute` |
| 그림자 | `--c-shadow`, `--c-shadow-lg` |
| 반경 | `--radius-lg`, `--radius-md`, `--radius-sm` |
| 글래스 | `--glass-blur` |

**bi-bar 강조 색** (블록 타이틀 좌측 막대): `#d97757` 코랄. `var(--c-primary-d)`로 SKU-CODE 같은 sub-block만 위반.

폰트: SUIT (로컬, `fonts/SUIT-*.otf`). 무게 400/500/600/700/800. Material Icons CDN.

---

## 재사용 패턴 카탈로그

### 1. 페이지 골격
**기존:** `detail.html`을 통째로 복사 후 콘텐츠만 교체. splash, header, app-main, modal scaffolding 그대로.

### 2. Section 블록 헤더
```html
<h5 class="bi-block-title"><span class="bi-bar"></span>섹션 이름</h5>
```
또는 우측에 액션이 있는 경우:
```html
<div class="bi-block-head">
  <h5 class="bi-block-title"><span class="bi-bar"></span>섹션 이름</h5>
  <div class="bi-block-meta"><a class="hBtn hBtn-sm hOrange ..."><i class="material-icons">add</i><span class="label">Add row</span></a></div>
</div>
```
참조: `js/detail.js:641-644` (PARENT CODE INFO), `js/detail.js:660-667` (SUB-CODE 헤더, sub-block은 `.pcc-title`)

### 3. 폼 그리드
```html
<div class="form-grid">              <!-- 2열 기본 -->
  <div class="form-group">            <!-- 1열 차지 -->
    <label>라벨</label>
    <div class="aniInput"><input type="text" class="browser-default" value=""><span class="focus-border"></span></div>
  </div>
  <div class="form-group span-2"> ... </div>  <!-- 2열 전체 차지 (textarea, reason 등) -->
</div>
```
컬럼 수 변형: `.form-grid.col-3` / `.col-4` / `.col-6`. CSS: `common.css:2544-`. 참조: `js/detail.js:644-660`.

### 4. 테이블 — `.hoo-spec-table` + `.hoo-table`
```html
<div class="hoo-spec-table">
  <table class="hoo-table" id="...Table">
    <colgroup><col style="width:40px"><col>...</colgroup>
    <thead><tr><th>No.</th><th class="hoo-th-key">필수컬럼 <span class="hoo-req">*</span></th><th class="hoo-th-num">숫자컬럼</th>...<th></th></tr></thead>
    <tbody>
      <tr>
        <td class="hoo-no">1</td>
        <td><div class="bi-select-wrap"><select class="bi-select browser-default ..."><option>...</option></select></div></td>
        <td><div class="aniInput"><input type="number" class="browser-default hoo-num ..." value=""><span class="focus-border"></span></div></td>
        <td><div class="bi-readonly"><i class="material-icons bi-readonly-ico">lock</i><span class="bi-readonly-text">readonly 값</span></div></td>
        <td class="hoo-x"><i class="material-icons">close</i></td>
      </tr>
    </tbody>
  </table>
</div>
```
- 모든 input은 `.aniInput > input.browser-default` + `.focus-border` 형태로 통일 (`common.css:5171-` 가 28px / 13px / weight 500 으로 강제)
- 모든 select는 `.bi-select-wrap > select.bi-select.browser-default` 형태 (`common.css:3818-` + table 내부 underline 스타일 `common.css` 끝부분)
- readonly cell 은 `.bi-readonly` 또는 readonly input
- 행 삭제 버튼은 `<td class="hoo-x"><i class="material-icons">close</i></td>` (이벤트 위임 통해 자동 처리)
- `renumberQaRows` 헬퍼로 행번호 재계산 (`js/detail.js:2334`)
- glass overlay 호버 효과 자동 적용: 페이지 init 후 `initAllHooTableOverlays()` 호출

### 5. 버튼 — `.hBtn` + variant
```html
<a href="javascript:;" class="hBtn hViolet waves-effect"><i class="material-icons">send</i><span class="label">Request</span></a>
<a href="javascript:;" class="hBtn hBtn-sm hOrange waves-effect"><i class="material-icons">add</i><span class="label">Add row</span></a>
```
Variant: `.hViolet` (primary CTA) / `.hOrange` (add row, secondary action) / `.hBlue` (save) / `.hGrey` (cancel/back) / `.hViva` (special, e.g., Process Map). `.hBtn-sm` 작은 사이즈. `.hBtn-pulse` 강조 펄스. CSS: `common.css:234-`.

### 6. 모달 — `.modal.search-modal` 패턴
```html
<div id="myModal" class="modal search-modal">
  <div class="modal-header">
    <h5><i class="material-icons">icon</i><span>제목</span></h5>
    <a href="javascript:;" class="modal-close"><i class="material-icons">close</i></a>
  </div>
  <div class="modal-content">...</div>
  <div class="modal-footer">
    <a class="hBtn hGrey ..."><span class="label">Cancel</span></a>
    <a class="hBtn hBlue ..."><span class="label">Confirm</span></a>
  </div>
</div>
```
JS:
```js
const modalEl = document.getElementById('myModal');
const modalInst = M.Modal.init(modalEl, {
  onOpenStart() { document.querySelector('.app-header')?.classList.add('content-blur'); document.querySelector('.detail-layout')?.classList.add('content-blur'); },
  onCloseEnd()  { document.querySelector('.app-header')?.classList.remove('content-blur'); document.querySelector('.detail-layout')?.classList.remove('content-blur'); }
});
modalInst.open();
```
참조: `detail.html:121-136`, `index.html:154-`. 변형: `.pm-modal` (process map), `.cmp-modal` (compare), `.search-modal` (검색).

### 7. 카드 / 패널
- `.glass-panel` — 일반 콘텐츠 카드 (글래스 효과)
- `.detail-section` — 상세 페이지의 stage section. `data-stage="N"` `data-role="..."` attribute 사용
- `.parent-code-card` + `.parent-code-children` — Parent → SKU-Code 양식 (절대 변형 금지)

### 8. 상태 표시
- 토스트: `M.toast({html: '메시지'})`
- pm-confirm 체크리스트: `.pm-confirm-card > .pm-check-list > li > label.pm-check`
- 진행 단계 아이콘: `check_circle` (done) / `play_circle` (active) / `cancel` (rejected) / `radio_button_unchecked` (pending)

### 9. 타이틀 바 / 워크플로우 / 프로세스 맵
- `applyTitleBar({...})` 헬퍼 호출 (`js/detail.js:73`)
- 좌측 워크플로우: `.routing-panel > .routing-timeline` 안에 `renderRouting()` 결과 주입
- 프로세스 맵 모달: `renderProcessMap()` 사용. 노드는 `buildPmNodeHtml(label, state, hlClass, person)`

---

## 클래스 prefix 컨벤션 (반드시 따를 것)

| Prefix | 의미 |
|---|---|
| `hBtn`, `hBtn-*` | 공유 버튼 시스템 |
| `hoo-*` | 공유 테이블 primitive (`hoo-spec-table`, `hoo-table`, `hoo-no`, `hoo-x`, `hoo-num`, `hoo-target`) |
| `bi-*` | Basic Information 섹션 — 블록 타이틀, 폼, 테이블 readonly 등 (`bi-block-title`, `bi-bar`, `bi-block-head`, `bi-block-meta`, `bi-select`, `bi-select-wrap`, `bi-readonly`) |
| `dv-*` | AI Document Verification (`dv-stepper`, `dv-step`, `dv-panel`, `dv-panel-actions`, `dv-line`, `dv-hint`) |
| `dz*` | Dropzone (TDS / MSDS / Composition 업로드) |
| `dup-*` | Duplicate Check (`dup-empty`, `dup-content`, `dup-summary`, `dup-confirm`, `dup-chk`) |
| `pc-*` | Parent Code identity (`pc-tag`) |
| `pcc-*` | Parent Code Children (SKU-CODE) (`pcc-head`, `pcc-title`, `pcc-count`) |
| `cnt-*` | Container row inputs (`cnt-container`, `cnt-net`, `cnt-uom`, `cnt-matnum`, `cnt-matname`) |
| `pm-*` | Process Map / Confirmation card (`pm-confirm-card`, `pm-check`, `pm-vrow`, `pm-vnode`) |
| `rt-*` | Routing / Workflow timeline (`rt-group`, `rt-stage`, `rt-cards`, `rt-card`, `rt-circle`) |
| `cmp-*` / `cmp2-*` | Compare modal (Material 비교) |
| `cust-*` | Customer 모드 전용 섹션 (`cust-section-block`, `cust-section-*`) |
| `ai-*` | AI 강조 시각 효과 (`ai-aura`, `ai-badge`, `ai-verify`) |
| `ds-*` | Duplicate summary cell (`ds-cell`, `ds-label`, `ds-value`) |
| `cardTitle`, `card`, `processDemo`, `tableDemo` | `md_intro.html` 전용. 다른 페이지에 끌어오지 말 것 |

**새 prefix 만들기 전:** 기존 prefix로 표현 가능한지 다시 검토. 정말 새로 필요하면 사용자에게 보고.

---

## 도메인 용어

- **Parent Code** (`M-XXXXXX`): material 1개당 1개. 화학적 정체성/composition 단위
- **SKU-Code** (`M-XXXXXX-NNN`): Container × Net Content × UOM 조합당 1개. 발주/재고 단위. Parent → 1:N children
- **Workflow / Stages**: Request → Dept Review (parallel) → Compliance → Release. Material/Customer/Vendor 별로 다름 (`processFlows`, `customerFlows` in `data.js` / `customer-data.js`)
- **AI Document Verification**: 신규 Material 진입 시 TDS/MSDS/Composition 3종 업로드 → AI parse → Material Master 중복 검사 → 사용자 confirm → Basic Info reveal
- **Process Map**: 결재 흐름의 vertical 다이어그램. 좌측 Workflow timeline의 확장 뷰
- **Smart-Code → Parent-Code 변경됨** (이전 명칭이지만 코드/주석에 남아있을 수 있음. 발견 시 통일)

---

## URL 파라미터 (detail.html)

`kind` (material 기본 / `customer` / `vendor`), `type`, `sub` (`new`/`plant`/`packing`/`reactivation` 또는 `newCust`/`custChange`/`tradingBlock`), `status` (`inprogress`/`approved`/`rejected`), `currentNode`, `id`, `person`, `date`, `desc`. 신규 진입 데모용으로 `dv=verified` (AI Document Verification 단계 모두 마친 상태로 부팅). `pCurrentNode` 비어있을 때 active step 전체가 'current'로 평가됨.

---

## 새 페이지 / 섹션 만들 때 따를 흐름

1. `detail.html` 또는 `index.html`을 통째로 복사해서 시작
2. 기존 stage / section 중 가장 가까운 것을 통째로 복사 후 텍스트만 교체
3. 새로 필요한 input 행은 기존 `.aniInput` 또는 `.bi-select-wrap` 마크업 그대로
4. 새로 필요한 테이블은 `.hoo-spec-table > .hoo-table` 그대로 (colgroup, thead, tbody, hoo-x 포함)
5. 새 모달은 `.modal.search-modal` 그대로 + `M.Modal.init` 패턴
6. 정적 데이터는 `js/data.js` 또는 `js/customer-data.js`에 추가 (별도 파일 만들지 X)
7. **CSS 파일 새로 만들지 말 것** — `css/common.css` 안에서만 작업
8. 페이지가 만들어진 후 init 흐름이 호출되었는지 확인:
   - `M.FormSelect.init(container.querySelectorAll('select'))`
   - `initAllHooTableOverlays()`
   - `autoAlignNumericColumns()`
   - `initStageCardGlow()`
   - `initHBtnGlass()` (페이지 로드 시 자동, 동적 추가 시 명시 호출)

---

## 절대 하지 말 것 (Don'ts)

- ❌ 새 색상 hex 정의 (e.g., `color: #abc123`) — 항상 `var(--c-*)`
- ❌ inline style 속성 사용
- ❌ 기존 클래스명 변경 (CSS는 어디서든 재사용 중)
- ❌ Materialize 1.0 외 라이브러리 추가
- ❌ 새 CSS 파일 생성
- ❌ `.parent-code-card` / `.parent-code-children` 의 marker / dot / rail / spur 구조 변경 (parent-child 시각화 합의된 패턴)
- ❌ `.bi-select`, `.aniInput input` 의 테이블 내부 스타일 (28px / 13px / weight 500 / underline) 변경
- ❌ 토큰을 무시하고 임의 폰트 사이즈 / weight / spacing
- ❌ `data.js` / `customer-data.js` 외 별도 mock 데이터 파일 생성
- ❌ 기존 Modal `M.Modal.init` blur 패턴 우회한 직접 show/hide

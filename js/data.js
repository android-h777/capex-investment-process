/* =================================================================
 * CAPEX — 10-stage workflow definition
 * 원본 CAPEX_Investment_Process.html / PPT 모두 10단계 시퀀스이며
 * 임의 그룹화 없음. 시간 순으로 위→아래.
 *
 * Each node:
 *   key:    URL/anchor 키
 *   no:     stage number (1~10)
 *   label:  routing-timeline / stage panel title (short)
 *   sub:    subtitle (Korean meaning) — optional, rt-card name fallback
 *   icon:   Material Icons name (우측 panel section-title 에서 사용)
 * ================================================================= */
/* 2026-07-09 M-CapEx TFT 프로토타입 기준으로 재편 (참조: Desktop CAPEX_M-CapEx_TFT_Prototype.html)
   — Gatekeeper/Approved Budget/AR Tracking 신규, TBE+CBE 병합, Contract·Commissioning 은 8단계 등에 흡수 */
const capexFlow = [
  { key: 'request',     no: 1,  label: 'Idea Registration',      sub: '아이디어 등록',            icon: 'lightbulb'     },
  { key: 'feasibility', no: 2,  label: 'Feasibility & ROI',      sub: '타당성 / Expected ROI',    icon: 'trending_up'   },
  { key: 'spec',        no: 3,  label: 'Requirement & Spec',     sub: '사양 정의 / CMMS',         icon: 'engineering'   },
  { key: 'gatekeeper',  no: 4,  label: 'Gatekeeper Review',      sub: '게이트키퍼 검토',          icon: 'fact_check'    },
  { key: 'approval',    no: 5,  label: 'AR Approval',            sub: 'AR 결재 (DOA)',            icon: 'verified'      },
  { key: 'budget',      no: 6,  label: 'Approved Budget',        sub: '승인 예산 / Supplement',   icon: 'account_balance' },
  { key: 'tbe',         no: 7,  label: 'TBE / CBE',              sub: 'Technical & Commercial Bid Eval', icon: 'science' },
  { key: 'execution',   no: 8,  label: 'Project Execution',      sub: '실행 단계 (S-Curve)',      icon: 'construction'  },
  { key: 'tracking',    no: 9,  label: 'AR Tracking & Forecast', sub: '월별 실적 / 예측',         icon: 'insights'      },
  { key: 'actual',      no: 10, label: 'Reporting & Actual ROI', sub: '리포팅 / 사후 성과 분석',  icon: 'analytics'     },
];

/* =================================================================
 * MASTERDATA mock — PPT 범례의 (MASTERDATA) 항목용 선택 리스트
 * Stage 1: Site/BU (SITE), Request Dept. (DEPT), Requester (USER)
 * 실제로는 마스터데이터 시스템 연동 — 프로토타입에서는 고정 mock.
 * ================================================================= */
const CPX_MASTER = {
  sites: [
    'Waterford / PA (Performance Additives)',
    'Leverkusen / SE (Silicone Elastomers)',
    'Itatiba / CS (Consumer Sealants)',
    'Ohta / EP (Engineered Products)',
    'Nantong / SF (Silicone Fluids)',
    'Rayong / SP (Specialty Products)',
  ],
  depts: [
    'Production',
    'Engineering',
    'Maintenance',
    'Quality Assurance',
    'EHS',
    'R&D',
    'Supply Chain',
  ],
  users: [
    'JONGHO LEE',
    'Sarah Chen',
    'Michael Brown',
    'Anna Schmidt',
    'David Park',
    'Maria Santos',
  ],
  budgetCodes: [
    'BU-PA-WF-2026-CAP-042',
    'BU-PA-WF-2026-CAP-041',
    'BU-SE-LV-2026-CAP-018',
    'BU-EP-OH-2026-CAP-007',
    'BU-CS-IT-2026-CAP-023',
  ],
  equipment: [
    'RX-1001 (Polymer Reactor, Line #1, Waterford)',
    'RX-1002 (Polymer Reactor, Line #2, Waterford)',
    'RX-2001 (Batch Reactor, Line #3, Waterford)',
    'MX-1101 (High-Shear Mixer, Line #1, Waterford)',
    'DR-1201 (Vacuum Dryer, Line #2, Waterford)',
  ],
  /* Stage 7 — (VENDOR MASTERDATA) 선정 벤더 (TBE/CBE 평가 3사) */
  vendors: [
    'Vendor A',
    'Vendor B',
    'Vendor C',
  ],
  /* Stage 7 — (ERP MASTERDATA) ERP 구매오더 번호 */
  poNumbers: [
    'PO-4500078923',
    'PO-4500078801',
    'PO-4500077654',
    'PO-4500076512',
    'PO-4500075488',
  ],
  /* Stage 5·6 — (RFQ MASTERDATA) 외부 구매 툴 견적요청(RFQ) 번호.
     선택 시 해당 RFQ 의 입찰 평가가 TBE/CBE 표에 로드됨 (TBE·CBE 각각 선택) */
  rfqNumbers: [
    'RFQ-2026-0042',
    'RFQ-2026-0041',
    'RFQ-2026-0038',
    'RFQ-2026-0035',
    'RFQ-2026-0029',
  ],
  /* Stage 1/6 — (M-ERP FINANCIAL MASTERDATA) 계정 마스터: Description ↔ Account 페어.
     Cost Estimate 의 Description 퀵서치 선택 시 Account 자동 채움 */
  finAccounts: [
    { desc: 'Investment - External Vendors', account: '200001400' },
    { desc: 'Investment - Cap. Labor',       account: '200001400' },
    { desc: 'Leasehold Improvements',        account: '291131003' },
    { desc: 'Software',                      account: '292131000' },
    { desc: 'Cap Engineering',               account: '200001400' },
    { desc: 'Cap Interest',                  account: '185001400' },
    { desc: 'Excess FIFO',                   account: '120122105' },
    { desc: 'Expense - AR Related',          account: '596683000' },
    { desc: 'Exp - Operating Lease',         account: '594602000' },
    { desc: 'Other (VAT)',                   account: '' },
  ],
  /* 퀵서치용 평면 리스트 (위 페어에서 파생) */
  finDescs: [
    'Investment - External Vendors',
    'Investment - Cap. Labor',
    'Leasehold Improvements',
    'Software',
    'Cap Engineering',
    'Cap Interest',
    'Excess FIFO',
    'Expense - AR Related',
    'Exp - Operating Lease',
    'Other (VAT)',
  ],
  finAccountNos: ['200001400', '291131003', '292131000', '185001400', '120122105', '596683000', '594602000'],

  /* Stage 4 — Gatekeeper Review (GATEKEEPER MASTERDATA) 사이트별 게이트키퍼 */
  gatekeepers: [
    'David Thompson — VP Operations, Waterford',
    'Laura Martinez — VP Operations, Sistersville',
    'Kenji Sato — Site Director, Ohta',
    'Petra Vogel — Site Director, Leverkusen',
  ],

  /* Stage 1 — Idea Registration (M-CapEx TFT) Category / SubCategory 마스터 */
  categories: ['Maintenance', 'EHS', 'Infrastructure', 'Growth', 'Technology', 'Productivity'],
  subCategories: ['Preventive', 'Corrective', 'Capacity Expansion', 'Compliance', 'Optimization', 'Modernization', 'New Installation', 'Upgrade'],
  /* Category → Sub Category 후보 (TFT: "Sub Category — to be defined" → 카테고리 연동 로직으로 구체화) */
  subCatByCategory: {
    Maintenance:    ['Preventive', 'Corrective', 'Upgrade'],
    EHS:            ['Compliance', 'Corrective', 'Modernization'],
    Infrastructure: ['New Installation', 'Modernization', 'Upgrade'],
    Growth:         ['Capacity Expansion', 'New Installation', 'Upgrade'],
    Technology:     ['Modernization', 'Optimization', 'Upgrade'],
    Productivity:   ['Optimization', 'Capacity Expansion', 'Preventive'],
  },
  /* Category 선택 → 필수 서류 자동 매핑 (TFT: "If select category information populates for documents needed") */
  categoryDocs: {
    Growth: [
      { doc: 'Project Financials',       why: 'Required for IRR / NPV calculation' },
      { doc: 'RAV Document',             why: 'Return on Assets Verification' },
    ],
    EHS: [
      { doc: 'EHS Risk Assessment',      why: 'Regulatory / safety compliance review' },
      { doc: 'Permit Checklist',         why: 'Environmental permit validation' },
    ],
    Maintenance: [
      { doc: 'Breakdown History Report', why: 'CMMS failure records for justification' },
    ],
    Infrastructure: [
      { doc: 'Site Master Plan Extract', why: 'Alignment with site infrastructure plan' },
    ],
    Technology: [
      { doc: 'Technology Assessment',    why: 'Fit / obsolescence review' },
      { doc: 'Project Financials',       why: 'Required for IRR / NPV calculation' },
    ],
    Productivity: [
      { doc: 'Project Financials',       why: 'Required for IRR / NPV calculation' },
    ],
  },

  /* Stage 1 — Sign-off Chain 역할 (combo). 담당자 지정 행의 Role 셀렉트 옵션 */
  signoffRoles: [
    'Requester',
    'Department Approver',
    'Technical Approver',
    'Finance Approver',
    'EHS Approver',
    'Plant Manager',
    'Maintenance / Reliability',
    'Procurement / Quality',
    'Final Approver',
  ],
};

/* =================================================================
 * Sample case — CAPEX-2026-WF-0042 (전체 단계 Completed)
 * ref/CAPEX_Investment_Process.html 의 모든 값을 그대로 옮김.
 * ================================================================= */
const capexCase = {
  id: 'CAPEX-2026-WF-0042',
  title: 'New Reactor — Polymer Line Capacity Expansion',
  classification: 'Strategic Growth',
  status: 'completed',
  currentNode: 'actual',
  lastMod: 'Last Mod. May 26, 2026 09:14 AM',
  requester: { name: 'JONGHO LEE', dept: 'Production', date: 'Jan 15, 2026' },

  /* Stage 1 — Idea Registration (M-CapEx TFT 재편, 2026-07-09) */
  stage1: {
    title: 'New Reactor Installation — Polymer Line Capacity Expansion',
    ideaNo: 'WTFD-0042',            /* 사이트 기반 자동 채번 (SVLL-####, WTFD-#### …) */
    category: 'Growth',             /* CPX_MASTER.categories */
    subCategory: 'Capacity Expansion',
    description: 'Polymer line at 95% utilization. $3,200,000 potential orders at risk in 2027 without expansion. +30% capacity needed. New reactor to be installed on existing foundation with piping tie-ins to current process infrastructure. Estimated 8-month implementation timeline from AR approval through commissioning.',
    submitted: 'Submitted on Jan 18, 2026 by JONGHO LEE',
    /* Schedule — TFT 최소 구성: AR Approval / Procurement / Construction / (Commissioning) / Closure.
       사용자 입력(시작/종료 데이트피커) → 타임라인·Duration 동적 갱신 (2026-07-09) */
    schedule: [
      { label: 'AR Approval',   start: 'Feb 1, 2026',  end: 'Feb 28, 2026' },
      { label: 'Procurement',   start: 'Mar 1, 2026',  end: 'Jun 30, 2026' },
      { label: 'Construction',  start: 'Jul 1, 2026',  end: 'Oct 31, 2026' },
      { label: 'Commissioning', start: 'Nov 1, 2026',  end: 'Nov 30, 2026' },
      { label: 'Closure',       start: 'Dec 1, 2026',  end: 'Dec 31, 2026' },
    ],
    /* Cost Estimate — 계정별 브레이크다운 (M-ERP Financial Master Data). null = 해당 없음.
       Total Project = Current AR + Prior Approved. 합계: 2,520,000 + 280,000 = 2,800,000 (= estBudget) */
    costEstimate: [
      { desc: 'Investment - External Vendors', account: '200001400', current: 2280000, prior: 280000 },
      { desc: 'Investment - Cap. Labor',       account: '200001400', current: 120000,  prior: null },
      { desc: 'Leasehold Improvements',        account: '291131003', current: null,    prior: null },
      { desc: 'Software',                      account: '292131000', current: null,    prior: null },
      { desc: 'Cap Engineering',               account: '200001400', current: 85000,   prior: null },
      { desc: 'Cap Interest',                  account: '185001400', current: null,    prior: null },
      { desc: 'Excess FIFO',                   account: '120122105', current: null,    prior: null },
      { desc: 'Expense - AR Related',          account: '596683000', current: 35000,   prior: null },
      { desc: 'Exp - Operating Lease',         account: '594602000', current: null,    prior: null },
      { desc: 'Other (VAT)',                   account: null,        current: null,    prior: null },
    ],
    /* Spend Schedule — 월별 지출 계획 ($). 컬럼(월)은 위 Schedule 의 전체 기간에서 자동 생성,
       금액은 전부 사용자 입력. 값은 'YYYY-MM' 키 맵 (다년 스케줄 대응). AR Tracker(9단계) Budget 의 원천 */
    spendSchedule: [
      { label: 'Ext. Vendors', v: { '2026-03': 350000, '2026-04': 350000, '2026-05': 350000, '2026-06': 350000, '2026-07': 280000, '2026-08': 200000, '2026-09': 200000, '2026-10': 150000, '2026-11': 50000 } },
      { label: 'Cap. Labor',   v: { '2026-07': 20000, '2026-08': 25000, '2026-09': 25000, '2026-10': 25000, '2026-11': 25000 } },
      { label: 'AR Expense',   v: { '2026-02': 5000, '2026-03': 5000, '2026-04': 5000, '2026-05': 5000, '2026-06': 5000, '2026-07': 3000, '2026-08': 3000, '2026-09': 2000, '2026-10': 2000 } },
      { label: 'Cap Eng.',     v: { '2026-04': 42500, '2026-05': 42500 } },
    ],
    /* 이하 기존 필드 — 타이틀바/서머리/Stage 2 산출식에서 계속 사용 */
    type: 'New Equipment — Capacity Expansion',
    classification: 'Strategic Growth',
    background: 'Polymer line at 95% utilization. $3.2M potential orders at risk in 2027 without expansion.',
    purpose: '+30% capacity to meet 2027 demand and secure long-term supply contracts.',
    site: 'Waterford / PA (Performance Additives)',
    dept: 'Production',
    requester: 'JONGHO LEE',
    estBudget: '2,800,000',
    requestDate: 'Jan 15, 2026',
    priority: 'High',
    targetCompletion: 'Q4 2026',
    /* Sign-off Chain — 담당자 지정 (Role: CPX_MASTER.signoffRoles / Name: CPX_MASTER.users 퀵서치) */
    signoffChain: [
      { role: 'Requester',           name: 'JONGHO LEE' },
      { role: 'Department Approver',  name: 'Sarah Chen' },
      { role: 'Technical Approver',   name: 'Michael Brown' },
      { role: 'Finance Approver',     name: 'Anna Schmidt' },
      { role: 'Final Approver',       name: 'David Park' },
    ],
  },

  /* Stage 2 — Feasibility & Expected ROI */
  stage2: {
    /* ---- 입력 항목 (PDF p.4) — 산출식의 입력. 금액은 숫자로 보관 ----
       Total Investment 는 Stage 1 Est. Budget 을 그대로 사용.
       ROI / Payback / IRR / NPV / Net Benefit 은 전부 auto-calc — detail.js calcStage2() */
    costSavings: 350000,        /* $/yr — 연간 예상 비용 절감액 */
    productivityGain: '+30% throughput',
    revenueImpact: 1200000,     /* $/yr — 연간 추가 매출 기대액 */
    opCostIncrease: 360000,     /* $/yr — 연간 운영비 증가 (Net Benefit 차감) */
    discountRate: 0.10,         /* NPV 할인율 r=10% (PDF 명세) */
    horizonYears: 5,            /* n=5yr (PDF 명세) */
    /* IRR·NPV — 재무모델(Finance ROI model) 산출 고정값 (TFT 참조 기준, 2026-07-09 사용자 결정).
       균등 CF 직접 계산(31.8%/$1,711,000)과 다름 — 램프업 등 모델 가정 차이로 간주.
       ROI/Payback 은 라이브 재계산, IRR/NPV 는 이 고정값 사용 */
    irrModel: 28.7,             /* % */
    npvModel: 1450000,          /* $ */
    /* CCC 개선 — WC Savings = Daily COGS(COGS÷365) × DIO days saved (auto-calc)
       ※ Annual COGS 는 원본 HTML/PDF 입력 항목에 없는 필드 — 산출식 입력으로 필요해
         2026-06-05 사용자 승인으로 추가. 클라이언트 확인 사항. */
    annualCogs: 18800000,    /* $/yr — Cost of Goods Sold (TFT 참조 값: WC Savings ≈ $180,000/yr) */
    dioReduction: 3.5,       /* days — 재고 보유일수 감소분 (입력) */
    leadTimeReduction: 2.0,  /* days — 리드타임 단축 (입력, 계산 미사용) */
    /* PDF 명세: Risk = 선택(High/Medium/Low) + 위험 요소 기술(text) 2필드 */
    riskLevel: 'Medium',
    riskNote: 'Existing line needs 3-week stop during installation. Scheduled during planned maintenance to reduce impact.',
    reviewResult: 'Approved',
    attachments: [
      { kind: 'file', label: 'Feasibility_Report.pdf', size: '1.2 MB' },
      { kind: 'file', label: 'ROI_Model.xlsx',         size: '384 KB' },
    ],
  },

  /* Stage 4 — Gatekeeper Review (M-CapEx TFT 신규, 2026-07-09)
     사이트/로케이션 기반으로 게이트키퍼에게 자동 라우팅 → 검토 → Advance to AR / FPP 결정.
     PM 지정으로 spend schedule·benefits 보완 가능. history = 상태 추적 탭 */
  gatekeeper: {
    name: 'David Thompson — VP Operations, Waterford',
    decision: 'Advanced to AR',
    assignedPm: 'K. Park',
    history: [
      { date: 'Jan 20, 2026', action: 'Received',       by: 'System',      note: 'Auto-routed to site gatekeeper' },
      { date: 'Jan 22, 2026', action: 'Reviewed',       by: 'D. Thompson', note: 'Strong business case — aligns with capacity growth strategy' },
      { date: 'Jan 25, 2026', action: 'Assigned to PM', by: 'D. Thompson', note: 'Assigned to K. Park for refinement of spend schedule & benefits' },
      { date: 'Jan 28, 2026', action: 'Updated',        by: 'K. Park',     note: 'Spend schedule and benefits refined, vendor quotes attached' },
      { date: 'Feb 1, 2026', action: 'Advanced to AR', by: 'D. Thompson', note: 'Approved to proceed — strong ROI, aligns with 2026 capital plan' },
    ],
  },

  /* Stage 5 — AR Approval (구 Stage 3 CAPEX Approval, M-CapEx TFT 재편)
     AR = Appropriation Request. arNo 는 사이트 기반 자동 채번 (WV26001 등) */
  stage3: {
    arNo: 'WV26001',
    capexNo: 'CAPEX-2026-WF-0042',
    status: 'Approved',
    approvedAmount: '$ 2,800,000',
    date: 'Feb 10, 2026',
    attachments: [
      { kind: 'file', label: 'Feasibility_Report.pdf', size: '2.4 MB' },
      { kind: 'file', label: 'ROI_Model.xlsx',         size: '480 KB' },
      { kind: 'file', label: 'Vendor_Quotes.pdf',      size: '1.8 MB' },
    ],
    /* Priority 는 Stage 1(stage1.priority)을 그대로 재확인 — 결재 레벨 결정. 별도 grade 필드 제거 */
    budgetCode: 'BU-PA-WF-2026-CAP-042',
    /* 날짜 — 미국식 표기 + 연도 포함 (타이틀바 Last Mod. 표기와 동일 톤) */
    approvalChain: [
      { role: 'Dept. Mgr',    name: 'J. Lee',      date: 'Feb 1, 2026'  },
      { role: 'Finance Dir.', name: 'S. Kim',      date: 'Feb 4, 2026'  },
      { role: 'VP Ops',       name: 'D. Thompson', date: 'Feb 7, 2026'  },
      { role: 'CFO',          name: 'M. Brown',    date: 'Feb 10, 2026' },
    ],
    conditions: 'Contract must stay within approved budget. Scope changes over 5% need re-approval. Monthly progress report required.',
  },

  /* Stage 4 — Requirement & Specification */
  stage4: {
    engSpec: 'Glass-lined reactor 10,000L, 6 bar design pressure, -20~250°C operating range, anchor agitator 0.5~120 rpm, CIP (Clean-in-Place) system integrated',
    quality: 'ATEX Zone 1 rated, FDA-compliant wetted parts, SIL-2 safety integrity level, EU PED 2014/68/EU pressure equipment directive compliance',
    /* Utility Requirements — TFT 는 표 형식 (사이트 용량 대비 검증용) */
    utilities: [
      { name: 'Electrical',     spec: '480V / 3ph / 60Hz — 75 kW' },
      { name: 'Steam',          spec: '10 bar — 2,000 kg/hr' },
      { name: 'Cooling Water',  spec: '25°C — 500 m³/hr' },
      { name: 'Instrument Air', spec: '6 bar — oil-free' },
    ],
    /* 비교 대상 기존 설비 — (EQUIP MASTERDATA) 퀵서치 + 타입 요약 (TFT 2필드 구성) */
    referenceEquip: 'RX-1001 (Polymer Reactor, Line #1, Waterford)',
    refEquipType: 'Glass-Lined Reactor — 8,000L · installed 2014, 10 years in service',
    breakdownHistory: [
      { date: 'Nov 5, 2024', wo: 'WO-2024-04821', desc: 'Agitator seal leak — bearing wear after 8 years', downtime: '72 hrs',  cost: '$ 45,000' },
      { date: 'Jun 12, 2024', wo: 'WO-2024-02917', desc: 'Glass lining crack — thermal shock during CIP cycle', downtime: '120 hrs', cost: '$ 82,000' },
      { date: 'Feb 20, 2024', wo: 'WO-2024-00845', desc: 'Temperature control valve stuck — DCS alarm triggered', downtime: '8 hrs',   cost: '$ 3,200'  },
      { date: 'Sep 8, 2023', wo: 'WO-2023-04102', desc: 'Motor overheating — insulation degradation',             downtime: '24 hrs',  cost: '$ 12,000' },
      { date: 'Mar 15, 2023', wo: 'WO-2023-01233', desc: 'Pressure relief valve failed annual test — replaced',    downtime: '4 hrs',   cost: '$ 1,800'  },
    ],
    breakdownTotal: { downtime: '228 hrs', cost: '$ 144,000' },
    upgradeHistory: [
      { date: 'Apr 2022', desc: 'Motor upgrade 18.5→22kW for higher viscosity products', cost: '$ 8,500',  result: 'Effective' },
      { date: 'Aug 2021', desc: 'Added vibration sensor on agitator bearing',             cost: '$ 4,200',  result: 'Early warning enabled' },
      { date: 'Nov 2020', desc: 'CIP nozzle redesign to reduce thermal shock risk',       cost: '$ 6,800',  result: 'Partially effective' },
      { date: 'Mar 2019', desc: 'DCS integration — replaced manual control panel',        cost: '$ 35,000', result: 'Effective' },
    ],
    keyFindings: [
      'Glass lining crack was the highest-cost failure ($ 82K). → New spec requires improved thermal shock resistance grade.',
      'Agitator bearing near end-of-life (vibration 2.1/2.5 mm/s). → New spec includes heavy-duty bearing + online vibration sensor from day 1.',
      'Motor already upgraded once (18.5→22kW). → New equipment sized at 30kW to cover future product range.',
      'CIP thermal shock risk remains after nozzle redesign. → New design includes pre-heating cycle in CIP sequence.',
      '3-year maintenance cost: $ 144K failures + $ 54.5K upgrades = $ 198.5K. → Supports the investment case.',
    ],
    attachments: [
      { kind: 'link', label: 'CMMS: RX-1001 Work Order History' },
      { kind: 'link', label: 'CMMS: RX-1001 Condition Monitoring Dashboard' },
      { kind: 'file', label: 'Equipment_Inspection_Report_2024.pdf', size: '2.4 MB' },
    ],
  },

  /* Stage 5 — TBE */
  stage5: {
    rfqNo: 'RFQ-2026-0042', /* 외부 구매 툴에서 불러온 기준 RFQ (TBE) */
    vendors: [
      { name: 'Vendor A', score: '92 / 100', compliance: 'Pass',        leadTime: '24 wks', comment: 'Best design, proven record', winner: true },
      { name: 'Vendor B', score: '85 / 100', compliance: 'Pass',        leadTime: '28 wks', comment: 'Good, longer delivery' },
      { name: 'Vendor C', score: '72 / 100', compliance: 'Conditional', leadTime: '26 wks', comment: 'Spec gap' },
    ],
    decision: 'Vendor A — Technically preferred',
  },

  /* Stage 6 — CBE */
  stage6: {
    rfqNo: 'RFQ-2026-0042', /* 외부 구매 툴에서 불러온 기준 RFQ (CBE — TBE와 독립 선택) */
    vendors: [
      { name: 'Vendor A', score: 88, quoted: '$ 2,350K', negotiated: '$ 2,280K', terms: '30/40/20/10', warranty: '24 mo', decision: 'Selected',     winner: true },
      { name: 'Vendor B', score: 82, quoted: '$ 2,520K', negotiated: '$ 2,450K', terms: '40/30/20/10', warranty: '18 mo', decision: 'Not selected' },
      { name: 'Vendor C', score: 75, quoted: '$ 2,100K', negotiated: '—',        terms: '50/30/20',    warranty: '12 mo', decision: 'Excluded'     },
    ],
    negotiation: 'Warranty 18→24 mo, spare parts included, 3% price reduction. Budget savings: $ 520K (18.6%)',
  },

  /* Stage 7 — Contract & PO */
  stage7: {
    contractNo: 'CNT-2026-WF-0042',
    poNo: 'PO-4500078923',
    contractAmount: '$ 2,280,000',
    vendor: 'Vendor A',
    /* PDF p.8 전용 필드 — 원본 HTML 에는 없으나 명세에 있어 추가 (2026-06-05) */
    contractDate: 'Mar 5, 2026',
    warranty: '24 mo from SAT — incl. spare parts package (CBE negotiation)',
    conditions: 'Liquidated damages 0.1% per day (max 10% of contract) · Performance bond 10% · ISO 14001 environmental compliance',
    payments: [
      { ms: 'M1 — Advance (30%)',    amount: '$ 684K', paidOn: 'Mar 15, 2026', status: 'Paid' },
      { ms: 'M2 — After FAT (40%)',  amount: '$ 912K', paidOn: 'Aug 25, 2026', status: 'Paid' },
      { ms: 'M3 — After Delivery (20%)', amount: '$ 456K', paidOn: 'Sep 20, 2026', status: 'Paid' },
      { ms: 'M4 — After SAT (10%)',  amount: '$ 228K', paidOn: 'Nov 15, 2026', status: 'Paid' },
    ],
    keyDates: [
      { label: 'FAT (Factory Acceptance Test)', date: 'Aug 20, 2026' },
      { label: 'Delivery',                      date: 'Sep 10, 2026' },
      { label: 'Installation Complete',         date: 'Oct 30, 2026' },
      { label: 'SAT (Site Acceptance Test)',    date: 'Nov 10, 2026' },
      { label: 'Warranty Expiry',               date: 'Nov 10, 2028' }, /* 파생: SAT + 24 mo — 설명은 ? 툴팁 */
    ],
  },

  /* Stage 8 — Design / Fab / Install (S-Curve + Timeline + Change Log + Issues) */
  stage8: {
    /* events = 포인트별 이벤트 라벨 (원본 eventLabels 이식) — 차트 dataLabel + 에디터 Event 행 */
    /* Construction Progress (%) — TFT 재편으로 서브차트 4개 → 이 한 개로 통합 (2026-07-09).
       key 'overall' 은 진도 에디터 cfg 조회용으로 유지 */
    overall: {
      labels: ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'],
      plan:   [5, 12, 22, 38, 55, 70, 82, 93, 100],
      actual: [4, 9, 16, 25, 38, 55, 72, 88, 100],
      events: ['Contract signed', 'P&ID review', 'Design freeze', 'Fab delay start', 'Max delay point', 'FAT passed', 'Site install begin', 'SAT passed', 'Go-Live'],
      status: 'Recovered',
    },
    /* Budget vs. Actual Spending — 완전 파생 차트 (2026-07-09):
       기간 = Stage 1 Schedule 스팬 / Plan = Spend Schedule 월합계 누적 / Actual = AR Tracker 실적 누적.
       데이터는 status 뿐 — 수치는 budgetCurveCfg() 가 원천에서 계산 */
    budgetCurve: {
      status: 'Tracking to plan',
    },
    milestones: [
      { date: 'Jan 15, 2026', label: 'Investment Request',  status: 'on-time' },
      { date: 'Feb 10, 2026', label: 'Investment Review',   status: 'on-time' },
      { date: 'Mar 5, 2026', label: 'CAPEX Approval',      status: 'on-time' },
      { date: 'Mar 20, 2026', label: 'Contract & PO',       status: 'on-time' },
      { date: 'Apr 20, 2026', label: 'Design Freeze',       status: 'on-time' },
      { date: 'Aug 20, 2026', label: 'FAT',                 status: 'delayed', note: '3d late'  },
      { date: 'Oct 30, 2026', label: 'Installation Done',   status: 'on-time' },
      { date: 'Nov 10, 2026', label: 'SAT',                 status: 'ahead',   note: '2d early' },
      { date: 'Dec 15, 2026', label: 'Commissioning Done',  status: 'on-time' },
    ],
    changes: [
      { desc: 'Motor size changed (22→30kW). Added cost $ 12,000.' },
      { desc: 'Added temperature sensor port. Added cost $ 3,500.' },
    ],
    issues: [
      { desc: 'Fabrication delayed 3 days → Recovered by running site prep in parallel. No impact on overall schedule.' },
    ],
    /* ── M-CapEx TFT 추가분 (2026-07-09) ── */
    /* Budget vs Actual — 월별 실적 집계 스냅샷 (7월 기준). Committed = 발주(PO) 확정액 */
    budgetVsActual: {
      total: '$ 2.80M', actual: '$ 1.62M', actualPct: '57.9% spent',
      committed: '$ 2.56M', committedPct: '91.4% committed', remaining: '$ 1.18M',
    },
    /* Purchasing — 프로젝트 내 발주(PO) 현황. GR(Goods Receipt) 완료 시 AR Tracker 로 자동 집계 */
    pos: [
      { po: 'PO-4500078923', desc: 'Reactor Vessel',        vendor: 'Vendor A', amount: '$ 2,280,000', status: 'GR Complete' },
      { po: 'PO-4500078950', desc: 'Installation Services', vendor: 'Vendor B', amount: '$ 185,000',   status: 'In Progress' },
      { po: 'PO-4500078962', desc: 'Electrical Work',       vendor: 'Vendor C', amount: '$ 95,000',    status: 'Pending' },
    ],
    /* Fixed Assets — 재무 마감 연계: 이관 양식 → 재무 검증 → 고정자산 등재 */
    fixedAsset: [
      { role: 'Asset Transfer Form',  name: 'Sent by K. Park',      date: 'Nov 21, 2026' },
      { role: 'Finance Validation',   name: 'Validated · A. Schmidt', date: 'Nov 24, 2026' },
      { role: 'Fixed Asset Register', name: 'FA-2026-WF-0088',      date: 'Nov 25, 2026' },
    ],
    /* Maintenance 연계 — 신규 설비 CMMS 등록 + PM(예방보전) 스케줄 생성 */
    maintenance: [
      { role: 'Equipment Master',  name: 'RX-2001 (New Reactor)',  date: 'Registered in CMMS' },
      { role: 'PM Schedule',       name: 'Created · 12 tasks',     date: 'First PM Dec 20, 2026' },
    ],
  },

  /* Stage 9 — AR Tracking & Forecast (M-CapEx TFT 신규, 2026-07-09)
     Budget 컬럼은 Stage 1 Spend Schedule 월합계에서 파생(단일 출처) — 여기엔 실적/예측만.
     GR·워크오더 청구 완료 시 자동 갱신되는 개념. Forecast 는 매월 10일까지 갱신 의무 */
  tracking: {
    currentIdx: 6,               /* July (0-base) — 현재 월 */
    deadline: 'Jul 10, 2026',
    actual:   [null, 3000, 340000, 410000, 385000, 362000, 120000, null, null, null, null, null],
    forecast: [null, null, null,   null,   null,   null,   310000, 230000, 225000, 180000, 80000, null],
  },

  /* Stage 10 — Reporting (M-CapEx TFT) 사이트 롤업 대시보드 + Active Projects */
  reporting: {
    summary: {
      budget: '$ 8,400,000', budgetSub: 'Waterford 2026',
      spent: '$ 3,200,000',  spentSub: '38.1% of budget',
      remaining: '$ 5,200,000',
      active: '7', activeSub: '3 Growth · 2 EHS · 2 Maint.',
    },
    projects: [
      { ar: 'WV26001', name: 'New Reactor — Polymer Line',   cat: 'Growth',      budget: '$ 2,800,000', actual: '$ 1,620,000', pct: '57.9%', status: 'In Execution', current: true },
      { ar: 'WV26002', name: 'Cooling Tower Replacement',    cat: 'Maintenance', budget: '$ 450,000',   actual: '$ 380,000',   pct: '84.4%', status: 'In Execution' },
      { ar: 'WV26003', name: 'Wastewater Treatment Upgrade', cat: 'EHS',         budget: '$ 1,200,000', actual: '$ 210,000',   pct: '17.5%', status: 'In Execution' },
      { ar: 'WV26004', name: 'Lab Equipment Modernization',  cat: 'Technology',  budget: '$ 680,000',   actual: '$ 520,000',   pct: '76.5%', status: 'Commissioning' },
      { ar: 'WV26005', name: 'Tank Farm Expansion',          cat: 'Growth',      budget: '$ 1,500,000', actual: '$ 95,000',    pct: '6.3%',  status: 'Procurement' },
      { ar: 'WV26006', name: 'Fire Suppression System',      cat: 'EHS',         budget: '$ 920,000',   actual: '$ 312,000',   pct: '33.9%', status: 'In Execution' },
      { ar: 'WV26007', name: 'Compressor Overhaul',          cat: 'Maintenance', budget: '$ 850,000',   actual: '$ 63,000',    pct: '7.4%',  status: 'AR Approval' },
    ],
    /* Site Budget vs Actual — 카테고리별 ($) */
    categories: [
      { name: 'Growth',         budget: 4300000, actual: 1715000 },
      { name: 'EHS',            budget: 2120000, actual: 522000 },
      { name: 'Infrastructure', budget: 400000,  actual: 180000 },
      { name: 'Technology',     budget: 680000,  actual: 520000 },
      { name: 'Productivity',   budget: 350000,  actual: 120000 },
      { name: 'Maintenance',    budget: 1300000, actual: 443000 },
    ],
  },

  /* Stage 9(구) — Commissioning & Verification — TFT 재편으로 스테이지에서 빠짐.
     qualifications 는 AI Summary 등에서 계속 참조 */
  stage9: {
    qualifications: [
      { label: 'FAT (Factory Acceptance Test)',     status: 'Passed', date: 'Aug 20, 2026' },
      { label: 'SAT (Site Acceptance Test)',        status: 'Passed', date: 'Nov 10, 2026' },
      { label: 'IQ (Installation Qualification)',   status: 'Passed', date: 'Nov 5, 2026' },
      { label: 'OQ (Operational Qualification)',    status: 'Passed', date: 'Nov 12, 2026' },
      { label: 'PQ (Performance Qualification)',    status: 'Passed', date: 'Nov 18, 2026' },
      { label: 'Go-Live',                           status: 'Live',   date: 'Nov 20, 2026' },
    ],
    result: 'All IQ/OQ/PQ passed. No major issues found.',
  },

  /* Stage 10 — Actual ROI Analysis */
  stage10: {
    budget: { approved: '$ 2.80M', actual: '$ 2.58M', delta: '-$ 0.22M', variancePct: 7.9 },
    savings:  { expected: '$ 350K', actual: '$ 412K',  pct: '+17.7%' },
    revenue:  { expected: '$ 1.20M', actual: '$ 1.38M', pct: '+15.0%' },
    /* Expected 컬럼은 전부 calcStage2() live 산출 (detail.js renderStage10) — 여기엔 actual 만 보관.
       (구식 하드코딩 expected mock 제거, 2026-06-09) */
    netBenefit: [
      { label: '① Annual Cost Savings',            actual: '$ 412K'  },
      { label: '② Annual Incremental Revenue',     actual: '$ 1,380K' },
      { label: '③ Annual Operating Cost Increase', actual: '$ 400K'  },
      { label: 'Annual Net Benefit (① + ② − ③)',   actual: '$ 1,392K', total: true },
    ],
    roiCompare: [
      { label: 'ROI (%)',          actual: '53.9%',     formula: 'Annual Net Benefit ÷ Total Investment × 100' },
      { label: 'Payback Period',   actual: '1.9 yr',    formula: 'Total Investment ÷ Annual Net Benefit' },
      { label: 'IRR',              actual: '31.4%',     formula: 'Discount rate at which NPV = 0' },
      { label: 'NPV',              actual: '$ 1,620K',  formula: 'Σ Cash Flow ÷ (1 + r)ⁿ − Investment' },
    ],
    cccCompare: [
      { label: 'DIO Reduction (Days Inventory Outstanding)', actual: '-4.1 days', formula: 'Days inventory reduced (Before − After)' },
      { label: 'Lead Time Reduction',                        actual: '-2.5 days', formula: 'Production time reduced (Before − After)' },
      { label: 'Working Capital Savings',                    actual: '$ 210K', formula: 'Cash freed by less inventory (Daily COGS × days saved)' },
    ],
    assessment: 'All targets exceeded. 7.9% under budget. ROI +11.4%p above forecast.',
    lessons: 'Verify fabrication delivery dates more strictly upfront. Parallel site prep was effective — recommend as standard practice.',
    reviewDate: 'May 20, 2027',
    attachments: [
      { kind: 'file', label: 'Final_Report.pdf', size: '1.8 MB' },
      { kind: 'file', label: 'ROI_Actual.xlsx',  size: '240 KB' },
    ],
  },
};

/* =================================================================
 * Workflow state helper — calcNodeStates({ flow, currentNode })
 * - currentNode 보다 앞: 'done'
 * - currentNode: 'current'
 * - 그 이후: 'pending'
 * masterdata-workflow-currentnode 패턴.
 * ================================================================= */
function calcNodeStates(flow, currentNode) {
  let seenCurrent = false;
  return flow.map(n => {
    if (n.key === currentNode) { seenCurrent = true; return { ...n, state: 'current' }; }
    return { ...n, state: seenCurrent ? 'pending' : 'done' };
  });
}

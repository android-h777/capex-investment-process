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
const capexFlow = [
  { key: 'request',     no: 1,  label: 'Investment Request',     sub: '투자 요청',                icon: 'lightbulb'     },
  { key: 'feasibility', no: 2,  label: 'Feasibility & ROI',      sub: '타당성 / Expected ROI',    icon: 'trending_up'   },
  { key: 'approval',    no: 3,  label: 'CAPEX Approval',         sub: '최종 결재',                icon: 'verified'      },
  { key: 'spec',        no: 4,  label: 'Requirement & Spec',     sub: '사양 정의 / CMMS',         icon: 'engineering'   },
  { key: 'tbe',         no: 5,  label: 'TBE',                    sub: 'Technical Bid Eval',       icon: 'science'       },
  { key: 'cbe',         no: 6,  label: 'CBE',                    sub: 'Commercial Bid Eval',      icon: 'request_quote' },
  { key: 'contract',    no: 7,  label: 'Contract & PO',          sub: '계약 / 발주',              icon: 'description'   },
  { key: 'execution',   no: 8,  label: 'Design / Fab / Install', sub: '실행 단계 (S-Curve)',      icon: 'construction'  },
  { key: 'commission',  no: 9,  label: 'Commissioning',          sub: '시운전 / Verification',    icon: 'play_circle'   },
  { key: 'actual',      no: 10, label: 'Actual ROI Analysis',    sub: '사후 성과 분석',           icon: 'analytics'     },
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
    'James Wilson',
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
  requester: { name: 'James Wilson', dept: 'Production', date: 'Jan 15, 2026' },

  /* Stage 1 — Investment Request */
  stage1: {
    title: 'New Reactor Installation — Polymer Line Capacity Expansion',
    type: 'New Equipment — Capacity Expansion',
    classification: 'Strategic Growth',
    background: 'Polymer line at 95% utilization. $3.2M potential orders at risk in 2027 without expansion.',
    purpose: '+30% capacity to meet 2027 demand and secure long-term supply contracts.',
    site: 'Waterford / PA (Performance Additives)',
    dept: 'Production',
    requester: 'James Wilson',
    estBudget: '2,800,000',
    requestDate: 'Jan 15, 2026',
    priority: 'High',
    targetCompletion: 'Q4 2026',
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
    /* CCC 개선 — WC Savings = Daily COGS(COGS÷365) × DIO days saved (auto-calc)
       ※ Annual COGS 는 원본 HTML/PDF 입력 항목에 없는 필드 — 산출식 입력으로 필요해
         2026-06-05 사용자 승인으로 추가. 클라이언트 확인 사항. */
    annualCogs: 18720000,    /* $/yr — Cost of Goods Sold */
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

  /* Stage 3 — CAPEX Approval */
  stage3: {
    capexNo: 'CAPEX-2026-WF-0042',
    status: 'Approved',
    approvedAmount: '$ 2,800,000',
    date: 'Feb 10, 2026',
    grade: 'A / High',
    budgetCode: 'BU-PA-WF-2026-CAP-042',
    /* 날짜 — 미국식 표기 + 연도 포함 (타이틀바 Last Mod. 표기와 동일 톤) */
    approvalChain: [
      { role: 'Dept. Mgr',    name: 'J. Wilson',   date: 'Feb 1, 2026'  },
      { role: 'Finance Dir.', name: 'S. Kim',      date: 'Feb 4, 2026'  },
      { role: 'VP Ops',       name: 'D. Thompson', date: 'Feb 7, 2026'  },
      { role: 'CFO',          name: 'M. Brown',    date: 'Feb 10, 2026' },
    ],
    conditions: 'Contract must stay within approved budget. Scope changes over 5% need re-approval. Monthly progress report required.',
  },

  /* Stage 4 — Requirement & Specification */
  stage4: {
    engSpec: 'Glass-lined reactor 10,000L, 6 bar, -20~250°C, anchor agitator 0.5~120 rpm, CIP system',
    quality: 'ATEX Zone 1, FDA wetted parts, SIL-2, EU PED 2014/68/EU',
    utilities: 'Elec: 480V/3ph/60Hz 75kW | Steam: 10 bar 2,000 kg/hr | CW: 25°C 500 m³/hr | IA: 6 bar oil-free',
    /* 비교 대상 기존 설비 — (EQUIP MASTERDATA) 퀵서치. 부가 설명은 값에 합쳐 한 줄 (원본 HTML 방식) */
    referenceEquip: 'RX-1001 (Polymer Reactor, Line #1, Waterford) — Same type, installed 2014, 10 years in service',
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
    vendors: [
      { name: 'Vendor A', score: '92 / 100', compliance: 'Pass',        leadTime: '24 wks', comment: 'Best design, proven record', winner: true },
      { name: 'Vendor B', score: '85 / 100', compliance: 'Pass',        leadTime: '28 wks', comment: 'Good, longer delivery' },
      { name: 'Vendor C', score: '72 / 100', compliance: 'Conditional', leadTime: '26 wks', comment: 'Spec gap' },
    ],
    decision: 'Vendor A — Technically preferred',
  },

  /* Stage 6 — CBE */
  stage6: {
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
    overall: {
      labels: ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov'],
      plan:   [5, 12, 22, 38, 55, 70, 82, 93, 100],
      actual: [4, 9, 16, 25, 38, 55, 72, 88, 100],
      events: ['Contract signed', 'P&ID review', 'Design freeze', 'Fab delay start', 'Max delay point', 'FAT passed', 'Site install begin', 'SAT passed', 'Go-Live'],
      status: 'Recovered',
    },
    subCharts: [
      { key: 'design',     title: 'Design',                                labels: ['Mar','Apr','May'],        plan: [25, 70, 100],        actual: [20, 58, 100],        events: ['Design kickoff', 'P&ID approved', 'All drawings final'],                              status: 'On Schedule',           tone: 'success' },
      { key: 'procure',    title: 'Procurement',                           labels: ['Apr','May','Jun'],        plan: [15, 55, 100],        actual: [22, 68, 100],        events: ['RFQ issued', 'Vendor selected', 'All POs placed'],                                    status: '2 days Ahead',          tone: 'accent'  },
      { key: 'fab',        title: 'Fabrication',                           labels: ['May','Jun','Jul','Aug'],  plan: [12, 45, 80, 100],    actual: [8, 28, 58, 100],     events: ['Material ordered', 'Welding delayed', 'Assembly in progress', 'FAT passed'],          status: '3 days Delayed (recovered)', tone: 'warn' },
      { key: 'install',    title: 'Installation (Site Prep + Mech + E&I)', labels: ['Aug','Sep','Oct','Nov'],  plan: [8, 35, 70, 100],     actual: [18, 50, 82, 100],    events: ['Site prep + parallel work', 'Mech install complete', 'E&I hookup done', 'SAT passed'], status: '5 days Ahead (parallel accel.)', tone: 'accent' },
    ],
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
      { id: 'CHG-001', desc: 'Motor size changed (22→30kW). Added cost $ 12,000.', state: 'Closed' },
      { id: 'CHG-002', desc: 'Added temperature sensor port. Added cost $ 3,500.', state: 'Closed' },
    ],
    issues: [
      { id: 'ISS-001', desc: 'Fabrication delayed 3 days → Recovered by running site prep in parallel. No impact on overall schedule.', state: 'Closed' },
    ],
  },

  /* Stage 9 — Commissioning & Verification */
  stage9: {
    qualifications: [
      { label: 'FAT (Factory Acceptance Test)',     status: 'Passed', date: 'Aug 20, 2026' },
      { label: 'SAT (Site Acceptance Test)',        status: 'Passed', date: 'Nov 10, 2026' },
      { label: 'IQ (Installation Qualification)',   status: 'Passed', date: 'Nov 5, 2026' },
      { label: 'OQ (Operational Qualification)',    status: 'Passed', date: 'Nov 12, 2026' },
      { label: 'PQ (Performance Qualification)',    status: 'Passed', date: 'Nov 18, 2026' },
      { label: 'Go-Live',                           status: 'Live',   date: 'Nov 20, 2026' },
    ],
    punchList: [
      { text: 'Pressure test passed — tested at 1.5× design pressure (9 bar)', state: 'Closed' },
      { text: 'Vibration check passed — within acceptable limits',             state: 'Closed' },
      { text: 'Control system signal check — all 48 I/O points confirmed OK',  state: 'Closed' },
      { text: 'Safety valve certificate received',                             state: 'Closed' },
      { text: 'Cleaning system validated — 3 test cycles passed',              state: 'Closed' },
      { text: 'Explosion-proof certificate received',                          state: 'Closed' },
    ],
    result: 'All IQ/OQ/PQ passed. No major issues found.',
    handover: 'Nov 20, 2026 — Handed over to Production team',
  },

  /* Stage 10 — Actual ROI Analysis */
  stage10: {
    budget: { approved: '$ 2.80M', actual: '$ 2.58M', delta: '-$ 0.22M', variancePct: 7.9 },
    savings:  { expected: '$ 350K', actual: '$ 412K',  pct: '+17.7%' },
    revenue:  { expected: '$ 1.20M', actual: '$ 1.38M', pct: '+15.0%' },
    netBenefit: [
      { label: '① Annual Cost Savings',         expected: '$ 350K',   actual: '$ 412K'  },
      { label: '② Annual Incremental Revenue',  expected: '$ 1,200K', actual: '$ 1,380K' },
      { label: '③ Annual Operating Cost Increase', expected: '$ 360K', actual: '$ 400K'  },
      { label: 'Annual Net Benefit (① + ② − ③)', expected: '$ 1,190K', actual: '$ 1,392K', total: true },
    ],
    roiCompare: [
      { label: 'ROI (%)',          expected: '42.5%',     actual: '53.9%',     formula: 'Annual Net Benefit ÷ Total Investment × 100' },
      { label: 'Payback Period',   expected: '2.4 yr',    actual: '1.9 yr',    formula: 'Total Investment ÷ Annual Net Benefit' },
      { label: 'IRR',              expected: '28.7%',     actual: '31.4%',     formula: 'Discount rate at which NPV = 0' },
      { label: 'NPV',              expected: '$ 1,450K',  actual: '$ 1,620K',  formula: 'Σ Cash Flow ÷ (1 + r)ⁿ − Investment' },
    ],
    cccCompare: [
      { label: 'DIO Reduction (Days Inventory Outstanding)', expected: '-3.5 days', actual: '-4.1 days', formula: 'Days inventory reduced (Before − After)' },
      { label: 'Lead Time Reduction',                        expected: '-2.0 days', actual: '-2.5 days', formula: 'Production time reduced (Before − After)' },
      { label: 'Working Capital Savings',                    expected: '$ 180K /yr', actual: '$ 210K /yr', formula: 'Cash freed by less inventory (Daily COGS × days saved)' },
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

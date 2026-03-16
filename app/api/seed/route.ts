import { NextResponse } from 'next/server'

// POST /api/seed — 노드맵 전체 기능을 보여주는 풍부한 데모 데이터
export async function POST() {
  const now = new Date()
  const date = (daysAgo: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  const meetings = [
    // 1. 회의 녹음
    {
      id: 'src-1', code: 'MTG-001', title: 'PKEEP 프로젝트 킥오프',
      date: date(35), duration_seconds: 2400, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: '[민주] 오늘부터 PKEEP 시작합니다. AI 기반 의사결정 맥락 관리 도구를 만들 겁니다.\n[이환] Next.js 14 + Supabase + GPT-4o로 가겠습니다.\n[이랑] Radix UI + Tailwind로 디자인 시스템 잡을게요.',
      transcriptSegments: [
        { speaker: 'Speaker A', text: '오늘부터 PKEEP 시작합니다.', start: 0, end: 5 },
        { speaker: 'Speaker B', text: 'Next.js 14 + Supabase + GPT-4o로 가겠습니다.', start: 6, end: 14 },
        { speaker: 'Speaker C', text: 'Radix UI + Tailwind로 디자인 시스템 잡을게요.', start: 15, end: 22 },
      ],
      summary: '킥오프. Next.js 14 + Supabase + GPT-4o 기술 스택 확정, 특허 5단계 구조 기반 MVP 시작.',
      keywords: ['킥오프', 'Next.js', 'Supabase', 'MVP', '특허'], issues: [{ title: '기술 스택 선정' }],
    },
    // 2. 슬랙 대화
    {
      id: 'src-2', code: 'SRC-002', title: '슬랙: STT 서비스 긴급 논의',
      date: date(28), duration_seconds: 0, source: 'text', sourceType: 'slack', language: 'ko',
      transcriptText: '이환: AssemblyAI가 화자 분리 잘 됩니다. Whisper는 안 되고 Clova는 한국어만.\n민주: 다국어 필수. AssemblyAI로 가죠.\n이환: 근데 실시간 API가 최근에 v3로 바뀌어서 마이그레이션 필요합니다.\n민주: 일정 영향 있나요?\n이환: 하루면 됩니다.',
      transcriptSegments: [], summary: 'STT 서비스 긴급 논의. AssemblyAI 채택, v3 마이그레이션 필요 확인.',
      keywords: ['STT', 'AssemblyAI', '화자분리', '실시간'], issues: [{ title: 'STT 서비스 선정' }],
    },
    // 3. 회의 녹음
    {
      id: 'src-3', code: 'MTG-003', title: 'UI/UX 리뷰 — 메인 플로우',
      date: date(21), duration_seconds: 2100, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: '[이랑] 녹음→STT→분석→결과 플로우에서 화자 매핑이 너무 길어요.\n[이환] AssemblyAI 자동 화자 분리로 매핑 단계 제거 가능합니다.\n[민주] 결과 화면에서 수정이 안 되는 게 문제. AI가 틀릴 수 있으니.\n[이랑] 요약+스크립트 2탭으로 나누겠습니다.',
      transcriptSegments: [
        { speaker: 'Speaker C', text: '녹음→STT→분석→결과 플로우에서 화자 매핑이 너무 길어요.', start: 0, end: 8 },
        { speaker: 'Speaker B', text: 'AssemblyAI 자동 화자 분리로 매핑 단계 제거 가능합니다.', start: 9, end: 16 },
        { speaker: 'Speaker A', text: '결과 화면에서 수정이 안 되는 게 문제.', start: 17, end: 22 },
        { speaker: 'Speaker C', text: '요약+스크립트 2탭으로 나누겠습니다.', start: 23, end: 28 },
      ],
      summary: 'UI/UX 리뷰. 화자 매핑 제거, 2탭 구조 채택, 인라인 수정 기능 요구.',
      keywords: ['UX', '화자매핑', '탭', '인라인수정'], issues: [{ title: '메인 플로우 개선' }, { title: '분석 결과 수정' }],
    },
    // 4. 노션 문서
    {
      id: 'src-4', code: 'SRC-004', title: '노션: 경쟁사 분석 보고서',
      date: date(18), duration_seconds: 0, source: 'text', sourceType: 'notion', language: 'ko',
      sourceUrl: 'https://notion.so/pkeep/competitor-analysis',
      transcriptText: '경쟁사 분석 결과: Fireflies는 60개 연동, 200개 AI앱. Tiro는 한국어 최적화, 봇 없이 시스템 오디오 녹음. Clova Note는 화자분리 정확도 최고.\nPKEEP 차별점: 5종 맥락 추출, 충돌 감지, 역추적 DAG — 경쟁사 아무도 안 함.\n결론: "왜(Why)" 추적이 핵심. 연동은 Slack+Notion 최소한으로.',
      transcriptSegments: [], summary: '경쟁사 분석. PKEEP의 핵심 차별점은 근거 추적+충돌 감지. Slack/Notion 연동 필수.',
      keywords: ['경쟁사', 'Fireflies', 'Tiro', '차별점', '연동'], issues: [{ title: '경쟁 포지셔닝' }],
    },
    // 5. 전화 통화 메모
    {
      id: 'src-5', code: 'SRC-005', title: '통화: 클라이언트 A사 요구사항 변경',
      date: date(14), duration_seconds: 0, source: 'text', sourceType: 'call', language: 'ko',
      transcriptText: 'A사 PM 김부장과 통화. 기존 Jira 연동 대신 자체 태스크 관리로 변경 요청. 이유: Jira 라이선스 비용 부담. 대신 CSV 내보내기만 지원해달라. 납기일은 변동 없음. 추가: 모바일 대응 문의했는데 v2로 안내함.',
      transcriptSegments: [], summary: 'A사 요구사항 변경. Jira 연동 → 자체 태스크 관리+CSV 내보내기로 전환. 모바일은 v2.',
      keywords: ['클라이언트', 'Jira', '태스크', 'CSV', '요구변경'], issues: [{ title: '요구사항 변경 대응' }],
    },
    // 6. 이메일
    {
      id: 'src-6', code: 'SRC-006', title: '이메일: 법무팀 개인정보 검토 결과',
      date: date(10), duration_seconds: 0, source: 'text', sourceType: 'email', language: 'ko',
      transcriptText: '법무팀 이변호사 회신: 음성 데이터 저장 시 개인정보보호법 제15조 동의 필요. 녹음 전 참석자 동의 UI 필수. 음성 원본은 STT 완료 후 즉시 삭제 권장. 해외 서버 전송 시 GDPR도 검토 필요.',
      transcriptSegments: [], summary: '법무 검토: 녹음 동의 UI 필수, 음성 원본 즉시 삭제, GDPR 검토 필요.',
      keywords: ['법무', '개인정보', '동의', 'GDPR', '삭제'], issues: [{ title: '개인정보 컴플라이언스' }],
    },
    // 7. 회의 녹음
    {
      id: 'src-7', code: 'MTG-007', title: '인프라 및 배포 전략',
      date: date(7), duration_seconds: 1500, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: '[이환] Cloudflare Pages + Vultr PostgreSQL이 최적입니다. Vercel은 hobby 제한.\n[민주] Vultr 서버 있으니 활용하죠.\n[이환] R2에 오디오 저장하면 무료 10GB. pgvector도 Vultr에서 됩니다.\n[민주] 법무팀 의견 반영해서 음성 즉시 삭제 정책도 넣읍시다.',
      transcriptSegments: [
        { speaker: 'Speaker B', text: 'Cloudflare Pages + Vultr PostgreSQL이 최적입니다.', start: 0, end: 8 },
        { speaker: 'Speaker A', text: 'Vultr 서버 있으니 활용하죠.', start: 9, end: 14 },
        { speaker: 'Speaker A', text: '법무팀 의견 반영해서 음성 즉시 삭제 정책도 넣읍시다.', start: 15, end: 22 },
      ],
      summary: '인프라 확정. Cloudflare Pages + Vultr PostgreSQL + R2. 음성 즉시 삭제 정책 포함.',
      keywords: ['Cloudflare', 'Vultr', 'PostgreSQL', 'R2', '음성삭제'], issues: [{ title: '배포 인프라' }, { title: '음성 데이터 정책' }],
    },
    // 8. 슬랙 대화
    {
      id: 'src-8', code: 'SRC-008', title: '슬랙: 디자인 시스템 컬러 충돌',
      date: date(5), duration_seconds: 0, source: 'text', sourceType: 'slack', language: 'ko',
      transcriptText: '이랑: 다크 테마 primary 색상이 접근성 기준 미달이에요. 대비율 3.2:1인데 4.5:1 필요.\n민주: 브랜드 오렌지를 바꿀 순 없잖아.\n이랑: 밝기만 올리면 됩니다. #F97316 → #FB923C로.\n이환: 코드 전체 교체 필요한데 CSS 변수라 30분이면 됩니다.',
      transcriptSegments: [], summary: '다크 테마 접근성 이슈. primary 색상 밝기 조정 (#F97316→#FB923C). CSS 변수로 빠르게 교체 가능.',
      keywords: ['접근성', '다크테마', '색상', 'WCAG'], issues: [{ title: '접근성 미달' }],
    },
    // 9. 회의 녹음
    {
      id: 'src-9', code: 'MTG-009', title: 'MVP 스프린트 2주차 리뷰',
      date: date(1), duration_seconds: 1920, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: '[민주] DB 전환, 온보딩, IR 데모가 이번 목표입니다.\n[이환] DB 마이그레이션 80% 완료. 금요일까지 끝냅니다. 근데 A사 요구변경 때문에 태스크 관리 자체 구현도 해야 해서 일정이 빡빡합니다.\n[이랑] 온보딩 와이어프레임 완료. 접근성 이슈도 이번에 같이 잡겠습니다.\n[민주] ProductHunt는 내년 Q2로 확정. 그전에 국내 베타.',
      transcriptSegments: [
        { speaker: 'Speaker A', text: 'DB 전환, 온보딩, IR 데모가 이번 목표입니다.', start: 0, end: 6 },
        { speaker: 'Speaker B', text: 'DB 마이그레이션 80% 완료. A사 요구변경 때문에 일정이 빡빡합니다.', start: 7, end: 16 },
        { speaker: 'Speaker C', text: '온보딩 와이어프레임 완료. 접근성 이슈도 같이 잡겠습니다.', start: 17, end: 24 },
        { speaker: 'Speaker A', text: 'ProductHunt는 내년 Q2로 확정.', start: 25, end: 30 },
      ],
      summary: '2주차 리뷰. DB 80%, 온보딩 설계 완료. A사 요구변경으로 일정 리스크. ProductHunt 27년 Q2 확정.',
      keywords: ['스프린트', 'DB전환', '온보딩', 'IR', '일정리스크'], issues: [{ title: '일정 리스크' }, { title: '다음 스프린트' }],
    },
  ]

  const decisions = [
    // MTG-001 킥오프 (meeting)
    { id: 'dec-1', meetingId: 'src-1', code: 'DEC-001', title: 'Next.js 14 + Supabase + GPT-4o 기술 스택', rationale: 'Supabase 호환성 + 서버 컴포넌트 활용', area: 'dev', status: 'confirmed', proposedBy: '이환 CTO', createdAt: date(35) },
    { id: 'dec-2', meetingId: 'src-1', code: 'DEC-002', title: '특허 5단계 구조 기반 MVP', rationale: '특허 청구항이 제품 차별점의 핵심', area: 'planning', status: 'confirmed', proposedBy: '민주 대표', createdAt: date(35) },
    { id: 'dec-3', meetingId: 'src-1', code: 'DEC-003', title: 'Radix UI + Tailwind 디자인 시스템', rationale: '빠른 구축 + 접근성 기본 지원', area: 'design', status: 'confirmed', proposedBy: '이랑 UX', createdAt: date(35) },

    // SRC-002 슬랙 (slack)
    { id: 'dec-4', meetingId: 'src-2', code: 'DEC-004', title: 'AssemblyAI를 STT로 채택', rationale: '화자 분리 + 다국어 감지 동시 지원', area: 'dev', status: 'confirmed', proposedBy: '이환 CTO', createdAt: date(28) },
    { id: 'dec-5', meetingId: 'src-2', code: 'DEC-005', title: 'AssemblyAI v3 마이그레이션', rationale: '실시간 API가 v3로 변경됨, 하루 작업', area: 'dev', status: 'confirmed', proposedBy: '이환 CTO', createdAt: date(28) },

    // MTG-003 UX 리뷰 (meeting)
    { id: 'dec-6', meetingId: 'src-3', code: 'DEC-006', title: '화자 매핑 단계 제거', rationale: 'AssemblyAI 자동 화자 분리로 수동 매핑 불필요', area: 'dev', status: 'confirmed', proposedBy: '이환 CTO', createdAt: date(21) },
    { id: 'dec-7', meetingId: 'src-3', code: 'DEC-007', title: '결과 화면 2탭 (요약/스크립트)', rationale: '정보 과부하 방지, 원본 확인 니즈', area: 'design', status: 'confirmed', proposedBy: '이랑 UX', createdAt: date(21) },
    { id: 'dec-8', meetingId: 'src-3', code: 'DEC-008', title: '분석 결과 인라인 수정 기능', rationale: 'AI 추출이 틀릴 수 있어 사용자 교정 필수', area: 'design', status: 'pending', proposedBy: '민주 대표', createdAt: date(21) },

    // SRC-004 노션 (notion)
    { id: 'dec-9', meetingId: 'src-4', code: 'DEC-009', title: 'Slack + Notion 연동 우선 구현', rationale: '경쟁사 대비 최소 연동 필수, Fireflies 대비 차별화는 다른 곳에서', area: 'planning', status: 'pending', proposedBy: '민주 대표', createdAt: date(18) },

    // SRC-005 전화 (call) — 요구변경으로 기존 결정 충돌
    { id: 'dec-10', meetingId: 'src-5', code: 'DEC-010', title: 'Jira 연동 취소 → 자체 태스크 관리', rationale: 'A사 Jira 라이선스 비용 부담, CSV 내보내기로 대체', area: 'dev', status: 'changed', proposedBy: '민주 대표', createdAt: date(14) },

    // SRC-006 이메일 (email) — 법무 검토로 블로커
    { id: 'dec-11', meetingId: 'src-6', code: 'DEC-011', title: '녹음 전 동의 UI 필수 구현', rationale: '개인정보보호법 제15조 요구, 법무팀 검토 결과', area: 'design', status: 'hold', proposedBy: '법무팀', createdAt: date(10) },
    { id: 'dec-12', meetingId: 'src-6', code: 'DEC-012', title: '음성 원본 STT 후 즉시 삭제', rationale: '법무팀 권고 + Tiro 선례 (경쟁 우위)', area: 'dev', status: 'confirmed', proposedBy: '법무팀', createdAt: date(10) },

    // MTG-007 인프라 (meeting)
    { id: 'dec-13', meetingId: 'src-7', code: 'DEC-013', title: 'Cloudflare Pages + Vultr PostgreSQL', rationale: '비용 효율 최고, 기존 인프라 활용', area: 'dev', status: 'confirmed', proposedBy: '이환 CTO', createdAt: date(7) },
    { id: 'dec-14', meetingId: 'src-7', code: 'DEC-014', title: 'Cloudflare R2 오디오 임시 저장', rationale: '무료 10GB, CDN 연동, 삭제 정책과 호환', area: 'dev', status: 'confirmed', proposedBy: '이환 CTO', createdAt: date(7) },

    // SRC-008 슬랙 (slack) — 디자인 충돌
    { id: 'dec-15', meetingId: 'src-8', code: 'DEC-015', title: 'Primary 색상 접근성 조정', rationale: 'WCAG 대비율 4.5:1 미달 → #F97316에서 #FB923C로', area: 'design', status: 'confirmed', proposedBy: '이랑 UX', createdAt: date(5) },

    // MTG-009 스프린트 리뷰 (meeting)
    { id: 'dec-16', meetingId: 'src-9', code: 'DEC-016', title: 'localStorage → PostgreSQL 전환', rationale: '데이터 영속성 + 팀 공유 필수', area: 'dev', status: 'pending', proposedBy: '이환 CTO', createdAt: date(1) },
    { id: 'dec-17', meetingId: 'src-9', code: 'DEC-017', title: 'ProductHunt 런칭 27년 Q2', rationale: '국내 베타 먼저 → 글로벌', area: 'planning', status: 'confirmed', proposedBy: '민주 대표', createdAt: date(1) },
    { id: 'dec-18', meetingId: 'src-9', code: 'DEC-018', title: '자체 태스크 관리 기능 구현', rationale: 'A사 요구변경 반영, Jira 대체', area: 'dev', status: 'pending', proposedBy: '이환 CTO', createdAt: date(1) },
  ]

  const tasks = [
    // 킥오프
    { id: 'task-1', meetingId: 'src-1', title: 'Supabase 프로젝트 초기 설정', assignee: '이환 CTO', done: true, createdAt: date(35) },
    { id: 'task-2', meetingId: 'src-1', title: 'Figma 디자인 시스템 셋업', assignee: '이랑 UX', done: true, createdAt: date(35) },
    { id: 'task-3', meetingId: 'src-1', title: '특허 ↔ 기능 매핑 문서', assignee: '민주 대표', done: true, createdAt: date(35) },
    // STT 슬랙
    { id: 'task-4', meetingId: 'src-2', title: 'AssemblyAI API 연동', assignee: '이환 CTO', done: true, createdAt: date(28) },
    { id: 'task-5', meetingId: 'src-2', title: 'v3 실시간 API 마이그레이션', assignee: '이환 CTO', done: true, createdAt: date(28) },
    { id: 'task-6', meetingId: 'src-2', title: '인앱 녹음 컴포넌트', assignee: '이환 CTO', done: true, createdAt: date(28) },
    // UX 리뷰
    { id: 'task-7', meetingId: 'src-3', title: '화자 매핑 코드 제거', assignee: '이환 CTO', done: true, createdAt: date(21) },
    { id: 'task-8', meetingId: 'src-3', title: '스크립트 원본 탭 구현', assignee: '이랑 UX', done: true, createdAt: date(21) },
    { id: 'task-9', meetingId: 'src-3', title: '인라인 수정 기능 설계', assignee: '이랑 UX', done: false, createdAt: date(21) },
    // 경쟁사 (노션)
    { id: 'task-10', meetingId: 'src-4', title: 'Slack 웹훅 연동 PoC', assignee: '이환 CTO', done: false, createdAt: date(18) },
    { id: 'task-11', meetingId: 'src-4', title: 'Notion API 연동 PoC', assignee: '이환 CTO', done: false, createdAt: date(18) },
    // 클라이언트 (전화)
    { id: 'task-12', meetingId: 'src-5', title: '자체 태스크 관리 UI 설계', assignee: '이랑 UX', done: false, createdAt: date(14) },
    { id: 'task-13', meetingId: 'src-5', title: 'CSV 내보내기 API 구현', assignee: '이환 CTO', done: false, createdAt: date(14) },
    // 법무 (이메일) — 블로커
    { id: 'task-14', meetingId: 'src-6', title: '녹음 동의 모달 UI 구현', assignee: '이랑 UX', done: false, createdAt: date(10) },
    { id: 'task-15', meetingId: 'src-6', title: '음성 자동 삭제 로직 구현', assignee: '이환 CTO', done: false, createdAt: date(10) },
    { id: 'task-16', meetingId: 'src-6', title: 'GDPR 검토 문서 작성', assignee: '민주 대표', done: false, createdAt: date(10) },
    // 인프라
    { id: 'task-17', meetingId: 'src-7', title: 'Vultr PostgreSQL 서버 세팅', assignee: '이환 CTO', done: false, createdAt: date(7) },
    { id: 'task-18', meetingId: 'src-7', title: 'Cloudflare Pages 배포', assignee: '이환 CTO', done: false, createdAt: date(7) },
    { id: 'task-19', meetingId: 'src-7', title: 'R2 오디오 업로드 API', assignee: '이환 CTO', done: false, createdAt: date(7) },
    // 접근성 (슬랙)
    { id: 'task-20', meetingId: 'src-8', title: 'CSS 변수 색상 교체', assignee: '이환 CTO', done: true, createdAt: date(5) },
    // 스프린트 리뷰
    { id: 'task-21', meetingId: 'src-9', title: 'DB 마이그레이션 완료', assignee: '이환 CTO', done: false, createdAt: date(1) },
    { id: 'task-22', meetingId: 'src-9', title: '온보딩 플로우 구현', assignee: '이랑 UX', done: false, createdAt: date(1) },
    { id: 'task-23', meetingId: 'src-9', title: 'IR 데모 시나리오 작성', assignee: '민주 대표', done: false, createdAt: date(1) },
  ]

  const rejected = [
    // STT 기각
    { id: 'rej-1', meetingId: 'src-2', title: 'Whisper API 단독 사용', reason: '화자 분리 불가, 별도 서비스 필요', relatedDecision: 'AssemblyAI를 STT로 채택', proposedBy: '이환 CTO' },
    { id: 'rej-2', meetingId: 'src-2', title: 'Clova Speech API', reason: '한국어만 지원, 글로벌 대응 불가', relatedDecision: 'AssemblyAI를 STT로 채택', proposedBy: '민주 대표' },
    // 인프라 기각
    { id: 'rej-3', meetingId: 'src-7', title: 'Vercel 배포 유지', reason: 'hobby 플랜 제한, Vultr 활용이 효율적', relatedDecision: 'Cloudflare Pages + Vultr PostgreSQL', proposedBy: '이환 CTO' },
    // 클라이언트 기각
    { id: 'rej-4', meetingId: 'src-5', title: 'Jira 연동 유지', reason: 'A사 라이선스 비용 부담으로 취소', relatedDecision: 'Jira 연동 취소 → 자체 태스크 관리', proposedBy: '민주 대표' },
    // 모바일 기각
    { id: 'rej-5', meetingId: 'src-9', title: '모바일 앱 동시 개발', reason: 'MVP 데스크톱 웹 완성이 우선', relatedDecision: 'ProductHunt 런칭 27년 Q2', proposedBy: '민주 대표' },
  ]

  return NextResponse.json({ meetings, decisions, tasks, rejected })
}

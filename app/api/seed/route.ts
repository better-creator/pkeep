import { NextResponse } from 'next/server'

// POST /api/seed — 핏커넥트(FitConnect) 피트니스 O2O 플랫폼 MVP 개발 시나리오
export async function POST() {
  const now = new Date()
  const date = (daysAgo: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  const meetings = [
    // 1. 킥오프 — 비즈니스 모델 확정
    {
      id: 'src-1', code: 'MTG-001', title: '핏커넥트 프로젝트 킥오프',
      date: date(42), duration_seconds: 3600, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[정우진] 오늘부터 핏커넥트 프로젝트 공식 시작합니다. 6주 스프린트로 MVP 나가야 돼요. 시장 타이밍이 중요합니다.
[이민호] 일단 코어 기능 정의부터 하죠. 트레이너 매칭이 메인인지, 예약 시스템이 메인인지 확실히 해야 합니다.
[정우진] 둘 다요. 트레이너를 찾고, 바로 예약까지.
[박서연] 아 근데 그건 좀... 6주에 둘 다는 무리예요. 매칭 알고리즘만 해도 추천 로직, 필터링, 리뷰 시스템 다 들어가야 하고. 예약은 결제, 캘린더 동기화, 취소 환불 정책까지 있잖아요.
[정우진] 그럼 뭘 먼저?
[박서연] MVP에서는 매칭에 집중하고, 예약은 카카오톡 채널로 빼는 게 현실적입니다. 일단 트레이너 발견하고 연결하는 것만 잘 되면.
[김하늘] 저도 동의해요. 사용자 입장에서 좋은 트레이너를 찾는 게 첫 번째 고통점이에요. 예약은 그다음이고.
[이민호] 근데 투자자 입장에서는 거래가 일어나야 하지 않나요? 매칭만 하면 매출이 안 나오는데.
[정우진] 맞아요 민호 씨 말도 맞는데... 일단 트레이너 풀이 있어야 거래도 있는 거니까. MVP는 매칭 중심으로 하되, 간단한 수업 신청 폼은 넣읍시다. 결제는 v2에서.
[박서연] 그러면 기술 스택 이야기하면, React Native는 시간상 못 하고 Next.js로 모바일 웹 먼저 가는 게 맞아요.
[김하늘] 모바일 퍼스트 디자인은 필수예요. 헬스장에서 폰으로 보는 거니까.
[박서연] 백엔드는 Firebase로 빠르게 가겠습니다. Auth, Firestore, Storage 다 있으니까.
[정우진] 좋습니다. 정리하면 — 매칭 중심 MVP, 모바일 웹, Next.js + Firebase. 6주 뒤 베타 런칭 목표.`,
      transcriptSegments: [
        { speaker: 'Speaker A', text: '오늘부터 핏커넥트 프로젝트 공식 시작합니다. 6주 스프린트로 MVP 나가야 돼요.', start: 0, end: 8 },
        { speaker: 'Speaker D', text: '트레이너 매칭이 메인인지, 예약 시스템이 메인인지 확실히 해야 합니다.', start: 9, end: 16 },
        { speaker: 'Speaker B', text: '6주에 둘 다는 무리예요. 매칭에 집중하고 예약은 카카오톡 채널로 빼는 게 현실적입니다.', start: 17, end: 30 },
        { speaker: 'Speaker C', text: '사용자 입장에서 좋은 트레이너를 찾는 게 첫 번째 고통점이에요.', start: 31, end: 38 },
        { speaker: 'Speaker A', text: 'MVP는 매칭 중심으로 하되, 간단한 수업 신청 폼은 넣읍시다.', start: 39, end: 48 },
      ],
      summary: '킥오프. 트레이너 매칭 중심 MVP 확정. 예약/결제는 v2로. Next.js + Firebase, 모바일 웹 우선. 6주 베타 런칭 목표.',
      keywords: ['킥오프', '매칭', 'MVP', 'Next.js', 'Firebase'], issues: [{ title: '매칭 vs 예약 스코프' }, { title: '기술 스택 선정' }],
    },
    // 2. 슬랙: 결제 시스템 논의
    {
      id: 'src-2', code: 'SRC-002', title: '슬랙: 결제 시스템 사전 논의',
      date: date(36), duration_seconds: 0, source: 'text', sourceType: 'slack', language: 'ko',
      transcriptText: `박서연: v2 결제 대비해서 미리 조사해봤는데요. 토스페이먼츠 vs 아임포트(포트원) 비교입니다.
박서연: 토스페이먼츠 — 수수료 PG 직접 계약 필요, 문서 깔끔, SDK 좋음. 근데 사업자등록 후 심사 2주 걸림.
박서연: 아임포트(포트원) — 여러 PG 통합, 테스트 모드 바로 가능, 웹훅 안정적. 수수료는 PG사별로 다름.
이민호: 우리 사업자등록 아직 안 했죠?
정우진: 다음 주에 나와요.
박서연: 그러면 아임포트로 가는 게 맞아요. 테스트 모드에서 개발 먼저 하고, 사업자 나오면 실결제 전환하면 됩니다.
정우진: 근데 토스페이먼츠가 브랜딩 측면에서 낫지 않나? 요즘 토스 인지도가...
박서연: 결제창은 어차피 PG사 창이 뜨는 거라 토스페이 결제 옵션은 아임포트에서도 됩니다.
정우진: 아 그렇구나. 그럼 아임포트.
김하늘: 결제 UI는 네이티브 바텀시트로 해주세요. 리디렉트 방식이면 이탈률 높아요.
박서연: 아임포트 v2 SDK가 인앱 결제 지원하니까 가능합니다.`,
      transcriptSegments: [], summary: '결제 시스템 사전 조사. 아임포트(포트원) 채택. 테스트 모드 선개발, 사업자등록 후 실결제 전환. 인앱 결제 UI 방식.',
      keywords: ['결제', '토스페이먼츠', '아임포트', '포트원', 'PG'], issues: [{ title: '결제 시스템 선정' }],
    },
    // 3. 디자인 리뷰 — 트레이너 프로필 UX
    {
      id: 'src-3', code: 'MTG-003', title: '디자인 리뷰 — 트레이너 프로필 UX',
      date: date(30), duration_seconds: 2700, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[김하늘] 트레이너 프로필 시안 공유합니다. 크게 두 가지 방향인데요. A안은 프로필 사진 중심 — 인스타 느낌으로 비주얼 임팩트 강하게. B안은 리뷰/스펙 중심 — 자격증, 경력, 리뷰 점수를 먼저 보여주는 거.
[정우진] A안이 좋지 않아요? 피트니스 업계가 비주얼이 중요하잖아.
[김하늘] 그게 좀 리스크가 있는 게요, 트레이너 입장에서 사진 퀄리티 차이가 너무 나요. 전문 촬영한 사람이랑 폰셀카 올린 사람이랑. 그러면 플랫폼 전체 퀄리티가 들쑥날쑥해져요.
[이민호] 맞아, 에어비앤비도 초기에 호스트 사진 직접 찍어줬잖아요.
[김하늘] 저희는 그 리소스가 없으니까, B안이 안전해요. 리뷰랑 스펙 데이터는 일정한 포맷으로 보여줄 수 있으니까.
[박서연] 근데 B안은 솔직히 좀 밋밋하지 않나... 크몽이나 숨고 느낌 날 것 같은데.
[김하늘] 그래서 절충안을 준비했어요. 사진은 상단에 고정 비율로 넣되, 아래에 핵심 지표 3개 — 경력 연차, 리뷰 평점, 수업 횟수 — 를 뱃지처럼 보여주는 거예요.
[정우진] 오 그거 좋네. 사진도 있고 신뢰도도 보이고.
[박서연] 리뷰 평점은 초기에 데이터가 없을 텐데?
[김하늘] 초기에는 "신규 트레이너" 뱃지를 대신 붙이면 돼요. 오히려 얼리어답터한테 어필할 수 있어요.
[이민호] 좋습니다. 절충안으로 가죠.`,
      transcriptSegments: [
        { speaker: 'Speaker C', text: '트레이너 프로필 시안 A안 사진 중심, B안 리뷰/스펙 중심.', start: 0, end: 10 },
        { speaker: 'Speaker A', text: 'A안이 좋지 않아요? 피트니스 업계가 비주얼이 중요하잖아.', start: 11, end: 18 },
        { speaker: 'Speaker C', text: '사진 퀄리티 차이가 너무 나서 B안이 안전해요.', start: 19, end: 28 },
        { speaker: 'Speaker C', text: '절충안 — 사진 고정비율 + 핵심 지표 뱃지 3개.', start: 29, end: 38 },
        { speaker: 'Speaker D', text: '좋습니다. 절충안으로 가죠.', start: 39, end: 42 },
      ],
      summary: '트레이너 프로필 UX 리뷰. 사진 중심(A)과 스펙 중심(B)의 절충안 채택 — 고정비율 사진 + 경력/평점/수업횟수 뱃지. 초기 리뷰 없는 트레이너는 "신규" 뱃지.',
      keywords: ['프로필', 'UX', '트레이너', '리뷰', '뱃지'], issues: [{ title: '트레이너 프로필 디자인' }, { title: '초기 데이터 부재 대응' }],
    },
    // 4. 노션: 시장 조사 결과
    {
      id: 'src-4', code: 'SRC-004', title: '노션: 피트니스 O2O 시장 조사',
      date: date(25), duration_seconds: 0, source: 'text', sourceType: 'notion', language: 'ko',
      sourceUrl: 'https://notion.so/fitconnect/market-research',
      transcriptText: `시장 조사 결과 정리 (이민호)

1. 클래스패스(ClassPass): 글로벌 선두. 크레딧 기반 예약 모델. 한국 진출했다가 2023년 철수. 원인: 한국 헬스장 시스템과 안 맞음 (월 회원권 문화). 교훈 — 한국형 모델 필요.

2. 카카오 예약: 네이버 예약과 함께 로컬 서비스 예약 점유. 근데 PT/퍼스널 트레이닝 카테고리가 약함. 헬스장 예약은 있지만 개인 트레이너 매칭은 없음.

3. 숨고/크몽: 전문가 매칭 플랫폼. 피트니스 카테고리 있지만 전문성 부족. 견적 요청 방식이라 즉시성 없음.

4. 또 하나 주목할 건 트레이너 쪽 SaaS — 트레이너비(TrainerBee), 핏매니저 같은 도구. 고객 관리/일정 관리에 집중. 매칭은 안 함.

경쟁 갭: "개인 트레이너 전문 매칭 + 즉시 예약"을 하는 서비스가 없음. 클래스패스는 시설 기반이고, 숨고는 느리고, 카카오는 카테고리가 없음.

우리 포지셔닝: 트레이너 전문 매칭 (AI 추천) + 즉시 수업 신청 + 트레이너 관리 도구(SaaS)
TAM: 국내 PT 시장 약 3조원 (2024 기준). 개인 트레이너 약 15만명.
목표: 6개월 내 서울 강남/마포 지역 트레이너 500명 온보딩.`,
      transcriptSegments: [], summary: '시장 조사. 클래스패스 철수 후 공백, 카카오 예약에 PT 카테고리 부재, 숨고는 즉시성 없음. 핏커넥트 포지셔닝: 트레이너 전문 매칭 + 즉시 신청 + 관리 SaaS.',
      keywords: ['시장조사', '클래스패스', '카카오예약', '숨고', 'TAM'], issues: [{ title: '경쟁 포지셔닝' }, { title: '트레이너 온보딩 전략' }],
    },
    // 5. 통화: 시드 투자자 피드백
    {
      id: 'src-5', code: 'SRC-005', title: '통화: 시드 투자자 피드백 — 매쉬업엔젤스',
      date: date(20), duration_seconds: 0, source: 'text', sourceType: 'call', language: 'ko',
      transcriptText: `매쉬업엔젤스 이 심사역과 30분 통화 (정우진 메모)

긍정적:
- 피트니스 O2O 시장 타이밍 좋음. 클래스패스 빠진 자리.
- 팀 밸런스 좋음 (CEO 기획, CTO 개발, 디자이너, PM).
- 모바일 웹 MVP → 앱 전환 로드맵 합리적.

핵심 피드백:
- "매칭은 쉬운데 리텐션이 어려워요. 트레이너가 플랫폼 밖에서 직거래하면 끝이잖아요." → 트레이너 리텐션 지표가 핵심 KPI가 되어야 한다.
- "트레이너한테 플랫폼에 남을 이유를 줘야 해요. 고객 관리 SaaS가 그 역할을 할 수 있겠네."
- "첫 거래만 플랫폼에서 하고 이후에 빠져나가는 게 이 업계 공통 문제. 숨고도 똑같은 이슈."

액션 아이템:
- 트레이너 리텐션 전략 구체화 (대시보드, 일정관리, 정산 시스템)
- MAU보다 트레이너 월간 활성률 추적
- 시드 데크에 리텐션 전략 섹션 추가

추가: 시리즈 A 전에 트레이너 500명, MAU 5000명은 있어야 다음 라운드 가능하다는 의견.`,
      transcriptSegments: [], summary: '시드 투자자 피드백. 트레이너 리텐션이 핵심 KPI. 직거래 이탈 방지를 위한 SaaS 도구 필요. 시리즈 A 기준: 트레이너 500명, MAU 5000명.',
      keywords: ['투자', '리텐션', '매쉬업엔젤스', 'KPI', '시드'], issues: [{ title: '트레이너 리텐션 전략' }, { title: '투자 유치 기준' }],
    },
    // 6. 이메일: 트레이너 베타 유저 인터뷰
    {
      id: 'src-6', code: 'SRC-006', title: '이메일: 트레이너 베타 유저 인터뷰 결과',
      date: date(16), duration_seconds: 0, source: 'text', sourceType: 'email', language: 'ko',
      transcriptText: `트레이너 베타 유저 인터뷰 결과 (김하늘 → 팀 전체)

5명 인터뷰 완료. 강남 3명, 마포 2명. 경력 2~8년차.

공통 니즈:
1. "인스타로 홍보하는데 한계가 있어요. 팔로워가 없으면 노출이 안 됨." — 4/5명
2. "숨고에 올렸는데 견적만 보내고 연락 안 오는 사람이 대부분." — 3/5명
3. "고객 관리가 제일 힘들어요. 엑셀로 하고 있는데..." — 5/5명 (!)
4. "수수료가 30% 넘으면 안 쓸 거예요. 숨고가 그래서 안 쓰는 거고." — 4/5명

놀라운 발견:
- 5명 중 4명이 개인 카카오톡 채널을 운영 중. 하지만 관리가 안 됨.
- 트레이너들이 원하는 건 "내가 안 해도 되는 마케팅 + 쉬운 일정 관리"
- 수수료 민감도 매우 높음. 10% 이하를 기대.

추천 기능 우선순위 (트레이너 기준):
1순위: 고객이 알아서 찾아오는 프로필 노출
2순위: 일정/고객 관리 대시보드
3순위: 정산/매출 리포트
4순위: 리뷰 관리

결론: 트레이너용 SaaS 기능을 MVP에 최소한이라도 넣어야 온보딩 가능.`,
      transcriptSegments: [], summary: '트레이너 5명 인터뷰. 핵심 니즈: 프로필 노출 + 고객/일정 관리. 수수료 10% 이하 기대. 트레이너 SaaS 최소 기능 MVP 필수.',
      keywords: ['인터뷰', '트레이너', '수수료', '고객관리', '온보딩'], issues: [{ title: '수수료 구조' }, { title: '트레이너 SaaS 스코프' }],
    },
    // 7. 회의: Firebase → Supabase 전환 논쟁
    {
      id: 'src-7', code: 'MTG-007', title: '기술 아키텍처 변경 — Firebase vs Supabase',
      date: date(12), duration_seconds: 3000, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[박서연] 좀 큰 이야기를 해야 하는데요. Firebase에서 Supabase로 전환하는 걸 제안합니다.
[정우진] 뭐? 지금? 2주나 개발했는데?
[박서연] 네, 저도 늦은 거 알아요. 근데 트레이너 인터뷰 결과 보니까 대시보드, 정산, 일정 관리가 필요한데, 이거 Firestore로는 쿼리가 너무 제한적이에요. 관계형 데이터가 많아졌어요.
[이민호] 구체적으로 뭐가 안 돼요?
[박서연] 예를 들어 "강남 지역, 요가 전문, 평점 4.5 이상, 이번 주 빈 시간 있는 트레이너"를 Firestore로 쿼리하려면 복합 인덱스를 미친듯이 만들어야 해요. 그리고 정산 리포트는 집계 쿼리가 필요한데 Firestore는 그게 안 돼서 Cloud Functions에서 해야 하고.
[정우진] 전환하면 일정 얼마나 밀려요?
[박서연] 3~4일이요. Auth는 Supabase Auth가 있고, Storage도 있고. Firestore 데이터는 아직 스키마만 잡은 거라 마이그레이션 비용은 적어요.
[김하늘] 3~4일이면 괜찮지 않나요? 나중에 바꾸면 더 비싸질 거고.
[이민호] 저는 좀 걱정되는 게, 이미 Firebase Auth로 소셜 로그인 붙여놨잖아요.
[박서연] Supabase Auth도 카카오, 구글 다 돼요. 오히려 Row Level Security가 있어서 보안이 더 좋아요.
[정우진] 근데 Firebase 실시간 기능은? 채팅 같은 거.
[박서연] Supabase Realtime이 있어요. PostgreSQL LISTEN/NOTIFY 기반인데 충분합니다.
[정우진] ...알겠어요. 서연 씨가 확신하면 바꿉시다. 대신 3일 안에 끝내야 해요.
[박서연] 네, 이번 주말 포함 3일이면 됩니다.
[이민호] 위험 요소 하나 — Supabase 무료 플랜 제한. 500MB DB, 1GB Storage.
[박서연] MVP에는 충분해요. 유료 전환은 베타 이후에.`,
      transcriptSegments: [
        { speaker: 'Speaker B', text: 'Firebase에서 Supabase로 전환하는 걸 제안합니다.', start: 0, end: 8 },
        { speaker: 'Speaker A', text: '뭐? 지금? 2주나 개발했는데?', start: 9, end: 14 },
        { speaker: 'Speaker B', text: 'Firestore로는 쿼리가 너무 제한적이에요. 관계형 데이터가 많아졌어요.', start: 15, end: 26 },
        { speaker: 'Speaker B', text: '3~4일이요. Auth는 Supabase Auth가 있고, Storage도 있고.', start: 27, end: 36 },
        { speaker: 'Speaker A', text: '서연 씨가 확신하면 바꿉시다. 대신 3일 안에 끝내야 해요.', start: 37, end: 44 },
      ],
      summary: 'Firebase→Supabase 전환 결정. 이유: 복합 쿼리, 정산 집계, RLS 보안. 3일 마이그레이션. MVP 무료 플랜 충분.',
      keywords: ['Firebase', 'Supabase', '마이그레이션', 'PostgreSQL', 'RLS'], issues: [{ title: 'DB 아키텍처 변경' }, { title: '마이그레이션 일정' }],
    },
    // 8. 슬랙: 실시간 채팅 스코프 조정
    {
      id: 'src-8', code: 'SRC-008', title: '슬랙: 실시간 채팅 기능 스코프 조정',
      date: date(8), duration_seconds: 0, source: 'text', sourceType: 'slack', language: 'ko',
      transcriptText: `이민호: @all 채팅 기능 스코프 논의 필요합니다. 원래 계획대로면 1:1 실시간 채팅인데, 일정 고려하면 축소해야 할 것 같아요.
박서연: 솔직히 지금 Supabase 전환 + 트레이너 대시보드 + 매칭 알고리즘 하면서 실시간 채팅까지 하면 죽어요. WebSocket 관리도 해야 하고.
김하늘: 대안으로 카카오톡 연결 버튼만 넣는 건요? 트레이너들 인터뷰에서도 카카오톡 채널 쓰고 있다고 했잖아요.
정우진: 음... 채팅이 없으면 플랫폼 바깥으로 나가는 거잖아. 그게 리텐션 문제의 시작 아닌가?
이민호: 맞는 말인데 MVP에서는 트레이드오프가 필요해요. 채팅 때문에 전체 런칭이 밀리면 더 큰 손해예요.
박서연: 절충안 — Supabase Realtime으로 간단한 메시지 기능만. 읽음 표시, 파일 전송, 채팅방 관리 이런 건 다 빼고. 텍스트만 주고받는 거.
정우진: 그래요 그렇게 합시다. 최소 채팅. 읽음 표시도 없이?
박서연: 네. 읽음 표시는 상태 관리가 복잡해요. MVP에서는 없이 가겠습니다.
김하늘: UI는 카카오톡 느낌으로 익숙하게 가겠습니다. 기능은 적어도 경험은 좋게.`,
      transcriptSegments: [], summary: '실시간 채팅 스코프 축소. Supabase Realtime 기반 텍스트 전용 최소 채팅. 읽음표시, 파일전송 제외. UI는 카카오톡 스타일.',
      keywords: ['채팅', 'Supabase Realtime', '스코프', 'MVP', '카카오톡'], issues: [{ title: '채팅 기능 범위' }],
    },
    // 9. 회의: 베타 런칭 전 QA 리뷰
    {
      id: 'src-9', code: 'MTG-009', title: '베타 런칭 전 QA 리뷰',
      date: date(4), duration_seconds: 2400, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[이민호] QA 결과 공유합니다. 전체 34개 테스트 케이스 중 통과 21개, 실패 13개입니다.
[정우진] 13개?! 이번 주 런칭인데?
[이민호] 심각한 거 먼저 말씀드리면요. 크리티컬 3개 있습니다.
[이민호] 첫 번째 — 카카오 소셜 로그인이 iOS Safari에서 안 돼요. 리다이렉트 콜백이 씹혀요.
[박서연] 아... Safari의 Intelligent Tracking Prevention 때문일 거예요. 서드파티 쿠키를 차단해서. Supabase 이슈 트래커에도 올라와 있던 건데 제가 놓쳤네요.
[이민호] 두 번째 — 트레이너 프로필 이미지 업로드가 5MB 넘으면 무한 로딩이에요. 에러 메시지도 안 뜨고.
[박서연] Supabase Storage 기본 제한이 50MB인데... 아 Next.js API Route body 크기 제한이 4MB이네요. serverless 환경이라.
[이민호] 세 번째 — 매칭 필터에서 "가격대" 필터가 적용이 안 돼요. 아무 값 넣어도 전체 목록 나옴.
[박서연] 그건 제가 가격 필드를 아직 인덱싱 안 해서... 금방 고칩니다.
[김하늘] UI 관련 이슈도 있어요. 트레이너 카드 리스트에서 스크롤이 끝까지 안 내려가요. 마지막 3개가 잘려요. 그리고 다크모드에서 뱃지 텍스트가 안 보여요.
[정우진] 런칭 가능한 상태인가요? 솔직하게.
[박서연] 크리티컬 3개는 2일이면 고칠 수 있어요. 나머지는 런칭 후에도 가능하고.
[이민호] 저는 일정 연기를 추천합니다. 크리티컬 고치고 한 번 더 QA 돌리면 최소 3일.
[정우진] ...알겠어요. 런칭일 3일 연기합시다. 버그 있는 상태로 나가면 트레이너들 첫인상 망해요.`,
      transcriptSegments: [
        { speaker: 'Speaker D', text: 'QA 결과. 34개 중 실패 13개, 크리티컬 3개.', start: 0, end: 8 },
        { speaker: 'Speaker D', text: '카카오 소셜 로그인 iOS Safari 불가, 이미지 업로드 5MB 무한로딩, 가격 필터 미작동.', start: 9, end: 22 },
        { speaker: 'Speaker B', text: '크리티컬 3개는 2일이면 고칠 수 있어요.', start: 23, end: 30 },
        { speaker: 'Speaker A', text: '런칭일 3일 연기합시다. 버그 있는 상태로 나가면 트레이너들 첫인상 망해요.', start: 31, end: 40 },
      ],
      summary: 'QA 리뷰. 34개 중 13개 실패, 크리티컬 3개 (iOS Safari 로그인, 이미지 업로드, 가격 필터). 런칭 3일 연기 결정.',
      keywords: ['QA', '버그', 'Safari', '업로드', '런칭연기'], issues: [{ title: 'iOS Safari 로그인' }, { title: '이미지 업로드 제한' }, { title: '런칭 일정' }],
    },
    // 10. 스프린트 회고 — 런칭 연기, 피벗 논의
    {
      id: 'src-10', code: 'MTG-010', title: '6주 스프린트 회고 — 런칭 연기 & 피벗 논의',
      date: date(1), duration_seconds: 3600, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[이민호] 6주 스프린트 회고합니다. 결론부터 말하면 베타 런칭은 1주 추가 연기를 제안합니다.
[정우진] 또요? 이미 3일 연기했는데.
[이민호] 크리티컬 버그 3개는 고쳤어요. 근데 트레이너 온보딩 플로우 테스트를 실제 트레이너한테 해봤는데, 프로필 등록이 너무 복잡하다는 피드백이 왔어요. 자격증 인증, 사진 5장, 자기소개, 전문분야, 가격표... 15분 걸려요.
[김하늘] 아... 제가 너무 많은 정보를 한 번에 받으려고 했네요.
[정우진] 트레이너가 15분 동안 폼 채울 리가 없잖아.
[김하늘] 프로필 등록을 3단계로 쪼개면요? 1단계 필수 — 이름, 사진 1장, 전문분야. 2단계 선택 — 나머지. 3단계 — 자격증 인증은 나중에.
[박서연] 그게 나아요. 일단 최소 정보로 프로필 만들고, 점진적으로 채우게.
[정우진] 좋아요. 근데 진짜 고민인 건... 매칭 플랫폼보다 트레이너 SaaS로 먼저 가야 하는 거 아닌가 하는 생각이 들어요.
[이민호] 무슨 말이에요?
[정우진] 투자자 피드백에서도 리텐션이 핵심이라고 했고, 트레이너 인터뷰에서도 고객 관리 도구를 제일 원하잖아. 매칭보다 SaaS를 먼저 주고, 트레이너가 모이면 자연스럽게 매칭이 되는 구조가 맞지 않나?
[박서연] 그건... 비즈니스 모델 자체가 바뀌는 건데요. SaaS 월 구독이냐, 매칭 수수료냐.
[정우진] 둘 다 할 수 있지 않나? 기본 SaaS는 무료, 매칭 프리미엄은 유료.
[이민호] 프리미엄 모델이네. 일단 지금 개발된 매칭 기능은 그대로 두고, 트레이너 대시보드를 더 강화해서 나가는 건 어때요?
[김하늘] 찬성. 트레이너가 매일 쓰는 도구가 되면 자연스럽게 매칭도 활성화될 거예요.
[박서연] 대시보드에 일정 관리, 고객 메모 정도만 추가하면 되니까 1주면 가능해요.
[정우진] 그러면 1주 연기하고, 그 동안 온보딩 간소화 + 대시보드 강화. 최종 베타 런칭은 다음 주 수요일.
[이민호] Good/Bad 짚고 갈게요. Good — Supabase 전환 결정이 신의 한 수였어요. 매칭 필터, 대시보드 쿼리 다 편해졌고. Bad — Firebase 2주 날린 건 초기 기술 검증이 부족했던 거. 그리고 스코프 관리가 계속 흔들렸어요.
[박서연] 개발 속도는 나쁘지 않았어요. 문제는 방향이 계속 바뀐 거지.
[정우진] 인정합니다. 다음 스프린트부터는 2주 단위 스코프 프리징 합시다. 중간에 바꾸지 말고.`,
      transcriptSegments: [
        { speaker: 'Speaker D', text: '6주 스프린트 회고. 베타 런칭 1주 추가 연기 제안.', start: 0, end: 8 },
        { speaker: 'Speaker D', text: '트레이너 온보딩 15분 걸림. 너무 복잡.', start: 9, end: 16 },
        { speaker: 'Speaker C', text: '프로필 등록 3단계 분리 제안.', start: 17, end: 22 },
        { speaker: 'Speaker A', text: '매칭보다 트레이너 SaaS를 먼저 가야 하는 거 아닌가.', start: 23, end: 32 },
        { speaker: 'Speaker D', text: 'Good — Supabase 전환. Bad — Firebase 2주 낭비, 스코프 흔들림.', start: 33, end: 42 },
        { speaker: 'Speaker A', text: '다음 스프린트부터 2주 단위 스코프 프리징.', start: 43, end: 48 },
      ],
      summary: '스프린트 회고. 베타 1주 추가 연기. 온보딩 3단계 간소화. SaaS 중심 피벗 논의 — 무료 SaaS + 유료 매칭 프리미엄 모델. 2주 단위 스코프 프리징 도입.',
      keywords: ['회고', '피벗', 'SaaS', '온보딩', '스코프프리징'], issues: [{ title: '비즈니스 모델 피벗' }, { title: '런칭 일정' }, { title: '프로세스 개선' }],
    },
  ]

  const decisions = [
    // MTG-001 킥오프
    { id: 'dec-1', meetingId: 'src-1', code: 'DEC-001', title: '트레이너 매칭 중심 MVP (예약/결제는 v2)', rationale: '6주에 매칭+예약은 불가. 매칭이 핵심 고통점.', area: 'planning', status: 'confirmed', proposedBy: '정우진 CEO', createdAt: date(42) },
    { id: 'dec-2', meetingId: 'src-1', code: 'DEC-002', title: 'Next.js + Firebase 기술 스택', rationale: 'Auth, Firestore, Storage 통합으로 빠른 개발', area: 'dev', status: 'changed', proposedBy: '박서연 CTO', createdAt: date(42) },
    { id: 'dec-3', meetingId: 'src-1', code: 'DEC-003', title: '모바일 퍼스트 웹 (앱 없이)', rationale: '헬스장에서 폰으로 사용. React Native 시간 부족.', area: 'design', status: 'confirmed', proposedBy: '김하늘 디자이너', createdAt: date(42) },

    // SRC-002 결제 슬랙
    { id: 'dec-4', meetingId: 'src-2', code: 'DEC-004', title: '아임포트(포트원) 결제 시스템 채택', rationale: '사업자등록 전 테스트 모드 가능. 다중 PG 통합.', area: 'dev', status: 'pending', proposedBy: '박서연 CTO', createdAt: date(36) },
    { id: 'dec-5', meetingId: 'src-2', code: 'DEC-005', title: '인앱 바텀시트 결제 UI', rationale: '리다이렉트 방식 이탈률 높음. 아임포트 v2 SDK 지원.', area: 'design', status: 'pending', proposedBy: '김하늘 디자이너', createdAt: date(36) },

    // MTG-003 디자인 리뷰
    { id: 'dec-6', meetingId: 'src-3', code: 'DEC-006', title: '트레이너 프로필 절충안 — 사진 + 지표 뱃지', rationale: '사진만으로는 퀄리티 불균형. 경력/평점/수업횟수 뱃지로 신뢰도 보완.', area: 'design', status: 'confirmed', proposedBy: '김하늘 디자이너', createdAt: date(30) },
    { id: 'dec-7', meetingId: 'src-3', code: 'DEC-007', title: '초기 리뷰 없는 트레이너에 "신규" 뱃지', rationale: '콜드 스타트 문제 해결. 얼리어답터 어필.', area: 'design', status: 'confirmed', proposedBy: '김하늘 디자이너', createdAt: date(30) },

    // SRC-004 시장 조사
    { id: 'dec-8', meetingId: 'src-4', code: 'DEC-008', title: '서울 강남/마포 지역 집중 런칭', rationale: 'PT 수요 밀집 지역. 6개월 트레이너 500명 목표.', area: 'planning', status: 'confirmed', proposedBy: '이민호 PM', createdAt: date(25) },

    // SRC-005 투자자 피드백
    { id: 'dec-9', meetingId: 'src-5', code: 'DEC-009', title: '트레이너 리텐션을 핵심 KPI로', rationale: '투자자 피드백 — 직거래 이탈이 업계 공통 문제. MAU보다 트레이너 활성률 추적.', area: 'planning', status: 'confirmed', proposedBy: '정우진 CEO', createdAt: date(20) },
    { id: 'dec-10', meetingId: 'src-5', code: 'DEC-010', title: '트레이너 SaaS 도구로 리텐션 확보', rationale: '플랫폼에 남을 이유 = 고객관리/일정관리 도구.', area: 'planning', status: 'confirmed', proposedBy: '정우진 CEO', createdAt: date(20) },

    // SRC-006 트레이너 인터뷰
    { id: 'dec-11', meetingId: 'src-6', code: 'DEC-011', title: '수수료 10% 이하 책정', rationale: '트레이너 5명 중 4명이 30% 이상이면 안 쓴다고. 숨고 사례.', area: 'planning', status: 'confirmed', proposedBy: '정우진 CEO', createdAt: date(16) },
    { id: 'dec-12', meetingId: 'src-6', code: 'DEC-012', title: 'MVP에 트레이너 대시보드 포함', rationale: '고객관리 니즈 5/5명 공통. 온보딩 핵심 무기.', area: 'planning', status: 'confirmed', proposedBy: '김하늘 디자이너', createdAt: date(16) },

    // MTG-007 Firebase→Supabase
    { id: 'dec-13', meetingId: 'src-7', code: 'DEC-013', title: 'Firebase → Supabase 전환', rationale: '복합 쿼리, 정산 집계, RLS 보안. Firestore 한계.', area: 'dev', status: 'confirmed', proposedBy: '박서연 CTO', createdAt: date(12) },
    { id: 'dec-14', meetingId: 'src-7', code: 'DEC-014', title: 'Supabase Auth + RLS 보안 모델', rationale: '카카오/구글 소셜 로그인 지원. Row Level Security로 데이터 보호.', area: 'dev', status: 'confirmed', proposedBy: '박서연 CTO', createdAt: date(12) },

    // SRC-008 채팅 스코프
    { id: 'dec-15', meetingId: 'src-8', code: 'DEC-015', title: '최소 채팅 — 텍스트 전용, 읽음표시 없음', rationale: '개발 리소스 한계. Supabase Realtime 활용. 읽음표시 상태관리 복잡.', area: 'dev', status: 'confirmed', proposedBy: '박서연 CTO', createdAt: date(8) },

    // MTG-009 QA 리뷰
    { id: 'dec-16', meetingId: 'src-9', code: 'DEC-016', title: '베타 런칭 3일 연기', rationale: '크리티컬 버그 3개. 트레이너 첫인상 중요.', area: 'planning', status: 'changed', proposedBy: '이민호 PM', createdAt: date(4) },

    // MTG-010 스프린트 회고
    { id: 'dec-17', meetingId: 'src-10', code: 'DEC-017', title: '베타 런칭 1주 추가 연기 + 온보딩 간소화', rationale: '트레이너 온보딩 15분은 치명적. 3단계 분리 필요.', area: 'planning', status: 'confirmed', proposedBy: '이민호 PM', createdAt: date(1) },
    { id: 'dec-18', meetingId: 'src-10', code: 'DEC-018', title: 'SaaS 중심 피벗 — 무료 SaaS + 유료 매칭', rationale: '트레이너 도구 먼저 → 자연스러운 매칭 활성화. 프리미엄 모델.', area: 'planning', status: 'pending', proposedBy: '정우진 CEO', createdAt: date(1) },
    { id: 'dec-19', meetingId: 'src-10', code: 'DEC-019', title: '2주 단위 스코프 프리징 도입', rationale: '스프린트 내 방향 변경이 잦아 개발 효율 저하.', area: 'planning', status: 'confirmed', proposedBy: '정우진 CEO', createdAt: date(1) },
    { id: 'dec-20', meetingId: 'src-10', code: 'DEC-020', title: '프로필 등록 3단계 분리', rationale: '1단계 필수(이름/사진/분야) → 2단계 선택 → 3단계 자격증. 점진적 온보딩.', area: 'design', status: 'confirmed', proposedBy: '김하늘 디자이너', createdAt: date(1) },
  ]

  const tasks = [
    // 킥오프 (src-1)
    { id: 'task-1', meetingId: 'src-1', title: 'Next.js 프로젝트 초기 세팅 (TypeScript, Tailwind)', assignee: '박서연 CTO', done: true, createdAt: date(42) },
    { id: 'task-2', meetingId: 'src-1', title: 'Figma 디자인 시스템 + 모바일 프레임 설정', assignee: '김하늘 디자이너', done: true, createdAt: date(42) },
    { id: 'task-3', meetingId: 'src-1', title: '비즈니스 모델 캔버스 + 경쟁 분석 초안', assignee: '정우진 CEO', done: true, createdAt: date(42) },
    { id: 'task-4', meetingId: 'src-1', title: '6주 스프린트 마일스톤 수립', assignee: '이민호 PM', done: true, createdAt: date(42) },

    // 결제 슬랙 (src-2) — Slack 연동
    { id: 'task-5', meetingId: 'src-2', title: '아임포트 v2 SDK 테스트 모드 PoC', assignee: '박서연 CTO', done: false, createdAt: date(36) },
    { id: 'task-5a', meetingId: 'src-2', title: '결제 플로우 와이어프레임 (v2 대비)', assignee: '김하늘 디자이너', done: true, createdAt: date(35) },
    { id: 'task-5b', meetingId: 'src-2', title: 'PG사별 수수료 비교표 정리', assignee: '이민호 PM', done: true, createdAt: date(35) },

    // 디자인 리뷰 (src-3)
    { id: 'task-6', meetingId: 'src-3', title: '트레이너 프로필 카드 UI 시안 (절충안)', assignee: '김하늘 디자이너', done: true, createdAt: date(30) },
    { id: 'task-7', meetingId: 'src-3', title: '트레이너 프로필 상세 페이지 디자인', assignee: '김하늘 디자이너', done: true, createdAt: date(30) },
    { id: 'task-8', meetingId: 'src-3', title: '"신규 트레이너" 뱃지 컴포넌트 개발', assignee: '박서연 CTO', done: true, createdAt: date(30) },

    // 시장 조사 노션 (src-4) — Notion 연동
    { id: 'task-9', meetingId: 'src-4', title: '경쟁사 기능 비교표 작성 (클래스패스/숨고/카카오)', assignee: '이민호 PM', done: true, createdAt: date(25) },
    { id: 'task-10', meetingId: 'src-4', title: '강남/마포 트레이너 온보딩 리드 리스트 100명', assignee: '정우진 CEO', done: true, createdAt: date(25) },
    { id: 'task-10a', meetingId: 'src-4', title: 'Notion에 경쟁사 분석 위키 페이지 생성', assignee: '이민호 PM', done: true, createdAt: date(24) },
    { id: 'task-10b', meetingId: 'src-4', title: 'TAM/SAM/SOM 시장 규모 슬라이드 작성', assignee: '정우진 CEO', done: true, createdAt: date(24) },
    { id: 'task-10c', meetingId: 'src-4', title: '클래스패스 철수 원인 분석 노션 정리', assignee: '이민호 PM', done: true, createdAt: date(23) },

    // 투자자 피드백 통화 (src-5) — 통화 연동
    { id: 'task-11', meetingId: 'src-5', title: '시드 데크에 리텐션 전략 섹션 추가', assignee: '정우진 CEO', done: true, createdAt: date(20) },
    { id: 'task-12', meetingId: 'src-5', title: '트레이너 활성률 지표 정의 + 대시보드 기획', assignee: '이민호 PM', done: true, createdAt: date(20) },
    { id: 'task-12a', meetingId: 'src-5', title: '직거래 이탈 방지 시나리오 3개 정리', assignee: '정우진 CEO', done: true, createdAt: date(19) },
    { id: 'task-12b', meetingId: 'src-5', title: '시리즈 A 기준 KPI 대시보드 Notion 페이지', assignee: '이민호 PM', done: false, createdAt: date(19) },

    // 트레이너 인터뷰 이메일 (src-6) — 이메일 연동
    { id: 'task-13', meetingId: 'src-6', title: '트레이너 대시보드 와이어프레임', assignee: '김하늘 디자이너', done: true, createdAt: date(16) },
    { id: 'task-14', meetingId: 'src-6', title: '트레이너 일정 관리 캘린더 UI', assignee: '김하늘 디자이너', done: true, createdAt: date(16) },
    { id: 'task-15', meetingId: 'src-6', title: '수수료 구조 시뮬레이션 (5%/8%/10% 시나리오)', assignee: '정우진 CEO', done: false, createdAt: date(16) },
    { id: 'task-15a', meetingId: 'src-6', title: '인터뷰 결과 Notion 위키 정리', assignee: '김하늘 디자이너', done: true, createdAt: date(15) },
    { id: 'task-15b', meetingId: 'src-6', title: '트레이너 페르소나 3유형 정의', assignee: '이민호 PM', done: true, createdAt: date(15) },
    { id: 'task-15c', meetingId: 'src-6', title: '온보딩 이메일 시퀀스 초안 작성', assignee: '정우진 CEO', done: false, createdAt: date(14) },

    // Firebase→Supabase (src-7)
    { id: 'task-16', meetingId: 'src-7', title: 'Supabase 프로젝트 생성 + 스키마 설계', assignee: '박서연 CTO', done: true, createdAt: date(12) },
    { id: 'task-17', meetingId: 'src-7', title: 'Firebase Auth → Supabase Auth 마이그레이션', assignee: '박서연 CTO', done: true, createdAt: date(12) },
    { id: 'task-18', meetingId: 'src-7', title: 'Firestore → PostgreSQL 데이터 스키마 전환', assignee: '박서연 CTO', done: true, createdAt: date(12) },
    { id: 'task-19', meetingId: 'src-7', title: 'RLS 정책 설정 (트레이너/회원 역할)', assignee: '박서연 CTO', done: true, createdAt: date(12) },

    // 채팅 스코프 슬랙 (src-8) — Slack 연동
    { id: 'task-20', meetingId: 'src-8', title: 'Supabase Realtime 채팅 구현 (텍스트 전용)', assignee: '박서연 CTO', done: true, createdAt: date(8) },
    { id: 'task-21', meetingId: 'src-8', title: '채팅 UI 디자인 (카카오톡 스타일)', assignee: '김하늘 디자이너', done: true, createdAt: date(8) },
    { id: 'task-21a', meetingId: 'src-8', title: '채팅 알림 로직 설계', assignee: '박서연 CTO', done: false, createdAt: date(7) },
    { id: 'task-21b', meetingId: 'src-8', title: '채팅 입력 컴포넌트 Figma 디자인', assignee: '김하늘 디자이너', done: true, createdAt: date(7) },

    // QA (src-9)
    { id: 'task-22', meetingId: 'src-9', title: 'iOS Safari 카카오 로그인 버그 수정', assignee: '박서연 CTO', done: true, createdAt: date(4) },
    { id: 'task-23', meetingId: 'src-9', title: '이미지 업로드 5MB 제한 에러 핸들링', assignee: '박서연 CTO', done: true, createdAt: date(4) },
    { id: 'task-24', meetingId: 'src-9', title: '매칭 필터 가격대 인덱싱 + 쿼리 수정', assignee: '박서연 CTO', done: true, createdAt: date(4) },

    // 스프린트 회고 (src-10)
    { id: 'task-25', meetingId: 'src-10', title: '온보딩 3단계 분리 리디자인', assignee: '김하늘 디자이너', done: false, createdAt: date(1) },
    { id: 'task-25a', meetingId: 'src-10', title: 'SaaS 피벗 비즈니스 모델 캔버스 수정', assignee: '정우진 CEO', done: false, createdAt: date(1) },
    { id: 'task-25b', meetingId: 'src-10', title: '트레이너 대시보드 일정관리 + 고객메모 개발', assignee: '박서연 CTO', done: false, createdAt: date(1) },
    { id: 'task-25c', meetingId: 'src-10', title: '2주 스코프 프리징 프로세스 Notion 템플릿', assignee: '이민호 PM', done: false, createdAt: date(1) },
  ]

  const rejected = [
    // 킥오프 — 예약 시스템
    { id: 'rej-1', meetingId: 'src-1', title: 'MVP에 예약+결제 시스템 포함', reason: '6주에 매칭+예약 동시 개발 불가. 매칭이 핵심 고통점이므로 예약은 v2로.', relatedDecision: '트레이너 매칭 중심 MVP (예약/결제는 v2)', proposedBy: '정우진 CEO' },
    // 결제
    { id: 'rej-2', meetingId: 'src-2', title: '토스페이먼츠 직접 연동', reason: '사업자등록 전 테스트 불가, 심사 2주 소요. 아임포트가 테스트 모드 즉시 가능.', relatedDecision: '아임포트(포트원) 결제 시스템 채택', proposedBy: '정우진 CEO' },
    // 디자인
    { id: 'rej-3', meetingId: 'src-3', title: '프로필 사진 중심 디자인 (A안)', reason: '트레이너 사진 퀄리티 격차가 커서 플랫폼 일관성 훼손. 전문 촬영 제공할 리소스 없음.', relatedDecision: '트레이너 프로필 절충안 — 사진 + 지표 뱃지', proposedBy: '김하늘 디자이너' },
    // 기술 스택
    { id: 'rej-4', meetingId: 'src-7', title: 'Firebase 유지', reason: 'Firestore 복합 쿼리 한계, 정산 집계 불가, RLS 없음. 트레이너 SaaS 기능 확장에 부적합.', relatedDecision: 'Firebase → Supabase 전환', proposedBy: '박서연 CTO' },
    // 채팅
    { id: 'rej-5', meetingId: 'src-8', title: '카카오톡 채널 연결로 채팅 대체', reason: '플랫폼 이탈 → 직거래 리스크. 리텐션 지표에 치명적.', relatedDecision: '최소 채팅 — 텍스트 전용, 읽음표시 없음', proposedBy: '정우진 CEO' },
    // 피벗
    { id: 'rej-6', meetingId: 'src-10', title: '매칭 플랫폼 모델 유지 (SaaS 없이)', reason: '트레이너 리텐션 확보 수단 부재. 직거래 이탈 방지 불가. 인터뷰 + 투자자 피드백 일치.', relatedDecision: 'SaaS 중심 피벗 — 무료 SaaS + 유료 매칭', proposedBy: '정우진 CEO' },
  ]

  return NextResponse.json({ meetings, decisions, tasks, rejected })
}

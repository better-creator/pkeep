import { NextResponse } from 'next/server'

// POST /api/seed — 글로우업 코스메틱 S/S 시즌 캠페인 (OTV 스튜디오)
export async function POST() {
  const now = new Date()
  const date = (daysAgo: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  const meetings = [
    // 1. 킥오프 미팅
    {
      id: 'src-1', code: 'M-001', title: '킥오프 미팅 — 브랜드 방향, 타겟, 톤앤매너',
      date: '2026-03-01', duration_seconds: 3600, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[금민주] 오늘부터 글로우업 코스메틱 S/S 캠페인 공식 시작합니다. 인스타그램, 유튜브, 옥외광고, D2C앱 이벤트까지 4개 채널 동시 진행이에요.
[정하은] 이번 시즌 키 메시지는 "매일이 빛나는 순간"으로 가고 싶어요. 일상 속 자연스러운 글로우업을 강조하는 거죠.
[금민주] 좋아요. 톤앤매너는 어떻게 잡을까요?
[최예린] 친근하지만 세련된 느낌으로요. 너무 하이엔드로 가면 타겟인 25-35 여성이 거리감 느끼고, 너무 캐주얼하면 브랜드 가치가 안 살아요.
[박서연] 비주얼 톤도 맞춰야 하는데, 메인 컬러는 어떻게 할까요? 지난 시즌에는 핑크 계열이었잖아요.
[정하은] 이번엔 코랄 오렌지 계열로 가고 싶어요. 봄 시즌에 맞고, 경쟁사들이 핑크에 몰려 있어서 차별화도 되고요.
[금민주] 코랄 오렌지 좋네요. 구체적인 컬러값은 디자인 리뷰 때 확정하죠. 그리고 D2C 앱 이벤트도 이번에 처음 하는 건데, 플레이팩토리랑 게임 콜라보로 진행합니다.
[정하은] 게임 콜라보라니 재밌겠네요. 타겟층이 좋아할 것 같아요.`,
      transcriptSegments: [
        { speaker: 'Speaker A', text: '글로우업 코스메틱 S/S 캠페인 공식 시작. 4개 채널 동시 진행.', start: 0, end: 10 },
        { speaker: 'Speaker C', text: '키 메시지 "매일이 빛나는 순간". 일상 속 자연스러운 글로우업.', start: 11, end: 20 },
        { speaker: 'Speaker F', text: '친근하지만 세련된 톤앤매너. 25-35 타겟.', start: 21, end: 28 },
        { speaker: 'Speaker C', text: '코랄 오렌지 계열 메인 컬러 제안.', start: 29, end: 36 },
        { speaker: 'Speaker A', text: 'D2C 앱 이벤트 — 플레이팩토리 게임 콜라보.', start: 37, end: 44 },
      ],
      summary: '킥오프. S/S 캠페인 방향 확정. 키 메시지 "매일이 빛나는 순간". 톤앤매너 친근+세련. 메인 컬러 코랄 오렌지 계열. 4개 채널(인스타/유튜브/옥외/D2C앱) 동시 진행.',
      keywords: ['킥오프', 'S/S캠페인', '톤앤매너', '코랄오렌지', 'D2C'], issues: [{ title: '메인 컬러 확정 필요' }, { title: 'D2C 앱 이벤트 기획' }],
    },
    // 2. 디자인 리뷰
    {
      id: 'src-2', code: 'M-002', title: '디자인 리뷰 — 시안 검토, 컬러 확정, 촬영 가이드',
      date: '2026-03-10', duration_seconds: 2700, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[박서연] 인스타 피드 시안 2차 공유합니다. 코랄 오렌지 #E8734A를 메인으로, 서브 컬러 아이보리 #FFF5E6으로 잡았어요.
[정하은] 오 좋아요. 근데 피드 정사각형 비율에서 여백이 너무 좁아요. 제품이 답답하게 보여요.
[박서연] 여백 8%로 늘릴게요. 그러면 좀 더 호흡이 생기죠.
[금민주] 컬러는 이걸로 확정하죠. #E8734A 코랄 오렌지. 모든 채널에 동일하게 적용합니다.
[한지우] 제품 촬영 가이드도 얘기해야 해요. 화이트 배경에 좌측 45도 라이팅으로 통일하면 피드 일관성이 나와요.
[금민주] 좋습니다. 촬영 가이드 문서 한지우 씨가 정리해주세요. 모델 촬영 보정 방향도 잡아야 하는데, 피부 톤 따뜻하게 하되 과보정은 안 돼요.
[한지우] 네, 자연스러운 글로우 느낌이 핵심이니까요. 그리고 제품 패키지 클로즈업은 매크로 렌즈 필수입니다. 질감이 살아야 해요.
[정하은] 동의해요. 이전 시즌에 일반 렌즈로 찍었을 때 패키지 디테일이 안 살았거든요.`,
      transcriptSegments: [
        { speaker: 'Speaker B', text: '코랄 오렌지 #E8734A 메인, 서브 아이보리 #FFF5E6.', start: 0, end: 8 },
        { speaker: 'Speaker C', text: '피드 여백이 너무 좁아요. 제품이 답답해 보여요.', start: 9, end: 16 },
        { speaker: 'Speaker A', text: '컬러 #E8734A 확정. 모든 채널 동일 적용.', start: 17, end: 24 },
        { speaker: 'Speaker D', text: '화이트 배경 + 좌측 45도 라이팅 통일.', start: 25, end: 32 },
        { speaker: 'Speaker D', text: '제품 패키지 클로즈업은 매크로 렌즈 필수.', start: 33, end: 40 },
      ],
      summary: '디자인 리뷰. 메인 컬러 코랄 오렌지 #E8734A 확정. 인스타 피드 여백 8%. 제품 촬영 가이드 — 화이트 배경, 좌측 45도 라이팅. 모델 보정 자연스럽게, 과보정 금지. 패키지 클로즈업 매크로 렌즈.',
      keywords: ['디자인리뷰', '컬러확정', '촬영가이드', '코랄오렌지', '매크로렌즈'], issues: [{ title: '인스타 피드 여백 조정' }, { title: '촬영 가이드 문서화' }],
    },
    // 3. 채널 전략 회의
    {
      id: 'src-3', code: 'M-003', title: '채널 전략 회의 — 인스타/유튜브/옥외 채널별 가이드',
      date: '2026-03-18', duration_seconds: 3000, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[금민주] 오늘은 채널별 콘텐츠 전략 확정합니다. 인스타, 유튜브, 옥외 각각 톤과 포맷을 정해야 해요.
[최예린] 인스타는 캐주얼하고 친근한 톤이 맞아요. 릴스 중심으로 가되, 피드는 정사각형 1:1로요.
[오태현] 유튜브는 정보 전달 중심이니까 좀 더 차분한 톤이 필요해요. 본편 러닝타임은 3분 이내로 하고, 자막은 흰색에 반투명 배경으로 가독성 확보하면 좋겠어요.
[금민주] 인스타와 유튜브 톤이 좀 다른데 괜찮을까요?
[최예린] 채널 특성이 다르니까 괜찮아요. 핵심 메시지와 컬러만 통일하면 됩니다.
[금민주] 옥외는 프린트웍스에서 진행하는데, 카피가 중요해요.
[최예린] 메인 카피 "매일이 빛나는 순간"으로 가되, 옥외에서는 짧고 강렬하게요. 서브 카피 후보도 3안 정도 준비할게요.
[오태현] 유튜브 15초 컷도 별도로 편집해야 해요. 본편에서 잘라내는 게 아니라 처음부터 15초용으로 구성해야 임팩트가 있어요.
[금민주] 릴스 BGM은 저작권 프리 어쿠스틱으로 갈게요. 분위기 맞으면서 리스크 없이.
[한지우] 유튜브 썸네일 A/B 테스트도 해야 해요. 제품 중심 vs 모델 중심으로 2안 만들어서 비교하죠.
[박서연] 옥외 시안은 버스쉘터 사이즈별로 따로 만들어야 해요. 가로형이랑 세로형 비율이 다르니까.`,
      transcriptSegments: [
        { speaker: 'Speaker A', text: '채널별 콘텐츠 전략 확정. 인스타/유튜브/옥외.', start: 0, end: 8 },
        { speaker: 'Speaker F', text: '인스타 캐주얼 톤, 릴스 중심. 피드 1:1.', start: 9, end: 16 },
        { speaker: 'Speaker E', text: '유튜브 정보 전달 톤. 3분 이내. 자막 흰색+반투명 배경.', start: 17, end: 26 },
        { speaker: 'Speaker F', text: '옥외 카피 "매일이 빛나는 순간". 서브 카피 3안 준비.', start: 27, end: 34 },
        { speaker: 'Speaker E', text: '유튜브 15초 컷 별도 편집. 처음부터 15초용 구성.', start: 35, end: 42 },
      ],
      summary: '채널 전략 확정. 인스타 — 캐주얼 톤, 릴스/피드 1:1. 유튜브 — 정보 전달 톤, 3분 이내, 흰색 자막. 옥외 — 짧고 강렬한 카피. 15초 컷 별도 편집. 릴스 BGM 저작권 프리 어쿠스틱.',
      keywords: ['채널전략', '인스타', '유튜브', '옥외', '릴스'], issues: [{ title: '인스타 vs 유튜브 톤 차이' }, { title: '옥외 사이즈별 시안' }],
    },
    // 4. 촬영 리뷰
    {
      id: 'src-4', code: 'M-004', title: '촬영 리뷰 — 촬영본 검토, 보정 방향',
      date: '2026-03-25', duration_seconds: 2400, source: 'recording', sourceType: 'meeting', language: 'ko',
      transcriptText: `[한지우] 스튜디오 블랑에서 촬영한 제품컷이랑 모델컷 1차 검토합니다. 전체 200컷 중 A급 선별 40컷이에요.
[정하은] 제품컷은 전반적으로 좋은데, 3번 립스틱 컷에서 코랄 오렌지가 좀 붉게 나왔어요. 실물이랑 차이가 있어요.
[한지우] 화이트밸런스 조정하면 됩니다. 보정 때 코랄 톤으로 맞출게요.
[금민주] 모델 보정은 피부 톤 따뜻하게 하되, 과보정 절대 안 돼요. 자연스러운 글로우가 이번 캠페인 핵심이에요.
[한지우] 네, 피부결은 살리면서 톤만 따뜻하게요. 잡티 제거 정도만 하고, 피부 질감 자체는 유지합니다.
[오태현] 영상도 같은 기조로 가야 해요. 모션랩에서 편집할 때 컬러 그레이딩 기준을 맞춰야 합니다.
[정하은] 패키지 클로즈업은 매크로 렌즈로 찍은 거 맞죠? 질감이 잘 살아있네요. 이건 그대로 쓸 수 있겠어요.
[한지우] 네, 매크로 렌즈로 찍었어요. 패키지 각인이랑 텍스처가 선명하게 나왔습니다.`,
      transcriptSegments: [
        { speaker: 'Speaker D', text: '스튜디오 블랑 촬영본 1차 검토. 200컷 중 A급 40컷.', start: 0, end: 8 },
        { speaker: 'Speaker C', text: '립스틱 컷 코랄 오렌지가 붉게 나옴. 실물 차이.', start: 9, end: 16 },
        { speaker: 'Speaker A', text: '모델 보정 — 피부 톤 따뜻하게, 과보정 금지. 자연스러운 글로우.', start: 17, end: 26 },
        { speaker: 'Speaker D', text: '피부결 살리고 톤만 따뜻하게. 잡티 제거 정도.', start: 27, end: 34 },
        { speaker: 'Speaker E', text: '영상 컬러 그레이딩도 같은 기조.', start: 35, end: 40 },
      ],
      summary: '촬영 리뷰. 제품컷 전반 양호, 립스틱 컷 컬러 보정 필요. 모델 보정 — 피부 톤 따뜻하게, 과보정 금지, 피부결 유지. 패키지 매크로 렌즈 촬영 양호. 영상 컬러 그레이딩 기준 통일.',
      keywords: ['촬영리뷰', '보정방향', '컬러보정', '매크로렌즈', '컬러그레이딩'], issues: [{ title: '립스틱 컷 컬러 보정' }, { title: '영상 컬러 그레이딩 기준' }],
    },
  ]

  const decisions = [
    // M-001 킥오프
    { id: 'dec-1', meetingId: 'src-1', code: 'DEC-001', title: '메인 컬러 코랄 오렌지(#E8734A) 확정', rationale: '봄 시즌에 맞고, 경쟁사 핑크 대비 차별화. 전 채널 통일 적용.', area: '컬러', status: 'confirmed', proposedBy: '금민주', createdAt: '2026-03-01' },
    { id: 'dec-6', meetingId: 'src-1', code: 'DEC-006', title: '톤앤매너 — 친근하지만 세련된', rationale: '25-35 타겟 여성. 하이엔드는 거리감, 캐주얼은 브랜드 가치 하락.', area: '브랜딩', status: 'confirmed', proposedBy: '최예린', createdAt: '2026-03-01' },

    // M-002 디자인 리뷰
    { id: 'dec-2', meetingId: 'src-2', code: 'DEC-002', title: '제품 촬영 — 화이트 배경 + 좌측 45도 라이팅', rationale: '피드 일관성 확보. 스튜디오 블랑 촬영 기준으로 통일.', area: '촬영', status: 'confirmed', proposedBy: '한지우', createdAt: '2026-03-10' },
    { id: 'dec-3', meetingId: 'src-2', code: 'DEC-003', title: '인스타 피드 정사각형 1:1, 여백 8%', rationale: '제품이 답답하게 보이는 문제 해결. 호흡 있는 레이아웃.', area: '채널', status: 'confirmed', proposedBy: '박서연', createdAt: '2026-03-10' },
    { id: 'dec-7', meetingId: 'src-2', code: 'DEC-007', title: '모델 촬영 보정 — 피부 톤 따뜻하게, 과보정 금지', rationale: '자연스러운 글로우가 캠페인 핵심. 피부결 유지, 잡티 제거 정도만.', area: '촬영', status: 'confirmed', proposedBy: '금민주', createdAt: '2026-03-10' },
    { id: 'dec-8', meetingId: 'src-2', code: 'DEC-008', title: '제품 패키지 클로즈업 — 매크로 렌즈 필수', rationale: '이전 시즌 일반 렌즈로 패키지 디테일 미흡. 질감 살리기 위해 매크로 필수.', area: '촬영', status: 'confirmed', proposedBy: '한지우', createdAt: '2026-03-10' },

    // M-003 채널 전략
    { id: 'dec-4', meetingId: 'src-3', code: 'DEC-004', title: '유튜브 자막 — 흰색 + 반투명 배경', rationale: '가독성 확보. 영상 톤을 해치지 않는 자막 디자인.', area: '채널', status: 'pending', proposedBy: '오태현', createdAt: '2026-03-18' },
    { id: 'dec-5', meetingId: 'src-3', code: 'DEC-005', title: '옥외 카피 "매일이 빛나는 순간"', rationale: '캠페인 키 메시지. 옥외에서 짧고 강렬하게 전달.', area: '카피', status: 'pending', proposedBy: '최예린', createdAt: '2026-03-18' },
    { id: 'dec-9', meetingId: 'src-3', code: 'DEC-009', title: '인스타 릴스 BGM — 저작권 프리 어쿠스틱', rationale: '브랜드 분위기에 맞으면서 저작권 리스크 없는 BGM.', area: '채널', status: 'pending', proposedBy: '금민주', createdAt: '2026-03-18' },
    { id: 'dec-10', meetingId: 'src-3', code: 'DEC-010', title: '유튜브 본편 러닝타임 3분 이내', rationale: '정보 전달 효율. 3분 초과 시 이탈률 급증.', area: '채널', status: 'confirmed', proposedBy: '오태현', createdAt: '2026-03-18' },
  ]

  const tasks = [
    // M-001 킥오프
    { id: 'task-9', meetingId: 'src-1', title: 'D2C 앱 이벤트 페이지 와이어프레임', assignee: '박서연', done: true, createdAt: '2026-03-01' },
    { id: 'task-4', meetingId: 'src-1', title: '모델 촬영 레퍼런스 수집', assignee: '금민주', done: true, createdAt: '2026-03-01' },
    { id: 'task-12', meetingId: 'src-1', title: '브랜드 가이드 외주사 공유', assignee: '금민주', done: true, createdAt: '2026-03-01' },

    // M-002 디자인 리뷰
    { id: 'task-1', meetingId: 'src-2', decisionId: 'dec-1', title: '인스타 피드 시안 3차 수정', assignee: '박서연', done: false, createdAt: '2026-03-10' },
    { id: 'task-3', meetingId: 'src-2', title: '제품 촬영 스케줄 확정', assignee: '한지우', done: true, createdAt: '2026-03-10' },
    { id: 'task-10', meetingId: 'src-2', title: '촬영 소품 리스트 작성', assignee: '한지우', done: true, createdAt: '2026-03-10' },

    // M-003 채널 전략
    { id: 'task-2', meetingId: 'src-3', title: '유튜브 썸네일 A/B 테스트안 제작', assignee: '박서연', done: false, createdAt: '2026-03-18' },
    { id: 'task-5', meetingId: 'src-3', title: '옥외 버스쉘터 사이즈별 시안', assignee: '박서연', done: false, createdAt: '2026-03-18' },
    { id: 'task-6', meetingId: 'src-3', title: '유튜브 15초 컷 1차 편집', assignee: '오태현', done: false, createdAt: '2026-03-18' },
    { id: 'task-7', meetingId: 'src-3', title: '인스타 릴스 BGM 후보 선정', assignee: '오태현', done: true, createdAt: '2026-03-18' },
    { id: 'task-8', meetingId: 'src-3', title: '클라이언트 피드백 회신 리마인드', assignee: '금민주', done: false, createdAt: '2026-03-18' },
    { id: 'task-11', meetingId: 'src-3', title: '옥외 카피 서브 카피 후보 3안', assignee: '최예린', done: false, createdAt: '2026-03-18' },
  ]

  const rejected = [
    // 킥오프 — 핑크 계열 유지
    { id: 'rej-1', meetingId: 'src-1', title: '메인 컬러 핑크 계열 유지', reason: '경쟁사들이 핑크에 몰려 있어 차별화 어려움. 봄 시즌에 코랄 오렌지가 더 적합.', relatedDecision: '메인 컬러 코랄 오렌지(#E8734A) 확정', proposedBy: '박서연' },
    // 디자인 리뷰 — 여백 없이
    { id: 'rej-2', meetingId: 'src-2', title: '인스타 피드 여백 없이 제품 꽉 채우기', reason: '제품이 답답하게 보임. 호흡 있는 레이아웃 필요.', relatedDecision: '인스타 피드 정사각형 1:1, 여백 8%', proposedBy: '정하은' },
    // 채널 전략 — 통일 톤
    { id: 'rej-3', meetingId: 'src-3', title: '인스타/유튜브 동일 톤으로 통일', reason: '채널 특성이 달라 동일 톤은 비효율. 핵심 메시지와 컬러만 통일하면 됨.', relatedDecision: '톤앤매너 — 친근하지만 세련된', proposedBy: '최예린' },
  ]

  return NextResponse.json({ meetings, decisions, tasks, rejected })
}

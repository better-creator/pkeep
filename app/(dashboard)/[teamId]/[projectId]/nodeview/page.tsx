'use client'

import { useState } from 'react'
import { TimelineItem } from '@/components/timeline'
import { FlowMapView } from '@/components/timeline/FlowView'
import { DecisionHierarchyView, Decision, DecisionMaker } from '@/components/decisions'
import { useParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Map, List } from 'lucide-react'

// Mock 사용자 데이터 — 글로우업 코스메틱 S/S 캠페인
const users = {
  jung: { id: 'u1', name: '정하은', role: 'owner' as const },       // 글로우업 브랜드 매니저 (client)
  geum: { id: 'u2', name: '금민주', role: 'owner' as const },       // OTV 크리에이티브 디렉터 (agency)
  park: { id: 'u3', name: '박서연', role: 'contributor' as const },  // OTV 시니어 디자이너 (agency)
  han:  { id: 'u4', name: '한지우', role: 'contributor' as const },  // 스튜디오 블랑 포토그래퍼 (vendor)
  oh:   { id: 'u5', name: '오태현', role: 'contributor' as const },  // 모션랩 영상 감독 (vendor)
  choi: { id: 'u6', name: '최예린', role: 'reviewer' as const },     // OTV 카피라이터 (agency)
}

// DecisionMaker 버전 (결정 전용)
const decisionUsers: Record<string, DecisionMaker> = {
  jung: { id: 'u1', name: '정하은', role: 'approver' },    // 클라이언트 — 최종 승인
  geum: { id: 'u2', name: '금민주', role: 'owner' },        // 크리에이티브 디렉터 — 결정 주도
  park: { id: 'u3', name: '박서연', role: 'contributor' },   // 시니어 디자이너
  han:  { id: 'u4', name: '한지우', role: 'contributor' },   // 포토그래퍼
  oh:   { id: 'u5', name: '오태현', role: 'contributor' },   // 영상 감독
  choi: { id: 'u6', name: '최예린', role: 'contributor' },   // 카피라이터
}

// Mock timeline data — 글로우업 코스메틱 S/S 캠페인
const mockTimelineItems: TimelineItem[] = [
  // ── 화면/산출물 노드 ──
  {
    id: 'scr-001',
    type: 'screen',
    category: 'screen',
    source: 'figma',
    code: 'SCR-001',
    title: '인스타 피드 시안 (3차)',
    date: '2026-03-20',
    description: '인스타그램 피드용 정사각형 1:1 시안, 코랄 오렌지 메인 컬러 적용, 제품 촬영 컷 배치',
    owner: users.park,
    contributors: [users.han],
    connections: {
      sources: [
        { id: 'dec-001', type: 'decision', category: 'decision', code: 'DEC-001', title: '메인 컬러 코랄 오렌지 확정', relation: 'affects' },
        { id: 'dec-002', type: 'decision', category: 'decision', code: 'DEC-002', title: '제품 촬영 — 화이트 배경 + 좌측 45도', relation: 'affects' },
        { id: 'dec-003', type: 'decision', category: 'decision', code: 'DEC-003', title: '인스타 피드 정사각형 1:1', relation: 'affects' },
      ],
      impacts: [],
    },
  },
  {
    id: 'scr-002',
    type: 'screen',
    category: 'screen',
    source: 'figma',
    code: 'SCR-002',
    title: '유튜브 썸네일 A/B',
    date: '2026-03-22',
    description: '유튜브 광고 영상용 썸네일 A/B 테스트 시안, 코랄 오렌지 그래디언트 배경',
    owner: users.park,
    contributors: [users.oh],
    connections: {
      sources: [
        { id: 'dec-001', type: 'decision', category: 'decision', code: 'DEC-001', title: '메인 컬러 코랄 오렌지 확정', relation: 'affects' },
        { id: 'dec-004', type: 'decision', category: 'decision', code: 'DEC-004', title: '유튜브 자막 — 흰색 + 반투명 배경', relation: 'affects' },
      ],
      impacts: [],
    },
  },
  {
    id: 'scr-003',
    type: 'screen',
    category: 'screen',
    source: 'figma',
    code: 'SCR-003',
    title: '옥외 버스쉘터 시안',
    date: '2026-03-24',
    description: '버스쉘터 옥외 광고 시안, "매일이 빛나는 순간" 카피 적용',
    owner: users.park,
    contributors: [users.choi],
    connections: {
      sources: [
        { id: 'dec-001', type: 'decision', category: 'decision', code: 'DEC-001', title: '메인 컬러 코랄 오렌지 확정', relation: 'affects' },
        { id: 'dec-005', type: 'decision', category: 'decision', code: 'DEC-005', title: '옥외 카피 "매일이 빛나는 순간"', relation: 'affects' },
      ],
      impacts: [],
    },
  },
  {
    id: 'scr-004',
    type: 'screen',
    category: 'screen',
    source: 'figma',
    code: 'SCR-004',
    title: 'D2C 앱 이벤트 페이지',
    date: '2026-03-26',
    description: '글로우업 D2C 앱 내 S/S 캠페인 이벤트 랜딩 페이지',
    owner: users.park,
    contributors: [users.geum],
    connections: {
      sources: [
        { id: 'dec-001', type: 'decision', category: 'decision', code: 'DEC-001', title: '메인 컬러 코랄 오렌지 확정', relation: 'affects' },
        { id: 'dec-006', type: 'decision', category: 'decision', code: 'DEC-006', title: '톤앤매너 — 친근하지만 세련된', relation: 'affects' },
      ],
      impacts: [],
    },
  },

  // ── 결정 노드 ──
  {
    id: 'dec-001',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-001',
    title: '메인 컬러 코랄 오렌지(#E8734A) 확정',
    date: '2026-03-01',
    description: 'S/S 시즌 키 컬러를 코랄 오렌지(#E8734A)로 확정. 전 채널 통일 적용.',
    status: 'confirmed',
    owner: users.geum,
    contributors: [users.park],
    reviewers: [users.jung],
    tasks: [
      { id: 't1', title: '컬러 팔레트 정의', status: 'done', assignee: users.park },
      { id: 't2', title: '채널별 컬러 가이드 배포', status: 'done', assignee: users.park },
    ],
    connections: {
      sources: [
        { id: 'mtg-001', type: 'meeting', category: 'meeting', code: 'MTG-001', title: '킥오프 미팅', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '인스타 피드 시안 (3차)', relation: 'affects' },
        { id: 'scr-002', type: 'screen', category: 'screen', code: 'SCR-002', title: '유튜브 썸네일 A/B', relation: 'affects' },
        { id: 'scr-003', type: 'screen', category: 'screen', code: 'SCR-003', title: '옥외 버스쉘터 시안', relation: 'affects' },
      ],
    },
  },
  {
    id: 'dec-002',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-002',
    title: '제품 촬영 — 화이트 배경 + 좌측 45도 라이팅',
    date: '2026-03-10',
    description: '제품 촬영 기본 세팅: 화이트 배경, 좌측 45도 키라이트, 우측 리플렉터 보조광',
    status: 'confirmed',
    owner: users.han,
    contributors: [users.geum],
    reviewers: [users.jung],
    tasks: [
      { id: 't3', title: '촬영 테스트 컷 3종 제출', status: 'done', assignee: users.han },
      { id: 't4', title: '최종 촬영 세팅 확정', status: 'done', assignee: users.han },
    ],
    connections: {
      sources: [
        { id: 'mtg-002', type: 'meeting', category: 'meeting', code: 'MTG-002', title: '디자인 리뷰', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '인스타 피드 시안 (3차)', relation: 'affects' },
      ],
    },
  },
  {
    id: 'dec-003',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-003',
    title: '인스타 피드 정사각형 1:1, 여백 8%',
    date: '2026-03-18',
    description: '인스타그램 피드 포맷은 정사각형 1:1 비율, 상하좌우 여백 8% 적용',
    status: 'confirmed',
    owner: users.park,
    reviewers: [users.geum],
    tasks: [
      { id: 't5', title: '그리드 템플릿 제작', status: 'done', assignee: users.park },
      { id: 't6', title: '시안 3종 적용 테스트', status: 'done', assignee: users.park },
    ],
    connections: {
      sources: [
        { id: 'mtg-003', type: 'meeting', category: 'meeting', code: 'MTG-003', title: '채널 전략 회의', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '인스타 피드 시안 (3차)', relation: 'affects' },
      ],
    },
  },
  {
    id: 'dec-004',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-004',
    title: '유튜브 자막 — 흰색 + 반투명 배경',
    date: '2026-03-18',
    description: '유튜브 영상 자막은 흰색 텍스트 + 반투명 블랙(40%) 배경 처리, 가독성 확보',
    status: 'pending',
    owner: users.oh,
    contributors: [users.park],
    reviewers: [users.jung],
    tasks: [
      { id: 't7', title: '자막 샘플 렌더링', status: 'done', assignee: users.oh },
      { id: 't8', title: '클라이언트 확인', status: 'in_progress', assignee: users.jung },
    ],
    connections: {
      sources: [
        { id: 'mtg-003', type: 'meeting', category: 'meeting', code: 'MTG-003', title: '채널 전략 회의', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-002', type: 'screen', category: 'screen', code: 'SCR-002', title: '유튜브 썸네일 A/B', relation: 'affects' },
      ],
    },
  },
  {
    id: 'dec-005',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-005',
    title: '옥외 카피 "매일이 빛나는 순간"',
    date: '2026-03-18',
    description: '옥외 광고 메인 카피를 "매일이 빛나는 순간"으로 결정. 서브 카피 추가 검토 중.',
    status: 'pending',
    owner: users.choi,
    contributors: [users.geum],
    reviewers: [users.jung],
    tasks: [
      { id: 't9', title: '카피 후보 5안 제출', status: 'done', assignee: users.choi },
      { id: 't10', title: '클라이언트 최종 승인', status: 'in_progress', assignee: users.jung },
    ],
    connections: {
      sources: [
        { id: 'mtg-003', type: 'meeting', category: 'meeting', code: 'MTG-003', title: '채널 전략 회의', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-003', type: 'screen', category: 'screen', code: 'SCR-003', title: '옥외 버스쉘터 시안', relation: 'affects' },
      ],
    },
  },
  {
    id: 'dec-006',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-006',
    title: '톤앤매너 — 친근하지만 세련된',
    date: '2026-03-01',
    description: '캠페인 전체 톤앤매너를 "친근하지만 세련된"으로 설정. 과도한 꾸밈 지양, 자연스러운 라이프스타일 지향.',
    status: 'confirmed',
    owner: users.geum,
    contributors: [users.choi],
    reviewers: [users.jung],
    tasks: [
      { id: 't11', title: '무드보드 제작', status: 'done', assignee: users.geum },
      { id: 't12', title: '레퍼런스 정리 공유', status: 'done', assignee: users.park },
    ],
    connections: {
      sources: [
        { id: 'mtg-001', type: 'meeting', category: 'meeting', code: 'MTG-001', title: '킥오프 미팅', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-004', type: 'screen', category: 'screen', code: 'SCR-004', title: 'D2C 앱 이벤트 페이지', relation: 'affects' },
      ],
    },
  },
  {
    id: 'dec-007',
    type: 'decision',
    category: 'decision',
    source: 'manual',
    code: 'DEC-007',
    title: '모델 촬영 보정 기준 — 피부 톤 따뜻하게, 과보정 금지',
    date: '2026-03-25',
    description: '모델 촬영본 보정 기준: 피부 톤을 따뜻하게 보정하되, 피부 결 등 과도한 보정은 금지. 기존 DEC-002 촬영 가이드의 보정 파트를 대체.',
    status: 'confirmed',
    owner: users.han,
    contributors: [users.geum, users.park],
    reviewers: [users.jung],
    tasks: [
      { id: 't13', title: '보정 전/후 샘플 제출', status: 'done', assignee: users.han },
      { id: 't14', title: '보정 가이드 문서화', status: 'done', assignee: users.park },
    ],
    connections: {
      sources: [
        { id: 'mtg-004', type: 'meeting', category: 'meeting', code: 'MTG-004', title: '촬영 리뷰', relation: 'created_from' },
      ],
      impacts: [
        { id: 'scr-001', type: 'screen', category: 'screen', code: 'SCR-001', title: '인스타 피드 시안 (3차)', relation: 'affects' },
      ],
    },
  },

  // ── 미팅 노드 ──
  {
    id: 'mtg-001',
    type: 'meeting',
    category: 'meeting',
    source: 'zoom',
    code: 'MTG-001',
    title: '킥오프 미팅',
    date: '2026-03-01',
    description: '글로우업 S/S 캠페인 킥오프. 브랜드 방향, 타겟 오디언스, 톤앤매너 논의.',
    owner: users.jung,
    contributors: [users.geum, users.park, users.choi],
    connections: {
      sources: [],
      impacts: [
        { id: 'dec-001', type: 'decision', category: 'decision', code: 'DEC-001', title: '메인 컬러 코랄 오렌지 확정', relation: 'created_from' },
        { id: 'dec-006', type: 'decision', category: 'decision', code: 'DEC-006', title: '톤앤매너 — 친근하지만 세련된', relation: 'created_from' },
      ],
    },
  },
  {
    id: 'mtg-002',
    type: 'meeting',
    category: 'meeting',
    source: 'zoom',
    code: 'MTG-002',
    title: '디자인 리뷰',
    date: '2026-03-10',
    description: '1차 시안 검토, 컬러 최종 확정, 제품 촬영 가이드 논의.',
    owner: users.geum,
    contributors: [users.jung, users.park, users.han],
    connections: {
      sources: [],
      impacts: [
        { id: 'dec-002', type: 'decision', category: 'decision', code: 'DEC-002', title: '제품 촬영 — 화이트 배경 + 좌측 45도', relation: 'created_from' },
        { id: 'dec-007', type: 'decision', category: 'decision', code: 'DEC-007', title: '모델 촬영 보정 기준', relation: 'created_from' },
      ],
    },
  },
  {
    id: 'mtg-003',
    type: 'meeting',
    category: 'meeting',
    source: 'zoom',
    code: 'MTG-003',
    title: '채널 전략 회의',
    date: '2026-03-18',
    description: '인스타그램, 유튜브, 옥외 광고 채널별 크리에이티브 가이드 논의.',
    owner: users.geum,
    contributors: [users.jung, users.park, users.oh, users.choi],
    connections: {
      sources: [],
      impacts: [
        { id: 'dec-003', type: 'decision', category: 'decision', code: 'DEC-003', title: '인스타 피드 정사각형 1:1', relation: 'created_from' },
        { id: 'dec-004', type: 'decision', category: 'decision', code: 'DEC-004', title: '유튜브 자막 — 흰색 + 반투명 배경', relation: 'created_from' },
        { id: 'dec-005', type: 'decision', category: 'decision', code: 'DEC-005', title: '옥외 카피 "매일이 빛나는 순간"', relation: 'created_from' },
      ],
    },
  },
  {
    id: 'mtg-004',
    type: 'meeting',
    category: 'meeting',
    source: 'zoom',
    code: 'MTG-004',
    title: '촬영 리뷰',
    date: '2026-03-25',
    description: '촬영본 전체 검토, 보정 방향 확정, 최종 셀렉 논의.',
    owner: users.han,
    contributors: [users.jung, users.geum, users.park],
    connections: {
      sources: [],
      impacts: [
        { id: 'dec-007', type: 'decision', category: 'decision', code: 'DEC-007', title: '모델 촬영 보정 기준', relation: 'created_from' },
      ],
    },
  },
]

// Mock decisions (상태별 뷰용 확장 데이터)
const mockDecisions: Decision[] = [
  {
    id: 'dec-001',
    code: 'DEC-001',
    title: '메인 컬러 코랄 오렌지(#E8734A) 확정',
    content: 'S/S 시즌 키 컬러를 코랄 오렌지(#E8734A)로 확정. 인스타, 유튜브, 옥외, D2C 앱 전 채널에 통일 적용한다.',
    date: '2026-03-01',
    status: 'confirmed',
    hierarchy: 'root',
    owner: { ...decisionUsers.geum, decidedAt: '2026-03-01' },
    approvers: [{ ...decisionUsers.jung, decidedAt: '2026-03-01' }],
    contributors: [decisionUsers.park],
    currentVersion: 1,
    area: '비주얼',
    keywords: ['컬러', '코랄 오렌지', '브랜딩'],
    projectId: 'proj-1',
    meetingId: 'mtg-001',
    affectedScreenIds: ['scr-001', 'scr-002', 'scr-003'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'dec-002',
    code: 'DEC-002',
    title: '제품 촬영 — 화이트 배경 + 좌측 45도 라이팅',
    content: '제품 촬영 기본 세팅을 화이트 배경, 좌측 45도 키라이트, 우측 리플렉터 보조광으로 확정. 보정 기준은 DEC-007로 분리.',
    date: '2026-03-10',
    status: 'confirmed',
    hierarchy: 'root',
    owner: { ...decisionUsers.han, decidedAt: '2026-03-10' },
    approvers: [{ ...decisionUsers.jung, decidedAt: '2026-03-10' }],
    contributors: [decisionUsers.geum],
    currentVersion: 1,
    area: '촬영',
    keywords: ['제품 촬영', '라이팅', '배경'],
    projectId: 'proj-1',
    meetingId: 'mtg-002',
    affectedScreenIds: ['scr-001'],
    createdAt: '2026-03-10',
    updatedAt: '2026-03-10',
  },
  {
    id: 'dec-003',
    code: 'DEC-003',
    title: '인스타 피드 정사각형 1:1, 여백 8%',
    content: '인스타그램 피드 포맷은 정사각형 1:1 비율, 상하좌우 여백 8% 적용하여 깔끔한 그리드 유지.',
    date: '2026-03-18',
    status: 'confirmed',
    hierarchy: 'root',
    owner: { ...decisionUsers.park, decidedAt: '2026-03-18' },
    approvers: [{ ...decisionUsers.geum, decidedAt: '2026-03-18' }],
    currentVersion: 1,
    area: '채널',
    keywords: ['인스타그램', '피드', '비율'],
    projectId: 'proj-1',
    meetingId: 'mtg-003',
    affectedScreenIds: ['scr-001'],
    createdAt: '2026-03-18',
    updatedAt: '2026-03-18',
  },
  {
    id: 'dec-004',
    code: 'DEC-004',
    title: '유튜브 자막 — 흰색 + 반투명 배경',
    content: '유튜브 영상 자막은 흰색 텍스트 + 반투명 블랙(40%) 배경 처리. 가독성 확보가 목적. 클라이언트 확인 대기 중.',
    date: '2026-03-18',
    status: 'pending',
    hierarchy: 'root',
    owner: { ...decisionUsers.oh, decidedAt: '2026-03-18' },
    contributors: [decisionUsers.park],
    currentVersion: 1,
    area: '채널',
    keywords: ['유튜브', '자막', '가독성'],
    projectId: 'proj-1',
    meetingId: 'mtg-003',
    affectedScreenIds: ['scr-002'],
    createdAt: '2026-03-18',
    updatedAt: '2026-03-18',
  },
  {
    id: 'dec-005',
    code: 'DEC-005',
    title: '옥외 카피 "매일이 빛나는 순간"',
    content: '옥외 광고 메인 카피를 "매일이 빛나는 순간"으로 결정. 서브 카피는 추가 검토 중.',
    date: '2026-03-18',
    status: 'pending',
    hierarchy: 'root',
    owner: { ...decisionUsers.choi, decidedAt: '2026-03-18' },
    contributors: [decisionUsers.geum],
    currentVersion: 1,
    area: '카피',
    keywords: ['옥외 광고', '카피', '슬로건'],
    projectId: 'proj-1',
    meetingId: 'mtg-003',
    affectedScreenIds: ['scr-003'],
    createdAt: '2026-03-18',
    updatedAt: '2026-03-18',
  },
  {
    id: 'dec-006',
    code: 'DEC-006',
    title: '톤앤매너 — 친근하지만 세련된',
    content: '캠페인 전체 톤앤매너를 "친근하지만 세련된"으로 설정. 과도한 꾸밈 지양, 자연스러운 라이프스타일 지향.',
    date: '2026-03-01',
    status: 'confirmed',
    hierarchy: 'root',
    owner: { ...decisionUsers.geum, decidedAt: '2026-03-01' },
    approvers: [{ ...decisionUsers.jung, decidedAt: '2026-03-01' }],
    contributors: [decisionUsers.choi],
    currentVersion: 1,
    area: '브랜딩',
    keywords: ['톤앤매너', '브랜드', '무드'],
    projectId: 'proj-1',
    meetingId: 'mtg-001',
    affectedScreenIds: ['scr-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'dec-007',
    code: 'DEC-007',
    title: '모델 촬영 보정 기준 — 피부 톤 따뜻하게, 과보정 금지',
    content: '모델 촬영본 보정 시 피부 톤을 따뜻하게 보정하되, 피부 결 등 과도한 보정은 금지. 기존 DEC-002의 보정 관련 내용을 대체.',
    date: '2026-03-25',
    status: 'confirmed',
    hierarchy: 'revision',
    owner: { ...decisionUsers.han, decidedAt: '2026-03-25' },
    approvers: [{ ...decisionUsers.jung, decidedAt: '2026-03-25' }],
    contributors: [decisionUsers.geum, decisionUsers.park],
    supersedes: 'dec-002-old',
    currentVersion: 2,
    revisions: [
      {
        id: 'rev-1',
        version: 1,
        title: '제품 촬영 보정 — 기본 색보정만',
        changedBy: decisionUsers.han,
        changedAt: '2026-03-10',
        previousDecisionId: undefined,
      },
      {
        id: 'rev-2',
        version: 2,
        title: '모델 촬영 보정 기준 — 피부 톤 따뜻하게, 과보정 금지',
        changedBy: decisionUsers.han,
        changedAt: '2026-03-25',
        changeReason: '촬영 리뷰 후 모델 보정 기준 구체화',
        previousDecisionId: 'dec-002-old',
      },
    ],
    area: '촬영',
    keywords: ['보정', '리터칭', '피부 톤'],
    projectId: 'proj-1',
    meetingId: 'mtg-004',
    affectedScreenIds: ['scr-001'],
    createdAt: '2026-03-25',
    updatedAt: '2026-03-25',
  },
]

type ViewType = 'flow' | 'decisions'

export default function NodeViewPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string
  const [viewType, setViewType] = useState<ViewType>('flow')
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>()

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">콘텐츠 플로우</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              회의 → 결정 → 산출물의 연결 관계를 노드 그래프로 시각화
            </p>
          </div>
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
            <TabsList className="bg-secondary/50 rounded-xl">
              <TabsTrigger value="flow" className="gap-2 rounded-lg">
                <Map className="h-4 w-4" />
                플로우 맵
              </TabsTrigger>
              <TabsTrigger value="decisions" className="gap-2 rounded-lg">
                <List className="h-4 w-4" />
                상태별
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
          <span className="text-xs text-muted-foreground">범례</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span className="text-xs text-muted-foreground">회의</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span className="text-xs text-muted-foreground">결정</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-purple-500" />
            <span className="text-xs text-muted-foreground">산출물</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span className="text-xs text-muted-foreground">변경됨</span>
          </div>
        </div>
      </div>

      {/* Content — full height */}
      <div className="flex-1 min-h-0">
        {viewType === 'flow' && (
          <FlowMapView items={mockTimelineItems} />
        )}
        {viewType === 'decisions' && (
          <div className="h-full overflow-auto p-6">
            <DecisionHierarchyView
              decisions={mockDecisions}
              selectedDecisionId={selectedDecisionId}
              onSelectDecision={(d) => setSelectedDecisionId(d.id)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ZoomIn, ZoomOut, Maximize2, Search, Calendar, Zap, Monitor, Wrench, FileText, Users, User, FolderKanban, LayoutGrid, List } from 'lucide-react'
import {
  TimelineItem,
  ItemCategory,
  categoryConfig,
  statusConfig,
} from '@/components/timeline/types'

interface MindmapViewProps {
  items: TimelineItem[]
}

// 팀 정보 - 역할 아이콘 추가
const teams = [
  { id: 'frontend', name: '프론트엔드팀', shortName: 'FE', color: '#f97316', icon: 'code', members: [
    { id: 'u1', name: '김철수', initials: '철' },
    { id: 'u2', name: '이영희', initials: '영' },
  ]},
  { id: 'backend', name: '백엔드팀', shortName: 'BE', color: '#3b82f6', icon: 'server', members: [
    { id: 'u3', name: '박지민', initials: '지' },
  ]},
  { id: 'design', name: '디자인팀', shortName: 'UX', color: '#a855f7', icon: 'palette', members: [
    { id: 'u4', name: '최수연', initials: '수' },
  ]},
]

// 프로젝트 정보
const projectInfo = {
  id: 'pkeep-mvp',
  name: 'PKEEP MVP',
}

// 카테고리 아이콘
const categoryIcons: Record<ItemCategory, React.ElementType> = {
  meeting: Calendar,
  decision: Zap,
  screen: Monitor,
  implementation: Wrench,
  document: FileText,
}


// 탭 필터 타입
type TabFilter = 'all' | 'project' | 'team' | 'member' | 'item'

// 뷰 모드 타입
type ViewMode = 'bubble' | 'list'

interface BubbleNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: 'project' | 'team' | 'member' | 'item'
  color: string
  radius: number
  parentId?: string
  teamId?: string
  memberId?: string
  data?: TimelineItem
  count?: number
  clickable?: boolean
  category?: ItemCategory
  teamIcon?: string
  initials?: string
  fullName?: string
  teamName?: string
  projectName?: string
  isSecondary?: boolean
}

export function MindmapView({ items }: MindmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<BubbleNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('bubble')

  // 탭 목록
  const tabs: { id: TabFilter; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: '전체', icon: FolderKanban },
    { id: 'project', label: '프로젝트', icon: FolderKanban },
    { id: 'team', label: '팀', icon: Users },
    { id: 'member', label: '담당자', icon: User },
    { id: 'item', label: '항목', icon: FileText },
  ]

  // 노드 스타일 (탭별)
  const getNodeStyles = useCallback((tab: TabFilter) => {
    const base = {
      project: { radius: 0, fontSize: 0, fontWeight: 0, strokeWidth: 0 },
      team: { radius: 0, fontSize: 0, fontWeight: 0, strokeWidth: 0 },
      member: { radius: 0, fontSize: 0, fontWeight: 0, strokeWidth: 0 },
      item: { radius: 0, fontSize: 0, fontWeight: 0, strokeWidth: 0 },
    }

    switch (tab) {
      case 'all':
        return {
          project: { radius: 75, fontSize: 13, fontWeight: 600, strokeWidth: 3 },
          team: { radius: 48, fontSize: 11, fontWeight: 600, strokeWidth: 2 },
          member: { radius: 38, fontSize: 9, fontWeight: 500, strokeWidth: 1.5 },
          item: { radius: 20, fontSize: 7, fontWeight: 400, strokeWidth: 1 },
        }
      case 'project':
        return {
          ...base,
          project: { radius: 90, fontSize: 15, fontWeight: 600, strokeWidth: 3 },
          team: { radius: 55, fontSize: 12, fontWeight: 600, strokeWidth: 2 },
        }
      case 'team':
        return {
          ...base,
          team: { radius: 70, fontSize: 14, fontWeight: 600, strokeWidth: 2.5 },
          member: { radius: 50, fontSize: 10, fontWeight: 500, strokeWidth: 1.5 },
        }
      case 'member':
        return {
          ...base,
          member: { radius: 60, fontSize: 11, fontWeight: 600, strokeWidth: 2 },
          item: { radius: 32, fontSize: 9, fontWeight: 500, strokeWidth: 1.5 },
        }
      case 'item':
        return {
          ...base,
          item: { radius: 45, fontSize: 10, fontWeight: 500, strokeWidth: 2 },
        }
      default:
        return base
    }
  }, [])

  // 노드 데이터 생성
  const nodes = useMemo(() => {
    const nodeList: BubbleNode[] = []
    const styles = getNodeStyles(activeTab)

    // 검색 필터링
    const filteredItems = searchQuery
      ? items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items

    if (activeTab === 'all') {
      // 프로젝트 노드
      nodeList.push({
        id: projectInfo.id,
        name: projectInfo.name,
        type: 'project',
        color: '#f97316',
        radius: styles.project.radius,
        count: filteredItems.length,
        clickable: true,
      })

      teams.forEach(team => {
        const teamItems = filteredItems.filter(item =>
          team.members.some(m => m.id === item.owner?.id)
        )

        if (teamItems.length > 0 || !searchQuery) {
          nodeList.push({
            id: team.id,
            name: team.shortName,
            type: 'team',
            color: team.color,
            radius: styles.team.radius,
            parentId: projectInfo.id,
            count: teamItems.length,
            clickable: true,
            teamIcon: team.icon,
          })

          team.members.forEach(member => {
            const memberItems = filteredItems.filter(item => item.owner?.id === member.id)
            if (memberItems.length > 0) {
              nodeList.push({
                id: member.id,
                name: member.name,
                type: 'member',
                color: team.color,
                radius: styles.member.radius,
                parentId: team.id,
                teamId: team.id,
                teamName: team.shortName,
                projectName: projectInfo.name,
                count: memberItems.length,
                clickable: true,
                initials: member.initials,
                fullName: member.name,
                isSecondary: true,
              })

              memberItems.forEach(item => {
                nodeList.push({
                  id: item.id,
                  name: item.code,
                  type: 'item',
                  color: categoryConfig[item.category].color,
                  radius: styles.item.radius,
                  parentId: member.id,
                  teamId: team.id,
                  memberId: member.id,
                  data: item,
                  category: item.category,
                })
              })
            }
          })
        }
      })

      // 미배정
      const unassigned = filteredItems.filter(item =>
        !teams.some(team => team.members.some(m => m.id === item.owner?.id))
      )
      if (unassigned.length > 0) {
        nodeList.push({
          id: 'unassigned',
          name: '?',
          type: 'team',
          color: '#9ca3af',
          radius: styles.team.radius * 0.7,
          parentId: projectInfo.id,
          count: unassigned.length,
        })
        unassigned.forEach(item => {
          nodeList.push({
            id: item.id,
            name: item.code,
            type: 'item',
            color: categoryConfig[item.category].color,
            radius: styles.item.radius,
            parentId: 'unassigned',
            data: item,
            category: item.category,
          })
        })
      }

    } else if (activeTab === 'project') {
      nodeList.push({
        id: projectInfo.id,
        name: projectInfo.name,
        type: 'project',
        color: '#f97316',
        radius: styles.project.radius,
        count: filteredItems.length,
      })

      teams.forEach(team => {
        const teamItems = filteredItems.filter(item =>
          team.members.some(m => m.id === item.owner?.id)
        )
        nodeList.push({
          id: team.id,
          name: team.shortName,
          type: 'team',
          color: team.color,
          radius: styles.team.radius,
          parentId: projectInfo.id,
          count: teamItems.length,
          clickable: true,
          teamIcon: team.icon,
        })
      })

    } else if (activeTab === 'team') {
      const targetTeams = selectedTeamId
        ? teams.filter(t => t.id === selectedTeamId)
        : teams

      targetTeams.forEach(team => {
        const teamItems = filteredItems.filter(item =>
          team.members.some(m => m.id === item.owner?.id)
        )

        nodeList.push({
          id: team.id,
          name: team.shortName,
          type: 'team',
          color: team.color,
          radius: styles.team.radius,
          count: teamItems.length,
          teamIcon: team.icon,
        })

        team.members.forEach(member => {
          const memberItems = filteredItems.filter(item => item.owner?.id === member.id)
          if (memberItems.length > 0 || !searchQuery) {
            nodeList.push({
              id: member.id,
              name: member.name,
              type: 'member',
              color: team.color,
              radius: styles.member.radius,
              parentId: team.id,
              teamId: team.id,
              teamName: team.shortName,
              projectName: projectInfo.name,
              count: memberItems.length,
              clickable: true,
              initials: member.initials,
              fullName: member.name,
              isSecondary: true,
            })
          }
        })
      })

    } else if (activeTab === 'member') {
      const targetTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null
      const allMembers = targetTeam
        ? targetTeam.members
        : teams.flatMap(t => t.members.map(m => ({ ...m, teamId: t.id, teamColor: t.color })))

      allMembers.forEach(member => {
        const team = teams.find(t => t.members.some(m => m.id === member.id))
        if (!team) return
        if (selectedMemberId && member.id !== selectedMemberId) return

        const memberItems = filteredItems.filter(item => item.owner?.id === member.id)

        nodeList.push({
          id: member.id,
          name: member.name,
          type: 'member',
          color: team.color,
          radius: styles.member.radius,
          teamId: team.id,
          teamName: team.shortName,
          projectName: projectInfo.name,
          count: memberItems.length,
          initials: member.initials,
          fullName: member.name,
        })

        memberItems.forEach(item => {
          nodeList.push({
            id: item.id,
            name: item.code,
            type: 'item',
            color: categoryConfig[item.category].color,
            radius: styles.item.radius,
            parentId: member.id,
            teamId: team.id,
            memberId: member.id,
            data: item,
            category: item.category,
          })
        })
      })

    } else if (activeTab === 'item') {
      filteredItems.forEach(item => {
        nodeList.push({
          id: item.id,
          name: item.title.length > 12 ? item.title.slice(0, 12) + '…' : item.title,
          type: 'item',
          color: categoryConfig[item.category].color,
          radius: styles.item.radius,
          data: item,
          category: item.category,
        })
      })
    }

    return nodeList
  }, [items, activeTab, searchQuery, selectedTeamId, selectedMemberId, getNodeStyles])

  // 링크 데이터 생성
  const links = useMemo(() => {
    return nodes
      .filter(n => n.parentId)
      .map(n => ({
        source: n.parentId!,
        target: n.id,
      }))
  }, [nodes])

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback((node: BubbleNode) => {
    if (node.type === 'item') {
      setSelectedNode(node)
      return
    }

    if (node.clickable) {
      if (node.type === 'team') {
        setActiveTab('team')
        setSelectedTeamId(node.id)
        setSelectedMemberId(null)
      } else if (node.type === 'member') {
        setActiveTab('member')
        setSelectedTeamId(node.teamId || null)
        setSelectedMemberId(node.id)
      }
    } else {
      setSelectedNode(node)
    }
  }, [])

  // 컨테이너 크기 감지
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // D3 시뮬레이션
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0 || nodes.length === 0) {
      return
    }

    const svg = d3.select(svgRef.current)
    const width = dimensions.width
    const height = dimensions.height
    const styles = getNodeStyles(activeTab)

    svg.selectAll('*').remove()

    const g = svg.append('g').attr('class', 'main-group')

    // 줌
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoom(event.transform.k)
      })

    svg.call(zoomBehavior)
    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.9))

    // defs
    const defs = svg.append('defs')

    // 그라데이션 - 더 부드럽게
    nodes.forEach(node => {
      const gradientId = `gradient-${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '35%')
        .attr('cy', '35%')
        .attr('r', '65%')

      const color = d3.color(node.color) as d3.RGBColor
      const isSecondary = node.isSecondary || node.type === 'member'

      if (isSecondary) {
        // 담당자는 더 밝고 투명한 색상
        gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.rgb(color).brighter(2).toString()).attr('stop-opacity', 0.85)
        gradient.append('stop').attr('offset', '100%').attr('stop-color', d3.rgb(color).brighter(0.8).toString()).attr('stop-opacity', 0.7)
      } else {
        gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.rgb(color).brighter(0.6).toString())
        gradient.append('stop').attr('offset', '100%').attr('stop-color', node.color)
      }
    })

    // 배경 그룹용 그라데이션 (팀/담당자 뷰에서 컨텍스트 표시)
    if (activeTab === 'team' || activeTab === 'member') {
      teams.forEach(team => {
        const bgGradientId = `bg-gradient-${team.id}`
        const bgGradient = defs.append('radialGradient')
          .attr('id', bgGradientId)
          .attr('cx', '50%')
          .attr('cy', '50%')
          .attr('r', '60%')

        const teamColor = d3.color(team.color) as d3.RGBColor
        bgGradient.append('stop').attr('offset', '0%').attr('stop-color', d3.rgb(teamColor).brighter(1.8).toString()).attr('stop-opacity', 0.15)
        bgGradient.append('stop').attr('offset', '70%').attr('stop-color', d3.rgb(teamColor).brighter(1.5).toString()).attr('stop-opacity', 0.08)
        bgGradient.append('stop').attr('offset', '100%').attr('stop-color', d3.rgb(teamColor).brighter(1.2).toString()).attr('stop-opacity', 0)
      })
    }

    // 그림자
    const shadow = defs.append('filter')
      .attr('id', 'bubble-shadow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%')
    shadow.append('feDropShadow')
      .attr('dx', 0).attr('dy', 3)
      .attr('stdDeviation', 4).attr('flood-opacity', 0.12)

    // 담당자용 가벼운 그림자
    const lightShadow = defs.append('filter')
      .attr('id', 'light-shadow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%')
    lightShadow.append('feDropShadow')
      .attr('dx', 0).attr('dy', 2)
      .attr('stdDeviation', 3).attr('flood-opacity', 0.08)

    // 배경 그룹 레이어 (팀/담당자 뷰에서 팀별 영역 표시)
    const bgGroups = g.append('g').attr('class', 'bg-groups')

    if (activeTab === 'team' || activeTab === 'member') {
      // 팀별로 배경 원 추가
      const teamsInView = selectedTeamId
        ? teams.filter(t => t.id === selectedTeamId)
        : teams

      teamsInView.forEach((team, index) => {
        const teamNodes = nodes.filter(n => n.teamId === team.id || n.id === team.id)
        if (teamNodes.length === 0) return

        // 팀별 위치 계산 (대략적 배치)
        const angle = (2 * Math.PI * index) / teamsInView.length - Math.PI / 2
        const radius = teamsInView.length === 1 ? 0 : 180
        const cx = Math.cos(angle) * radius
        const cy = Math.sin(angle) * radius

        const bgGroup = bgGroups.append('g')
          .attr('class', `bg-group-${team.id}`)
          .attr('transform', `translate(${cx}, ${cy})`)

        // 배경 원
        bgGroup.append('circle')
          .attr('r', activeTab === 'member' ? 200 : 160)
          .attr('fill', `url(#bg-gradient-${team.id})`)
          .attr('stroke', team.color)
          .attr('stroke-width', 1)
          .attr('stroke-opacity', 0.15)
          .attr('stroke-dasharray', '5,5')

        // 팀 라벨 (상단)
        bgGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', activeTab === 'member' ? -180 : -140)
          .attr('fill', team.color)
          .attr('font-size', 12)
          .attr('font-weight', 600)
          .attr('opacity', 0.5)
          .text(team.name)
      })
    }

    // 팀별 그룹 중심점 계산
    const teamsInView = selectedTeamId
      ? teams.filter(t => t.id === selectedTeamId)
      : teams
    const teamCenters: Record<string, { x: number; y: number }> = {}
    teamsInView.forEach((team, index) => {
      const angle = (2 * Math.PI * index) / teamsInView.length - Math.PI / 2
      const radius = teamsInView.length === 1 ? 0 : 150
      teamCenters[team.id] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      }
    })

    // 시뮬레이션
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links)
        .id((d: unknown) => (d as BubbleNode).id)
        .distance((d: unknown) => {
          const link = d as { source: BubbleNode; target: BubbleNode }
          return link.source.radius + link.target.radius + 20
        })
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength((d: unknown) => -(d as BubbleNode).radius * 8))
      .force('collision', d3.forceCollide().radius((d: unknown) => (d as BubbleNode).radius + 8).strength(0.85))
      .force('center', d3.forceCenter(0, 0).strength(0.04))

    // 팀/담당자 뷰에서 팀별 그룹핑 힘 추가
    if ((activeTab === 'team' || activeTab === 'member') && teamsInView.length > 1) {
      simulation.force('teamGroup', d3.forceX<BubbleNode>()
        .x(d => {
          const teamId = d.teamId || d.id
          return teamCenters[teamId]?.x || 0
        })
        .strength(0.15)
      )
      simulation.force('teamGroupY', d3.forceY<BubbleNode>()
        .y(d => {
          const teamId = d.teamId || d.id
          return teamCenters[teamId]?.y || 0
        })
        .strength(0.15)
      )
    }

    // 링크
    const linkElements = g.append('g').attr('class', 'links')
      .selectAll('line').data(links).join('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', (d: unknown) => {
        const target = nodes.find(n => n.id === (d as { target: string }).target)
        return target?.isSecondary ? '4,3' : 'none'
      })

    // 노드
    const nodeGroups = g.append('g').attr('class', 'nodes')
      .selectAll<SVGGElement, BubbleNode>('g').data(nodes).join('g')
      .attr('class', 'node-group')
      .style('cursor', d => d.clickable || d.type === 'item' ? 'pointer' : 'default')

    // 드래그
    const dragBehavior = d3.drag<SVGGElement, BubbleNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x; d.fy = d.y
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null; d.fy = null
      })
    nodeGroups.call(dragBehavior)

    // 버블 원
    nodeGroups.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => `url(#gradient-${d.id.replace(/[^a-zA-Z0-9]/g, '_')})`)
      .attr('stroke', d => {
        if (d.isSecondary || d.type === 'member') {
          return d3.rgb(d3.color(d.color) as d3.RGBColor).brighter(0.2).toString()
        }
        return d3.rgb(d3.color(d.color) as d3.RGBColor).darker(0.2).toString()
      })
      .attr('stroke-width', d => {
        if (d.isSecondary || d.type === 'member') return 1.5
        return styles[d.type]?.strokeWidth || 2
      })
      .attr('stroke-dasharray', d => (d.isSecondary || d.type === 'member') ? '0' : '0')
      .attr('filter', d => (d.isSecondary || d.type === 'member') ? 'url(#light-shadow)' : 'url(#bubble-shadow)')
      .attr('opacity', d => (d.isSecondary || d.type === 'member') ? 0.85 : 1)
      .on('click', (_event, d) => handleNodeClick(d))
      .on('mouseenter', function(_event, d) {
        if (d.clickable || d.type === 'item') {
          d3.select(this).transition().duration(150).attr('r', d.radius * 1.08)
        }
      })
      .on('mouseleave', function(_event, d) {
        d3.select(this).transition().duration(150).attr('r', d.radius)
      })

    // 프로젝트: 팀별 아이콘들 표시
    nodeGroups.filter(d => d.type === 'project')
      .each(function(d) {
        const group = d3.select(this)
        const iconSize = 14
        const spacing = 18
        const startX = -(teams.length - 1) * spacing / 2

        teams.forEach((team, i) => {
          group.append('circle')
            .attr('cx', startX + i * spacing)
            .attr('cy', -d.radius * 0.35)
            .attr('r', iconSize / 2 + 2)
            .attr('fill', team.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5)
        })
      })

    // 팀: 아이콘 표시
    nodeGroups.filter(d => d.type === 'team' && d.teamIcon !== undefined)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -d.radius * 0.15)
      .attr('fill', 'white')
      .attr('font-size', d => d.radius * 0.45)
      .attr('pointer-events', 'none')
      .text(d => {
        switch(d.teamIcon) {
          case 'code': return '💻'
          case 'server': return '🖥️'
          case 'palette': return '🎨'
          default: return ''
        }
      })

    // 아이템: 카테고리 아이콘
    nodeGroups.filter(d => d.type === 'item' && d.category !== undefined)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', () => activeTab === 'item' ? -4 : -2)
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(d.radius * 0.45, 10))
      .attr('pointer-events', 'none')
      .text(d => {
        switch(d.category) {
          case 'meeting': return '📅'
          case 'decision': return '⚡'
          case 'screen': return '🖼️'
          case 'implementation': return '🔧'
          case 'document': return '📄'
          default: return ''
        }
      })

    // 텍스트
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => {
        if (d.type === 'project') return 8
        if (d.type === 'team' && d.teamIcon) return d.radius * 0.35
        if (d.type === 'item' && d.category) return d.radius * 0.3
        if (d.type === 'member') return 4
        return 4
      })
      .attr('fill', d => (d.isSecondary || d.type === 'member') ? d3.rgb(d3.color(d.color) as d3.RGBColor).darker(1.8).toString() : 'white')
      .attr('font-size', d => styles[d.type]?.fontSize || 10)
      .attr('font-weight', d => styles[d.type]?.fontWeight || 500)
      .attr('pointer-events', 'none')
      .text(d => {
        if (d.type === 'project') return d.name
        if (d.type === 'team') return d.name
        if (d.type === 'member') return d.fullName || d.name
        if (d.type === 'item') return d.data?.code || ''
        return d.name
      })

    // 멤버 노드에 소속 팀 표시 (작은 라벨)
    nodeGroups.filter(d => d.type === 'member' && d.teamName !== undefined)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * 0.55)
      .attr('fill', d => d3.rgb(d3.color(d.color) as d3.RGBColor).darker(0.5).toString())
      .attr('font-size', 8)
      .attr('font-weight', 400)
      .attr('opacity', 0.7)
      .attr('pointer-events', 'none')
      .text(d => d.teamName || '')

    // 카운트 (프로젝트, 팀만)
    nodeGroups.filter(d => (d.type === 'project' || d.type === 'team') && d.count !== undefined && d.count > 0)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'project' ? 22 : d.radius * 0.65)
      .attr('fill', 'rgba(255,255,255,0.8)')
      .attr('font-size', d => (styles[d.type]?.fontSize || 10) * 0.7)
      .attr('font-weight', 400)
      .attr('pointer-events', 'none')
      .text(d => `${d.count}`)

    // 담당자 카운트 (외부 뱃지 스타일)
    nodeGroups.filter(d => d.type === 'member' && d.count !== undefined && d.count > 0)
      .each(function(d) {
        const group = d3.select(this)
        const badgeR = 10
        group.append('circle')
          .attr('cx', d.radius * 0.6)
          .attr('cy', -d.radius * 0.6)
          .attr('r', badgeR)
          .attr('fill', '#f97316')
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
        group.append('text')
          .attr('x', d.radius * 0.6)
          .attr('y', -d.radius * 0.6)
          .attr('text-anchor', 'middle')
          .attr('dy', 3.5)
          .attr('fill', 'white')
          .attr('font-size', 9)
          .attr('font-weight', 600)
          .attr('pointer-events', 'none')
          .text(d.count || '')
      })

    // 틱
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: unknown) => ((d as { source: BubbleNode }).source.x || 0))
        .attr('y1', (d: unknown) => ((d as { source: BubbleNode }).source.y || 0))
        .attr('x2', (d: unknown) => ((d as { target: BubbleNode }).target.x || 0))
        .attr('y2', (d: unknown) => ((d as { target: BubbleNode }).target.y || 0))
      nodeGroups.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)

      // 배경 그룹 원 위치 업데이트 (팀/담당자 뷰)
      if (activeTab === 'team' || activeTab === 'member') {
        teamsInView.forEach(team => {
          const teamNodes = nodes.filter(n => n.teamId === team.id || n.id === team.id)
          if (teamNodes.length === 0) return

          // 팀 노드들의 중심 계산
          const avgX = teamNodes.reduce((sum, n) => sum + (n.x || 0), 0) / teamNodes.length
          const avgY = teamNodes.reduce((sum, n) => sum + (n.y || 0), 0) / teamNodes.length

          bgGroups.select(`.bg-group-${team.id}`)
            .attr('transform', `translate(${avgX}, ${avgY})`)
        })
      }
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, links, dimensions, activeTab, getNodeStyles, handleNodeClick])

  // 줌 컨트롤
  const handleZoom = useCallback((factor: number) => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as unknown as (t: d3.Transition<SVGSVGElement, unknown, null, undefined>, k: number) => void,
      factor
    )
  }, [])

  const handleReset = useCallback(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform as unknown as (t: d3.Transition<SVGSVGElement, unknown, null, undefined>, transform: d3.ZoomTransform) => void,
      d3.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(0.9)
    )
  }, [dimensions])

  const resetFilters = () => {
    setActiveTab('all')
    setSearchQuery('')
    setSelectedTeamId(null)
    setSelectedMemberId(null)
  }

  // 리스트 뷰용 필터링된 아이템
  const filteredItemsForList = useMemo(() => {
    let filtered = items

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 팀 필터
    if (selectedTeamId) {
      const team = teams.find(t => t.id === selectedTeamId)
      if (team) {
        filtered = filtered.filter(item =>
          team.members.some(m => m.id === item.owner?.id)
        )
      }
    }

    // 담당자 필터
    if (selectedMemberId) {
      filtered = filtered.filter(item => item.owner?.id === selectedMemberId)
    }

    return filtered
  }, [items, searchQuery, selectedTeamId, selectedMemberId])

  // 리스트 뷰용 그룹핑된 데이터
  const groupedItemsForList = useMemo(() => {
    const grouped: Record<string, { team: typeof teams[0]; members: Record<string, { member: typeof teams[0]['members'][0]; items: TimelineItem[] }> }> = {}

    teams.forEach(team => {
      grouped[team.id] = { team, members: {} }
      team.members.forEach(member => {
        grouped[team.id].members[member.id] = { member, items: [] }
      })
    })

    filteredItemsForList.forEach(item => {
      const team = teams.find(t => t.members.some(m => m.id === item.owner?.id))
      if (team && item.owner) {
        grouped[team.id].members[item.owner.id].items.push(item)
      }
    })

    return grouped
  }, [filteredItemsForList])

  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: '600px', height: '100%' }}>
      {/* 필터 바 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 탭 */}
          <div className="flex items-center gap-0.5 bg-stone-100/80 rounded-lg p-0.5">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'all') {
                      setSelectedTeamId(null)
                      setSelectedMemberId(null)
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* 팀 필터 */}
          {(activeTab === 'team' || activeTab === 'member') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-stone-400 uppercase tracking-wide">팀</span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => { setSelectedTeamId(null); setSelectedMemberId(null) }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    !selectedTeamId ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  전체
                </button>
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => { setSelectedTeamId(team.id); setSelectedMemberId(null) }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      selectedTeamId === team.id
                        ? 'text-white shadow-sm'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                    style={selectedTeamId === team.id ? { backgroundColor: team.color } : {}}
                  >
                    {team.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 담당자 필터 */}
          {activeTab === 'member' && selectedTeamId && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-stone-400 uppercase tracking-wide">담당자</span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => setSelectedMemberId(null)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    !selectedMemberId ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  전체
                </button>
                {teams.find(t => t.id === selectedTeamId)?.members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      selectedMemberId === member.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 검색 */}
          <div className="flex-1 max-w-[200px] ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="pl-8 h-8 text-xs bg-stone-50/50 border-stone-200/60"
              />
            </div>
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-0.5 bg-stone-100/80 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('bubble')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'bubble'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
              title="버블 뷰"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
              title="리스트 뷰"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {(activeTab !== 'all' || searchQuery || selectedTeamId) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-stone-400 hover:text-stone-600 h-8 px-2 text-xs">
              초기화
            </Button>
          )}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-stone-100/60">
          <span className="text-[10px] text-stone-400 uppercase tracking-wide">카테고리</span>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = categoryIcons[key as ItemCategory]
            return (
              <div key={key} className="flex items-center gap-1">
                <div
                  className="w-3.5 h-3.5 rounded flex items-center justify-center"
                  style={{ backgroundColor: config.color }}
                >
                  <Icon className="h-2 w-2 text-white" />
                </div>
                <span className="text-[10px] text-stone-500">{config.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 메인 */}
      <div className="flex-1 flex relative min-h-0">
        {viewMode === 'bubble' ? (
          <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50/30" style={{ minHeight: '400px' }}>
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              style={{ display: 'block' }}
            />

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-stone-400">
                  <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              </div>
            )}

            {/* 줌 컨트롤 */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-stone-200/60">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleZoom(1.3)}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleZoom(0.7)}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <div className="text-[10px] text-center text-stone-400 border-t border-stone-100 pt-1 mt-0.5">
                {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>
        ) : (
          /* 리스트 뷰 */
          <div className="flex-1 overflow-auto bg-stone-50/50 p-4">
            {filteredItemsForList.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-stone-400">
                  <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {/* 요약 */}
                <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-stone-700">{projectInfo.name}</span>
                  </div>
                  <div className="text-xs text-stone-500">
                    총 <span className="font-semibold text-orange-600">{filteredItemsForList.length}</span>개 항목
                  </div>
                </div>

                {/* 팀별 그룹 */}
                {teams.map(team => {
                  const teamData = groupedItemsForList[team.id]
                  const teamItems = Object.values(teamData.members).flatMap(m => m.items)

                  // 팀 필터가 걸려있고 해당 팀이 아니면 스킵
                  if (selectedTeamId && selectedTeamId !== team.id) return null
                  // 아이템이 없으면 스킵
                  if (teamItems.length === 0) return null

                  return (
                    <div key={team.id} className="bg-white rounded-xl border border-stone-200/60 overflow-hidden">
                      {/* 팀 헤더 */}
                      <div
                        className="px-4 py-3 border-b border-stone-100 flex items-center gap-3"
                        style={{ backgroundColor: `${team.color}10` }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.icon === 'code' ? '💻' : team.icon === 'server' ? '🖥️' : '🎨'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-800">{team.name}</h3>
                          <p className="text-xs text-stone-500">{teamItems.length}개 항목</p>
                        </div>
                      </div>

                      {/* 멤버별 아이템 */}
                      <div className="divide-y divide-stone-100">
                        {team.members.map(member => {
                          const memberItems = teamData.members[member.id].items

                          // 담당자 필터가 걸려있고 해당 담당자가 아니면 스킵
                          if (selectedMemberId && selectedMemberId !== member.id) return null
                          // 아이템이 없으면 스킵
                          if (memberItems.length === 0) return null

                          return (
                            <div key={member.id} className="p-4">
                              {/* 담당자 헤더 */}
                              <div className="flex items-center gap-2 mb-3">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                  style={{ backgroundColor: team.color, opacity: 0.7 }}
                                >
                                  {member.initials}
                                </div>
                                <span className="text-sm font-medium text-stone-700">{member.name}</span>
                                <Badge variant="outline" className="text-[10px] ml-auto">
                                  {memberItems.length}
                                </Badge>
                              </div>

                              {/* 아이템 목록 */}
                              <div className="space-y-2 ml-8">
                                {memberItems.map(item => {
                                  const Icon = categoryIcons[item.category]
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-50/50 hover:bg-stone-100/50 transition-colors cursor-pointer"
                                      onClick={() => {
                                        const node = nodes.find(n => n.id === item.id)
                                        if (node) setSelectedNode(node)
                                      }}
                                    >
                                      <div
                                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: categoryConfig[item.category].color }}
                                      >
                                        <Icon className="h-3 w-3 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono text-orange-600">{item.code}</span>
                                          {item.status && (
                                            <Badge
                                              variant="outline"
                                              className={`text-[9px] px-1 py-0 ${statusConfig[item.status].bg} ${statusConfig[item.status].text} border-0`}
                                            >
                                              {statusConfig[item.status].label}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-stone-800 mt-0.5 truncate">{item.title}</p>
                                        {item.description && (
                                          <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{item.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 상세 패널 */}
        {selectedNode && (
          <div className="w-72 border-l border-stone-200/60 bg-white/95 backdrop-blur-sm overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge style={{ backgroundColor: selectedNode.color }} className="text-white text-[10px]">
                  {selectedNode.type === 'project' ? '프로젝트' :
                   selectedNode.type === 'team' ? '팀' :
                   selectedNode.type === 'member' ? '담당자' :
                   selectedNode.category ? categoryConfig[selectedNode.category].label : '항목'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)} className="h-6 px-2 text-xs">
                  닫기
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-stone-800">{selectedNode.name}</h3>
                  {selectedNode.count !== undefined && (
                    <p className="text-xs text-stone-500 mt-0.5">{selectedNode.count}개 항목</p>
                  )}
                </div>

                {selectedNode.data && (
                  <>
                    <div>
                      <span className="text-[10px] font-mono text-orange-600">{selectedNode.data.code}</span>
                      <h4 className="text-sm font-medium text-stone-800 mt-0.5">{selectedNode.data.title}</h4>
                      {selectedNode.data.status && (
                        <Badge
                          variant="outline"
                          className={`mt-1.5 text-[10px] ${statusConfig[selectedNode.data.status].bg} ${statusConfig[selectedNode.data.status].text} border-0`}
                        >
                          {statusConfig[selectedNode.data.status].label}
                        </Badge>
                      )}
                    </div>

                    {selectedNode.data.description && (
                      <div>
                        <h4 className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1">설명</h4>
                        <p className="text-xs text-stone-600 leading-relaxed">{selectedNode.data.description}</p>
                      </div>
                    )}

                    {selectedNode.data.owner && (
                      <div>
                        <h4 className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1">담당자</h4>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-[10px] text-orange-600 font-medium">
                            {selectedNode.data.owner.name.charAt(0)}
                          </div>
                          <span className="text-xs text-stone-700">{selectedNode.data.owner.name}</span>
                        </div>
                      </div>
                    )}

                    {selectedNode.data.connections.sources.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1.5">연결된 항목</h4>
                        <div className="space-y-1">
                          {selectedNode.data.connections.sources.map(source => (
                            <div key={source.id} className="text-[10px] p-1.5 rounded bg-stone-50 flex items-center gap-1.5">
                              <span className="font-mono text-orange-600">{source.code}</span>
                              <span className="text-stone-500 truncate">{source.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === 'team' && (
                  <div>
                    <h4 className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1.5">팀원</h4>
                    <div className="space-y-1">
                      {teams.find(t => t.id === selectedNode.id)?.members.map(member => (
                        <div key={member.id} className="flex items-center gap-2 p-1.5 rounded bg-stone-50">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                            style={{ backgroundColor: selectedNode.color }}
                          >
                            {member.initials}
                          </div>
                          <span className="text-xs text-stone-700">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

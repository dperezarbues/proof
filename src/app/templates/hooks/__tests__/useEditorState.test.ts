// @vitest-environment jsdom

import type { DragEndEvent } from '@dnd-kit/core'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useEditorState } from '../useEditorState'

function dragEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId },
    over: overId ? { id: overId } : null,
  } as DragEndEvent
}

const baseLayout = {
  header: { style: 'stacked' },
  sections: [
    { id: 'summary', breakable: true },
    { id: 'experience', breakable: true },
  ],
  sidebar_sections: ['contact', { id: 'skills', breakable: false }],
}

afterEach(() => cleanup())

describe('useEditorState', () => {
  it('parses the initial layout via parseLayoutStructure', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    expect(result.current.layout.sections).toEqual([
      { kind: 'full', key: 'summary', id: 'summary', breakable: true },
      { kind: 'full', key: 'experience', id: 'experience', breakable: true },
    ])
    expect(result.current.layout.sidebarSections).toEqual([
      { id: 'contact', breakable: true },
      { id: 'skills', breakable: false },
    ])
  })

  it('falls back to an empty, safe layout when given malformed input', () => {
    const { result } = renderHook(() => useEditorState({ garbage: true }))
    expect(result.current.layout).toEqual({ header: { style: 'stacked' }, sections: [] })
  })

  it('updateSection applies fn only to the matching section', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.updateSection('summary', (s) => ({ ...s, breakable: false }))
    })
    expect(result.current.layout.sections[0]).toMatchObject({ key: 'summary', breakable: false })
    expect(result.current.layout.sections[1]).toMatchObject({ key: 'experience', breakable: true })
  })

  it('handleDragEnd reorders sections', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.handleDragEnd(dragEvent('summary', 'experience'))
    })
    expect(result.current.layout.sections.map((s) => s.key)).toEqual(['experience', 'summary'])
  })

  it('handleDragEnd is a no-op when dropped outside a target or on itself', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.handleDragEnd(dragEvent('summary', null))
    })
    expect(result.current.layout.sections.map((s) => s.key)).toEqual(['summary', 'experience'])
    act(() => {
      result.current.handleDragEnd(dragEvent('summary', 'summary'))
    })
    expect(result.current.layout.sections.map((s) => s.key)).toEqual(['summary', 'experience'])
  })

  it('addFullSection appends a full section', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.addFullSection('education')
    })
    expect(result.current.layout.sections.at(-1)).toEqual({
      kind: 'full',
      key: 'education',
      id: 'education',
      breakable: true,
    })
  })

  it('addColumnsGroup appends an empty two-column group with a unique key', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.addColumnsGroup()
    })
    const added = result.current.layout.sections.at(-1)
    expect(added).toMatchObject({ kind: 'columns', columns: 2, content: [[], []], breakable: true })
    expect(added?.key).toMatch(/^columns-/)
  })

  it('removeSection removes only the targeted section', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.removeSection('summary')
    })
    expect(result.current.layout.sections.map((s) => s.key)).toEqual(['experience'])
  })

  it('updateColumn replaces one column of a columns section and leaves others untouched', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.addColumnsGroup()
    })
    const key = result.current.layout.sections.at(-1)?.key
    expect(key).toBeDefined()
    act(() => {
      result.current.updateColumn(key as string, 0, ['skills'])
    })
    const updated = result.current.layout.sections.at(-1)
    expect(updated).toMatchObject({ content: [['skills'], []] })
  })

  it('updateColumn is a no-op on a non-columns section', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.updateColumn('summary', 0, ['skills'])
    })
    expect(result.current.layout.sections[0]).toEqual({
      kind: 'full',
      key: 'summary',
      id: 'summary',
      breakable: true,
    })
  })

  it('updateSpacing sets pre/post and omits either when undefined', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.updateSpacing('summary', 1.5, undefined)
    })
    expect(result.current.layout.sections[0]).toMatchObject({ pre_spacing: 1.5 })
    expect(result.current.layout.sections[0]).not.toHaveProperty('post_spacing')
  })

  it('updateSpacing replaces existing spacing rather than merging stale values', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.updateSpacing('summary', 1.5, 0.5)
    })
    act(() => {
      result.current.updateSpacing('summary', undefined, 0.8)
    })
    expect(result.current.layout.sections[0]).not.toHaveProperty('pre_spacing')
    expect(result.current.layout.sections[0]).toMatchObject({ post_spacing: 0.8 })
  })

  it('handleSidebarDragEnd reorders sidebar sections', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.handleSidebarDragEnd(dragEvent('contact', 'skills'))
    })
    expect(result.current.layout.sidebarSections?.map((s) => s.id)).toEqual(['skills', 'contact'])
  })

  it('addSidebarSection appends and works when sidebarSections starts undefined', () => {
    const { result } = renderHook(() =>
      useEditorState({ header: { style: 'stacked' }, sections: [] }),
    )
    expect(result.current.layout.sidebarSections).toBeUndefined()
    act(() => {
      result.current.addSidebarSection('languages')
    })
    expect(result.current.layout.sidebarSections).toEqual([{ id: 'languages', breakable: true }])
  })

  it('removeSidebarSection removes only the targeted entry', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.removeSidebarSection('contact')
    })
    expect(result.current.layout.sidebarSections).toEqual([{ id: 'skills', breakable: false }])
  })

  it('toggleSidebarBreakable flips only the targeted entry', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.toggleSidebarBreakable('skills')
    })
    expect(result.current.layout.sidebarSections).toEqual([
      { id: 'contact', breakable: true },
      { id: 'skills', breakable: true },
    ])
  })

  it('updateSidebarSpacing replaces existing spacing rather than merging stale values', () => {
    const { result } = renderHook(() => useEditorState(baseLayout))
    act(() => {
      result.current.updateSidebarSpacing('skills', 1, 2)
    })
    act(() => {
      result.current.updateSidebarSpacing('skills', undefined, 3)
    })
    const skills = result.current.layout.sidebarSections?.find((s) => s.id === 'skills')
    expect(skills).not.toHaveProperty('pre_spacing')
    expect(skills).toMatchObject({ post_spacing: 3 })
  })
})

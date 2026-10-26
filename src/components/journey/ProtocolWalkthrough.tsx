import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

export type ProtocolKind = 'OAuth 2.0' | 'OAuth + OIDC' | 'OIDC' | 'Application' | 'Application + OAuth' | 'Shared'
export type ProtocolStep = {
  phase: string
  kind: ProtocolKind
  title: string
  from: string
  to: string
  fromLane: 0 | 1 | 2 | 3
  toLane: 0 | 1 | 2 | 3
  channel: string
  action: string
  example: string
  check: string
  result: string
}

const lanes = ['Browser', 'Expense Portal backend', 'Boo Identity', 'Expense API']
const laneX = (lane: number) => 125 + lane * 250

export function ProtocolWalkthrough({ steps, selected, onSelect, label, afterDetail, beforeDiagram }: {
  steps: readonly ProtocolStep[]
  selected: number
  onSelect: (index: number) => void
  label: string
  afterDetail?: ReactNode
  beforeDiagram?: ReactNode
}) {
  const current = steps[selected]
  const diagramRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const diagram = diagramRef.current
    const row = selectedRef.current
    if (!diagram || !row) return
    const diagramBox = diagram.getBoundingClientRect()
    const rowBox = row.getBoundingClientRect()
    const headerHeight = diagram.querySelector('.sequence-lanes')?.getBoundingClientRect().height ?? 0
    if (rowBox.bottom > diagramBox.bottom) diagram.scrollTop += rowBox.bottom - diagramBox.bottom + 8
    else if (rowBox.top < diagramBox.top + headerHeight) diagram.scrollTop -= diagramBox.top + headerHeight - rowBox.top + 8
  }, [selected])

  return <div className="protocol-walkthrough">
    <section className="protocol-step-detail" aria-live="polite">
      <div className="protocol-step-meta"><span>PHASE {current.phase} · {selected + 1} / {steps.length} handoffs</span><span>{current.kind}</span></div>
      <h3>{current.title}</h3>
      <div className="protocol-route"><strong>{current.from}</strong><ArrowRight size={17} aria-hidden="true" /><strong>{current.to}</strong><small>{current.channel}</small></div>
      <p>{current.action}</p>
      <div className="protocol-step-evidence">
        <div><span>ILLUSTRATIVE EXCHANGE</span><pre>{current.example}</pre></div>
        <div><span>CHECK</span><p>{current.check}</p><span>RESULT</span><p>{current.result}</p></div>
      </div>
    </section>
    {afterDetail}
    {beforeDiagram}
    <div className="sequence-guide"><span>Follow the arrows from top to bottom.</span><span>Select any handoff to inspect its check and result.</span></div>
    <div className="sequence-diagram" role="group" aria-label={label} ref={diagramRef}>
      <div className="sequence-lanes">{lanes.map(lane => <strong key={lane}>{lane}</strong>)}</div>
      <div className="sequence-events">
        <div className="sequence-lifelines" aria-hidden="true">{lanes.map(lane => <span key={lane} />)}</div>
        {steps.map((step, index) => {
          const fromX = laneX(step.fromLane)
          const toX = laneX(step.toLane)
          const self = fromX === toX
          return <button
            type="button"
            key={step.phase}
            ref={selected === index ? selectedRef : undefined}
            className={`sequence-event ${selected === index ? 'selected' : ''}`}
            aria-pressed={selected === index}
            aria-label={`Step ${step.phase}: ${step.title}, ${step.kind}. ${step.from} to ${step.to}`}
            onClick={() => onSelect(index)}
          >
            <span className="sequence-event-heading"><b>{step.phase}</b><strong>{step.title}</strong><em>{step.kind}</em></span>
            <svg className="sequence-arrow" viewBox="0 0 1000 39" preserveAspectRatio="none" aria-hidden="true">
              <defs><marker id={`sequence-arrow-${index}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" /></marker></defs>
              {self
                ? <path d={`M ${fromX - 36} 5 C ${fromX - 36} 38, ${toX + 36} 38, ${toX + 36} 5`} markerEnd={`url(#sequence-arrow-${index})`} />
                : <line x1={fromX} y1="21" x2={toX + (toX > fromX ? -8 : 8)} y2="21" markerEnd={`url(#sequence-arrow-${index})`} />}
            </svg>
            <span className="sequence-mobile-route">{step.from} <ArrowRight size={14} aria-hidden="true" /> {step.to}</span>
          </button>
        })}
      </div>
    </div>
  </div>
}

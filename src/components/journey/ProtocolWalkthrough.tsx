import type { ReactNode } from 'react'
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

export function ProtocolWalkthrough({ steps, selected, actions, boundary }: {
  steps: readonly ProtocolStep[]
  selected: number
  actions?: ReactNode
  boundary?: ReactNode
}) {
  const current = steps[selected]

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
    {actions}
    {boundary}
  </div>
}

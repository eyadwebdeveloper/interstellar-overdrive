import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrewStore } from '../stores/crewStore'
import { useProgressStore } from '../stores/progressStore'
import { getDailyQuestion } from '../data/crewActivities'

type Intent = 'refresh' | 'think' | 'connect' | 'unwind'
const WINDOWS = [5, 10, 20, 30]
const LABEL: Record<Intent, string> = { refresh: 'Refresh', think: 'Think', connect: 'Connect', unwind: 'Unwind' }

export default function Today() {
  const member = useCrewStore((s) => s.getActiveMember())
  const day = useCrewStore((s) => s.getMissionDay())
  const due = useProgressStore((s) => s.getDueSkills(member.id).length)
  const [minutes, setMinutes] = useState(10)

  const hour = new Date().getHours()
  const late = hour >= 22 || hour < 5
  const best: Intent = late ? 'unwind' : due > 0 ? 'refresh' : minutes >= 10 ? 'connect' : 'unwind'

  const items: Record<Intent, { title: string; why: string; to: string }> = {
    refresh: {
      title: `${Math.min(minutes, 8)}-minute skill review`,
      why: due > 0 ? `${due} skill${due > 1 ? 's are' : ' is'} due before ${due > 1 ? 'they fade' : 'it fades'}.` : 'Nothing is overdue. A short review keeps it that way.',
      to: '/academy',
    },
    think: { title: 'Find the structure', why: 'Hunt through the skeleton and nerves. Nothing is logged.', to: '/body?mode=find' },
    connect: { title: 'Today\u2019s question for the crew', why: getDailyQuestion(day), to: '/crew' },
    unwind: { title: 'Quiet room', why: 'Low light, no score, nothing to finish.', to: '/quiet' },
  }

  return (
    <section className="today">
      <h1>Day {day}</h1>
      <p className="lede">{late ? 'It is late. Something quiet will help more than something clever.' : 'You have a gap in the schedule. How long is it?'}</p>
      <div className="window" role="group" aria-label="Minutes available">
        {WINDOWS.map((m) => (
          <button key={m} aria-pressed={m === minutes} onClick={() => setMinutes(m)}>{m} min</button>
        ))}
      </div>
      <div className="strips">
        {(Object.keys(items) as Intent[]).map((k) => (
          <article key={k} className="strip" data-i={k} data-best={k === best ? '' : undefined}>
            {k === best && <span className="fit">{late ? 'best for tonight' : `fits ${minutes} minutes`}</span>}
            <div className="tab">{LABEL[k]}</div>
            <div className="body"><h3>{items[k].title}</h3><p className="why">{items[k].why}</p></div>
            <Link className="go" to={items[k].to}>Start</Link>
          </article>
        ))}
      </div>
      <p className="fineprint">Nothing on this page is shared. Your history stays on this device unless you send it.</p>
    </section>
  )
}

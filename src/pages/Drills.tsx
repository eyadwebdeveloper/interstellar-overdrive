import { useState } from 'react'
import { MEDICAL_MODULES, type MedicalScenario } from '../data/medicalModules'
import { useCrewStore } from '../stores/crewStore'
import { useProgressStore } from '../stores/progressStore'

interface ScenarioChoice {
  optionIndex: number
  feedback: string
  correct: boolean
}

interface ActiveScenario {
  scenario: MedicalScenario
  moduleTitle: string
  moduleId: string
}

const SCENARIOS = MEDICAL_MODULES.flatMap((module) =>
  module.scenarios.map((scenario) => ({
    scenario,
    moduleTitle: module.title,
    moduleId: module.id,
  })),
)

export default function Drills() {
  const member = useCrewStore((state) => state.getActiveMember())
  const markModuleComplete = useProgressStore((state) => state.markModuleComplete)
  const addQuizAttempt = useProgressStore((state) => state.addQuizAttempt)
  const isModuleComplete = useProgressStore((state) => state.isModuleComplete)
  const [active, setActive] = useState<ActiveScenario | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [choices, setChoices] = useState<ScenarioChoice[]>([])
  const [showDebrief, setShowDebrief] = useState(false)

  function startScenario(item: ActiveScenario) {
    setActive(item)
    setStepIndex(0)
    setChoices([])
    setShowDebrief(false)
  }

  function selectOption(optionIndex: number) {
    if (!active || choices[stepIndex]) return
    const option = active.scenario.steps[stepIndex].options[optionIndex]
    setChoices((current) => [
      ...current,
      { optionIndex, feedback: option.feedback, correct: option.correct },
    ])
  }

  function finishScenario() {
    if (!active) return
    const correctAnswers = choices.filter((choice) => choice.correct).length
    markModuleComplete(member.id, active.moduleId)
    addQuizAttempt({
      moduleId: active.moduleId,
      crewMemberId: member.id,
      score: correctAnswers,
      totalQuestions: active.scenario.steps.length,
    })
    setActive(null)
  }

  if (active) {
    const { scenario } = active
    const step = scenario.steps[stepIndex]
    const choice = choices[stepIndex]
    const groundChoices = scenario.steps.map((scenarioStep) =>
      scenarioStep.options.find((option) => option.correct)?.text,
    ).filter((text): text is string => Boolean(text))

    return (
      <section className="drills">
        <p className="training-notice">
          Training use only. Follow official procedures in a real emergency.
        </p>
        <button className="drills-back" onClick={() => setActive(null)}>Back to scenarios</button>
        <p className="drills-kicker">{active.moduleTitle} · Mission day {scenario.missionDay}</p>
        <h1>{scenario.title}</h1>
        <p className="drills-description">{scenario.description}</p>

        {!showDebrief ? (
          <div className="drills-step">
            <p className="drills-step-count">Step {stepIndex + 1} of {scenario.steps.length}</p>
            <p className="drills-narrative">{step.narrative}</p>
            <h2>{step.question}</h2>
            <div className="drills-options" role="group" aria-label="Choose a response">
              {step.options.map((option, index) => (
                <button
                  className="drills-option"
                  key={option.text}
                  type="button"
                  aria-pressed={choice?.optionIndex === index}
                  disabled={Boolean(choice)}
                  onClick={() => selectOption(index)}
                >
                  {option.text}
                </button>
              ))}
            </div>
            {choice && (
              <div className="drills-feedback" role="status">
                <strong>{choice.correct ? 'That matches this scenario.' : 'Review this choice.'}</strong>
                <p>{choice.feedback}</p>
                <button
                  className="drills-action"
                  onClick={() => {
                    if (stepIndex === scenario.steps.length - 1) setShowDebrief(true)
                    else setStepIndex((current) => current + 1)
                  }}
                >
                  {stepIndex === scenario.steps.length - 1 ? 'View debrief' : 'Continue'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="drills-debrief">
            <div className="ground-reply">
              <strong>Ground replies in 18 min</strong>
              <p>This simulated review may differ from the crew’s choices. In this scenario, Ground expected:</p>
              <ul>
                {groundChoices.map((text, index) => <li key={`${index}-${text}`}>{text}</li>)}
              </ul>
              <p className="ground-note">This is a fictional training response, not real medical guidance.</p>
            </div>
            <h2>Debrief</h2>
            <ol className="debrief-list">
              {scenario.steps.map((scenarioStep, index) => {
                const selected = choices[index]
                const option = scenarioStep.options[selected.optionIndex]
                return (
                  <li key={`${scenario.id}-${index}`}>
                    <h3>{scenarioStep.question}</h3>
                    <p><strong>Your choice:</strong> {option.text}</p>
                    <p><strong>Feedback:</strong> {selected.feedback}</p>
                  </li>
                )
              })}
            </ol>
            <button className="drills-action" onClick={finishScenario}>Complete scenario</button>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="drills">
      <p className="training-notice">
        Training use only. Follow official procedures in a real emergency.
      </p>
      <p className="drills-kicker">Scenario practice</p>
      <h1>Drills</h1>
      <p className="drills-description">Work through a simulated event, then review your choices.</p>
      {SCENARIOS.length === 0 ? (
        <p className="drills-empty">No scenarios are available yet.</p>
      ) : (
        <div className="drills-list">
          {SCENARIOS.map((item) => {
            const complete = isModuleComplete(member.id, item.moduleId)
            return (
              <article className="drills-card" key={item.scenario.id}>
                <p className="drills-kicker">{item.moduleTitle} · Mission day {item.scenario.missionDay}</p>
                <h2>{item.scenario.title}</h2>
                <p>{item.scenario.description}</p>
                <div className="drills-card-footer">
                  <span>{item.scenario.steps.length} {item.scenario.steps.length === 1 ? 'step' : 'steps'}{complete ? ' · Module complete' : ''}</span>
                  <button className="drills-action" onClick={() => startScenario(item)}>Start scenario</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

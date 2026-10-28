import { steps } from "../lib/content";

export function StepList({ detailed = false }: { detailed?: boolean }) {
  return (
    <ol className={`step-list${detailed ? " step-list-detailed" : ""}`}>
      {steps.map((step) => (
        <li className="step" key={step.number}>
          <span className="step-number" aria-hidden="true">
            {step.number}
          </span>
          <div className="step-body">
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
          <span className={`step-actor actor-${step.actor === "Kamu" ? "you" : step.actor === "AI + tim" ? "ai" : "team"}`}>
            {step.actor}
          </span>
        </li>
      ))}
    </ol>
  );
}

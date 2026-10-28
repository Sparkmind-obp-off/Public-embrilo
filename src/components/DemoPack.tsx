import { useRef, useState, type KeyboardEvent } from "react";
import { Info } from "lucide-react";
import { demoBrand, demoIdeas } from "../lib/content";

/** Accessible tabs (WAI-ARIA pattern) showing a clearly-labelled fictional pack. */
export function DemoPack() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = demoIdeas.length - 1;
    let next = active;
    if (event.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (event.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const idea = demoIdeas[active];

  return (
    <div className="demo-pack">
      <aside className="demo-brief" aria-label="Brief contoh">
        <span className="demo-badge">Contoh ilustrasi · brand fiktif</span>
        <h3>{demoBrand.name}</h3>
        <dl>
          <div>
            <dt>Produk</dt>
            <dd>{demoBrand.product}</dd>
          </div>
          <div>
            <dt>Audiens</dt>
            <dd>{demoBrand.audience}</dd>
          </div>
        </dl>
        <p className="demo-note">
          <Info size={16} aria-hidden="true" />
          {demoBrand.note}
        </p>
      </aside>

      <div className="demo-output">
        <div role="tablist" aria-label="Ide dalam paket contoh" className="demo-tabs" onKeyDown={onKeyDown}>
          {demoIdeas.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={active === index}
              aria-controls={`panel-${item.id}`}
              tabIndex={active === index ? 0 : -1}
              className="demo-tab"
              onClick={() => setActive(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${idea.id}`} aria-labelledby={`tab-${idea.id}`} tabIndex={0} className="demo-panel">
          <div className="demo-field">
            <span className="demo-field-label">Hook</span>
            <p className="demo-hook">{idea.hook}</p>
          </div>
          <div className="demo-field">
            <span className="demo-field-label">Alur adegan</span>
            <ol className="demo-scenes">
              {idea.scenes.map((scene) => (
                <li key={scene}>{scene}</li>
              ))}
            </ol>
          </div>
          <div className="demo-field-row">
            <div className="demo-field">
              <span className="demo-field-label">Caption</span>
              <p>{idea.caption}</p>
            </div>
            <div className="demo-field">
              <span className="demo-field-label">CTA</span>
              <p>{idea.cta}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

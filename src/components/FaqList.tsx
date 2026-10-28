import { useId, useState } from "react";
import { Plus } from "lucide-react";
import type { Faq } from "../lib/content";

export function FaqList({ items, defaultOpen = 0 }: { items: Faq[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();

  return (
    <div className="faq-list">
      {items.map((faq, index) => {
        const isOpen = open === index;
        const buttonId = `${baseId}-q-${index}`;
        const panelId = `${baseId}-a-${index}`;
        return (
          <div className={`faq-item${isOpen ? " is-open" : ""}`} key={faq.q}>
            <h3 className="faq-heading">
              <button
                id={buttonId}
                type="button"
                className="faq-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span>{faq.q}</span>
                <Plus className="faq-icon" size={20} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} className="faq-panel" hidden={!isOpen}>
              <p>{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

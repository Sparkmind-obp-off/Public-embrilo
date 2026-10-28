import { ArrowUpRight, Check } from "lucide-react";
import type { Service } from "../lib/content";
import { Link } from "../lib/router";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="service-card" aria-labelledby={`svc-${service.code}`}>
      <span className="service-number" aria-hidden="true">
        {service.number}
      </span>
      <h3 id={`svc-${service.code}`}>{service.title}</h3>
      <p className="service-summary">{service.summary}</p>
      <ul className="check-list">
        {service.deliverables.slice(0, 3).map((item) => (
          <li key={item}>
            <Check size={16} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <Link to={`/brief?layanan=${service.code}`} className="service-link">
        Mulai dengan layanan ini <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

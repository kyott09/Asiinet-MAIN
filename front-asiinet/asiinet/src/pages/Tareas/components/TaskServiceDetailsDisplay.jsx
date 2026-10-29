import { getTaskServiceDetailEntries } from "../../../../../../shared/taskServiceDetails.js";

function TaskServiceDetailsDisplay({ service, serviceDetails }) {
  const entries = getTaskServiceDetailEntries(service, serviceDetails);
  if (!entries.length) return <span className="tasks-detail-empty">Sin detalles específicos</span>;

  return (
    <details className="tasks-service-details-summary">
      <summary>Ver detalles</summary>
      <dl>
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt>{entry.label}</dt>
            <dd>{entry.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export default TaskServiceDetailsDisplay;

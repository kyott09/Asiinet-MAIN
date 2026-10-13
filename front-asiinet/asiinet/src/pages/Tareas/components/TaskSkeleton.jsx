function TaskSkeleton() {
  return (
            <div className="tasks-skeleton" role="status" aria-label="Cargando tareas">
              <div className="tasks-skeleton-table" aria-hidden="true">
                {Array.from({ length: 3 }, (_, row) => (
                  <div className="tasks-skeleton-row" key={row}>
                    {Array.from({ length: 7 }, (_, column) => (
                      <span className="tasks-skeleton-bar" key={column}></span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="tasks-skeleton-cards" aria-hidden="true">
                {Array.from({ length: 3 }, (_, card) => (
                  <div className="tasks-skeleton-card" key={card}>
                    <span className="tasks-skeleton-bar tasks-skeleton-bar-short"></span>
                    <span className="tasks-skeleton-bar"></span>
                    <span className="tasks-skeleton-bar tasks-skeleton-bar-medium"></span>
                  </div>
                ))}
              </div>
            </div>
  );
}

export default TaskSkeleton;

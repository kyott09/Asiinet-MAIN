import TaskServiceDetailsDisplay from "./TaskServiceDetailsDisplay";
import { formatTaskVisit } from "../../../../../../shared/taskVisitSlots.js";

function TaskCards({ filteredTasks, pageTitle, isClient, getTaskStatusLabel, canClientEditTask, handleEdit, canDeleteTask, requestDelete, deletingId }) {
  return (
              <div className="tasks-mobile-list" aria-label="Listado de tareas">
                {filteredTasks.map((task) => (
                  <article className="tasks-mobile-item" key={task.id}>
                    <div className="tasks-mobile-heading">
                      <div>
                        <p className="tasks-mobile-service">
                          {pageTitle.slice(0, -1)} n.º {task.number} · {task.service}
                        </p>
                        <h3>{task.client}</h3>
                      </div>
                      {isClient ? (
                        <span className={`tasks-status tasks-status-${String(task.status ?? "").toLowerCase().replaceAll(" ", "-")}`}>
                          {getTaskStatusLabel(task.status)}
                        </span>
                      ) : (
                        <span className={`tasks-status tasks-status-${task.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {task.status}
                        </span>
                      )}
                    </div>

                    <dl className="tasks-mobile-summary">
                      <div>
                        <dt>Visita</dt>
                        <dd>{formatTaskVisit(task.visitDate, task.visitTimeSlot)}</dd>
                      </div>
                      {!isClient && (
                        <>
                          <div>
                            <dt>Prioridad</dt>
                            <dd>
                              <span className={`tasks-priority tasks-priority-${String(task.priority ?? "").toLowerCase()}`}>
                                {task.priority || "Sin asignar"}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt>Finalización</dt>
                            <dd>{task.dueDate || "Sin fecha"}</dd>
                          </div>
                          <div>
                            <dt>Empleado asignado</dt>
                            <dd>{task.employee || "Sin asignar"}</dd>
                          </div>
                        </>
                      )}
                    </dl>

                    <details className="tasks-mobile-details">
                      <summary>Detalles de la {pageTitle.toLowerCase().slice(0, -1)}</summary>
                      <dl>
                        <div>
                          <dt>Fecha de creación</dt>
                          <dd>{task.createdAt}</dd>
                        </div>
                        <div>
                          <dt>Estado</dt>
                          <dd>{isClient ? getTaskStatusLabel(task.status) : task.status}</dd>
                        </div>
                        <div>
                          <dt>Descripción</dt>
                          <dd>{task.description}</dd>
                        </div>
                        <div>
                          <dt>Detalles del servicio</dt>
                          <dd><TaskServiceDetailsDisplay service={task.service} serviceDetails={task.serviceDetails} /></dd>
                        </div>
                      </dl>
                    </details>

                    <div className="tasks-actions tasks-mobile-actions">
                      {(isClient ? canClientEditTask(task) : true) && (
                        <button
                          type="button"
                          onClick={() => handleEdit(task)}
                          aria-label={`Editar tarea número ${task.number}`}
                        >
                          Editar
                        </button>
                      )}
                      {canDeleteTask && (
                        <button
                          className="tasks-delete"
                          type="button"
                          onClick={(event) => requestDelete(task, event)}
                          disabled={deletingId === task.id}
                          aria-label={`Eliminar tarea número ${task.number}`}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
  );
}

export default TaskCards;

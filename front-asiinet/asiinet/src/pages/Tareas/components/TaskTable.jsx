import TaskServiceDetailsDisplay from "./TaskServiceDetailsDisplay";

function TaskTable({ filteredTasks, isClient, getTaskStatusLabel, canClientEditTask, handleEdit, canDeleteTask, requestDelete, deletingId }) {
  return (
              <div className="tasks-table-wrap" role="region" aria-label="Listado de tareas" tabIndex="0">
                <table className="tasks-table">
                <thead>
                  <tr>
                    <th scope="col">N.º</th>
                    <th scope="col">Cliente</th>
                    {!isClient && <th scope="col">Empleado asignado</th>}
                    <th scope="col">Creación</th>
                    {!isClient && <th scope="col">Finalización</th>}
                    <th scope="col">Servicio</th>
                    {!isClient && <th scope="col">Prioridad</th>}
                    <th scope="col">Estado</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Detalles del servicio</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.number}</td>
                      <td>{task.client}</td>
                      {!isClient && <td>{task.employee || "Sin asignar"}</td>}
                      <td>{task.createdAt}</td>
                      {!isClient && <td>{task.dueDate}</td>}
                      <td>{task.service}</td>
                      {!isClient && (
                        <td>
                          <span className={`tasks-priority tasks-priority-${String(task.priority ?? "").toLowerCase()}`}>
                            {task.priority || "Sin asignar"}
                          </span>
                        </td>
                      )}
                      <td>
                        <span className={`tasks-status tasks-status-${String(task.status ?? "").toLowerCase().replaceAll(" ", "-")}`}>
                          {isClient ? getTaskStatusLabel(task.status) : task.status}
                        </span>
                      </td>
                      <td>{task.description}</td>
                      <td><TaskServiceDetailsDisplay service={task.service} serviceDetails={task.serviceDetails} /></td>
                      <td>
                        <div className="tasks-actions">
                          {isClient && canClientEditTask(task) && (
                            <button
                              type="button"
                              onClick={() => handleEdit(task)}
                              aria-label={`Editar tarea número ${task.number}`}
                            >
                              Editar
                            </button>
                          )}
                          {!isClient && (
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
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
  );
}

export default TaskTable;

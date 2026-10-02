import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const services = [
  {
    title: "Instalación",
    description: "Altas de servicio para clientes residenciales y comerciales.",
  },
  {
    title: "Reconexión",
    description: "Restablecimiento rápido del servicio ante cortes o bajas temporales.",
  },
  {
    title: "Service técnico",
    description: "Mantenimiento y resolución de fallas en la conexión del cliente.",
  },
  {
    title: "Desconexión",
    description: "Bajas de servicio gestionadas de forma prolija y trazable.",
  },
];

const highlights = [
  {
    title: "Órdenes de trabajo",
    description:
      "Cada pedido genera una orden con número único, fecha, móvil asignado y el detalle de las tareas realizadas, siguiendo el flujo: nueva → vista → en proceso → terminada / no terminada.",
  },
  {
    title: "Móviles y equipos",
    description:
      "Los trabajos se asignan a móviles formados por 2 o 3 empleados y un vehículo, con integrantes que pueden rotar según disponibilidad del personal.",
  },
  {
    title: "Ranking de rendimiento",
    description:
      "Los empleados eligen su próxima tarea dentro de su pool asignado. El sistema mide la productividad semanal y prioriza técnicos destacados para clientes premium.",
  },
  {
    title: "Stock y vehículos",
    description:
      "Control de materiales (precintos, tarugos, módems, routers) con alertas de reposición, y seguimiento de cada vehículo: verificación técnica, neumáticos y mantenimiento.",
  },
];

function Home() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main className="dashboard-content">
        <AccountActions />
        <section style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
        <h1>Asiinet</h1>
        <p style={{ fontSize: "18px", lineHeight: 1.6 }}>
          Asiinet es una contratista dedicada a brindar servicio de internet por cable a clientes
          residenciales y comerciales. Este panel centraliza la recepción de pedidos, la
          planificación de trabajos, el control de stock y vehículos, y la gestión de personal, para
          reemplazar los procesos en papel por un sistema con trazabilidad completa.
        </p>
        </section>

      <section style={{ maxWidth: "900px", margin: "48px auto 0" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Qué gestiona el sistema</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {highlights.map((item) => (
            <div
              key={item.title}
              style={{
                border: "1px solid #13110F",
                borderRadius: "12px",
                padding: "18px",
                textAlign: "left",
                background: "linear-gradient(180deg, #fff 0%, rgba(246, 92, 23, 0.06) 100%)",
                boxShadow: "0 10px 22px rgba(19, 17, 15, 0.04)",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: "17px", color: "var(--text-h, #08060d)" }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.5 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "900px", margin: "48px auto 0" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Tipos de trabajo</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          {services.map((service) => (
            <div
              key={service.title}
              style={{
                background: "linear-gradient(135deg, rgba(246, 92, 23, 0.12) 0%, #fff 100%)",
                border: "1px solid #13110F",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 8px 18px rgba(246, 92, 23, 0.08)",
              }}
            >
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "var(--text-h, #08060d)" }}>
                {service.title}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>{service.description}</p>
            </div>
          ))}
        </div>
      </section>
      </main>
    </div>
  );
}

export default Home;
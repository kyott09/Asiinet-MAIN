import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { VehicleModel } from "../vehicle-model/vehicle-model.entity";

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  patente!: string;

  @Column({ type: "varchar" })
  color!: string;

  @Column({ type: "text", nullable: true })
  descripcion!: string | null;

  @Column({ type: "varchar" })
  estado!: string; // ej: "disponible", "en_uso", "mantenimiento"

  // Cada vehículo pertenece a un solo modelo.
  @ManyToOne(() => VehicleModel)
  @JoinColumn({ name: "vehicle_model_id" })
  vehicleModel!: VehicleModel;

  // FK simple (sin relación todavía) para una futura asignación a un empleado.
  @Column({ type: "integer", nullable: true })
  employee_id!: number | null;
}
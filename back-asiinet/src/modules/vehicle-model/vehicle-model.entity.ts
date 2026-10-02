import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Brand } from "../brand/brand.entity.js";

@Entity("vehicle_models")
export class VehicleModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  descripcion!: string;

  // Cada modelo pertenece a una sola marca.
  @ManyToOne(() => Brand)
  @JoinColumn({ name: "brand_id" })
  brand!: Brand;
}
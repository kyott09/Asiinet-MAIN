import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("brands")
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  descripcion!: string;
}
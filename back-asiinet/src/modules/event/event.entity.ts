import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity.js";

@Entity("eventos")
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120 })
  titulo!: string;

  @Column({ type: "varchar", length: 30 })
  tipo!: string;

  @Column({ type: "date" })
  fecha!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  descripcion!: string | null;

  @Column({ type: "int" })
  creadorId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "creadorId" })
  creador!: User;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}

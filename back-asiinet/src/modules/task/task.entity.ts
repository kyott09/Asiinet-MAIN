import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { User } from "../user/user.entity.js";

@Entity("tareas")
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 160 })
  client!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "clientId" })
  clientUser!: User | null;

  @RelationId((task: Task) => task.clientUser)
  clientId!: number | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  employee!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "employeeId" })
  employeeUser!: User | null;

  @RelationId((task: Task) => task.employeeUser)
  employeeId!: number | null;

  @Column({ type: "date" })
  createdAt!: string;

  @Column({ type: "date" })
  dueDate!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 80 })
  service!: string;

  @Column({ type: "varchar", length: 20 })
  priority!: string;

  @Column({ type: "varchar", length: 40 })
  status!: string;
}
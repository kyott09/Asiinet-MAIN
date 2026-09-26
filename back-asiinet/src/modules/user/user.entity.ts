import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";


@Entity("usuarios")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;


  @Column({ type: "varchar", nullable: true, default: "Usuario" })
  nombre!: string;


  @Column({ type: "varchar", unique: true })
  email!: string;


  @Column({type: "varchar"})
  passwordHash!: string;


  @Column({ type: "varchar", default: "user" })
  role!: string;


  @Column({ type: "date", nullable: true })
  fechaNacimiento!: Date | null;


  @Column({ type: "varchar", nullable: true })
  domicilio!: string | null;


  @Column({ type: "text", nullable: true })
  fotoPerfil!: string | null;


  @CreateDateColumn()
  creadoEn!: Date;
}

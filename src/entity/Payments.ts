import {Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp} from 'typeorm';

@Entity('payments')
export class Payments {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column("varchar", { name: "pay_mode" ,nullable: false })
    paymentMode: string;

    @Column("varchar", { name: "amount" ,nullable: false })
    amount: string;

    @Column("varchar", { name: "status" ,nullable: false })
    status: string;

    @Column("varchar", { name: "payment_session_id" ,nullable: false })
    paymentSessionId: string;

    @Column("int", { name: "user_id" ,nullable: false })
    userId: number;

    @Column('timestamp', { name: "created_at", primary: false, nullable: true })
    createdDate: Date;

    @Column('timestamp', { name: "updated_at", primary: false, nullable: true })
    updatedDate: Date;

}

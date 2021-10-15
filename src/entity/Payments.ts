import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import { Orders } from './Orders';

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

    @OneToOne(type => Orders, orders =>  orders.payment)
    @JoinColumn({ name: "id"})
    orders: Orders;

}

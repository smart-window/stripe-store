import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import { OrderDetails } from './OrdersDetails';
import { Payments } from './Payments';

@Entity('orders')
export class Orders {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('int', { name: "userid" ,nullable: false })
    userId: number;
    
    @OneToOne(type => Payments, payments => payments.orders)
    @JoinColumn({ name: "paymentid"})
    payment: Payments;
    
    @Column('int', { name: "paymentid" ,nullable: false })
    paymentId: number;

    @Column("varchar", { name: "status" ,nullable: false })
    status: string;
   
    @Column('timestamp', { name: "created_at", primary: false, nullable: true })
    createdDate: Date; 

    @Column('timestamp', { name: "updated_at", primary: false, nullable: true })
    updatedDate: Date;

    @OneToMany(type => OrderDetails, orderDetails =>  orderDetails.orders)
    orderDetails: OrderDetails[];

    
}

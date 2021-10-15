import {Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import { OrderDetails } from './OrdersDetails';

@Entity('orders')
export class Orders {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('int', { name: "userid" ,nullable: false })
    userId: number;
    
    @Column('int', { name: "paymentid" ,nullable: false })
    paymentId: number;
   
    @Column('timestamp', { name: "created_at", primary: false, nullable: true })
    createdDate: Date;

    @OneToMany(type => OrderDetails, orderDetails =>  orderDetails.orders)
    orderDetails: OrderDetails[];
    
}

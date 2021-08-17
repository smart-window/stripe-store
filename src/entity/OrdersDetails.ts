import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import { Orders } from './Orders';
import { Products } from './Products';

@Entity('orderdetail')
export class OrderDetails {
    @PrimaryGeneratedColumn('increment')
    id: number;
    
    @ManyToOne(type => Orders, orders =>  orders.orderDetails)
    @JoinColumn({ name: "order_id"})
    orders: Orders;

    @OneToOne(type => Products, products => products.orderDetails)
    @JoinColumn({ name: "product_id"})
    product: Products;

    @Column('int', { name: "product_id" ,nullable: false })
    productId: number;

    @Column('int', { name: "order_id" ,nullable: false })
    orderId: number;
    
    @Column('int', { name: "quantity" ,nullable: false })
    quantity: number;
   
    @Column('timestamp', { name: "created_at", primary: false, nullable: true })
    createdDate: Date;


}

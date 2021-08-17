import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import { CartItems } from './CartItems';
import { OrderDetails } from './OrdersDetails';

@Entity('products')
export class Products {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column("varchar",{ name: "name" ,nullable: false })
    name: string;

    @Column("varchar",{ name: "price" ,nullable: false })
    price: string;

    @Column('varchar', { name: "category" ,nullable: false })
    category: string;

    @Column('varchar', { name: "image" ,nullable: false })
    image: string;

    @OneToMany(type => CartItems, cartItems =>  cartItems.product)
    @JoinColumn({ name: "id"})
    cartItems: CartItems[];

    @OneToMany(type => OrderDetails, orderDetails =>  orderDetails.product)
    @JoinColumn({ name: "id"})
    orderDetails: OrderDetails[];

}

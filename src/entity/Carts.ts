import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import { CartItems } from './CartItems';

@Entity('carts')
export class Carts {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('int', { name: "userid" ,nullable: false })
    userId: number;
   
    @Column('timestamp', { name: "created_date", primary: false, nullable: true })
    createdDate: Date;

    @OneToMany(type => CartItems, cartItems =>  cartItems.cart)
    cartItems: CartItems[];
}

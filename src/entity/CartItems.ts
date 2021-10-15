import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import { Carts } from './Carts';
import { Products } from './Products';

@Entity('cart_items')
export class CartItems {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @OneToOne(type => Products, products =>  products.cartItems)
    @JoinColumn({ name: "product_id"})
    product: Products;

    @ManyToOne(type => Carts, carts =>  carts.cartItems)
    @JoinColumn({ name: "cart_id"})
    cart: Carts;
    
    @Column("int", { name: "cart_id" ,nullable: false })
    cartId: number;
    
    @Column("int", { name: "quantity" ,nullable: false })
    quantity: number;

    @Column('int', { name: "product_id" ,nullable: false })
    productId: number;
   
    @Column('timestamp', { name: "created_date", primary: false, nullable: false })
    createdDate: Date;



}

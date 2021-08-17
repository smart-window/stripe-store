import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Timestamp} from 'typeorm';

@Entity('users')
export class Users {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar', { name: "first_name" ,nullable: false })
    firstName: string;

    @Column('varchar', { name: "last_name" ,nullable: false })
    lastName: string;
   

}

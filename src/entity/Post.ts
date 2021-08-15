import {Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import {User} from './User';
import {Comment} from './Comment';

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column('varchar')
    title: string;
    @Column('text')
    content: string;
    @Column('int')
    authorId: number;
    @CreateDateColumn()
    createdAt: Timestamp;
    @CreateDateColumn()
    updatedAt: Timestamp;
    @ManyToOne('User', 'posts')
    author: User;  // a post belongs to a user
    @OneToMany('Comment', 'post')
    comments: Comment[];  // a post has many comments


    constructor(authorId: number, title: string, content: string) {
        this.authorId = authorId;
        this.title = title;
        this.content = content;
    }
}

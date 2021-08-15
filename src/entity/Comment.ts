import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Timestamp} from 'typeorm';
import {User} from './User';
import {Post} from './Post';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column('int')
    userId: number;
    @Column('int')
    postId: number;
    @Column('text')
    content: string;
    @CreateDateColumn()
    createdAt: Timestamp;
    @CreateDateColumn()
    updatedAt: Timestamp;
    @ManyToOne('User', 'comments')
    user: User;  // a comment belongs to a user
    @ManyToOne('Post', 'comments')
    post: Post;  // a comment belongs to a post

    constructor(userId: number, postId: number, content: string) {
        this.userId = userId;
        this.postId = postId;
        this.content = content;
    }

}

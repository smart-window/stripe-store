import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Timestamp
} from 'typeorm';
import { Post } from './Post';
import { Comment } from './Comment';
// import getDatabaseConnection from 'lib/getDatabaseConnection';
import _ from 'lodash';
import md5 from 'md5';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('increment')
    id: number;
    @Column('varchar')
    username: string;
    @Column('varchar')
    passwordDigest: string;
    @CreateDateColumn()
    createdAt: Timestamp;
    @CreateDateColumn()  // Ctrl + Alt + B  ==> go to implements  默认timestamp
    updatedAt: Timestamp;
    // overcome circular dependency issues
    // @OneToMany(() => Post, post => post.author)
    @OneToMany('Post', 'author')
    posts: Post[];  // a user has many posts
    @OneToMany('Comment', 'user')
    comments: Comment[];  // a user has many comments

    constructor(username: string, passwordDigest: string) {
        this.username = username;
        this.passwordDigest = passwordDigest;
    }

    password: string;
    passwordConfirmation: string;

    DIGEST = 'Frank_Blog_2020';

    errors = {
        username: [] as string[],
        password: [] as string[],
        passwordConfirmation: [] as string[]
    };

    async validate() {
        if (this.username.trim() === '') {
            this.errors.username.push('用户名不能为空！');
        }
        if (!/[_a-zA-Z0-9]/.test(this.username.trim())) {
            this.errors.username.push('用户名必须由字母数字下划线组成！');
        }
        if (this.username.trim().length > 42) {
            this.errors.username.push('用户名太长！');
        }
        if (this.username.trim().length < 4) {
            this.errors.username.push('用户名太短！');
        }
        // Entity里连接数据库可能会存在问题
        //const connection = await getDatabaseConnection();
        //const found = await connection.manager.findOne(User, {username: this.username});
        //if (found) {
        //    this.errors.username.push('用户名已存在！');
        //}
        if (this.password === '') {
            this.errors.password.push('密码不能为空！');
        }
        if (this.passwordConfirmation !== this.password) {
            this.errors.passwordConfirmation.push('密码不匹配！');
        }
    }

    hasErrors() {
        return !!Object.values(this.errors).find(v => v.length > 0);
    }

    @BeforeInsert()
    generatePasswordDigest() {
        this.passwordDigest = md5(this.DIGEST + this.passwordConfirmation);
    }

    toJSON() {
        return _.omit(this, ['password', 'passwordConfirmation', 'passwordDigest', 'errors', 'DIGEST']);
    }
}

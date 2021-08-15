import getDatabaseConnection from 'lib/getDatabaseConnection';
import {User} from 'src/entity/User';
import md5 from 'md5';

export class SignIn {
    username: string;
    password: string;

    user: User;

    errors = {
        username: [] as string[],
        password: [] as string[]
    };

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    async validate() {
        if (this.username.trim() === '') {
            this.errors.username.push('请填写用户名！');
        } else {
            const connection = await getDatabaseConnection();
            const user = await connection.manager.findOne(User, {username: this.username});
            if (user) {
                const passwordDigest = md5(user.DIGEST + this.password);
                if (passwordDigest === user.passwordDigest) {
                    this.user = user;
                } else {
                    this.errors.password.push('密码不匹配！');
                }
            } else {
                this.errors.username.push('用户名不存在！');
            }
        }
    }

    hasErrors() {
        return !!Object.values(this.errors).find(v => v.length > 0);
    }
}
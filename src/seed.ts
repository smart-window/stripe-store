import 'reflect-metadata';
import {createConnection} from 'typeorm';
import {User} from './entity/User';
import {Post} from './entity/Post';
import {Comment} from './entity/Comment';

createConnection().then(async connection => {
    console.log('database connected: ', connection.isConnected);

    // 创建 user 1
    const user = new User('frank', 'b9cbe8d1dfc7c2d531dedfcd4467bf1a');
    // 创建 post 1
    const post = new Post(1, '如何保持健康？', '有4种方式可以保持健康，首先应该坚持锻炼，其次是节食。。。。。。');
    // 创建 comment 1
    const comment = new Comment(1, 1, '我认为节食不是一个聪明的做法，我认为不应该节食。吃饱了才有力气减肥呢。');

    const [, userCount] = await connection.manager.findAndCount(User);
    const [, postCount] = await connection.manager.findAndCount(Post);
    const [, commentCount] = await connection.manager.findAndCount(Comment);

    if (userCount === 0 && postCount === 0 && commentCount === 0) {
        console.log('No data available in three relations, start seeding...');
        const insertUserResult = await connection.manager.save(user);
        console.log(insertUserResult);

        const insertPostResult = await connection.manager.save(post);
        console.log(insertPostResult);

        const insertCommentResult = await connection.manager.save(comment);
        console.log(insertCommentResult);

        console.log('Finished');
    } else {
        await connection.manager.clear(User);
        await connection.manager.clear(Post);
        await connection.manager.clear(Comment);
        console.log('Please do this operation again');
    }

    return await connection.close();
}).catch(error => console.log(error));

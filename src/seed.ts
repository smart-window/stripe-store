import 'reflect-metadata';
import {createConnection} from 'typeorm';

createConnection().then(async connection => {
    //LOG database connected: ', connection.isConnected

    // const user = new User('frank', 'b9cbe8d1dfc7c2d531dedfcd4467bf1a');
    
    // const post = new Post(1, 'Test', 'Test');
    
    // const comment = new Comment(1, 1, 'Test');

    // const [, userCount] = await connection.manager.findAndCount(User);
    // const [, postCount] = await connection.manager.findAndCount(Post);
    // const [, commentCount] = await connection.manager.findAndCount(Comment);

    // if (userCount === 0 && postCount === 0 && commentCount === 0) {
    //     //LOG 'No data available in three relations, start seeding...
    //     const insertUserResult = await connection.manager.save(user);
    //     const insertPostResult = await connection.manager.save(post);
    //     const insertCommentResult = await connection.manager.save(comment);
    // } else {
    //     await connection.manager.clear(User);
    //     await connection.manager.clear(Post);
    //     await connection.manager.clear(Comment);
    // }

    return await connection.close();
}).catch(error => {
    //LOG error
});

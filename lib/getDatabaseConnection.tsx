import {Connection, createConnection, getConnectionManager, getConnectionOptions} from 'typeorm';
import 'reflect-metadata';
import {Post} from 'src/entity/Post';
import {Comment} from 'src/entity/Comment';
import {User} from 'src/entity/User';
import config from 'ormconfig.json';

const connectionManager = getConnectionManager();

const create = async () => {
    // @ts-ignore
    return createConnection({
        ...config,
        entities: [User, Post, Comment]
    });
};

const connectionPromise = (async () => {
    if (connectionManager.has('default')) {
        const connection: Connection = connectionManager.get('default');
        console.log('has default connection, close it whatever then create......');
        await connection.close();
        return create();
    }
    console.log('no connection existed, create a connection......');
    return create();
})();

const getDatabaseConnection = async () => connectionPromise;

export default getDatabaseConnection;


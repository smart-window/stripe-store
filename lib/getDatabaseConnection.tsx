import { Connection, createConnection, getConnectionManager, getConnectionOptions } from 'typeorm';
import 'reflect-metadata';
import config from '../ormconfig.json';
import { Users } from '../src/entity/Users';
import { Payments } from '../src/entity/Payments';
import { OrderDetails } from '../src/entity/OrdersDetails';
import { Orders } from '../src/entity/Orders';
import { Products } from '../src/entity/Products';
import { Carts } from '../src/entity/Carts';
import { CartItems } from '../src/entity/CartItems';

const connectionManager = getConnectionManager();

// const create = async () => {
//     // @ts-ignore
//     return createConnection({
//         ...config,
//         entities: [Users, Payments, OrderDetails, Orders, Products, Carts, CartItems]
//     });
// };

// const connectionPromise = (async () => {
//     if (connectionManager.has('default')) {
//         const connection: Connection = connectionManager.get('default');
//         console.log('has default connection, close it whatever then create......');
//         await connection.close();
//         return create();
//     }
//     console.log('no connection existed, create a connection......');
//     return create();
// })();

// const getDatabaseConnection = async () => connectionPromise;

// export default getDatabaseConnection;

export const getDatabaseConnection = async (optionOverrides: Record<string, any> = {}): Promise<Connection> => {
    const connectionOptions = await getConnectionOptions();
    const options: any = {
        ...connectionOptions,
        entities: [Users, Payments, OrderDetails, Orders, Products, Carts, CartItems],
        ...optionOverrides
    };
    if (connectionManager.has('default')) {
        await connectionManager.get('default').close();
    }
    return await createConnection(options);
};

export default getDatabaseConnection;

//export default getDatabaseConnection;

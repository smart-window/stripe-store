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
const logger = require('pino')()

export const getDatabaseConnection = async (optionOverrides: Record<string, any> = {}): Promise<Connection> => {
    const connectionOptions = await getConnectionOptions();
    const options: any = {
        ...connectionOptions,
        entities: [Users, Payments, OrderDetails, Orders, Products, Carts, CartItems],
        ...optionOverrides
    };
    try {
        if (connectionManager.has('default')) {
            await connectionManager.get('default').close();
        }
    } catch (error) {
        logger.error("ERROR getConnection " + error.message);
    }
    return await createConnection(options);
};

export default getDatabaseConnection;

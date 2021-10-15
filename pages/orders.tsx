import {
    NextPageContext,
    NextComponentType,
} from 'next';
import OrdersPage from '../containers/orders';

interface OrderPageContext extends NextPageContext {
    store: any;
}

const OrderPageContext = () => {
    return <OrdersPage />
}

export async function getStaticProps() {
    return {
        props: { },
    };
}

export default OrderPageContext;

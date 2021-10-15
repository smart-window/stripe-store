import {
    NextPageContext,
    NextComponentType,
} from 'next';
import MyOrdersPage from '../containers/my-orders';

interface MyOrderPageContext extends NextPageContext {
    store: any;
}

const MyOrderPageContext = () => {
    return <MyOrdersPage />
}

export async function getStaticProps() {
    return {
        props: { },
    };
}

export default MyOrderPageContext;

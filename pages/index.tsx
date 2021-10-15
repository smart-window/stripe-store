import {
  NextPageContext,
  NextComponentType,
} from 'next';
import DashboardPage from '../containers/dashboard';

interface IndexPageContext extends NextPageContext {
  store: any;
}

const IndexPageContext = () => {

  return <DashboardPage />
}

export async function getStaticProps() {
  return {
    props: {},
  }
}

export default IndexPageContext
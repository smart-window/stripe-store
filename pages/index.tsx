import {
  NextPageContext,
  NextComponentType,
} from 'next';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import DonatePage from '../containers/shopping-cart';
import { addTodo } from '../actions';
import { Store } from '../store';

interface IndexPageContext extends NextPageContext {
  store: Store;
}

const IndexPage: NextComponentType<IndexPageContext> = compose()(DonatePage);

IndexPage.getInitialProps = ({ store, req }) => {
  const isServer: boolean = !!req;

  return {
    isServer,
  };
}

export default connect()(IndexPage);

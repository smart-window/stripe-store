import {
  NextPageContext,
  NextComponentType,
} from 'next';
import DonatePage from '../containers/shopping-cart';
import { addTodo } from '../actions';
import { initializeStore, useStore } from '../store';

interface IndexPageContext extends NextPageContext {
  store: any;
}

const IndexPageContext = () => {
  return <DonatePage />
}

export async function getStaticProps() {
  const store = initializeStore();
  const { todo } = store.getState();
  store.dispatch(addTodo(Object.assign(todo.item, {
    value: '',
  })));
  return {
    props: {},
  }
}

export default IndexPageContext
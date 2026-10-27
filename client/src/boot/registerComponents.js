import Injector from 'lib/Injector';
import NestedItemList from '../components/NestedItemList';

export default () => {
  Injector.component.registerMany({
    NestedItemList,
  });
};

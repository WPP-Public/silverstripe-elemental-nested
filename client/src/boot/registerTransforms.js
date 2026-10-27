import Injector from 'lib/Injector';
import withNestedItems from '../components/withNestedItems';

export default () => {
  Injector.transform('nested-items-element', (updater) => {
    updater.component('Element', withNestedItems, 'ElementWithNestedItems');
  });
};

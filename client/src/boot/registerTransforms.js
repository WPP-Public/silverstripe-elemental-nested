import Injector from 'lib/Injector';
import withNestedElementContext from '../components/withNestedElementContext';
import withNestedItems from '../components/withNestedItems';

// Extends the standard ElementEditor: Element exposes its record via context,
// and ElementContent renders the nested item editor beneath the block summary
// or inline form so nested items move with the parent block when it is sorted.
export default () => {
  Injector.transform('elemental-nested-items', (updater) => {
    updater.component('Element', withNestedElementContext, 'ElementWithNestedContext');
    updater.component('ElementContent', withNestedItems, 'ElementContentWithNestedItems');
  });
};

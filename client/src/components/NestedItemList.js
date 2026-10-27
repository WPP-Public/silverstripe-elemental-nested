/* global window */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import i18n from 'i18n';
import getJsonErrorMessage from 'lib/getJsonErrorMessage';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import * as api from '../lib/nestedItemApi';
import NestedItem from './NestedItem';
import AddNestedItem from './AddNestedItem';

const notify = (text, type = 'error') => {
  window.jQuery?.noticeAdd({ text, type, stayTime: 5000 });
};

// Events inside the nested editor must not reach the parent Element, which
// would otherwise start dragging the whole block or toggle its inline form.
const stopPropagation = (event) => event.stopPropagation();

const NestedItemList = ({ parentId, areaId, nestedItems, allowedTypes, canAdd }) => {
  const dispatch = useDispatch();
  const [items, setItems] = useState(nestedItems);
  const [expandedId, setExpandedId] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setItems(nestedItems);
  }, [nestedItems]);

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Reload the elemental area so this block (summary, nested items, versioned
  // state badge) reflects the change.
  const reloadArea = useCallback(() => {
    dispatch({ type: 'FORCE_RELOAD', payload: { elementEditorId: areaId } });
  }, [dispatch, areaId]);

  const run = useCallback((request) => {
    setBusy(true);
    return request
      .then((result) => {
        reloadArea();
        return result;
      })
      .catch(async (error) => {
        setItems(nestedItems);
        notify(await getJsonErrorMessage(error));
      })
      .finally(() => setBusy(false));
  }, [nestedItems, reloadArea]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = itemIds.indexOf(active.id);
    const toIndex = itemIds.indexOf(over.id);
    const sorted = arrayMove(items, fromIndex, toIndex);
    const afterId = toIndex > 0 ? sorted[toIndex - 1].id : 0;

    // Render the new order immediately to avoid a "pop" while the area reloads
    setItems(sorted);
    run(api.sortItem(active.id, parentId, afterId));
  }, [itemIds, items, parentId, run]);

  // afterID 0 appends new items to the end of the list
  const handleAdd = useCallback((className) => run(api.createItem(parentId, className, 0))
    .then((result) => {
      if (result?.id) {
        setExpandedId(result.id);
      }
    }), [parentId, run]);

  const handleDelete = useCallback((item) => {
    const message = i18n.inject(
      i18n._t('NestedItemList.CONFIRM_DELETE', 'Are you sure you want to remove this {type}?'),
      { type: item.type.toLowerCase() }
    );
    // eslint-disable-next-line no-alert
    if (!window.confirm(message)) {
      return;
    }

    setItems((current) => current.filter(({ id }) => id !== item.id));
    run(api.deleteItem(item.id));
  }, [run]);

  const handleDuplicate = useCallback((item) => run(api.duplicateItem(item.id)), [run]);

  const handleToggleHidden = useCallback((item) => run(api.toggleHidden(item.id)), [run]);

  // Saves happen with the page save, which shows its own notification
  const handleSaved = reloadArea;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="nested-item-list"
      onPointerDown={stopPropagation}
      onClick={stopPropagation}
      onKeyUp={stopPropagation}
      onKeyDown={stopPropagation}
      aria-busy={busy}
    >
      {items.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <ul className="nested-item-list__items">
              {items.map((item) => (
                <NestedItem
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onDelete={() => handleDelete(item)}
                  onDuplicate={() => handleDuplicate(item)}
                  onToggleHidden={() => handleToggleHidden(item)}
                  onSaved={handleSaved}
                  onValidationError={() => setExpandedId(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {!items.length && (
        <p className="nested-item-list__empty">
          {i18n._t('NestedItemList.EMPTY', 'No items yet')}
        </p>
      )}
      {canAdd && (
        <AddNestedItem allowedTypes={allowedTypes} onAdd={handleAdd} disabled={busy} />
      )}
    </div>
  );
};

NestedItemList.propTypes = {
  parentId: PropTypes.number.isRequired,
  areaId: PropTypes.number.isRequired,
  nestedItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    className: PropTypes.string,
    type: PropTypes.string,
    icon: PropTypes.string,
    title: PropTypes.string,
    summary: PropTypes.string,
    isHidden: PropTypes.bool,
  })).isRequired,
  allowedTypes: PropTypes.arrayOf(PropTypes.shape({
    class: PropTypes.string,
    title: PropTypes.string,
    icon: PropTypes.string,
  })).isRequired,
  canAdd: PropTypes.bool,
};

export default NestedItemList;

import React, { useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import backend from 'lib/Backend';
import Config from 'lib/Config';
import i18n from 'i18n';
import getJsonErrorMessage from 'lib/getJsonErrorMessage';
import { ElementEditorContext } from 'components/ElementEditor/ElementEditor';
import { getControllerLink } from '../state/nestedItemConfig';
import NestedItemRow from './NestedItemRow';
import AddNestedItemButton from './AddNestedItemButton';

const NestedItemList = ({
  parentElementId,
  nestedItems,
  allowedNestedTypes,
  canAddNested,
}) => {
  const { fetchElements } = useContext(ElementEditorContext);
  const [items, setItems] = useState(nestedItems);
  const [expandedId, setExpandedId] = useState(null);

  React.useEffect(() => {
    setItems(nestedItems);
  }, [nestedItems]);

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const refetch = useCallback(() => {
    if (typeof fetchElements === 'function') {
      return fetchElements();
    }
    return Promise.resolve();
  }, [fetchElements]);

  const postJson = useCallback((path, body) => {
    const url = `${getControllerLink()}/${path}`;
    return backend.post(url, body, {
      'X-SecurityID': Config.get('SecurityID'),
    });
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = itemIds.indexOf(active.id);
    const toIndex = itemIds.indexOf(over.id);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const reordered = arrayMove(items, fromIndex, toIndex);
    const afterID = toIndex > 0 ? reordered[toIndex - 1].id : 0;
    setItems(reordered);

    postJson('api/sort', {
      id: active.id,
      parentID: parentElementId,
      afterID,
    })
      .then(() => refetch())
      .catch(async (err) => {
        setItems(nestedItems);
        await getJsonErrorMessage(err);
      });
  }, [itemIds, items, nestedItems, parentElementId, postJson, refetch]);

  const handleCreate = useCallback((className, afterID = 0) => postJson('api/create', {
    parentID: parentElementId,
    className,
    afterID,
  }).then(() => refetch()), [parentElementId, postJson, refetch]);

  const handleDelete = useCallback((id) => postJson('api/delete', { id })
    .then(() => refetch()), [postJson, refetch]);

  const handleDuplicate = useCallback((id) => postJson('api/duplicate', { id })
    .then(() => refetch()), [postJson, refetch]);

  const handleToggleHidden = useCallback((id) => postJson('api/toggleHidden', { id })
    .then(() => refetch()), [postJson, refetch]);

  const handleMoveToParent = useCallback((id, newParentID) => postJson('api/sort', {
    id,
    parentID: newParentID,
    afterID: 0,
  }).then(() => refetch()), [postJson, refetch]);

  const otherParents = useMemo(() => {
    const nodes = document.querySelectorAll('[data-nested-item-list-parent]');
    const parents = [];
    nodes.forEach((node) => {
      const id = parseInt(node.getAttribute('data-nested-item-list-parent'), 10);
      const label = node.getAttribute('data-nested-item-list-label') || `#${id}`;
      if (id && id !== parentElementId) {
        parents.push({ id, label });
      }
    });
    return parents;
  }, [parentElementId, items]);

  const parentLabel = document.querySelector(
    `[data-element-block-id="${parentElementId}"] .element-editor-header__title`
  )?.textContent;

  return (
    <div
      className="nested-item-list"
      data-nested-item-list-parent={parentElementId}
      data-nested-item-list-label={parentLabel || ''}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <NestedItemRow
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onDelete={() => handleDelete(item.id)}
              onDuplicate={() => handleDuplicate(item.id)}
              onToggleHidden={() => handleToggleHidden(item.id)}
              onMoveToParent={(newParentID) => handleMoveToParent(item.id, newParentID)}
              otherParents={otherParents}
              onSaved={() => refetch()}
            />
          ))}
        </SortableContext>
      </DndContext>
      {canAddNested && (
        <AddNestedItemButton
          allowedNestedTypes={allowedNestedTypes}
          onAdd={handleCreate}
          insertAfterId={items.length ? items[items.length - 1].id : 0}
        />
      )}
      {!items.length && (
        <p className="nested-item-list__empty text-muted">
          {i18n._t('NestedItemList.EMPTY', 'No items yet')}
        </p>
      )}
    </div>
  );
};

NestedItemList.propTypes = {
  parentElementId: PropTypes.number.isRequired,
  nestedItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    icon: PropTypes.string,
    title: PropTypes.string,
    summary: PropTypes.string,
    isHidden: PropTypes.bool,
  })).isRequired,
  allowedNestedTypes: PropTypes.arrayOf(PropTypes.shape({
    class: PropTypes.string,
    title: PropTypes.string,
    icon: PropTypes.string,
  })).isRequired,
  canAddNested: PropTypes.bool,
};

export default NestedItemList;

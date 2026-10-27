import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FormBuilderLoader from 'containers/FormBuilderLoader/FormBuilderLoader';
import i18n from 'i18n';
import { loadNestedItemSchemaValue } from '../state/nestedItemConfig';

const NestedItemRow = ({
  item,
  expanded,
  onToggleExpand,
  onDelete,
  onDuplicate,
  onToggleHidden,
  onMoveToParent,
  otherParents,
  onSaved,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSubmit = useCallback((data, action, submitFn) => submitFn().then(() => {
    onSaved();
    return data;
  }), [onSaved]);

  const rowClass = classNames('nested-item-row', {
    'nested-item-row--hidden': item.isHidden,
    'nested-item-row--dragging': isDragging,
    'nested-item-row--expanded': expanded,
  });

  return (
    <div ref={setNodeRef} style={style} className={rowClass} {...attributes}>
      <div className="nested-item-row__header">
        <button
          type="button"
          className="nested-item-row__drag btn btn--no-pad"
          ref={setActivatorNodeRef}
          {...listeners}
          aria-label={i18n._t('NestedItemRow.DRAG', 'Drag to reorder')}
        >
          <span className="font-icon-menu" />
        </button>
        <button
          type="button"
          className="nested-item-row__main"
          onClick={onToggleExpand}
        >
          <span className={classNames('nested-item-row__icon', item.icon)} />
          <span className="nested-item-row__type">{item.type}</span>
          <span className="nested-item-row__summary">{item.summary || item.title}</span>
        </button>
        <div className="nested-item-row__actions">
          <button
            type="button"
            className="btn btn--no-pad nested-item-row__toggle-hidden"
            onClick={(e) => { e.stopPropagation(); onToggleHidden(); }}
            title={item.isHidden
              ? i18n._t('NestedItemRow.SHOW', 'Show item')
              : i18n._t('NestedItemRow.HIDE', 'Hide item')}
          >
            <span className={item.isHidden ? 'font-icon-eye' : 'font-icon-eye-slash'} />
          </button>
          <button
            type="button"
            className="btn btn--no-pad"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title={i18n._t('NestedItemRow.DUPLICATE', 'Duplicate')}
          >
            <span className="font-icon-duplicate" />
          </button>
          <button
            type="button"
            className="btn btn--no-pad"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title={i18n._t('NestedItemRow.DELETE', 'Delete')}
          >
            <span className="font-icon-trash" />
          </button>
          {otherParents.length > 0 && (
            <select
              className="nested-item-row__move"
              defaultValue=""
              onChange={(e) => {
                const parentID = parseInt(e.target.value, 10);
                if (parentID) {
                  onMoveToParent(parentID);
                }
                e.target.value = '';
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">
                {i18n._t('NestedItemRow.MOVE_TO', 'Move to…')}
              </option>
              {otherParents.map((parent) => (
                <option key={parent.id} value={parent.id}>{parent.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      {expanded && (
        <div className="nested-item-row__form" onPointerDown={(evt) => evt.stopPropagation()}>
          <FormBuilderLoader
            formTag="form"
            schemaUrl={loadNestedItemSchemaValue('schemaUrl', item.id)}
            identifier={`nested-item-${item.id}`}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  );
};

NestedItemRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    icon: PropTypes.string,
    title: PropTypes.string,
    summary: PropTypes.string,
    isHidden: PropTypes.bool,
  }).isRequired,
  expanded: PropTypes.bool,
  onToggleExpand: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onToggleHidden: PropTypes.func.isRequired,
  onMoveToParent: PropTypes.func.isRequired,
  otherParents: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    label: PropTypes.string,
  })),
  onSaved: PropTypes.func.isRequired,
};

export default NestedItemRow;

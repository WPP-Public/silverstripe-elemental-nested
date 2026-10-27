import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import i18n from 'i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSelector } from 'react-redux';
import { isDirty } from 'redux-form';
import { getFormName, getFormState } from '../lib/nestedItemApi';
import NestedItemForm from './NestedItemForm';

/**
 * A nested item rendered like a compact elemental block: drag handle, icon,
 * type and summary, with actions on the right and the inline edit form below
 * when expanded.
 */
const NestedItem = ({
  item,
  expanded,
  onToggleExpand,
  onDelete,
  onDuplicate,
  onToggleHidden,
  onSaved,
  onValidationError,
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

  // Keep the form mounted once opened so unsaved edits survive collapsing the
  // item; they're submitted with the page save.
  const [formOpened, setFormOpened] = useState(expanded);
  if (expanded && !formOpened) {
    setFormOpened(true);
  }
  const dirty = useSelector((state) => isDirty(getFormName(item.id), getFormState)(state));

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleHeaderKeyDown = (event) => {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onToggleExpand();
    }
  };

  const summary = item.summary || item.title;
  const editLabel = i18n.inject(i18n._t('NestedItem.EDIT', 'Edit this {type}'), { type: item.type.toLowerCase() });

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={classNames('nested-item', {
        'nested-item--expanded': expanded,
        'nested-item--hidden': item.isHidden,
        'nested-item--dragging': isDragging,
      })}
    >
      <div className="nested-item__header">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="nested-item__drag-handle btn font-icon-drag-handle"
          title={i18n._t('NestedItem.DRAG', 'Drag to reorder')}
          aria-label={i18n._t('NestedItem.DRAG', 'Drag to reorder')}
          {...attributes}
          {...listeners}
        />
        <div
          className="nested-item__main"
          role="button"
          tabIndex={0}
          title={editLabel}
          aria-expanded={expanded}
          onClick={onToggleExpand}
          onKeyDown={handleHeaderKeyDown}
        >
          <span className={classNames('nested-item__icon', item.icon)} aria-hidden="true" />
          <span className="nested-item__text">
            <span className="nested-item__type">
              {item.type}
              {item.isHidden && (
                <span className="nested-item__badge">{i18n._t('NestedItem.HIDDEN', 'Hidden')}</span>
              )}
              {dirty && (
                <span className="nested-item__badge nested-item__badge--unsaved">
                  {i18n._t('NestedItem.UNSAVED', 'Unsaved changes')}
                </span>
              )}
            </span>
            <span className={classNames('nested-item__summary', { 'nested-item__summary--empty': !summary })}>
              {summary || i18n._t('NestedItem.EMPTY', 'Not filled in yet')}
            </span>
          </span>
          <span
            className={classNames('nested-item__caret', expanded ? 'font-icon-up-open-big' : 'font-icon-down-open-big')}
            aria-hidden="true"
          />
        </div>
        <div className="nested-item__actions">
          <button
            type="button"
            className={classNames('btn nested-item__action', item.isHidden ? 'font-icon-eye' : 'font-icon-eye-with-line')}
            title={item.isHidden ? i18n._t('NestedItem.SHOW', 'Show') : i18n._t('NestedItem.HIDE', 'Hide')}
            aria-label={item.isHidden ? i18n._t('NestedItem.SHOW', 'Show') : i18n._t('NestedItem.HIDE', 'Hide')}
            onClick={onToggleHidden}
          />
          <button
            type="button"
            className="btn nested-item__action font-icon-page-multiple"
            title={i18n._t('NestedItem.DUPLICATE', 'Duplicate')}
            aria-label={i18n._t('NestedItem.DUPLICATE', 'Duplicate')}
            onClick={onDuplicate}
          />
          <button
            type="button"
            className="btn nested-item__action nested-item__action--delete font-icon-trash-bin"
            title={i18n._t('NestedItem.REMOVE', 'Remove')}
            aria-label={i18n._t('NestedItem.REMOVE', 'Remove')}
            onClick={onDelete}
          />
        </div>
      </div>
      {formOpened && (
        <NestedItemForm
          itemId={item.id}
          visible={expanded && !isDragging}
          onSaved={onSaved}
          onValidationError={onValidationError}
        />
      )}
    </li>
  );
};

NestedItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
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
  onSaved: PropTypes.func.isRequired,
  onValidationError: PropTypes.func.isRequired,
};

export default NestedItem;

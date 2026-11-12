import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Popover } from 'reactstrap';
import i18n from 'i18n';

/**
 * An insert point between nested items, styled after elemental's
 * `.element-editor__hover-bar`: a blue line with a plus appears on hover or
 * focus, and clicking it opens a popover of the allowed types.
 *
 * Inserts after the item with afterId, or at the top of the list when
 * afterId is 0.
 */
const NestedItemHoverBar = ({ parentId, afterId, allowedTypes, onAdd, disabled }) => {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const id = `NestedItemHoverBar_${parentId}_${afterId}`;
  const label = i18n._t('NestedItemHoverBar.ADD', 'Add new item here');

  const toggle = () => setOpen((current) => !current);

  const handleAdd = (type) => {
    setAdding(true);
    setOpen(false);
    Promise.resolve(onAdd(type.class, afterId)).finally(() => setAdding(false));
  };

  return (
    <li className="nested-item-hover-bar" id={`${id}_container`}>
      <button
        type="button"
        id={id}
        className={classNames('nested-item-hover-bar__area', {
          'nested-item-hover-bar__area--focus': open,
        })}
        onClick={toggle}
        disabled={disabled || adding}
        aria-label={label}
        aria-expanded={open}
        title={label}
      >
        <span className="nested-item-hover-bar__area-inner">
          <span className="nested-item-hover-bar__line font-icon-plus-circled" aria-hidden="true" />
        </span>
      </button>
      {open && (
        <Popover
          placement="bottom"
          target={id}
          container={`#${id}_container`}
          isOpen={open}
          toggle={toggle}
          trigger="legacy"
          popperClassName="nested-item-hover-bar__popover"
        >
          <div className="nested-item-hover-bar__types">
            {allowedTypes.map((type) => (
              <button
                key={type.class}
                type="button"
                className={classNames('btn nested-item-hover-bar__type', type.icon)}
                onClick={() => handleAdd(type)}
              >
                {type.title}
              </button>
            ))}
          </div>
        </Popover>
      )}
    </li>
  );
};

NestedItemHoverBar.propTypes = {
  parentId: PropTypes.number.isRequired,
  afterId: PropTypes.number.isRequired,
  allowedTypes: PropTypes.arrayOf(PropTypes.shape({
    class: PropTypes.string,
    title: PropTypes.string,
    icon: PropTypes.string,
  })).isRequired,
  onAdd: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default NestedItemHoverBar;

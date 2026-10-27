import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import i18n from 'i18n';

/**
 * One button per allowed nested type, appended to the end of the list.
 */
const AddNestedItem = ({ allowedTypes, onAdd, disabled }) => {
  const [adding, setAdding] = useState(null);

  const handleAdd = (type) => {
    setAdding(type.class);
    Promise.resolve(onAdd(type.class)).finally(() => setAdding(null));
  };

  return (
    <div className="nested-item-add">
      <span className="nested-item-add__label">{i18n._t('NestedItemList.ADD', 'Add')}</span>
      {allowedTypes.map((type) => (
        <button
          key={type.class}
          type="button"
          className={classNames('btn btn-outline-secondary btn-sm nested-item-add__button', type.icon)}
          disabled={disabled || adding !== null}
          onClick={() => handleAdd(type)}
        >
          {type.title}
        </button>
      ))}
    </div>
  );
};

AddNestedItem.propTypes = {
  allowedTypes: PropTypes.arrayOf(PropTypes.shape({
    class: PropTypes.string,
    title: PropTypes.string,
    icon: PropTypes.string,
  })).isRequired,
  onAdd: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default AddNestedItem;

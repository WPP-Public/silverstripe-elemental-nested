import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverBody } from 'reactstrap';
import i18n from 'i18n';

const AddNestedItemButton = ({ allowedNestedTypes, onAdd, insertAfterId }) => {
  const [open, setOpen] = useState(false);
  const targetId = `nested-add-${insertAfterId}`;

  const handleAdd = (className) => (event) => {
    event.preventDefault();
    onAdd(className, insertAfterId).then(() => setOpen(false));
  };

  return (
    <div className="nested-item-list__add">
      <button
        type="button"
        id={targetId}
        className="btn nested-item-list__add-button"
        onClick={() => setOpen(!open)}
      >
        {i18n._t('NestedItemList.ADD_ITEM', 'Add item')}
      </button>
      <Popover
        placement="bottom"
        isOpen={open}
        target={targetId}
        toggle={() => setOpen(!open)}
      >
        <PopoverBody className="nested-item-list__add-popover">
          <ul className="list-unstyled nested-item-list__add-options">
            {allowedNestedTypes.map((type) => (
              <li key={type.class}>
                <button
                  type="button"
                  className="btn btn--block btn--no-pad nested-item-list__add-option"
                  onClick={handleAdd(type.class)}
                >
                  <span className={type.icon} />
                  {type.title}
                </button>
              </li>
            ))}
          </ul>
        </PopoverBody>
      </Popover>
    </div>
  );
};

AddNestedItemButton.propTypes = {
  allowedNestedTypes: PropTypes.arrayOf(PropTypes.shape({
    class: PropTypes.string,
    title: PropTypes.string,
    icon: PropTypes.string,
  })).isRequired,
  onAdd: PropTypes.func.isRequired,
  insertAfterId: PropTypes.number,
};

export default AddNestedItemButton;

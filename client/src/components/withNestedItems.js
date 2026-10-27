import React from 'react';
import PropTypes from 'prop-types';
import NestedItemList from './NestedItemList';

const withNestedItems = (ElementComponent) => {
  const Wrapped = (props) => {
    const { element } = props;
    const blockSchema = element?.blockSchema || {};
    const hasNested = Array.isArray(blockSchema.allowedNestedTypes);

    return (
      <div className="nested-item-element-wrapper" data-element-block-id={element.id}>
        <ElementComponent {...props} />
        {hasNested && (
          <NestedItemList
            parentElementId={element.id}
            nestedItems={blockSchema.nestedItems || []}
            allowedNestedTypes={blockSchema.allowedNestedTypes || []}
            canAddNested={blockSchema.canAddNested}
          />
        )}
      </div>
    );
  };

  Wrapped.propTypes = {
    element: PropTypes.shape({
      id: PropTypes.number,
      blockSchema: PropTypes.object,
    }).isRequired,
  };

  return Wrapped;
};

export default withNestedItems;

import React, { useMemo } from 'react';
import NestedElementContext from './NestedElementContext';

const withNestedElementContext = (Element) => {
  const ElementWithNestedContext = (props) => {
    const { element, areaId } = props;
    const value = useMemo(() => ({ element, areaId }), [element, areaId]);

    return (
      <NestedElementContext.Provider value={value}>
        <Element {...props} />
      </NestedElementContext.Provider>
    );
  };

  ElementWithNestedContext.displayName = `withNestedElementContext(${Element.displayName || Element.name || 'Element'})`;

  return ElementWithNestedContext;
};

export default withNestedElementContext;

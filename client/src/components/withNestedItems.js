import React, { useContext } from 'react';
import NestedElementContext from './NestedElementContext';
import NestedItemList from './NestedItemList';

const withNestedItems = (Content) => {
  const ContentWithNestedItems = (props) => {
    const context = useContext(NestedElementContext);
    const blockSchema = context?.element?.blockSchema;

    if (!blockSchema || !Array.isArray(blockSchema.allowedNestedTypes)) {
      return <Content {...props} />;
    }

    return (
      <>
        <Content {...props} />
        <NestedItemList
          parentId={Number(context.element.id)}
          areaId={Number(context.areaId)}
          nestedItems={blockSchema.nestedItems || []}
          allowedTypes={blockSchema.allowedNestedTypes}
          canAdd={Boolean(blockSchema.canAddNested)}
        />
      </>
    );
  };

  ContentWithNestedItems.displayName = `withNestedItems(${Content.displayName || Content.name || 'Content'})`;

  return ContentWithNestedItems;
};

export default withNestedItems;

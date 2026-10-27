import Config from 'lib/Config';

const SECTION_KEY = 'AKQA\\ElementalNested\\Controllers\\NestedItemController';

export const getNestedConfig = () => Config.getSection(SECTION_KEY);

export const loadNestedItemSchemaValue = (key, itemId = null) => {
  const section = getNestedConfig();
  const schemaValue = section?.form?.nestedItemForm?.[key] || '';

  if (itemId) {
    return `${schemaValue}/${itemId}`;
  }
  return schemaValue;
};

export const getControllerLink = () => {
  const link = getNestedConfig()?.controllerLink || '';
  return link.replace(/\/$/, '');
};

import backend from 'lib/Backend';
import Config from 'lib/Config';

const SECTION_KEY = 'AKQA\\ElementalNested\\Controllers\\NestedItemController';

const getSection = () => Config.getSection(SECTION_KEY) || {};

export const getControllerLink = () => (getSection().controllerLink || '').replace(/\/$/, '');

export const getSchemaUrl = (itemId) => {
  const schemaUrl = getSection().form?.nestedItemForm?.schemaUrl || '';
  return `${schemaUrl.replace(/\/$/, '')}/${itemId}`;
};

const post = (action, body) => backend.post(
  `${getControllerLink()}/api/${action}`,
  body,
  { 'X-SecurityID': Config.get('SecurityID') }
);

export const createItem = (parentID, className, afterID = 0) => post('create', { parentID, className, afterID })
  .then((response) => response.json());

export const deleteItem = (id) => post('delete', { id });

export const duplicateItem = (id) => post('duplicate', { id });

export const toggleHidden = (id) => post('toggleHidden', { id });

export const sortItem = (id, parentID, afterID) => post('sort', { id, parentID, afterID });

export const FORM_IDENTIFIER = 'NestedItem';

// Matches NestedItemController::FORM_NAME_TEMPLATE, namespaced by FORM_IDENTIFIER
export const getFormName = (itemId) => `${FORM_IDENTIFIER}.NestedItemForm_${itemId}`;

// Same as admin's lib/getFormState, which isn't exposed as a global
export const getFormState = (state) => state.form?.formState;

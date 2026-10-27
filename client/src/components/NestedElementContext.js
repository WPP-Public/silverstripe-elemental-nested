import { createContext } from 'react';

/**
 * Carries the current elemental block record (and its area) from the Element
 * component down to ElementContent, which only receives the element ID.
 */
const NestedElementContext = createContext(null);

export default NestedElementContext;

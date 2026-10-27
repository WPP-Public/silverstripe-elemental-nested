/* global window */
import React from 'react';
import { render } from '@testing-library/react';
import NestedItemForm from '../components/NestedItemForm';

const mockDispatch = jest.fn();
let mockDirty = false;

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => mockDirty,
}), { virtual: true });

jest.mock('redux-form', () => ({
  submit: (name) => ({ type: 'SUBMIT', name }),
  destroy: (name) => ({ type: 'DESTROY', name }),
  isDirty: () => () => mockDirty,
}), { virtual: true });

describe('NestedItemForm', () => {
  let handlers;

  beforeEach(() => {
    jest.clearAllMocks();
    handlers = [];
    window.jQuery = () => ({
      length: 1,
      on: (event, handler) => handlers.push(handler),
      off: (event, handler) => { handlers = handlers.filter((h) => h !== handler); },
    });
  });

  const renderForm = () => render(
    <NestedItemForm itemId={7} visible onSaved={jest.fn()} onValidationError={jest.fn()} />
  );

  it('submits a dirty form when the page form is saved', () => {
    mockDirty = true;
    const { container } = renderForm();
    const data = { promises: [], onAjaxSuccessCallbacks: [] };

    handlers.forEach((handler) => handler({}, data));

    expect(data.promises).toHaveLength(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SUBMIT', name: 'NestedItem.NestedItemForm_7' });
    expect(container.querySelector('.element-form-dirty-state')).toBeTruthy();

    data.onAjaxSuccessCallbacks.forEach((callback) => callback());
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'DESTROY', name: 'NestedItem.NestedItemForm_7' });
  });

  it('leaves clean forms and unload checks alone', () => {
    mockDirty = false;
    const { container } = renderForm();
    const data = { promises: [], onAjaxSuccessCallbacks: [] };

    handlers.forEach((handler) => handler({}, data));
    handlers.forEach((handler) => handler({}));

    expect(data.promises).toHaveLength(0);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(container.querySelector('.element-form-dirty-state')).toBeNull();
  });

  it('stops listening when unmounted', () => {
    const { unmount } = renderForm();
    expect(handlers).toHaveLength(1);

    unmount();

    expect(handlers).toHaveLength(0);
  });
});

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NestedItemList from '../components/NestedItemList';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => false,
}), { virtual: true });

jest.mock('redux-form', () => ({
  submit: jest.fn(),
  destroy: jest.fn(),
  isDirty: () => () => false,
}), { virtual: true });

jest.mock('../lib/nestedItemApi', () => ({
  FORM_IDENTIFIER: 'NestedItem',
  getFormName: (id) => `NestedItem.NestedItemForm_${id}`,
  getFormState: (state) => state,
  getSchemaUrl: (id) => `schema/${id}`,
  createItem: jest.fn(() => Promise.resolve({ id: 3 })),
  deleteItem: jest.fn(() => Promise.resolve()),
  duplicateItem: jest.fn(() => Promise.resolve()),
  toggleHidden: jest.fn(() => Promise.resolve()),
  sortItem: jest.fn(() => Promise.resolve()),
}));

const api = require('../lib/nestedItemApi');

const props = {
  parentId: 10,
  areaId: 5,
  nestedItems: [
    { id: 1, type: 'Link', icon: 'font-icon-link', title: 'Visible', summary: 'https://visible.test', isHidden: false },
    { id: 2, type: 'Link', icon: 'font-icon-link', title: 'Hidden', summary: 'https://hidden.test', isHidden: true },
  ],
  allowedTypes: [{ class: 'LinkItem', title: 'Link', icon: 'font-icon-link' }],
  canAdd: true,
};

describe('NestedItemList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders each item with its summary and marks hidden items', () => {
    render(<NestedItemList {...props} />);

    expect(screen.getByText('https://visible.test')).toBeTruthy();
    expect(screen.getByText('https://hidden.test').closest('.nested-item').className)
      .toContain('nested-item--hidden');
  });

  it('shows an empty message when there are no items', () => {
    render(<NestedItemList {...props} nestedItems={[]} />);

    expect(screen.getByText('No items yet')).toBeTruthy();
  });

  it('appends a new item of the chosen type and reloads the elemental area', async () => {
    render(<NestedItemList {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    expect(api.createItem).toHaveBeenCalledWith(10, 'LinkItem', 0);
    await screen.findByText('https://visible.test');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'FORCE_RELOAD', payload: { elementEditorId: 5 } });
  });

  it('removes an item after confirmation', async () => {
    window.confirm = jest.fn(() => true);
    render(<NestedItemList {...props} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    expect(api.deleteItem).toHaveBeenCalledWith(1);
    expect(screen.queryByText('https://visible.test')).toBeNull();
    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
  });

  it('does not let clicks reach the parent elemental block', () => {
    const onParentClick = jest.fn();
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={onParentClick}><NestedItemList {...props} /></div>
    );

    fireEvent.click(screen.getByText('https://visible.test'));

    expect(onParentClick).not.toHaveBeenCalled();
  });
});

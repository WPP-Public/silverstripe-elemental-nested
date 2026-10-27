import React from 'react';
import { render, screen } from '@testing-library/react';
import NestedItemList from '../components/NestedItemList';

jest.mock('components/ElementEditor/ElementEditor', () => {
  const mockReact = require('react');
  return {
    ElementEditorContext: mockReact.createContext({ fetchElements: jest.fn() }),
  };
});

describe('NestedItemList', () => {
  it('renders nested rows and greys out hidden items', () => {
    render(
      <NestedItemList
        parentElementId={10}
        nestedItems={[
          {
            id: 1,
            type: 'Link',
            icon: 'font-icon-link',
            title: 'Visible',
            summary: 'https://visible.test',
            isHidden: false,
          },
          {
            id: 2,
            type: 'Link',
            icon: 'font-icon-link',
            title: 'Hidden',
            summary: 'https://hidden.test',
            isHidden: true,
          },
        ]}
        allowedNestedTypes={[{ class: 'LinkItem', title: 'Link', icon: 'font-icon-link' }]}
        canAddNested={true}
      />
    );

    expect(screen.getByText('https://visible.test')).toBeTruthy();
    expect(screen.getByText('https://hidden.test').closest('.nested-item-row').className)
      .toContain('nested-item-row--hidden');
  });
});

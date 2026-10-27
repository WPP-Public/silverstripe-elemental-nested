# silverstripe-elemental-nested

Ordered nested items inside Elemental blocks for Silverstripe CMS 6.

## Overview

Apply `HasNestedItems` to any `BaseElement` subclass to manage a sorted list of `NestedItem` records. Nested items are lightweight `DataObject` records (not full blocks): they inherit publish state from the parent, support inline editing in the Elemental editor, and can be reordered, hidden, duplicated, or moved to another compatible parent on the same page.

## Requirements

- PHP 8.3+
- Silverstripe CMS 6
- `dnadesign/silverstripe-elemental` 6

## Installation

```bash
composer require akqa-nz/silverstripe-elemental-nested
```

Build CMS assets (from this module directory, with Node 18+):

```bash
yarn install
yarn build
```

## Usage

Define nested item classes:

```php
use AKQA\ElementalNested\Models\NestedItem;

class LinkItem extends NestedItem
{
    private static array $db = ['URL' => 'Varchar(2048)'];
}
```

Enable nested items on a block:

```php
use AKQA\ElementalNested\Extensions\HasNestedItems;

class LinkListBlock extends BaseElement
{
    private static array $extensions = [HasNestedItems::class];

    private static array $allowed_nested_items = [LinkItem::class];
}
```

In templates:

```ss
<% loop $Element.getVisibleNestedItems %>
    <% include $ClassName.ShortName %>
<% end_loop %>
```

## Licence

BSD-3-Clause

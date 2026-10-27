<?php

namespace AKQA\ElementalNested\Tests\Fixtures;

use AKQA\ElementalNested\Extensions\HasNestedItems;
use DNADesign\Elemental\Models\BaseElement;

class LinkListBlock extends BaseElement
{
    private static string $table_name = 'ElementalNestedTest_LinkListBlock';

    private static string $singular_name = 'Link list';

    private static array $extensions = [
        HasNestedItems::class,
    ];

    private static array $allowed_nested_items = [
        LinkItem::class,
    ];

    public function getType(): string
    {
        return 'Link list';
    }
}

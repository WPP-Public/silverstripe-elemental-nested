<?php

namespace AKQA\ElementalNested\Tests\Fixtures;

use AKQA\ElementalNested\Models\NestedItem;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\TextField;

class LinkItem extends NestedItem
{
    private static string $table_name = 'ElementalNestedTest_LinkItem';

    private static string $singular_name = 'Link';

    private static string $icon = 'font-icon-link';

    private static array $db = [
        'URL' => 'Varchar(2048)',
    ];

    public function getCMSFields(): FieldList
    {
        $fields = parent::getCMSFields();
        $fields->addFieldsToTab('Root.Main', [
            TextField::create('Title'),
            TextField::create('URL'),
        ]);

        return $fields;
    }

    public function getSummary(): string
    {
        return $this->URL ?: (string) $this->Title;
    }
}

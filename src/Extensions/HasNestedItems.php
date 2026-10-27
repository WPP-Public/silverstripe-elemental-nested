<?php

namespace AKQA\ElementalNested\Extensions;

use AKQA\ElementalNested\Models\NestedItem;
use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\Core\Config\Config;
use SilverStripe\Core\Extension;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridFieldAddExistingAutocompleter;
use SilverStripe\Forms\GridField\GridFieldAddNewButton;
use SilverStripe\Forms\GridField\GridFieldConfig_RecordEditor;
use SilverStripe\Forms\LiteralField;
use Symbiote\GridFieldExtensions\GridFieldAddNewMultiClass;
use Symbiote\GridFieldExtensions\GridFieldOrderableRows;

/**
 * @method BaseElement&HasNestedItems $owner
 * @method \SilverStripe\ORM\HasManyList|NestedItem[] NestedItems()
 */
class HasNestedItems extends Extension
{
    private static array $db = [];

    private static array $has_many = [
        'NestedItems' => NestedItem::class . '.ParentElement',
    ];

    private static array $owns = [
        'NestedItems',
    ];

    private static array $cascade_deletes = [
        'NestedItems',
    ];

    private static array $cascade_duplicates = [
        'NestedItems',
    ];

    public function updateCMSFields(FieldList $fields): void
    {
        $fields->removeByName('NestedItems');

        if (!$this->owner->isInDB()) {
            $fields->addFieldToTab(
                'Root.Main',
                LiteralField::create(
                    'NestedItemsNotice',
                    '<p class="message notice">Save this block before adding items.</p>'
                )
            );
            return;
        }

        $config = GridFieldConfig_RecordEditor::create();
        $config->removeComponentsByType([
            GridFieldAddNewButton::class,
            GridFieldAddExistingAutocompleter::class,
        ]);

        $allowed = $this->getAllowedNestedClasses();
        if ($allowed && class_exists(GridFieldAddNewMultiClass::class) && $this->canAddNestedItems()) {
            $adder = GridFieldAddNewMultiClass::create();
            $adder->setClasses($allowed);
            $config->addComponent($adder);
        }

        if (class_exists(GridFieldOrderableRows::class)) {
            $config->addComponent(GridFieldOrderableRows::create('Sort'));
        }

        $fields->addFieldToTab(
            'Root.Main',
            GridField::create(
                'NestedItems',
                _t(self::class . '.ITEMS', 'Items'),
                $this->owner->NestedItems(),
                $config
            )
        );
    }

    public function updateBlockSchema(array &$blockSchema): void
    {
        $blockSchema['nestedItems'] = $this->getNestedItemsForEditor();
        $blockSchema['allowedNestedTypes'] = $this->getAllowedNestedTypeDefinitions();
        $blockSchema['canAddNested'] = $this->canAddNestedItems();
    }

    public function updateContentForSearchIndex(string &$content): void
    {
        foreach ($this->owner->NestedItems() as $item) {
            $content .= ' ' . $item->getContentForSearchIndex();
        }
    }

    /**
     * @return NestedItem[]|\SilverStripe\ORM\DataList
     */
    public function getVisibleNestedItems()
    {
        return $this->owner->NestedItems()->filter('IsHidden', false);
    }

    public function canAddNestedItems(): bool
    {
        if (!$this->owner->canEdit()) {
            return false;
        }

        $max = $this->owner->config()->get('max_nested_items');
        if ($max !== null && $this->owner->NestedItems()->count() >= (int) $max) {
            return false;
        }

        return count($this->getAllowedNestedClasses()) > 0;
    }

    /**
     * @return class-string<NestedItem>[]
     */
    public function getAllowedNestedClasses(): array
    {
        $classes = $this->owner->config()->get('allowed_nested_items');
        if (!is_array($classes)) {
            return [];
        }

        return array_values(array_filter($classes, fn ($class) => is_subclass_of($class, NestedItem::class)));
    }

    public function getAllowedNestedTypeDefinitions(): array
    {
        $definitions = [];
        foreach ($this->getAllowedNestedClasses() as $class) {
            $definitions[] = [
                'class' => $class,
                'className' => str_replace('\\', '_', $class),
                'title' => _t($class . '.SINGULAR_NAME', singleton($class)->getType()),
                'icon' => Config::forClass($class)->get('icon'),
            ];
        }

        return $definitions;
    }

    public function isAllowedNestedClass(string $class): bool
    {
        return in_array($class, $this->getAllowedNestedClasses(), true);
    }

    /**
     * @param BaseElement $element
     */
    public static function assertOn(BaseElement $element): bool
    {
        return $element->hasExtension(self::class);
    }

    private function getNestedItemsForEditor(): array
    {
        $items = [];
        foreach ($this->owner->NestedItems()->sort('Sort ASC') as $item) {
            $items[] = [
                'id' => $item->ID,
                'className' => $item->ClassName,
                'type' => $item->getType(),
                'icon' => $item->getIconClass(),
                'title' => $item->Title,
                'summary' => $item->getSummary(),
                'isHidden' => (bool) $item->IsHidden,
            ];
        }

        return $items;
    }
}

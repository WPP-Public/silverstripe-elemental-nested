<?php

namespace AKQA\ElementalNested\Models;

use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\Core\ClassInfo;
use SilverStripe\Forms\FieldList;
use SilverStripe\ORM\DataObject;
use SilverStripe\Security\Permission;
use SilverStripe\Versioned\Versioned;

/**
 * Lightweight ordered child record owned by a {@link BaseElement}.
 *
 * @property string $Title
 * @property int $Sort
 * @property bool $IsHidden
 * @property int $ParentElementID
 * @method BaseElement ParentElement()
 */
class NestedItem extends DataObject
{
    private static string $table_name = 'NestedItem';

    private static array $db = [
        'Title' => 'Varchar(255)',
        'Sort' => 'Int',
        'IsHidden' => 'Boolean(0)',
    ];

    private static array $has_one = [
        'ParentElement' => BaseElement::class,
    ];

    private static array $default_sort = [
        'Sort' => 'ASC',
    ];

    private static array $extensions = [
        Versioned::class,
    ];

    private static string $icon = 'font-icon-block-content';

    private static bool $touching_parent = false;

    public function getCMSFields(): FieldList
    {
        $fields = parent::getCMSFields();
        $fields->removeByName(['ParentElementID', 'Sort']);

        return $fields;
    }

    public function getType(): string
    {
        return $this->config()->get('singular_name') ?: ClassInfo::shortName(static::class);
    }

    public function getSummary(): string
    {
        return (string) $this->Title;
    }

    public function getIconClass(): string
    {
        return (string) $this->config()->get('icon');
    }

    public function canView($member = null): bool
    {
        $parent = $this->ParentElement();
        return $parent && $parent->exists() ? $parent->canView($member) : parent::canView($member);
    }

    public function canEdit($member = null): bool
    {
        $parent = $this->ParentElement();
        return $parent && $parent->exists() ? $parent->canEdit($member) : parent::canEdit($member);
    }

    public function canDelete($member = null): bool
    {
        $parent = $this->ParentElement();
        return $parent && $parent->exists() ? $parent->canEdit($member) : parent::canDelete($member);
    }

    public function canCreate($member = null, $context = []): bool
    {
        if (static::class === self::class) {
            return false;
        }

        if (isset($context['ParentElement']) && $context['ParentElement'] instanceof BaseElement) {
            return $context['ParentElement']->canEdit($member);
        }

        return Permission::checkMember($member, 'CMS_ACCESS_CMS');
    }

    protected function onBeforeWrite(): void
    {
        parent::onBeforeWrite();

        if (!$this->Sort && $this->ParentElementID) {
            $max = (int) static::get()
                ->filter('ParentElementID', $this->ParentElementID)
                ->max('Sort');
            $this->Sort = $max + 1;
        }
    }

    protected function onAfterWrite(): void
    {
        parent::onAfterWrite();
        $this->touchParentElement();
    }

    protected function onAfterDelete(): void
    {
        parent::onAfterDelete();
        $this->touchParentElement();
    }

    protected function touchParentElement(): void
    {
        if (self::$touching_parent) {
            return;
        }

        $parent = $this->ParentElement();
        if (!$parent || !$parent->exists() || !$parent->canEdit()) {
            return;
        }

        self::$touching_parent = true;
        $parent->write();
        self::$touching_parent = false;
    }

    /**
     * Content included when the parent block is indexed for search.
     */
    public function getContentForSearchIndex(): string
    {
        return (string) $this->Title;
    }
}

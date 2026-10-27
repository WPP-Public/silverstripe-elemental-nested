<?php

namespace AKQA\ElementalNested\Services;

use AKQA\ElementalNested\Models\NestedItem;
use InvalidArgumentException;
use SilverStripe\Core\Convert;
use SilverStripe\ORM\DataObject;
use SilverStripe\ORM\Queries\SQLUpdate;

class NestedItemReorder
{
    public function __construct(
        private NestedItem $item,
        private bool $itemIsNew = false
    ) {
    }

    public function reorder(int $afterItemID = 0, ?int $newParentElementID = null): NestedItem
    {
        $item = $this->item;
        $oldParentId = (int) $item->ParentElementID;

        if ($newParentElementID !== null && $newParentElementID !== $oldParentId) {
            $item->ParentElementID = $newParentElementID;
        }

        $parentId = (int) $item->ParentElementID;
        $currentPosition = (int) $item->Sort;
        $sortAfterPosition = 0;

        if ($afterItemID) {
            /** @var NestedItem|null $afterItem */
            $afterItem = NestedItem::get()->byID($afterItemID);
            if (!$afterItem) {
                throw new InvalidArgumentException(sprintf('NestedItem#%s not found', $afterItemID));
            }
            if ((int) $afterItem->ParentElementID !== $parentId) {
                throw new InvalidArgumentException('After item belongs to a different parent element');
            }
            $sortAfterPosition = (int) $afterItem->Sort;
        }

        $baseTableName = Convert::raw2sql(DataObject::getSchema()->tableName(NestedItem::class));
        $tableName = sprintf('"%s"', $baseTableName);

        if ($afterItemID === 0) {
            $max = (int) NestedItem::get()->filter('ParentElementID', $parentId)->max('Sort');
            $item->Sort = $max + 1;
            $item->write(skipValidation: $this->itemIsNew);
            return $item;
        }

        if ($sortAfterPosition < $currentPosition || $oldParentId !== $parentId) {
            $operator = '+';
            $filter = "$tableName.\"Sort\" > $sortAfterPosition AND $tableName.\"Sort\" < $currentPosition";
            $newPosition = $sortAfterPosition + 1;
        } else {
            $operator = '-';
            $filter = "$tableName.\"Sort\" <= $sortAfterPosition AND $tableName.\"Sort\" > $currentPosition";
            $newPosition = $sortAfterPosition;
        }

        if (!$this->itemIsNew && $currentPosition > 0 && $oldParentId === $parentId) {
            SQLUpdate::create()
                ->setTable($tableName)
                ->assignSQL('"Sort"', "$tableName.\"Sort\" $operator 1")
                ->addWhere([$filter, "$tableName.\"ParentElementID\"" => $parentId])
                ->execute();
        }

        $item->Sort = $newPosition;
        $item->write(skipValidation: $this->itemIsNew);

        return $item;
    }
}

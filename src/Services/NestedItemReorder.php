<?php

namespace AKQA\ElementalNested\Services;

use AKQA\ElementalNested\Models\NestedItem;
use InvalidArgumentException;
use SilverStripe\Core\Injector\Injectable;

/**
 * Positions a nested item among its siblings and renumbers the parent's items
 * so Sort values stay unique and sequential.
 *
 * An $afterItemID of 0 moves an existing item to the top of the list, and
 * appends a new item to the end of the list.
 */
class NestedItemReorder
{
    use Injectable;

    public function __construct(
        private NestedItem $item,
        private bool $itemIsNew = false
    ) {
    }

    public function reorder(int $afterItemID = 0, ?int $newParentElementID = null): NestedItem
    {
        $item = $this->item;
        if ($newParentElementID !== null) {
            $item->ParentElementID = $newParentElementID;
        }
        $parentID = (int) $item->ParentElementID;

        $siblings = NestedItem::get()
            ->filter('ParentElementID', $parentID)
            ->exclude('ID', $item->ID ?: 0)
            ->sort('Sort', 'ASC')
            ->toArray();
        $siblingIDs = array_map(fn (NestedItem $sibling) => (int) $sibling->ID, $siblings);

        if ($afterItemID) {
            $position = array_search($afterItemID, $siblingIDs, true);
            if ($position === false) {
                throw new InvalidArgumentException(sprintf(
                    'NestedItem#%s not found under parent element #%s',
                    $afterItemID,
                    $parentID
                ));
            }
            $insertAt = $position + 1;
        } else {
            $insertAt = $this->itemIsNew ? count($siblingIDs) : 0;
        }

        // Renumber siblings, leaving a gap for the item at $insertAt. Written via the
        // ORM rather than a bulk SQL update so the new order is versioned and
        // published along with the parent element.
        $sort = 1;
        foreach ($siblings as $index => $sibling) {
            if ($index === $insertAt) {
                $sort++;
            }
            if ((int) $sibling->Sort !== $sort) {
                $sibling->Sort = $sort;
                $sibling->write();
            }
            $sort++;
        }

        $item->Sort = $insertAt + 1;
        $item->write(skipValidation: $this->itemIsNew);

        return $item;
    }
}

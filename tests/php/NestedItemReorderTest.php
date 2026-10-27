<?php

namespace AKQA\ElementalNested\Tests;

use AKQA\ElementalNested\Models\NestedItem;
use AKQA\ElementalNested\Services\NestedItemReorder;
use AKQA\ElementalNested\Tests\Fixtures\LinkItem;
use AKQA\ElementalNested\Tests\Fixtures\LinkListBlock;
use DNADesign\Elemental\Models\ElementalArea;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Versioned\Versioned;

class NestedItemReorderTest extends SapphireTest
{
    protected $usesDatabase = true;

    protected static $extra_dataobjects = [
        LinkListBlock::class,
        LinkItem::class,
    ];

    private LinkListBlock $block;

    protected function setUp(): void
    {
        parent::setUp();

        $area = ElementalArea::create();
        $area->write();

        $this->block = LinkListBlock::create();
        $this->block->ParentID = $area->ID;
        $this->block->write();
    }

    public function testNewItemsAreSortedAfterExistingItems(): void
    {
        $ids = $this->createItems(3);

        $this->assertSame($ids, $this->sortedIds());
        $this->assertSame([1, 2, 3], $this->sortValues());
    }

    public function testMoveAfterAnotherItem(): void
    {
        [$a, $b, $c] = $this->createItems(3);

        $this->reorder($a, $c);

        $this->assertSame([$b, $c, $a], $this->sortedIds());
        $this->assertSame([1, 2, 3], $this->sortValues());
    }

    public function testAfterZeroMovesExistingItemToTop(): void
    {
        [$a, $b, $c] = $this->createItems(3);

        $this->reorder($c, 0);

        $this->assertSame([$c, $a, $b], $this->sortedIds());
    }

    public function testNewItemCanBeInsertedAfterASibling(): void
    {
        [$a, $b] = $this->createItems(2);

        $item = LinkItem::create(['ParentElementID' => $this->block->ID]);
        NestedItemReorder::create($item, true)->reorder($a);

        $this->assertSame([$a, (int) $item->ID, $b], $this->sortedIds());
        $this->assertSame([1, 2, 3], $this->sortValues());
    }

    public function testNewItemWithAfterZeroIsAppended(): void
    {
        [$a, $b] = $this->createItems(2);

        $item = LinkItem::create(['ParentElementID' => $this->block->ID]);
        NestedItemReorder::create($item, true)->reorder(0);

        $this->assertSame([$a, $b, (int) $item->ID], $this->sortedIds());
    }

    public function testReorderedSiblingsArePublishedWithTheParent(): void
    {
        [$a, $b, $c] = $this->createItems(3);
        $this->block->publishRecursive();

        $this->reorder($c, 0);
        $this->block->publishRecursive();

        $live = Versioned::withVersionedMode(function () {
            Versioned::set_stage(Versioned::LIVE);
            return $this->sortedIds();
        });
        $this->assertSame([$c, $a, $b], $live);
    }

    public function testEditingAnItemMarksTheParentAsModified(): void
    {
        $this->logInWithPermission('ADMIN');
        [$a] = $this->createItems(1);
        $this->block->publishRecursive();
        $this->assertFalse($this->block->isModifiedOnDraft());

        $item = NestedItem::get()->byID($a);
        $item->Title = 'Changed';
        $item->write();

        $this->assertTrue(LinkListBlock::get()->byID($this->block->ID)->isModifiedOnDraft());
    }

    /**
     * @return int[]
     */
    private function createItems(int $count): array
    {
        $ids = [];
        for ($i = 0; $i < $count; $i++) {
            $item = LinkItem::create(['ParentElementID' => $this->block->ID, 'Title' => "Item $i"]);
            $item->write();
            $ids[] = (int) $item->ID;
        }

        return $ids;
    }

    private function reorder(int $id, int $afterID): void
    {
        NestedItemReorder::create(NestedItem::get()->byID($id))->reorder($afterID);
    }

    /**
     * @return int[]
     */
    private function sortedIds(): array
    {
        return array_map('intval', NestedItem::get()
            ->filter('ParentElementID', $this->block->ID)
            ->sort('Sort', 'ASC')
            ->column('ID'));
    }

    /**
     * @return int[]
     */
    private function sortValues(): array
    {
        return array_map('intval', NestedItem::get()
            ->filter('ParentElementID', $this->block->ID)
            ->sort('Sort', 'ASC')
            ->column('Sort'));
    }
}

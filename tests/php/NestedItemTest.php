<?php

namespace AKQA\ElementalNested\Tests;

use AKQA\ElementalNested\Tests\Fixtures\LinkItem;
use AKQA\ElementalNested\Tests\Fixtures\LinkListBlock;
use DNADesign\Elemental\Models\ElementalArea;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Versioned\Versioned;

class NestedItemTest extends SapphireTest
{
    protected static $extra_dataobjects = [
        LinkListBlock::class,
        LinkItem::class,
    ];

    public function testAllowedNestedClassEnforced(): void
    {
        $area = ElementalArea::create();
        $area->write();

        $block = LinkListBlock::create();
        $block->ParentID = $area->ID;
        $block->write();

        $this->assertTrue($block->isAllowedNestedClass(LinkItem::class));
        $this->assertFalse($block->isAllowedNestedClass(LinkListBlock::class));
    }

    public function testDuplicateParentDuplicatesChildren(): void
    {
        $area = ElementalArea::create();
        $area->write();

        $block = LinkListBlock::create();
        $block->ParentID = $area->ID;
        $block->write();

        $item = LinkItem::create();
        $item->ParentElementID = $block->ID;
        $item->Title = 'Example';
        $item->URL = 'https://example.com';
        $item->write();

        $copy = $block->duplicate();
        $this->assertCount(1, $copy->NestedItems());
        $this->assertSame('Example', $copy->NestedItems()->first()->Title);
    }

    public function testHiddenItemsExcludedFromVisibleList(): void
    {
        $area = ElementalArea::create();
        $area->write();

        $block = LinkListBlock::create();
        $block->ParentID = $area->ID;
        $block->write();

        $visible = LinkItem::create();
        $visible->ParentElementID = $block->ID;
        $visible->Title = 'Visible';
        $visible->write();

        $hidden = LinkItem::create();
        $hidden->ParentElementID = $block->ID;
        $hidden->Title = 'Hidden';
        $hidden->IsHidden = true;
        $hidden->write();

        $this->assertCount(1, $block->getVisibleNestedItems());
        $this->assertSame('Visible', $block->getVisibleNestedItems()->first()->Title);
    }

    public function testPermissionsDelegateToParent(): void
    {
        $this->logInWithPermission('ADMIN');

        $area = ElementalArea::create();
        $area->write();

        $block = LinkListBlock::create();
        $block->ParentID = $area->ID;
        $block->write();

        $item = LinkItem::create();
        $item->ParentElementID = $block->ID;
        $item->Title = 'Test';
        $item->write();

        $this->assertTrue($item->canView());
        $this->assertTrue($item->canEdit());
        $this->assertTrue($item->canDelete());
    }

    public function testPublishingParentPublishesChildren(): void
    {
        $area = ElementalArea::create();
        $area->write();

        $block = LinkListBlock::create();
        $block->ParentID = $area->ID;
        $block->write();

        $item = LinkItem::create();
        $item->ParentElementID = $block->ID;
        $item->Title = 'Published child';
        $item->write();

        $block->publishRecursive();

        $live = Versioned::get_by_stage(LinkItem::class, Versioned::LIVE)->filter('ParentElementID', $block->ID);
        $this->assertCount(1, $live);
    }
}

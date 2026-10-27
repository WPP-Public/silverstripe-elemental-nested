<?php

// Page and PageController for running this module's tests standalone, where
// there's no project to provide them (silverstripe/cms needs both). This
// folder is excluded from the class manifest so it can't clash with a
// project's own Page. Copied into app/src by `composer test` and CI.

use SilverStripe\CMS\Controllers\ContentController;
use SilverStripe\CMS\Model\SiteTree;

class Page extends SiteTree
{
}

class PageController extends ContentController
{
}

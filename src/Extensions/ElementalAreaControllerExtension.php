<?php

namespace AKQA\ElementalNested\Extensions;

use AKQA\ElementalNested\Extensions\HasNestedItems;
use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Core\Extension;

class ElementalAreaControllerExtension extends Extension
{
    /**
     * @param array<int, array<string, mixed>> $data
     */
    public function updateApiReadElementalArea(array &$data, HTTPRequest $request): void
    {
        foreach ($data as $index => $elementData) {
            $element = BaseElement::get()->byID($elementData['id'] ?? 0);
            if (!$element || !$element->hasExtension(HasNestedItems::class)) {
                continue;
            }

            // Ensure nested item payload is current (also set via updateBlockSchema).
            $data[$index]['blockSchema'] = $element->getBlockSchema();
        }
    }
}

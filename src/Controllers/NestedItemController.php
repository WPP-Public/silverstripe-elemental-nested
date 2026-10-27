<?php

namespace AKQA\ElementalNested\Controllers;

use AKQA\ElementalNested\Extensions\HasNestedItems;
use AKQA\ElementalNested\Models\NestedItem;
use AKQA\ElementalNested\Services\NestedItemReorder;
use DNADesign\Elemental\Models\BaseElement;
use SilverStripe\Admin\AdminRootController;
use SilverStripe\Admin\FormSchemaController;
use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Core\Injector\Injector;
use SilverStripe\Core\Validation\ValidationException;
use SilverStripe\Core\Validation\ValidationResult;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\FormAction;
use SilverStripe\Security\SecurityToken;

class NestedItemController extends FormSchemaController
{
    public const FORM_NAME_TEMPLATE = 'NestedItemForm_%s';

    private static string $url_segment = 'nested-items';

    private static string $required_permission_codes = 'CMS_ACCESS';

    private static array $url_handlers = [
        'nestedItemForm/$ItemID' => 'nestedItemForm',
        '$FormName/field/$FieldName' => 'formAction',
        'GET api/read/$ParentID!' => 'apiRead',
        'POST api/create' => 'apiCreate',
        'POST api/delete' => 'apiDelete',
        'POST api/duplicate' => 'apiDuplicate',
        'POST api/sort' => 'apiSort',
        'POST api/toggleHidden' => 'apiToggleHidden',
    ];

    private static array $allowed_actions = [
        'nestedItemForm',
        'formAction',
        'apiRead',
        'apiCreate',
        'apiDelete',
        'apiDuplicate',
        'apiSort',
        'apiToggleHidden',
    ];

    public function getClientConfig(): array
    {
        $clientConfig = parent::getClientConfig();
        $clientConfig['form'] = [
            'nestedItemForm' => [
                'schemaUrl' => $this->Link('schema/nestedItemForm'),
                'formNameTemplate' => sprintf(static::FORM_NAME_TEMPLATE, '{id}'),
            ],
        ];
        $clientConfig['controllerLink'] = $this->Link();

        return $clientConfig;
    }

    public function apiRead(HTTPRequest $request): HTTPResponse
    {
        $parentID = (int) $request->param('ParentID');
        $parent = $this->getParentElement($parentID);
        if (!$parent) {
            $this->jsonError(404);
        }
        if (!$parent->canView()) {
            $this->jsonError(403);
        }

        $schema = $parent->getBlockSchema();

        return $this->jsonSuccess(200, [
            'nestedItems' => $schema['nestedItems'] ?? [],
            'allowedNestedTypes' => $schema['allowedNestedTypes'] ?? [],
            'canAddNested' => $schema['canAddNested'] ?? false,
        ]);
    }

    public function apiCreate(HTTPRequest $request): HTTPResponse
    {
        if (!SecurityToken::inst()->checkRequest($request)) {
            $this->jsonError(400);
        }

        $parentID = (int) $this->getPostedJsonValue($request, 'parentID');
        $className = (string) $this->getPostedJsonValue($request, 'className');
        $data = json_decode($request->getBody(), true) ?: [];
        $afterID = isset($data['afterID']) ? (int) $data['afterID'] : 0;

        $parent = $this->getParentElement($parentID);
        if (!$parent || !$this->assertCanManageNested($parent)) {
            $this->jsonError(403);
        }

        if (!is_subclass_of($className, NestedItem::class)) {
            $this->jsonError(400);
        }

        if (!$parent->isAllowedNestedClass($className) || !$parent->canAddNestedItems()) {
            $this->jsonError(403);
        }

        /** @var NestedItem $item */
        $item = Injector::inst()->create($className);
        if (!$item->canCreate(null, ['ParentElement' => $parent])) {
            $this->jsonError(403);
        }

        $item->ParentElementID = $parentID;
        $reorderer = Injector::inst()->create(NestedItemReorder::class, $item, true);
        $reorderer->reorder($afterID);

        return $this->jsonSuccess(201, ['id' => $item->ID]);
    }

    public function apiDelete(HTTPRequest $request): HTTPResponse
    {
        if (!SecurityToken::inst()->checkRequest($request)) {
            $this->jsonError(400);
        }

        $item = $this->getNestedItem((int) $this->getPostedJsonValue($request, 'id'));
        if (!$item || !$item->canDelete()) {
            $this->jsonError(403);
        }

        $item->delete();

        return $this->jsonSuccess(204);
    }

    public function apiDuplicate(HTTPRequest $request): HTTPResponse
    {
        if (!SecurityToken::inst()->checkRequest($request)) {
            $this->jsonError(400);
        }

        $item = $this->getNestedItem((int) $this->getPostedJsonValue($request, 'id'));
        if (!$item || !$item->canEdit()) {
            $this->jsonError(403);
        }

        $parent = $item->ParentElement();
        if (!$parent || !$this->assertCanManageNested($parent)) {
            $this->jsonError(403);
        }

        $copy = $item->duplicate();
        $copy->Title = $this->getCopyTitle((string) $copy->Title);
        $reorderer = Injector::inst()->create(NestedItemReorder::class, $copy, false);
        $reorderer->reorder($item->ID);

        return $this->jsonSuccess(201, ['id' => $copy->ID]);
    }

    public function apiSort(HTTPRequest $request): HTTPResponse
    {
        if (!SecurityToken::inst()->checkRequest($request)) {
            $this->jsonError(400);
        }

        $id = (int) $this->getPostedJsonValue($request, 'id');
        $parentID = (int) $this->getPostedJsonValue($request, 'parentID');
        $data = json_decode($request->getBody(), true) ?: [];
        $afterID = isset($data['afterID']) ? (int) $data['afterID'] : 0;

        $item = $this->getNestedItem($id);
        if (!$item || !$item->canEdit()) {
            $this->jsonError(403);
        }

        $targetParent = $this->getParentElement($parentID);
        if (!$targetParent || !$this->assertCanManageNested($targetParent)) {
            $this->jsonError(403);
        }

        if ($parentID !== (int) $item->ParentElementID && !$targetParent->isAllowedNestedClass($item->ClassName)) {
            $this->jsonError(403);
        }

        $reorderer = Injector::inst()->create(NestedItemReorder::class, $item, false);
        $reorderer->reorder($afterID, $parentID);

        return $this->jsonSuccess(204);
    }

    public function apiToggleHidden(HTTPRequest $request): HTTPResponse
    {
        if (!SecurityToken::inst()->checkRequest($request)) {
            $this->jsonError(400);
        }

        $item = $this->getNestedItem((int) $this->getPostedJsonValue($request, 'id'));
        if (!$item || !$item->canEdit()) {
            $this->jsonError(403);
        }

        $item->IsHidden = !$item->IsHidden;
        $item->write();

        return $this->jsonSuccess(200, ['isHidden' => (bool) $item->IsHidden]);
    }

    public function nestedItemForm(): Form
    {
        $id = (int) $this->getRequest()->param('ItemID');
        $item = $this->getNestedItem($id);
        if (!$item) {
            $this->jsonError(404);
        }
        if (!$item->canView()) {
            $this->jsonError(403);
        }

        return $this->createNestedItemForm($item);
    }

    public function getNestedItemForm(): Form
    {
        return $this->nestedItemForm();
    }

    public function save(array $data, Form $form): HTTPResponse
    {
        $request = $this->getRequest();
        if (!SecurityToken::inst()->checkRequest($request)) {
            $this->jsonError(400);
        }

        $id = (int) $request->param('ID');
        $item = $this->getNestedItem($id);
        if (!$item || !$item->canEdit()) {
            $this->jsonError(403);
        }

        if (isset($data['ID'])) {
            $this->jsonError(400);
        }

        $form->saveInto($item);

        try {
            $item->write();
        } catch (ValidationException $e) {
            throw $e;
        }

        $schemaID = $form->FormAction();
        return $this->getSchemaResponse($schemaID, $form);
    }

    private function createNestedItemForm(NestedItem $item): Form
    {
        $id = $item->ID;
        $fields = $item->getCMSFields();

        $form = Form::create(
            $this,
            sprintf(static::FORM_NAME_TEMPLATE, $id),
            $fields,
            FieldList::create([
                FormAction::create('save', _t(__CLASS__ . '.SAVE', 'Save'))
                    ->addExtraClass('btn--hidden'),
            ])
        );

        $urlSegment = $this->config()->get('url_segment');
        $form->setFormAction(AdminRootController::admin_url("$urlSegment/nestedItemForm/$id"));
        $form->loadDataFrom($item);

        if (!$item->canEdit()) {
            $form->makeReadonly();
        }

        $form->addExtraClass('nested-item-editor-form');
        $form->addExtraClass('bypass-entwine-submission');

        $form->setValidationResponseCallback(function (ValidationResult $errors) use ($form, $id) {
            $schemaId = Controller::join_links(
                $this->Link('schema'),
                $this->config()->get('url_segment'),
                'nestedItemForm',
                $id
            );
            return $this->getSchemaResponse($schemaId, $form, $errors);
        });

        return $form;
    }

    private function getParentElement(int $id): ?BaseElement
    {
        if (!$id) {
            return null;
        }

        $parent = BaseElement::get()->byID($id);
        if (!$parent || !$parent->hasExtension(HasNestedItems::class)) {
            return null;
        }

        return $parent;
    }

    private function getNestedItem(int $id): ?NestedItem
    {
        if (!$id) {
            return null;
        }

        $item = NestedItem::get()->byID($id);
        return $item instanceof NestedItem ? $item : null;
    }

    private function assertCanManageNested(BaseElement $parent): bool
    {
        return $parent->canEdit();
    }

    private function getCopyTitle(string $title): string
    {
        if (preg_match('/^(.*)(\scopy)(\s[0-9]+)?$/', $title, $parts)) {
            if (!empty($parts[3])) {
                $num = (int) trim($parts[3]);
                return $parts[1] . $parts[2] . ' ' . ($num + 1);
            }
            return $title . ' 2';
        }

        return $title . ' copy';
    }
}

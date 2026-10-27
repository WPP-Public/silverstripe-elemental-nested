/* global window */
import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { submit, destroy, isDirty } from 'redux-form';
import FormBuilderLoader from 'containers/FormBuilderLoader/FormBuilderLoader';
import { getSchemaUrl, getFormName, FORM_IDENTIFIER, getFormState } from '../lib/nestedItemApi';

/**
 * Inline edit form for a nested item, loaded from the nested item controller's
 * form schema. There is no save button: like elemental's own inline forms,
 * dirty nested forms are submitted when the page is saved, and mark the page
 * as changed while they have unsaved edits.
 */
const NestedItemForm = ({ itemId, visible, onSaved, onValidationError }) => {
  const dispatch = useDispatch();
  const formName = getFormName(itemId);
  const dirty = useSelector((state) => isDirty(formName, getFormState)(state));

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const resolveRef = useRef(null);

  const settle = (result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  // Submit this form as part of the page save. LeftAndMain waits for every
  // promise added to data.promises before submitting the page form.
  useEffect(() => {
    const $form = window.jQuery ? window.jQuery('.cms-edit-form') : null;
    if (!$form || !$form.length) {
      return undefined;
    }

    const handleBeforeSubmit = (event, data) => {
      // Also triggered without data from window.onbeforeunload
      if (!data || !dirtyRef.current) {
        return;
      }
      data.promises.push(new Promise((resolve) => {
        resolveRef.current = resolve;
        dispatch(submit(formName));
      }));
      // Reset the form after a successful page save so it reloads from the server
      data.onAjaxSuccessCallbacks.push(() => dispatch(destroy(formName)));
    };

    $form.on('beforesubmitform', handleBeforeSubmit);
    return () => $form.off('beforesubmitform', handleBeforeSubmit);
  }, [dispatch, formName]);

  const handleSubmit = useCallback((data, action, submitFn) => submitFn()
    .then((formSchema) => {
      // Validation failures return the schema URL as the id, successful saves the form action.
      const hasErrors = /\/schema\//.test(formSchema?.id || '');
      if (hasErrors) {
        onValidationError();
      } else {
        onSaved();
      }
      settle({ success: !hasErrors, reason: hasErrors ? 'invalid' : '' });
      return formSchema;
    })
    .catch((error) => {
      settle({ success: false, reason: 'error' });
      throw error;
    }), [onSaved, onValidationError]);

  return (
    <div className="nested-item__form" hidden={!visible}>
      <FormBuilderLoader
        formTag="form"
        identifier={FORM_IDENTIFIER}
        schemaUrl={getSchemaUrl(itemId)}
        refetchSchemaOnMount={!dirty}
        onSubmit={handleSubmit}
      />
      {dirty && (
        // Picked up by elemental's entwine to flag the page form as changed
        <input type="hidden" name="nested-item-change-tracker" className="element-form-dirty-state" value="1" />
      )}
    </div>
  );
};

NestedItemForm.propTypes = {
  itemId: PropTypes.number.isRequired,
  visible: PropTypes.bool,
  onSaved: PropTypes.func.isRequired,
  onValidationError: PropTypes.func.isRequired,
};

export default NestedItemForm;

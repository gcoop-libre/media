/**
 * Created by lux on 21.01.2017.
 */

/**
 * Implements hook_field_formatter_view().
 * @param {String} entity_type
 * @param {Object} entity
 * @param {Object} field
 * @param {Object} instance
 * @param {String} langcode
 * @param {Object} items
 * @param {Object} display
 */
function media_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {
    // Iterate over each item, and place a widget onto the render array.
    var content = {};
    for (var delta in items) {
      if (!items.hasOwnProperty(delta)) {
        continue;
      }
      var item = items[delta];
      switch (display.type) {
        case 'file_rendered':
          content[delta] = {item: item};
          content[delta].theme = 'media_file_rendered';
          break;
        default:
          console.log('media_field_formatter_view() - unsupported display type: ' + display.type);
          break;
      }
    }
    return content;
  }
  catch (error) {
    console.log('media_field_formatter_view - ' + error);
  }
}

/**
 * Implements hook_field_widget_form().
 * @param {Object} form
 * @param {Object} form_state
 * @param {Object} field
 * @param {Object} instance
 * @param {String} langcode
 * @param {Object} items
 * @param {Number} delta
 * @param {Object} element
 */
function media_field_widget_form(form, form_state, field, instance, langcode,
                                 items, delta, element) {
  try {
    // Change the item type to a hidden input to hold the file id.
    items[delta].type = 'hidden';

    var media_types = [];

    instance.settings.file_extensions.split(/[ ,]+/).forEach(function (type) {
      switch (type) {
        case 'jpg':
          media_types.push(MEDIA_TYPES.IMAGE);
          break;
        case 'mp4':
          media_types.push(MEDIA_TYPES.VIDEO);
          break;
        case 'mp3':
          media_types.push(MEDIA_TYPES.AUDIO);
          break;
      }
    });

    // If we already have media for this item, show it.
    var media = '';
    if (typeof items[delta].item !== 'undefined' && items[delta].item.fid) {
      items[delta].value = items[delta].item.fid;
      media = theme('media_file_rendered', {item: items[delta].item});
      media += media_remove_button({
        attributes: {
          'data-input_id': items[delta].id,
          'data-element_id': element.id,
          'data-langcode': langcode,
          'data-cardinality': field.cardinality
        }
      });
    }

    // add container for uploaded media
    var field_basename = media_field_widget_media_containter_id(items[delta].id);
    var html = '<div id="' + field_basename + '">' +
                 '<div id="' + field_basename + '-field-msg"></div>' +
                 '<div id="' + field_basename + '-field">' + media + '</div>' +
               '</div>';

    if ((parseInt(delta) + 1) == field.cardinality) {
      html += '<div id="' + element.id + '-upload-button">' +
        media_upload_button({
          'media_types': media_types,
          attributes: {
            'data-element_id': element.id,
            'data-langcode': langcode,
            'data-cardinality': field.cardinality
          }
        }) + '</div>';

      html += '<script type="text/javascript">_media_field_widget_form_visibility(\'' + element.id + '\' , \'' + langcode + '\' , \'' + field.cardinality + '\');</script>';
    }

    // Add html to the item's children.
    if (items[delta].children) {
      items[delta].children.push({markup: html});
    } else {
      items[delta].children = [{markup: html}];
    }
  }
  catch (error) {
    console.log('media_field_widget_form - ' + error);
  }
}

/**
 * Verifies the visibility of the upload button
 * @param {String} id
 * @param {String} field_language
 * @param {Number} field_cardinality
 */
function _media_field_widget_form_visibility(id, field_language, field_cardinality) {
  $('#' + id + '-upload-button')
    .hide();

  for (var i = 0; i < field_cardinality; i++) {
    var field_id = id + '-' + field_language + '-' + i + '-value';

    if (empty($('#' + field_id).val())) {
      $('#' + id + '-upload-button')
        .show();
      break;
    }
  }
}
//# sourceURL=media.fields.js

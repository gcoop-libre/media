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
    //items[delta].type = 'textfield';


    // If we already have media for this item, show it.
    var media = '';
    if (typeof items[delta].item !== 'undefined' && items[delta].item.fid) {
      items[delta].value = items[delta].item.fid;
      //items[delta].default_value = items[delta].item.fid;
      media = theme('media_file_rendered', {item: items[delta].item});
      console.log('media_field_widget_form - media: ', media);
      // @TODO - show the remove button.
    }
    // add container for uploaded media
    html = '<div id="' + media_field_widget_media_containter_id() + '"></div>' +
      '<div id="' + items[delta].id + '-media-field-msg"></div>' +
      '<div id="' + items[delta].id + '-media-field">'+ media +'</div>' +
        media_buttons({field: field, item: items[delta]}) +
      '<div class="media-buttons-containter">' +
      '</div>';

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
function media_field_widget_media_containter_id(id) {
  return id + '-media';
}
//# sourceURL=media.fields.js
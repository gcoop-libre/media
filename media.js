/**
 * Implements hook_field_formatter_view().
 */
function media_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {
    //console.log(entity_type);
    //console.log(entity);
    //console.log(field);
    //console.log(instance);
    //console.log(langcode);
    //console.log(items);
    //console.log(display);
    
    // Iterate over each item, and place a widget onto the render array.
    var content = {};
    for (var delta in items) {
        if (!items.hasOwnProperty(delta)) { continue; }
        var item = items[delta];
        switch (display.type) {
          case 'file_rendered':
            content[delta] = { item: item };
            content[delta].theme = 'media_file_rendered';
            break;
          default:
            console.log('media_field_formatter_view() - unsupported display type: ' + display.type);
            break;
        }
    }
    return content;
  }
  catch (error) { console.log('media_field_formatter_view - ' + error); }
}

/**
 *
 */
function theme_media_file_rendered(variables) {
  try {
    var item = variables.item;
    switch (item.filemime) {
      case 'image/jpeg':
        return theme('image', {
            path: drupalgap_image_path(item.uri)
        });
        break;
      case 'application/pdf':
        return bl(
          item.filename,
          drupalgap_image_path(item.uri),
          {
            InAppBrowser: true,
            attributes: {
              'data-icon': 'action'
            }
          }
        );
        break;
      default:
        console.log('theme_media_file_rendered() - unsupported filemime: ' + item.filemime);
        break;
    }
    return '';
  }
  catch (error) { console.log('variables - ' + error); }
}


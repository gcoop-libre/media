/**
 * THEME FUNCTIONS
 */
function theme_media_file_rendered(variables) {
  try {
    var item = variables.item;
    switch (item.filemime) {
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
        // check of mimetipe 'image/*'
        if ((/image\//).test(item.filemime)) {
          return theme(
            'image_style', {
              'style_name': 'll_media_default',
              'path': item.uri
            });
        }
        // check of mimetipe 'video/*'
        else if ((/video\//).test(item.filemime)) {
          return theme('video', {
            path: drupalgap_image_path(item.uri),
            fid: item.fid,
            item: item,
            attributes: {
              controls: '',
              class: 'media-video',
              playsinline: '',
              // autoplay: '',
              preload: 'metadata',
              'webkit-playsinline': 'webkit-playsinline'
            }
          });
        } else if ((/audio\//).test(item.filemime)) {
          return theme('audio', {
            path: drupalgap_image_path(item.uri),
            attributes: {
              controls: '',
              class: 'media-audio'
            }
          });
        } else {
          console.log('theme_media_file_rendered() - unsupported filemime: ' + item.filemime);
        }
        break;
    }
    return '';
  }
  catch (error) {
    console.log('variables - ' + error);
  }
}

/**
 * Themes a media button.
 * @param {Object} variables
 * @return {String}
 */
function theme_media_button(variables) {
  try {
    variables.attributes['data-media-type'] = variables.type;

    switch (variables.type) {
      case MEDIA_TYPES.IMAGE :
        variables.text = t('Upload Image');
        variables.attributes['data-icon'] = 'camera';
        break;
      case MEDIA_TYPES.VIDEO :
        variables.text = t('Upload Video');
        variables.attributes['data-icon'] = 'video';
        break;
      case MEDIA_TYPES.AUDIO :
        variables.text = t('Upload Audio');
        variables.attributes['data-icon'] = 'audio';
        break;
    }
    variables.attributes['data-role'] = 'button';
    variables.attributes['data-button_type'] = 'add';
    variables.attributes['href'] = '#';
    var html = '<a ' + drupalgap_attributes(variables.attributes) + '>' +
      variables.text +
      '</a>';
    return html;
  }
  catch (error) {
    console.log('theme_media_button - ' + error);
  }
}

/**
 * Themes a media button for removing current media.
 * @param {Object} variables
 * @return {String}
 */
function theme_media_remove_button(variables) {
  try {
    variables.attributes['data-icon'] = 'delete';
    variables.attributes['data-iconpos'] = 'right';
    variables.attributes['data-role'] = 'button';
    variables.attributes['data-button_type'] = 'remove';
    variables.attributes['href'] = '#';
    var html = '<a ' + drupalgap_attributes(variables.attributes) + '>' +
                  t('Remove') +
               '</a>';
    return html;
  }
  catch (error) {
    console.log('theme_media_remove_button - ' + error);
  }
}
//# sourceURL=media.themes.js
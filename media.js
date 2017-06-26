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

/**
 * Created by lux on 21.01.2017.
 */

/**
 * GLOBALS
 */

// cordova-plugin-imagepicker options
var IMAPICKER_OPTIONS = {
  quality: (drupalgap.settings.camera.quality) ? drupalgap.settings.camera.quality : 50,
  width: (drupalgap.settings.camera.targetWidth) ? drupalgap.settings.camera.targetWidth : 1024,
  height: (drupalgap.settings.camera.targetHeight) ? drupalgap.settings.camera.targetHeight : 1024
}

/**
 * enum for media actions
 */
var MEDIA_ACTIONS = {
  IMAGE_UPLOAD: 1,
  IMAGE_RECORD: 2,
  VIDEO_UPLOAD: 3,
  VIDEO_RECORD: 4,
  AUDIO_RECORD: 5,
  PICTURE_MULTIPLE_UPLOAD: 6,
};

/**
 * enum for media types
 */
var MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio'
};

/**
 * HELPERS
 */

/**
 * Generate media remove button
 * @param {Object} variables
 * @return {String}
 */
function media_remove_button(variables) {
  try {
    var html = '';

    variables.attributes.onclick = 'media_remove_pressed(this);';
    html += theme('media_remove_button', {
      attributes: variables.attributes
    });

    return html;
  } catch (error) {
    console.log('media_remove_button - ' + error);
  }
}

/**
 * Generate media upload button
 * @param {Object} variables
 * @return {String}
 */
function media_upload_button(variables) {
  try {
    var html = '';

    variables.attributes.onclick = 'media_upload_pressed(this);';
    variables.media_types.forEach(function (media_type) {
      html += theme('media_button', {
        type: media_type,
        attributes: variables.attributes
      });
    });

    return html;
  } catch (error) {
    console.log('media_buttons - ' + error);
  }
}

/**
 * Select Media source
 * @param {Object} button
 */
function media_upload(button, media_source) {
  try {
    var id = $(button).data('element_id');
    var field_language = $(button).data('langcode');
    var field_cardinality = $(button).data('cardinality');
    var webform_component_type = $(button).data("webform_component_type");
    var input_id = '';

    // Search for an empty position within the field values
    for (var i = 0; i < field_cardinality; i++) {
      var field_id = id + '-' + field_language + '-' + i + '-value';

      if (empty($('#' + field_id).val())) {
        input_id = field_id;
        break;
      }
    }

    if (empty(input_id)) {
      return;
    }

    function set_camera_options(srcType, medType) {
      var options = {
        quality: (drupalgap.settings.camera.quality) ? drupalgap.settings.camera.quality : 50,
        sourceType: srcType,
        destinationType: Camera.DestinationType.FILE_URI,
        mediaType: medType,
        targetWidth: (drupalgap.settings.camera.targetWidth) ? drupalgap.settings.camera.targetWidth : 1024,
        targetHeight: (drupalgap.settings.camera.targetHeight) ? drupalgap.settings.camera.targetHeight : 1024,
        saveToPhotoAlbum: (srcType == Camera.PictureSourceType.PHOTOLIBRARY) ? false : true
      };
      return options;
    }

    function upload_media_file(files) {
      // upload file
      var uri = encodeURI(Drupal.settings.site_path + "/" + Drupal.settings.endpoint + "/file/create_raw");
      var headers = {'X-CSRF-Token': Drupal.sessid};

      // get first file
      fileURI = files.shift();

      var fileOptions = new FileUploadOptions();
      fileOptions.fileKey = "files[file_1]";
      fileOptions.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1).split('?')[0];
      fileOptions.headers = headers;

      var ft = new FileTransfer();

      // show progress
      ft.onprogress = function (progressEvent) {
        if (progressEvent.lengthComputable) {
          var progress = Math.round(progressEvent.loaded * 100 / progressEvent.total);
          $(".ui-loader h1").replaceWith("<h1>" + t("Uploading") + " " + progress + "%</h1>");
        }
      };

      // show toast
      drupalgap.loader = 'uploading';
      drupalgap_loading_message_show();

      ft.upload(
        fileURI,
        uri,
        function (r) {
          var result = $.parseJSON(r.response);
          var fid = result[0].fid;

          // set fid in form
          if (field_cardinality == 1) {
            // only one file allowed
            $("input#" + input_id).val(fid);
          } else {
            // multiple files allowed
            // check if form element is a webform component multiple_file type
            if (webform_component_type == 'multiple_file') {
              // webform multiple file component
              $("input#" + input_id).val($("input#" + input_id).val() + fid + ',');
            } else {
              // drupal field with multiple values
              $("input#" + input_id).val(fid);

              $('.' + drupalgap_form_get_element_container_class(name).replace(/\s+/g, '.') + ' .description').remove();
            }
          }
          _media_field_widget_form_visibility(id, field_language, field_cardinality);

          // check for additional files
          if (files.length > 0) {
            upload_media_file(files);
          } else {
            drupalgap_loading_message_hide();
          }
        },
        function (error) {
          // error
          drupalgap_loading_message_hide();
          console.log("upload error source " + error.source);
          console.log("upload error target " + error.target);
        },
        fileOptions
      );
    }

    function get_media_success(f) {
      //var mediaFullPath = '';
      var mediaFullPaths = [];
      console.log('get_media_success - %o:', f);
      if (Array.isArray(f)) {
        f.forEach(function (mediaFullPath) {
          if (mediaFullPath.fullPath != undefined) {
            // captured with cordova-plugin-media-capture
            mediaFullPaths.push(f[0].fullPath);
          } else {
            // captured with cordova-plugin-imagepicker
            mediaFullPaths.push(mediaFullPath);
          }
        });
      } else {
        // captured with cordova-plugin-camera
        mediaFullPaths.push(f);
      }

      // inject media in form
      var mediaHTML = '';
      mediaFullPaths.forEach(function (mediaFullPath) {
        switch (media_type) {
          case MEDIA_TYPES.IMAGE:
            mediaHTML += "<img src='" + mediaFullPath + "'>";
            break;
          case MEDIA_TYPES.VIDEO:
            mediaHTML += "<video  style='max-width:100%;' controls preload='metadata' webkit-playsinline=webkit-playsinline' playsinline><source src='" + mediaFullPath + "'></video>";
            if (media_source == MEDIA_ACTIONS.VIDEO_RECORD) {
              try {
                // save captured video to album by cordova-library-helper
                LibraryHelper.saveVideoToLibrary({}, get_media_error, mediaFullPath, '');
              }
              catch (error) {
                console.log('get_media_success - error: %o', error);
              }
            }
            break;
          case MEDIA_TYPES.AUDIO:
            mediaHTML = "<audio style='max-width:100%;' controls preload='metadata'><source src='" + mediaFullPath + "'></audio>";
            break;
        }
      });
      mediaHTML += media_remove_button({
        attributes: {
          'data-input_id': input_id,
          'data-element_id': id,
          'data-langcode': field_language,
          'data-cardinality': field_cardinality
        }
      });
      mediaHTML += '<script type="text/javascript">$(\'a[data-input_id=' + input_id + '\').buttonMarkup();</script>';

      // replace media
      $('#' + media_field_widget_media_containter_id(input_id) + '-field').html(mediaHTML);

      // scroll down;
      scrollToElement('#' + id + '-upload-button', 500, -40);

      //upload media
      upload_media_file(mediaFullPaths);
    }

    function get_media_error(error) {
      console.log('media_upload - error: %o' + error);
    }

    // get media
    var cameraOptions = {};
    var media_type = '';

    switch (media_source) {
      case MEDIA_ACTIONS.IMAGE_UPLOAD:
        media_type = MEDIA_TYPES.IMAGE;
        // @TODO: use image cordova-plugin-imagepicker for selecting multiple pictures at once
        // as cordova-plugin-imagepicker shows currently ony albums, it's hard to find pictures
        // if (field_cardinality == 1) {
        //   cameraOptions = set_camera_options(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.PICTURE);
        // } else {
        //   // multiple files allowed, use cordova-plugin-imagepicker
        //   window.imagePicker.getPictures(get_media_success, get_media_error, IMAPICKER_OPTIONS);
        // }
        cameraOptions = set_camera_options(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.PICTURE);
        break;
      case MEDIA_ACTIONS.IMAGE_RECORD:
        media_type = MEDIA_TYPES.IMAGE;
        cameraOptions = set_camera_options(Camera.PictureSourceType.CAMERA, Camera.MediaType.PICTURE);
        break;
      case MEDIA_ACTIONS.VIDEO_UPLOAD:
        media_type = MEDIA_TYPES.VIDEO;
        cameraOptions = set_camera_options(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.VIDEO);
        break;
      case MEDIA_ACTIONS.VIDEO_RECORD:
        media_type = MEDIA_TYPES.VIDEO;
        navigator.device.capture.captureVideo(get_media_success, get_media_error, {limit: 1});
        //navigator.device.capture.captureVideo(captureVideoSuccess, captureError, {limit: 1});
        break;
      case MEDIA_ACTIONS.AUDIO_RECORD:
        media_type = MEDIA_TYPES.AUDIO;
        navigator.device.capture.captureAudio(get_media_success, get_media_error, {limit: 1});
        break;
    }

    if (!$.isEmptyObject(cameraOptions)) {
      // use cordova-plugin-camera
      navigator.camera.getPicture(get_media_success, get_media_error, cameraOptions);
    }
  }
  catch (error) {
    console.log('media_upload - ' + error);
  }
}

/**
 * Delete Current Media
 * @param {Object} button
 */
function media_remove_pressed(button) {
  try {
    var input_id = $(button).data('input_id');
    var field_basename = media_field_widget_media_containter_id(input_id);
    var id = $(button).data('element_id');
    var field_language = $(button).data('langcode');
    var field_cardinality = $(button).data('cardinality');

    $('input#' + input_id).val('');
    $('#' + field_basename + '-field-msg').empty();
    $('#' + field_basename + '-field').empty();

    _media_field_widget_form_visibility(id, field_language, field_cardinality);
  } catch (error) {
    console.log('media_remove_pressed - ' + error);
  }
}

/**
 * Select Media source
 * @param {Object} button
 */
function media_upload_pressed(button) {
  try {
    var media_type = $(button).data("media-type");

    function onConfirm(buttonIndex) {
      // check for cancel
      if (buttonIndex != 3) {
        var media_action = '';

        switch (media_type) {
          case MEDIA_TYPES.IMAGE:
            media_action = (buttonIndex == 2) ? MEDIA_ACTIONS.IMAGE_UPLOAD : MEDIA_ACTIONS.IMAGE_RECORD;
            media_upload(button, media_action);
            break;
          case MEDIA_TYPES.VIDEO:
            media_action = (buttonIndex == 2) ? MEDIA_ACTIONS.VIDEO_UPLOAD : MEDIA_ACTIONS.VIDEO_RECORD;
            media_upload(button, media_action);
            break;
        }
      }
    }

    var confirm_message = '';
    var confirm_title = '';
    var confirm_button_labels = [];

    switch (media_type) {
      case MEDIA_TYPES.IMAGE:
        confirm_message = t('Select Image source');
        confirm_title = t('Upload Image');
        confirm_button_labels = [t('Camera'), t('Photo Library'), t('Cancel')];
        break;
      case MEDIA_TYPES.VIDEO:
        confirm_message = t('Select Video source');
        confirm_title = t('Upload Video');
        confirm_button_labels = [t('Camera'), t('Media Library'), t('Cancel')];
        break;
      case MEDIA_TYPES.AUDIO:
        media_upload(button, MEDIA_ACTIONS.AUDIO_RECORD);
        break;
    }

    if (confirm_message) {
      navigator.notification.confirm(
        confirm_message,
        onConfirm,
        confirm_title,
        confirm_button_labels
      );
    }
  } catch (error) {
    console.log('media_upload_pressed - ' + error);
  }
}

/**
 * Implements hook_assemble_form_state_into_field().
 * @param {Object} entity_type
 * @param {String} bundle
 * @param {String} form_state_value
 * @param {Object} field
 * @param {Object} instance
 * @param {String} langcode
 * @param {Number} delta
 * @param {Object} field_key
 * @return {*}
 */
function file_assemble_form_state_into_field(entity_type, bundle,
                                             form_state_value,
                                             field,
                                             instance,
                                             langcode,
                                             delta,
                                             field_key) {
  try {
    field_key.value = 'fid';
    return form_state_value;
  }
  catch (error) {
    console.log('file_assemble_form_state_into_field - ' + error);
  }
}

function media_field_widget_media_containter_id(id) {
  return id + '-media';
}
//# sourceURL=media.helpers.js

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
function image_field_widget_form(form, form_state, field, instance, langcode,
                                 items, delta, element) {
  try {
    // replace core widget form
    media_field_widget_form(form, form_state, field, instance, langcode, items, delta, element);
  }
  catch (error) {
    console.log('image_field_widget_form - ' + error);
  }
}

/**
 * Implements hook_field_widget_form().
 */
function file_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    // replace core widget form
    media_field_widget_form(form, form_state, field, instance, langcode, items, delta, element);
  }
  catch (error) {
    console.log('file_field_widget_form - ' + error);
  }
}
//# sourceURL=media.hooks.js

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

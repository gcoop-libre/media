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

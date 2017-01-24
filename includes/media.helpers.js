/**
 * Created by lux on 21.01.2017.
 */

/**
 * GLOBALS
 */

/**
 * enum for media  actions
 */
var MEDIA_ACTIONS = {
  IMAGE_UPLOAD: 1,
  IMAGE_RECORD: 2,
  VIDEO_UPLOAD: 3,
  VIDEO_RECORD: 4,
  AUDIO_RECORD: 5,
  PICTURE_MULTIPLE_UPLOAD: 6,
};

var MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio'
};

/**
 * HELPERS
 */

/**
 * Generate media upload buttons
 * @param {Object} variables
 * @return {String}
 */
function media_buttons(variables) {
  try {
    //debugger;
    var type = '';
    if (variables.field != undefined) {
      if (variables.field.type == 'image') {
        type = MEDIA_TYPES.IMAGE;
      }
    }
    var html = theme('media_button', {
      type: type,
      attributes: {
        'onclick': 'media_upload_pressed(this);',
        'data-input_id': variables.item.id,
        'data-cardinality': variables.field.cardinality,
      }
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
    var input_id = $(button).data("input_id");
    var cardinality = $(button).data("cardinality");

    function set_camera_options(srcType, medType) {
      var options = {
        quality: (drupalgap.settings.camera.quality) ? drupalgap.settings.camera.quality : 50,
        sourceType: srcType,
        destinationType: Camera.DestinationType.FILE_URI,
        mediaType: medType,
        targetWidth: (drupalgap.settings.camera.targetWidth) ? drupalgap.settings.camera.targetWidth : 1024,
        targetHeight: (drupalgap.settings.camera.targetHeight) ? drupalgap.settings.camera.targetHeight : 1024
      };
      return options;
    }

    function camera_get_media(srcType, medType) {
      var cameraOptions = set_camera_options(srcType, medType);
      navigator.camera.getPicture(function (f) {
        var mediaHTML = "";
        if (medType == Camera.MediaType.PICTURE) {
          mediaHTML = "<img src='" + f + "'>";
        } else if (medType == Camera.MediaType.VIDEO) {
          mediaHTML += "<video  style='max-width:100%;' controls><source src='" + f + "'></video>";
        }
        //$("#" + input_id + "-media-field").append(mediaHTML);
        $("#" + input_id + "-media-field").html(mediaHTML);
        upload_media_file([f]);
      }, function (e) {
        dpm(e);
      }, cameraOptions);
    }

    function upload_media_file(files) {
      // upload file
      var uri = encodeURI(Drupal.settings.site_path + "/" + Drupal.settings.endpoint + "/file/create_raw");
      var headers = {'X-CSRF-Token': Drupal.sessid};

      // get first file
      fileURI = files.shift();

      var fileOptions = new FileUploadOptions();
      fileOptions.fileKey = "files[file_1]";
      fileOptions.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
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
          // if (!$("input#" + input_id).val()) {
          //   $("input#" + input_id).val(fid);
          // } else {
          //   $("input#" + input_id).val($("input#" + input_id).val() + ',' + fid);
          // }
          $("input#" + input_id).val(fid);

          // check for additional files
          if (files.length > 0) {
            uploadFile(files);
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

    switch (media_source) {
      case MEDIA_ACTIONS.IMAGE_UPLOAD:
        camera_get_media(Camera.PictureSourceType.PHOTOLIBRARY, Camera.MediaType.PICTURE);
        break;
      case MEDIA_ACTIONS.IMAGE_RECORD:
        camera_get_media(Camera.PictureSourceType.CAMERA, Camera.MediaType.PICTURE);
        break;
    }
  }
  catch (error) {
    console.log('media_upload - ' + error);
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
      switch (buttonIndex) {
        default:
          return;
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
    }

    function onConfirm(buttonIndex) {
      var media_action = '';

      switch (media_type) {
        case MEDIA_TYPES.IMAGE:
          media_action = (buttonIndex == 2) ? MEDIA_ACTIONS.IMAGE_UPLOAD : MEDIA_ACTIONS.IMAGE_RECORD;
          media_upload(button, media_action);
          break;
      }
      console.log('media_upload_pressed - media action: ' + media_action);
    }

    navigator.notification.confirm(
      confirm_message,
      onConfirm,
      confirm_title,
      confirm_button_labels
    );
  } catch (error) {
    console.log('media_upload_pressed - ' + error);
  }

}
//# sourceURL=media.helpers.js

const express = require('express');
const request = require('request');
const router = express.Router();
const BG_REMOVE_API = 'https://i3sgfzdc.streamoid.com/roi/bgremove/v4';
const IMAGE_API = 'https://app-image-upload-s3-qzmv6gjalq-ez.a.run.app';

const uploadImageToCloudFront = (file, callback) => {
  const url = IMAGE_API + '/image_data/';
  console.log('url = ', url);
  var options = {
    method: 'POST',
    url: url,
    headers: {},
    formData: {
      image_data: {
        value: file.data,
        options: {
          filename: file.name,
          contentType: file.mimetype,
        },
      },
    },
  };
  request(options, function(error, response) {
    if (error) {
      console.log('Error: ', error);
      return callback(error, null);
    } else {
      try {
        const body = JSON.parse(response.body);
        if (body.data && body.data.cloudfront_url) {
          return callback(null, body);
        } else {
          return callback(
            { statusCode: 500, statusMessage: 'cloudfront_url is not present' },
            null,
          );
        }
      } catch (error) {
        console.log('Error: ', error);
        callback(error, null);
      }
    }
  });
};

router.post('/removeBg', (req, res) => {
  console.log('Background remove POST', req.files);
  const url = BG_REMOVE_API;
  try {
    const updatedFormData = {
      image: {
        value: req.files.image.data,
        options: {
          filename: 'sample.jpg',
          contentType: 'image/jpeg',
        },
      },
    };

    request
      .post({ url: BG_REMOVE_API, formData: updatedFormData })

      .pipe(res)
      .on('error', function(err) {
        // console.log('Error : ', err);
        res.send({ status: { code: -1, message: err } });
      });
  } catch (err) {
    console.log('Error : ', err);
    res.send({ status: { code: -1, message: err } });
  }
});

router.post('/upload/image', (req, res) => {
  console.log(req.files);
  uploadImageToCloudFront(req.files.image, (err, response) => {
    if (response) {
      const data = {
        imageUrl: response.data.cloudfront_url.replace('http://', 'https://'),
      };
      res.send(data);
    } else {
      const error = {
        statusCode: 500,
        statusMessage: err.statusMessage
          ? err.statusMessage
          : 'file not uploaded to s3',
      };
      res.send(error);
    }
  });
});

module.exports = router;

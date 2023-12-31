import React, { Component, createRef } from 'react';
import { fileToDataURI, formatImage, dataURItoBlob } from 'utils/utils';
import './style.css';
const allowedImageTypes = 'image/png,image/jpeg,image/jpg,image/webp';

import image from './1.png';

let imageCapture;

// const dataURItoBlob = (dataURI, name = 'sample.jpeg') => {
//   var byteString = atob(dataURI.split(',')[1]);
//   var ab = new ArrayBuffer(byteString.length);
//   var ia = new Uint8Array(ab);
//   for (var i = 0; i < byteString.length; i++) {
//     ia[i] = byteString.charCodeAt(i);
//   }
//   return new Blob([ab], { type: 'image/jpeg' });
// };

class ImageScaling extends Component {
  state = {
    bgRemovedData: null,
  };
  componentDidMount() {
    this.inputFileRef = React.createRef();
  }

  // can use this to remove bg from base64 image data
  removeAgain = srcData => {
    let blob = dataURItoBlob(srcData);

    const data = new FormData();
    data.append('image', blob);
    fetch(`/api/v2/removeBg`, {
      method: 'post',
      body: data,
    })
      .then(res => {
        return res.blob();
      })
      .then(response => {
        console.log(response);

        const image = URL.createObjectURL(response);
        return image;
      })
      .then(img => {
        const image = new Image();

        image.onload = () => {
          let drawCanvas = document.createElement('canvas');
          drawCanvas.height = image.height;
          drawCanvas.width = image.width;
          const ctx = drawCanvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          let imageArrayData = ctx.getImageData(
            0,
            0,
            drawCanvas.height,
            drawCanvas.width,
          );
          let dataURL = drawCanvas.toDataURL('image/png', 1);

          //   may come handy to get the width
          //   console.log(imageArrayData);

          const finalImage = new Image();
          const imageSrc = drawCanvas.toDataURL('image/png', 1);
          finalImage.src = imageSrc;
          this.setState({ bgRemovedData: imageSrc });
          //   this.removeAgain(imageSrc);
          //   document.body.appendChild(finalImage);
        };

        image.src = img;
      })
      .catch(err => {
        console.log(err);
      });
  };
  /// main fun to remove bg and feed to tanuj's api
  removeBg = e => {
    const data = new FormData();
    data.append('image', e.target.files[0]);
    fetch(`/api/v2/removeBg`, {
      method: 'post',
      body: data,
    })
      .then(res => {
        return res.blob();
      })
      .then(response => {
        const image = URL.createObjectURL(response);
        return image;
      })
      .then(img => {
        const link = document.createElement('a');
        const image = new Image();

        image.onload = () => {
          let drawCanvas = document.createElement('canvas');
          drawCanvas.height = image.height;
          drawCanvas.width = image.width;
          const ctx = drawCanvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          let imageArrayData = ctx.getImageData(
            0,
            0,
            drawCanvas.height,
            drawCanvas.width,
          );
          let dataURL = drawCanvas.toDataURL('image/png', 1);

          //   console.log(imageArrayData);

          const finalImage = new Image();
          const imageSrc = drawCanvas.toDataURL('image/png', 1);
          finalImage.src = imageSrc;
          this.setState({ bgRemovedData: imageSrc });
          //   this.removeAgain(imageSrc);
          //   document.body.appendChild(finalImage);
        };

        image.src = img;
      })
      .catch(err => {
        console.log(err);
      });
  };
  // to capture photo
  takePhoto = () => {
    imageCapture
      .takePhoto()
      .then(blob => {
        console.log('Took photo:', blob);
        // img.classList.remove('hidden');
        const img = URL.createObjectURL(blob);
        return img;
      })
      .then(img => {
        const image = new Image();

        image.onload = function() {
          let drawCanvas = document.createElement('canvas');
          drawCanvas.height = image.height;
          drawCanvas.width = image.width;
          const ctx = drawCanvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          let imageArrayData = ctx.getImageData(
            0,
            0,
            drawCanvas.height,
            drawCanvas.width,
          );
          //   console.log(imageArrayData);
          removeBg(src);
        };

        image.src = img;
        document.body.appendChild(image);
      })
      .catch(error => {
        console.error('takePhoto() error: ', error);
      });
  };

  onGetUserMediaButtonClick = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(mediaStream => {
        document.querySelector('#video').srcObject = mediaStream;

        const track = mediaStream.getVideoTracks()[0];
        imageCapture = new ImageCapture(track);
      })
      .catch(error => console.error(error));
  };

  onGrabFrameButtonClick = () => {
    imageCapture
      .grabFrame(res => res.blob())
      .then(imageBitmap => {
        const canvas = document.querySelector('#grabFrameCanvas');
        this.drawCanvas(canvas, imageBitmap);
      })
      .catch(error => console.error(error));
  };

  onTakePhotoButtonClick = () => {
    imageCapture
      .takePhoto()
      .then(blob => createImageBitmap(blob))
      .then(imageBitmap => {
        const canvas = document.querySelector('#takePhotoCanvas');
        this.drawCanvas(canvas, imageBitmap);
      })
      .catch(error => console.error(error));
  };

  /* Utils */

  drawCanvas = (canvas, img) => {
    canvas.width = getComputedStyle(canvas).width.split('px')[0];
    canvas.height = getComputedStyle(canvas).height.split('px')[0];
    let ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
    let x = (canvas.width - img.width * ratio) / 2;
    let y = (canvas.height - img.height * ratio) / 2;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    canvas
      .getContext('2d')
      .drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        x,
        y,
        img.width * ratio,
        img.height * ratio,
      );

    const imageSrc = canvas.toDataURL('image/png', 1);
    this.removeAgain(imageSrc);
  };

  //   for video
  startRecord = () => {
    () => {
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then(stream => {
          preview.srcObject = stream;
          downloadButton.href = stream;
          preview.captureStream =
            preview.captureStream || preview.mozCaptureStream;
          return new Promise(resolve => (preview.onplaying = resolve));
        })
        .then(() => startRecording(preview.captureStream(), recordingTimeMS))
        .then(recordedChunks => {
          let recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
          const recording = document.getElementById('video');
          recording.src = URL.createObjectURL(recordedBlob);
          const downloadButton = document.getElementById('download');
          downloadButton.href = recording.src;
          downloadButton.download = 'RecordedVideo.webm';

          log(
            `Successfully recorded ${recordedBlob.size} bytes of ${
              recordedBlob.type
            } media.`,
          );
        })
        .catch(error => {
          if (error.name === 'NotFoundError') {
            log("Camera or microphone not found. Can't record.");
          } else {
            log(error);
          }
        });
    };
  };

  pauseRecord = () => {
    this.takePhoto();
  };

  render() {
    return (
      <div
        onClick={() => {
          //   this.removeBg();
        }}
      >
        <input
          ref={this.inputFileRef}
          type="file"
          accept={allowedImageTypes}
          onChange={e => {
            this.removeBg(e);
          }}
        />
        <button
          onClick={() => {
            this.setState({ setShowVideoRecording: true });
          }}
        >
          Take Photo
        </button>

        {this.state.setShowVideoRecording && (
          <div>
            <video
              id="video"
              controls={true}
              autoPlay
              height={200}
              width={200}
              style={{
                border: '1px solid red',
                boxShadow: '0 0 10px 10px  rgba(0,0,0,.5)',
              }}
            />
            <div>
              <button onClick={() => this.onGetUserMediaButtonClick()}>
                Click Start
              </button>
              <button onClick={() => this.onGrabFrameButtonClick()}>
                Click end
              </button>
            </div>
            <canvas
              height={200}
              width={200}
              id="grabFrameCanvas"
              style={{ border: '1px solid' }}
            />
            <canvas
              height={200}
              width={200}
              id="takePhotoCanvas"
              style={{ border: '1px solid' }}
            />
          </div>
        )}
        {/* // for masking */}
        {this.state.bgRemovedData && (
          <div
            style={{
              width: '600px',
              height: '600px',

              WebkitMaskImage: `url("${this.state.bgRemovedData}")`,
              maskImage: `${this.state.bgRemovedData}`,
              backgroundColor: `${true ? '#6B37FF' : '#000113'}`,
              WebkitMaskSize: '50%',
              WebkitMaskRepeat: 'no-repeat',
              //   borderRadius: '16px',
              //   border: '1px solid',
              //   boxShadow: '0 0 10px 10px  rgba(0,0,0,.5)',
            }}
          >
            {/* <img
              src={this.state.bgRemovedData}
              style={{
                width: '600px',
                height: '600px',
                objectFit: 'contain',
              }}
            /> */}
          </div>
        )}
      </div>
    );
  }
}

export default ImageScaling;

document.addEventListener('DOMContentLoaded', () => {
  new App();
});

class App {
  constructor() {
    this.canvas = document.querySelector('#canvas');
    this.video = document.querySelector('#video-element');
    this.init();
  }
  async init() {
    await this.getVideoStream();
    await this.setVideoDimension();
    this.startCapture();
  }
  getVideoStream() {
    return new Promise((resolve, reject) => {
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          this.video.srcObject = stream;
          resolve();
        });
      } else {
        reject();
      }
    });
  }
  setVideoDimension() {
    return new Promise((resolve, reject) => {
      this.video.addEventListener('loadedmetadata', () => {
        this.vw = this.video.videoWidth;
        this.vh = this.video.videoHeight;
        this.canvas.width = this.vw;
        this.canvas.height = this.vh;
        this.canvas.style.width = '200px';
        this.canvas.style.height = '150px';
        resolve();
      });
    });
  }
  startCapture() {
    window.requestAnimationFrame(this.captureFrame);
  }

  captureFrame = (t) => {
    let ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.translate(this.vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.video, 0, 0, this.vw, this.vh);
    ctx.restore();
    window.requestAnimationFrame(this.captureFrame);
  };
}

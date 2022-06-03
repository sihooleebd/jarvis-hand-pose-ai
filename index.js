/* eslint-disable no-undef */
import poses from './poses.js';
import { calculateCosineSimilarity, standardize, normalize } from './myMath.js';
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

Array.prototype.sum = function () {
  return this.reduce((a, c) => a + c, 0);
};
Array.prototype.average = function () {
  return this.sum() / this.length;
};
Array.prototype.minN = function () {
  return this.reduce((a, c) => (a < c ? a : c), 987654321);
};
Array.prototype.maxN = function () {
  return this.reduce((a, c) => (a > c ? a : c), -1);
};

class App {
  constructor() {
    this.canvas = document.querySelector('#canvas');
    this.video = document.querySelector('#video-element');
    this.queue = [];
    this.queueCount = {
      create: 0,
      expand: 0,
      shrink: 0,
      point: 0,
      drag: 0,
      none: 0,
    };
    this.init();
  }
  async init() {
    await this.getVideoStream();
    await this.setVideoDimension();
    this.model = await this.getModel();
    this.startDetecting();
    this.startCapturing();
  }

  async getModel() {
    return await handpose.load();
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
  startCapturing() {
    window.requestAnimationFrame(this.captureFrame);
  }

  startDetecting() {
    this.detect(Date.now());
  }

  resetQueue() {
    this.queue.length = 0;
    this.queueCount['create'] = 0;
    this.queueCount['expand'] = 0;
    this.queueCount['shrink'] = 0;
    this.queueCount['point'] = 0;
    this.queueCount['drag'] = 0;
    this.queueCount['none'] = 0;
  }

  async detect(t) {
    this.hands = await this.model.estimateHands(this.video);
    // console.log(this.hands);
    // console.log(Date.now() - t);
    if (this.hands.length) {
      this.calculateSimilarity();
    } else {
      this.resetQueue();
    }
    setTimeout(() => {
      this.detect(Date.now());
    }, 5);
  }

  captureFrame = (t) => {
    let ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.translate(this.vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.video, 0, 0, this.vw, this.vh);
    ctx.restore();
    this.drawHands(ctx);
    window.requestAnimationFrame(this.captureFrame);
  };
  drawHands(ctx) {
    ctx.fillStyle = '#f00';
    this.hands.forEach((hand) => {
      // console.log('hand', hand);
      hand.landmarks.forEach((p) => {
        // console.log('landmark', p[0], p[1]);
        ctx.beginPath();
        ctx.arc(this.vw - p[0], p[1], 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
      });
    });
  }

  determineHandPose() {
    console.log('determineHandPose');
    const poseNames = Object.keys(poses);
    console.log('bruh1.5');
    let maxNum = -1;
    let maxPose;
    console.log('bruh2');
    poseNames.forEach((poseName) => {
      if (this.queueCount[poseName] > maxNum) {
        maxNum = this.queueCount[poseName];
        maxPose = poseName;
      }
      document
        .getElementById(`pose-${poseName}`)
        .parentElement.classList.remove('activated');
    });
    console.log('bruh3');
    if (this.queueCount['none'] > maxNum) {
      maxNum = this.queueCount['none'];
      maxPose = 'none';
    }
    console.log('bruh3');
    if (maxPose != 'none') {
      document
        .querySelector(`#pose-${maxPose}`)
        .parentElement.classList.add('activated');
    }
  }

  calculateSimilarity() {
    const poseNames = Object.keys(poses);
    const hand = this.hands[0];
    const hv = normalize(hand.landmarks).flat();
    let maxPose;
    let maxNum = -1;
    poseNames.forEach((poseName) => {
      const pose = poses[poseName];
      const pv = normalize(pose).flat();
      const cos = calculateCosineSimilarity(hv, pv);
      document.querySelector(`#pose-${poseName}`).innerHTML = cos.toFixed(3);
      if (cos.toFixed(3) > maxNum) {
        maxNum = cos.toFixed(3);
        maxPose = poseName;
      }
    });

    if (maxNum > 0.85) {
      console.log('current max pose', maxPose);
      this.queue.push(maxPose);
      this.queueCount[maxPose] += 1;
    } else {
      console.log('current max pose none');
      this.queue.push('none');
      this.queueCount['none'] += 1;
    }
    if (this.queue.length > 10) {
      const tmp = this.queue.shift();
      this.queueCount[tmp] -= 1;
    }
    console.log(this.queue);
    console.log(
      this.queueCount['create'],
      this.queueCount['expand'],
      this.queueCount['shrink'],
      this.queueCount['point'],
      this.queueCount['drag'],
      this.queueCount['none'],
    );
    console.log('BRUH111');
    this.determineHandPose();
  }
}

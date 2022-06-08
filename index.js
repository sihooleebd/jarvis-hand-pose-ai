/* eslint-disable no-undef */
import poses from './newPoses.js';
import { calculateCosineSimilarity, standardize, normalize } from './myMath.js';
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

class App {
  constructor() {
    this.canvas = document.querySelector('#canvas');
    this.video = document.querySelector('#video-element');
    this.poseStartTIme = undefined;
    this.poseStartPosition = undefined;
    this.currentPoseName = 'none';
    this.maxWindowId = 3;
    this.pointedWindowElement = null;
    this.init();
  }
  async init() {
    await this.getVideoStream();
    await this.setVideoDimension();
    this.detector = await this.getDetector();
    this.startCapturing();
    this.startDetecting();
  }

  async getDetector() {
    console.log('handPoseDetection', handPoseDetection);

    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfigMediapipe = {
      runtime: 'mediapipe',
      modelType: 'lite',
      maxHands: 1,
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4`,
    };

    const detectorConfigTfjs = {
      runtime: 'tfjs',
    };

    console.log('getDetector...');
    console.log('model', model);
    try {
      const detector = await handPoseDetection.createDetector(
        model,
        // detectorConfigTfjs,
        detectorConfigMediapipe,
      );
      console.log('detector = ', detector);
      return detector;
    } catch (e) {
      console.log('detector error', e);
    }

    return;
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
  async detect(t) {
    this.hands = await this.detector.estimateHands(this.video);
    if (this.hands.length) {
      //console.log('hand', this.hands[0]);
    }
    //console.log(this.hands);
    if (this.hands.length) {
      this.calculateSimilarity();
    } else {
      this.onPoseDetected('none');
    }
    setTimeout(() => {
      this.detect(Date.now());
    }, 10);
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
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [0, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [0, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20],
    ];
    ctx.fillStyle = '#f00';
    if (!this.hands || !Array.isArray(this.hands)) {
      return;
    }
    this.hands.forEach((hand) => {
      // console.log('hand', hand);
      if (!hand.keypoints) return;
      hand.keypoints.forEach((p) => {
        // console.log('landmark', p[0], p[1]);
        ctx.beginPath();
        ctx.arc(this.vw - p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
      connections.forEach((connection) => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f00';

        ctx.moveTo(
          this.vw - hand.keypoints[connection[0]].x,
          hand.keypoints[connection[0]].y,
        );
        ctx.lineTo(
          this.vw - hand.keypoints[connection[1]].x,
          hand.keypoints[connection[1]].y,
        );
        ctx.stroke();
      });
    });
  }

  calculateSimilarity() {
    const poseNames = Object.keys(poses);
    const hand = this.hands[0];
    const hv = normalize(
      hand.keypoints3D.map((keypoint) => [keypoint.x, keypoint.y, keypoint.z]),
    ).flat();
    let maxPose;
    let maxNum = -1;
    let maxNumOfPose = {
      create: -1,
      expand: -1,
      shrink: -1,
      point: -1,
      drag: -1,
    };
    poseNames.forEach((poseName) => {
      const pose = poses[poseName];
      const pv = normalize(
        pose.map((keypoint) => [keypoint.x, keypoint.y, keypoint.z]),
      ).flat();
      const cos = calculateCosineSimilarity(hv, pv);

      let myPoseName = poseName;
      // console.log('myPoseName before if', myPoseName);
      if (!isNaN(parseInt(poseName.charAt(poseName.length - 1)))) {
        myPoseName = myPoseName.substring(0, myPoseName.length - 1);
      }
      const cosToFixed = cos.toFixed(3);
      // console.log('myposename', myPoseName);
      maxNumOfPose[myPoseName] = Math.max(maxNumOfPose[myPoseName], cosToFixed);
      if (cosToFixed > maxNum) {
        maxNum = cosToFixed;
        maxPose = myPoseName;
      }
    });
    Object.keys(maxNumOfPose).forEach((pose) => {
      document.querySelector(`#pose-${pose}`).innerHTML = maxNumOfPose[pose];
    });

    const x = hand.keypoints[maxPose == 'point' ? 8 : 5].x;
    const y = hand.keypoints[maxPose == 'point' ? 8 : 5].y;
    if (maxNum > 0.95) {
      this.onPoseDetected(maxPose, [this.vw - x, y]);
    } else {
      this.onPoseDetected('none');
    }
  }

  onPoseDetected(poseName, posePosition) {
    document
      .querySelectorAll(`.gestures > li`)
      .forEach((elem) => elem.classList.remove('activated'));

    if (poseName == 'none') {
      this.currentPoseName = poseName;
      return;
    }
    document
      .querySelector(`#pose-${poseName}`)
      .parentElement.classList.add('activated');

    if (this.currentPoseName !== poseName) {
      this.poseStartTime = Date.now();
      this.poseStartPosition = posePosition;
      this.currentPoseName = poseName;
      if (poseName == 'drag') {
        if (!this.pointedWindowElement) {
          return;
        }
        this.initialPointedWindowPos = {
          x: this.pointedWindowElement.offsetLeft,
          y: this.pointedWindowElement.offsetTop,
        };
      }
    }
    // console.log('pose position', posePosition);
    // console.log('pose duration', Date.now() - this.poseStartTIme);
    // console.log(
    //   `dragged by ${posePosition[0] - this.poseStartPosition[0]} ${
    //     posePosition[1] - this.poseStartPosition[0]
    //   }`,
    if (poseName == 'point') {
      this.onPoint(posePosition);
    }
    if (poseName == 'create') {
      this.onCreate();
    }
    if (poseName == 'expand' || poseName == 'shrink') {
      this.onSize(poseName);
    }
    if (poseName == 'drag') {
      this.onDrag(posePosition);
    }
  }

  onDrag(posePosition) {
    if (!this.pointedWindowElement) {
      return;
    }
    const dx = (posePosition[0] - this.poseStartPosition[0]) * 2;
    const dy = (posePosition[1] - this.poseStartPosition[1]) * 2;
    // console.log('dx', dx, 'dy', dy);
    this.pointedWindowElement.style.left = `${
      this.initialPointedWindowPos.x + dx
    }px`;
    this.pointedWindowElement.style.top = `${
      this.initialPointedWindowPos.y + dy
    }px`;
  }

  onSize(actionName) {
    if (!this.pointedWindowElement) {
      return;
    }
    const left = this.pointedWindowElement.offsetLeft;
    const top = this.pointedWindowElement.offsetTop;
    const width = this.pointedWindowElement.offsetWidth;
    const height = this.pointedWindowElement.offsetHeight;
    console.log('left', left, 'top', top, 'width', width, 'height', height);
    if (actionName == 'expand' && Math.max(width, height) > 500) {
      return;
    }
    if (Math.min(width, height) < 100) {
      this.pointedWindowElement.remove();
      this.setPointedWindow(null);
      return;
    }
    const diff = actionName == 'expand' ? 1 : -1;
    this.pointedWindowElement.style.left = `${left - 1.5 * diff}px`;
    this.pointedWindowElement.style.top = `${top - diff}px`;
    this.pointedWindowElement.style.width = `${width + diff * 3}px`;
    this.pointedWindowElement.style.height = `${height + diff * 2}px`;
  }

  onCreate() {
    const windowsElement = document.querySelector('#windows');
    const width = windowsElement.offsetWidth;
    const height = windowsElement.offsetHeight;
    const newWindowWidth = 200;
    const newWindowHeight = 133;

    if (Date.now() - this.poseStartTime >= 1000) {
      const divClassNo = Math.floor(Math.random() * 6) + 1;
      this.maxWindowId++;
      const newWindow = document.createElement('div');
      newWindow.setAttribute('id', `window-${this.maxWindowId}`);
      newWindow.classList.add('window');
      newWindow.classList.add(`program-${divClassNo}`);
      newWindow.style.left = `${width / 2 - newWindowWidth / 2}px`;
      newWindow.style.top = `${height / 2 - newWindowHeight / 2}px`;
      newWindow.style.zIndex = 999;
      document.getElementById('windows').appendChild(newWindow);
      this.poseStartTime = Date.now();
      this.reassignZIndex();
      this.setPointedWindow(newWindow);
    }
  }

  reassignZIndex() {
    Array.from(document.querySelectorAll('.window'))
      .sort((w1, w2) =>
        window.getComputedStyle(w1).zIndex > window.getComputedStyle(w2).zIndex
          ? 1
          : -1,
      )
      .forEach((w, i) => {
        w.style.zIndex = i + 1;
      });
  }
  onPoint(posePosition) {
    const pointElement = document.querySelector('#point');
    const windowsElement = document.querySelector('#windows');
    const width = windowsElement.offsetWidth;
    const height = windowsElement.offsetHeight;
    const deadZoneX = 100;
    const deadZoneY = 100;

    const pointX =
      (width * (posePosition[0] - deadZoneX)) / (this.vw - deadZoneX * 2);
    const pointY =
      (height * (posePosition[1] - deadZoneY)) / (this.vh - deadZoneY * 2);
    pointElement.style.left = `${pointX}px`;
    pointElement.style.top = `${pointY}px`;

    const pointedWindows = Array.from(document.querySelectorAll('.window'))
      .filter(
        (window) =>
          pointX >= window.offsetLeft &&
          pointX <= window.offsetLeft + window.offsetWidth &&
          pointY >= window.offsetTop &&
          pointY <= window.offsetTop + window.offsetHeight,
      )
      .sort((w1, w2) =>
        window.getComputedStyle(w1).zIndex < window.getComputedStyle(w2).zIndex
          ? 1
          : -1,
      );
    const pointedWindow =
      pointedWindows.length > 0 ? pointedWindows[0] : undefined;
    if (pointedWindow) {
      pointedWindow.style.zIndex = 999;
      this.reassignZIndex();
      this.setPointedWindow(pointedWindow);
    } else {
      this.setPointedWindow(null);
    }
  }

  setPointedWindow(window) {
    this.pointedWindowElement = window;
    Array.from(document.querySelectorAll('.window')).forEach((w) => {
      if (w != window) w.classList.remove('pointed');
    });
    this.pointedWindowElement &&
      this.pointedWindowElement.classList.add('pointed');
  }
}

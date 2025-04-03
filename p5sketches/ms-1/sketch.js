// developed based on Dan Shiffman's shader example
const BLOB_COUNT_ORIGINAL = 5; //dragable balls
const BLOBS_TOTAL = 7;        

const FINGER_INDEX_1 = 5;  // for thumb tip
const FINGER_INDEX_2 = 6;  // for index finger tip

const FRICTION = 0.975;
const SPRING = 0.02;
const RESONANCE = 0.09;
const BOUNCE = 0.9;

let theShader;
let blobs = []; 

let handPose;
let video;
let hands = [];

// drage control
let draggingIndex = -1; 
let prevMouseY = 0;
let fingerPressed = false; // detach finger touch

// smoothness index
let alpha = 0.4; 

function preload() {
  theShader = loadShader('basic.vert', 'basic.frag');
  handPose = ml5.handPose();
}

function setup() {
  pixelDensity(1);
  let SIZE = floor(min(windowWidth, windowHeight) * 0.9);
  createCanvas(SIZE, SIZE, WEBGL);
  noStroke();

  video = createCapture(VIDEO);
  video.size(SIZE, SIZE);
  video.hide();

  handPose.detectStart(video, gotHands);

  for (let i = 0; i < BLOBS_TOTAL; i++) {
    let x, y;
    if (i < BLOB_COUNT_ORIGINAL) {
      x = map(i, 0, BLOB_COUNT_ORIGINAL - 1, width * 0.1, width * 0.9);
      y = height / 2;
      blobs.push(new Blobb(x, y, false));  // 
    } else {
 
      x = -9999;
      y = -9999;
      blobs.push(new Blobb(x, y, true));   //
    }
  }
}

function draw() {
  background(0);

  handleHandTracking();
  updateBlobs();

  theShader.setUniform('u_resolution', [width, height]);
  theShader.setUniform('u_blobx', blobs.map(b => b.x));
  theShader.setUniform('u_bloby', blobs.map(b => b.y));

  shader(theShader);
  rect(0, 0, width, height);
}


class Blobb {
  constructor(x, y, isFinger) {
    this.x = x;
    this.y = y;
    this.vy = 0;           
    this.targetY = y;     
    this.isFinger = isFinger; 
  }

  update() {
    if (this.isFinger) return;

    if (!this.isDragging()) {
      let springForce = (this.targetY - this.y) * SPRING;
      this.vy += springForce;
      this.vy *= FRICTION;
      this.y += this.vy;

      if (this.y < 0) {
        this.y = 0;
        this.vy *= -BOUNCE;
      } else if (this.y > height) {
        this.y = height;
        this.vy *= -BOUNCE;
      }
    }
  }

  isDragging() {
    return (!this.isFinger && draggingIndex === blobs.indexOf(this));
  }
}

function updateBlobs() {
  if (draggingIndex !== -1) {
    let mainBlob = blobs[draggingIndex];
    let mainVY = mainBlob.vy;

    for (let i = 0; i < BLOB_COUNT_ORIGINAL; i++) {
      if (i !== draggingIndex) {
        let b = blobs[i];
        b.vy += (mainVY - b.vy) * RESONANCE;
      }
    }
  }

  for (let b of blobs) {
    b.update();
  }
}

function gotHands(results) {
  hands = results; 
}


function handleHandTracking() {
  if (hands.length > 0) {
    let hand = hands[0];
    let thumb = hand.keypoints[4];
    let indexFinger = hand.keypoints[8];

    let rawThumbX = width  - thumb.x;
    let rawThumbY = height - thumb.y;
    let rawIndexX = width  - indexFinger.x;
    let rawIndexY = height - indexFinger.y;

    let thumbBlob = blobs[FINGER_INDEX_1];
    let indexBlob = blobs[FINGER_INDEX_2];

    thumbBlob.x  = lerp(thumbBlob.x,  rawThumbX,  alpha);
    thumbBlob.y  = lerp(thumbBlob.y,  rawThumbY,  alpha);
    indexBlob.x  = lerp(indexBlob.x,  rawIndexX,  alpha);
    indexBlob.y  = lerp(indexBlob.y,  rawIndexY,  alpha);

    let d = dist(thumbBlob.x, thumbBlob.y, indexBlob.x, indexBlob.y);
    let threshold = 40; 

    if (d < threshold) {
      if (!fingerPressed) {
        fingerPressed = true;
        simulateMousePressed(indexBlob.x, indexBlob.y);
      } else {
        simulateMouseDragged(indexBlob.x, indexBlob.y);
      }
    } else {
      if (fingerPressed) {
        fingerPressed = false;
        simulateMouseReleased();
      }
    }
  } else {
    let thumbBlob = blobs[FINGER_INDEX_1];
    let indexBlob = blobs[FINGER_INDEX_2];
    thumbBlob.x = -9999;
    thumbBlob.y = -9999;
    indexBlob.x = -9999;
    indexBlob.y = -9999;

    if (fingerPressed) {
      fingerPressed = false;
      simulateMouseReleased();
    }
  }
}


function simulateMousePressed(x, y) {
  let oldMx = -x + width;
  let mx = width - oldMx;
  let my = y + height / 2;

  for (let i = 0; i < BLOB_COUNT_ORIGINAL; i++) {
    let b = blobs[i];
    let distY = abs(b.y - my);
    let distX = abs(b.x - mx);
    if (distX < 30) {
      draggingIndex = i;
      prevMouseY = my;
      break;
    }
  }
}

function simulateMouseDragged(x, y) {
  if (draggingIndex !== -1) {
    let my = y + height / 2;
    let b = blobs[draggingIndex];
    let dy = my - prevMouseY;

    b.y += dy;   
    b.vy = dy;   

    prevMouseY = my;

    if (b.y < 0) b.y = 0;
    if (b.y > height) b.y = height;
  }
}

function simulateMouseReleased() {
  if (draggingIndex !== -1) {
    draggingIndex = -1;
  }
}

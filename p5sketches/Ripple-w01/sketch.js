let mic, fft;
let ripples = [];
let lastTriggerTime = 0;
let triggerCooldown = 300; 
let lastPrintTime = 0;     
let debugThreshold = 50;   

function setup() {
  createCanvas(windowWidth, windowHeight);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
}

function draw() {
  background(0);
  
  let spectrum = fft.analyze();
  let energy = fft.getEnergy(800, 1200);
  
  if (millis() - lastPrintTime > 1000) {
    let centroid = fft.getCentroid();
    console.log("当前声音频谱重心: " + centroid.toFixed(2) + " Hz, 能量: " + energy);
    lastPrintTime = millis();
  }
  

  
  if (energy > debugThreshold && millis() - lastTriggerTime > triggerCooldown) {
    let x = random(width);
    let y = random(height);
    let c = color(random(255), random(255), random(255));
    ripples.push(new Ripple(x, y, c));
    lastTriggerTime = millis();
  }
  
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].display();
    if (ripples[i].isFinished()) {
      ripples.splice(i, 1);
    }
  }
}

class Ripple {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = random(300, 600);
    this.growthRate = random(2, 5);
    this.alpha = 255;
    this.fadeRate = 2;
    this.col = col;
    this.strokeW = 1; 
  }
  
  update() {
    this.radius += this.growthRate;
    this.strokeW += 0.2;
    
    if (this.radius > this.maxRadius) {
      this.alpha -= this.fadeRate * 2;
    } else {
      this.alpha -= this.fadeRate;
    }
    
    if (this.alpha < 0) this.alpha = 0;
  }
  
  display() {
    noFill();
    stroke(red(this.col), green(this.col), blue(this.col), this.alpha);
    strokeWeight(this.strokeW);
    ellipse(this.x, this.y, this.radius * 2);
  }
  
  isFinished() {
    return this.alpha <= 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

function mousePressed() {
  userStartAudio();
}

/*********** classes ***********/

// rectangle object
function Rect(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

// tunnel object
function Tunnel(pw, ph) {
	// constants
	this.resolution = 2; // width of tunnel elements
	this.maxA = .6; // greatest slope of walls
	this.maxAVar = .05; // maximum angle variance between steps
	this.wColor = '#ABC'; // wall color
	this.bColor = '#EEE'; // background color
	this.startingGap = .5; // starting ratio of gap to height
	
	// ivars
	this.h;
	this.w;
	this.rects;
	this.currGap;
	this.currOffset;
	this.currAngle;
	
	this.updateOffset = function() {
		// adjust angle
		offsetPercent = this.currOffset / (this.h - this.currGap);
		da = -this.maxAVar * offsetPercent + Math.random() * this.maxAVar;
		if (Math.abs(this.currAngle + da) < Math.abs(this.maxA)) {
			this.currAngle += da;
		} else {
			this.currAngle -= da;
		}
		// calculate new offset
		dh = Math.tan(this.currAngle) * this.resolution;
		this.currOffset += dh;
	}
	
	// move all components to the left, regenerate the furthest if needed
	this.move = function() {
		wrapped = false;
		// move things, wrap if needed
		for (var i = 0; i < this.rects.length; i++) {
			currRect = this.rects[i];
			currRect.x -= 1;
			if (currRect.x < -this.resolution) {
				wrapped = true
				currRect.x += this.w + this.resolution;
				if (currRect.y == 0) {
					// it's the upper tunnel
					currRect.h = this.currOffset;
				} else {
					// it's the lower
					currRect.y = this.currOffset + this.currGap;
					currRect.h = this.h - currRect.y;
				}
			}
		}
		// if it's been wrapped, update the angle and offset again
		if (wrapped) {
			this.updateOffset();
		}
	}
	
	// check if player overlaps
	this.checkCollision = function(a) {
		for (var i = 0; i < this.rects.length; i++) {
			b = this.rects[i];
			if (a.x < b.x + b.w && a.x + a.w > b.x &&
			   a.y < b.y + b.h && a.y + a.h > b.y) {
				return true;
			}
		}
		return false; // we got through okeay
	}
	
	// draw the tunnel to the passed in canvas
	this.draw = function(canvas) {
		// draw backround
		canvas.fillStyle = this.bColor; // background color
		canvas.fillRect(0, 0, this.w, this.h);
		canvas.fillStyle = this.wColor;
		for (var i = 0; i < this.rects.length; i++) {
			canvas.fillRect(this.rects[i].x, this.rects[i].y, this.rects[i].w, this.rects[i].h);
		}
	}
	
	// constructor
	this.init = function(w, h) {
		// reset ivars
		this.h = h;
		this.w = w;
		this.rects = []
		this.currGap = h * this.startingGap;
		this.currOffset = (h - this.currGap) / 2;
		this.currAngle = 0.0;
		
		// make initial rectangle states
		colNum = Math.ceil(this.w / this.resolution) + 1; // with an extra, for width
		for (var col = 0; col < colNum; col++) {
			this.rects[2 * col] = new Rect(col * this.resolution, 0, this.resolution, this.currOffset); // top section
			this.rects[2 * col + 1] = new Rect(col * this.resolution, this.currOffset + this.currGap, this.resolution, this.h - (this.currOffset + this.currGap)); // bottom section
			this.updateOffset();
		}
	}
	
	// call constructor
	this.init(pw, ph);
}

// helicopter object
Heli.prototype = new Rect();
Heli.prototype.constructor = Heli;
function Heli(px, py) {
	// ivars
	this.cColor = '#00F'; // chopper color
	this.velocity = {x: 0, y: 0};
	this.maxVelocity = {x: 1, y: 1};
	
	// call super constructer
	Rect.prototype.constructor.call(this, px, py, 20, 20);
	
	// cap velocities
	this.capV = function() {
		if (Math.abs(this.velocity.y) > Math.abs(this.maxVelocity.y)) {
			this.velocity.y = this.velocity.y / Math.abs(this.velocity.y) * this.maxVelocity.y;
		}
	}
	
	// apply upward force to the chopper
	this.lift = function() {
		this.velocity.y -= .08;
		this.capV();
	}
	
	// pull downward (gravity)
	this.fall = function() {
		this.velocity.y += .02;
		this.capV();
	}
	
	// update x & y
	this.update = function() {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
	
	// draw the chopper to the passed in canvas
	this.draw = function(canvas) {
		canvas.fillStyle = this.cColor;
		canvas.fillRect(this.x, this.y, this.w, this.h);
	}
}

// scorepanel object
function ScorePanel(p_width, p_height, p_offset, p_maxScore) {
	// constants
	this.bColor = '#BCD';
	this.tColor = '#0F0';
	
	// ivars
	this.w = p_width;
	this.h = p_height;
	this.offset = p_offset;
	this.currScore = 0;
	this.maxScore = p_maxScore;
	
	this.draw = function(canvas) {
		canvas.fillStyle = this.bColor; // background color
		canvas.fillRect(0, this.offset, this.w, this.h);
		
		// draw text
		context.strokeText('Hello world!', this.offest, 10);
	}
}

/********* game objects **********/
var tunnel;
var player;
var scorePanel;

/********* game mechanics **********/

// game vars
var paused = true;
var pauseTriggered = false;

// key manipulation
var keys = {}
document.onkeydown = function(e) { keys[e.which] = true }
document.onkeyup = function(e) { keys[e.which] = false }

function newGame(width, height) {
	paused = true;
	tunnel = new Tunnel(width, height - 30);
	scorePanel = new ScorePanel(width, 30, height - 30);
	player = new Heli(40, height/2 - 10);
}

function update(c) {
	// check pause
	if (keys[80] && !pauseTriggered) {
		paused = !paused;
		pauseTriggered = true;
	} else if (!keys[80] && pauseTriggered){
		pauseTriggered = false;
	}
	
	// apply lift
	if (keys[32] && paused) paused = false;
	else if (keys[32]) player.lift();
	
	// break out if paused
	if (paused) return;
	
	// move tunnel
	tunnel.move();
	
	
	player.fall();
	player.update();
	
	// check for collisions
	if (tunnel.checkCollision(player)) {
		newGame(c.canvas.width, c.canvas.height);
	}
}

function draw(c) {
	tunnel.draw(c);
	player.draw(c);
	scorePanel.draw(c);
}

window.onload = function() {
	// new game with proper dimensions
	var c = document.getElementById('screen').getContext('2d');
	newGame(c.canvas.width, c.canvas.height);
	
	// start game loop
	setInterval(function() {
		update(c);
		draw(c);
	}, 1000 / 150);
}
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
	this.oColor = '#9AB'; // obstacle color
	this.bColor = '#EEE'; // background color
	this.startingGap = .5; // starting ratio of gap to height
	this.maxObCoeff = 3;
	this.minObSize = 23;
	this.obWidth = 20;
	this.obDist = 100;
	this.obDistVar = 50;
	
	// ivars
	this.h;
	this.w;
	this.rects;
	this.obstacles = new Array();
	this.currGap;
	this.currOffset;
	this.currAngle;
	this.lastTopRect;
	this.sinceLastOb = 0;
	this.obDistNext = 0;
	
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
			currRect.x -= 2;
			if (currRect.x < -this.resolution) {
				wrapped = true
				currRect.x += this.w + this.resolution;
				if (currRect.y == 0) {
					// it's the upper tunnel
					currRect.h = this.currOffset;
					if (currRect.x >= this.w - this.resolution) this.lastTopRect = currRect;
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
		
		// deal with some obstacles
		for (var i = 0; i < this.obstacles.length; i++) {
			currObs = this.obstacles[i];
			currObs.x -= 2;
			if (currObs.x < -this.minObSize) {
				// remove it
				pos = this.obstacles.indexOf(currObs);
				this.obstacles.splice(pos, pos + 1);
			}
		}
		
		
		// make new obstacles
		this.sinceLastOb++;
		if (this.lastTopRect && this.sinceLastOb > this.obDistNext) {
			newH = this.minObSize * (1 + parseInt(Math.random() * this.maxObCoeff));
			newY = this.lastTopRect.h; // height of the last top one
			newY += (this.currGap - newH) * Math.random();
			newObs = new Rect(this.w, newY, this.minObSize, newH);
			this.obstacles.push(newObs);
			this.sinceLastOb = 0;
			this.obDistNext = this.obDist + (Math.random() * 2 * this.obDistVar - this.obDistVar);
		}
	}
	
	// check if player overlaps
	this.checkCollision = function(a) {
		// check walls
		for (var i = 0; i < this.rects.length; i++) {
			b = this.rects[i];
			if (a.x < b.x + b.w && a.x + a.w > b.x &&
			   a.y < b.y + b.h && a.y + a.h > b.y) {
				return true;
			}
		}
		// check obstacles
		for (var i = 0; i < this.obstacles.length; i++) {
			b = this.obstacles[i];
			if (a.x < b.x + b.w && a.x + a.w > b.x &&
			   a.y < b.y + b.h && a.y + a.h > b.y) {
				return true;
			}
		}
		return false; // we got through okay
	}
	
	// draw the tunnel to the passed in canvas
	this.draw = function(canvas) {
		// draw backround
		canvas.fillStyle = this.bColor; // background color
		canvas.fillRect(0, 0, this.w, this.h);
		// draw obstacles
		canvas.fillStyle = this.oColor;
		for (var i = 0; i < this.obstacles.length; i++) {
			canvas.fillRect(this.obstacles[i].x, this.obstacles[i].y, this.obstacles[i].w, this.obstacles[i].h);
		}
		// draw walls
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
	this.maxVelocity = {x: 1, y: 1.2};
	
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
		this.velocity.y += .03;
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
	this.tColor = '#567';
	
	// ivars
	this.w = p_width;
	this.h = p_height;
	this.offset = p_offset;
	this.currScore = 0;
	this.maxScore = p_maxScore;
	this.notification
	
	this.draw = function(canvas) {
		canvas.fillStyle = this.bColor; // background color
		canvas.fillRect(0, this.offset, this.w, this.h);
		
		// draw current
		canvas.fillStyle = this.tColor;
	    canvas.font = (this.h - 13) + "pt Fondamento";
		canvas.textBaseline = "middle"
		canvas.textAlign = "left";
		canvas.fillText(Math.floor(this.currScore), 10, this.offset + this.h / 2);
		
		// draw max
		canvas.textAlign = "right";
		canvas.fillText(Math.floor(this.maxScore), this.w - 10, this.offset + this.h / 2);
	}
	
	this.incScore = function() {
		this.currScore += .03;
		if (this.maxScore < this.currScore) this.maxScore = this.currScore;
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
var highScore = 0;

// key and mouse manipulation
var keys = {}
var mouseDown = false;
document.onkeydown = function(e) { keys[e.which] = true; return false; }
document.onkeyup = function(e) { keys[e.which] = false; return false; }
document.onmousedown = function() { mouseDown = true; return false; }
document.onmouseup = function() { mouseDown = false; return false; }
// return false so we're not selecting stuff or doing other key input

function newGame(width, height) {
	paused = true;
	tunnel = new Tunnel(width, height - 30);
	if (scorePanel) highScore = scorePanel.maxScore;
	scorePanel = new ScorePanel(width, 30, height - 30, highScore);
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
	if ((keys[32] || mouseDown) && paused) paused = false;
	else if (keys[32] || mouseDown) player.lift();
	
	// break out if paused
	if (paused) return;
	
	// move tunnel
	tunnel.move();
	
	// update player
	player.fall();
	player.update();
	
	// increment score
	scorePanel.incScore();
	
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
	}, 1000 / 75);
}
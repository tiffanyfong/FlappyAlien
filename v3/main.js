var pipeInitialX = 440;

var game = new Phaser.Game(450, 600, Phaser.AUTO, "screen", 
	{preload: preload, create: create, update: update});

var spaceKey;
var gameState; // start = 0, in play = 1, end = 2
var gravity = 0; // -1 = light, 0 = normal, 1 = heavy
var frequency = 0; // -1 = frequent, 0 = normal, 1 = infrequent
var debrisToggle = 0; // 0 = off, 1 = on
var pipeToggle = 0; // 0 = off, 1 = on
var score = 0;
var highScore = 0;
var scoreToggle = 1; // prevents double scoring of pipes
var collisionToggle = 0; // evil alien collision
var scoreText;

function preload() {
	$("#endBox").hide();
	game.load.image("background", "img/background.png");
	game.load.image("ground", "img/ground.png");
	game.load.image("alien", "img/alien.png");
	game.load.image("debris", "img/alienInverted.png");
	game.load.image("pipeTop", "img/PipeTop.png");
	game.load.image("pipeBottom", "img/PipeBottom.png");

	game.load.audio("jump", "audio/jump.wav");
	game.load.audio("thwack", "audio/thwack.wav");
	game.load.audio("alienThrow", "audio/alienThrow.wav");
	game.load.audio("score++", "audio/score++.mp3");
};

function create() { 
	// Enable Arcade physics system
	game.physics.startSystem(Phaser.Physics.ARCADE);

	background = game.add.sprite(0,0,"background");

	setupObstacles();

	// Player
	player = game.add.sprite(150, 250, "alien");
	game.physics.arcade.enable(player);
	player.body.collideWorldBounds = true;
	player.anchor.setTo(0.2, 0.5);

	// Jump on Space key
	spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
	spaceKey.onDown.add(jump, this);

	// Display score on top-left
	scoreText = game.add.text(18, 18, "0", {fontSize: '32px', fill: '#FFFFFF'});

	// Audio
	jumpSound = game.add.audio("jump");
	jumpSound.volume = 0.3;
	hitSound = game.add.audio("thwack");
	evilAlienSound = game.add.audio("alienThrow");
	evilAlienBuffer = game.add.audio("thwack");	// Silence for syncronization
	evilAlienBuffer.volume = 0;
	evilAlienBuffer.onStop.add(addDebris, this);
	scoreSound = game.add.audio("score++");
	scoreSound.volume = 0.1;

	reset();
};

function setupObstacles() {
	// Ground
	blocks = game.add.group();
	blocks.enableBody = true;
	initialGround = game.add.sprite(0, 520, "ground");
	blocks.add(initialGround);
	game.physics.arcade.enable(initialGround);
	initialGround.body.immovable = true;
	initialGround.checkWorldBounds = true;
	initialGround.outOfBoundsKill = true;

	// Pipes
	pipes = game.add.group();
	pipes.enableBody = true;

	// Debris
	debris = game.add.group();
	debris.enableBody = true;
};

// Intialize game
$("#reset").click(reset);

function reset() {
	gameState = 0;

	blocks.destroy();
	pipes.destroy();
	debris.destroy();

	setupObstacles();

	// Reset scores
	$("#endBox").hide();
	score = 0;
	scoreText.text = "0";
	
	// Set up player
	player.x = 150;
	player.y = 250;
	player.body.gravity.y = 0;
	player.body.velocity.y = 0;
	player.angle = 0;

	return false;
};

function update() {
	game.physics.arcade.collide(player, blocks, gameOver, null, this);
	//game.physics.arcade.collide(player, pipes, gameOver, null, this);
	game.physics.arcade.collide(debris, blocks);

	if (gameState === 1) {
		game.physics.arcade.collide(player, debris, bounce, null, this);

		// Make alien turn downwards
		if (player.angle < 40) 
			player.angle += 1;

		// Move alien back to normal x position (evilAlien)
		if (debrisToggle && collisionToggle && player.x > 150) {
			player.body.velocity.x = 0;
			collisionToggle = 0;
		}
		else if (debrisToggle && collisionToggle && player.x < 10) {
			player.body.velocity.x = Math.max(10, player.body.velocity.x * -1);
		}

		// Update score
		pipes.forEach(function(pipe) {
			if (!pipe.scored && (pipe.x + 20 < player.x)) {
				pipe.scored = true;
				if (scoreToggle) { // Prevents double scoring
					score += 1;
					scoreText.text = score;
					scoreSound.play();
				}
				scoreToggle = !scoreToggle;
			}
		}, this);
	}
};

// When user pushes space key for the first time
function start() {
	gameState = 1;

	// Determine custom settings
	gravity = $("#lowG").css("background-color") === "rgb(45, 210, 45)"
		? -1 : 0;
	gravity = $("#highG").css("background-color") === "rgb(45, 210, 45)"
		? 1 : gravity;
	
	frequency = $("#lowF").css("background-color") === "rgb(45, 210, 45)"
		? 1 : 0;
	frequency = $("#highF").css("background-color") === "rgb(45, 210, 45)"
		? -1 : frequency;

	debrisToggle = $("#onA").css("background-color") === "rgb(45, 210, 45)"
		? 1 : 0;

	pipeToggle = $("#onP").css("background-color") === "rgb(45, 210, 45)"
		? 1 : 0;

	player.body.gravity.y = 1000 + (gravity << 9);

	// Send out pipes if game is in play
	pipeTimer = game.time.events.loop(
		1700 + (frequency << 9), addPipeColumn, this);

	// Move ground left
	initialGround.body.velocity.x = -200;
	addGround();
	groundTimer = game.time.events.loop(1770, addGround, this);

	if (debrisToggle) {
		debrisTimer = game.time.events.loop(2500, throwDebris, this);
	}
};

function gameOver() {
	if (gameState !== 2) {
		hitSound.play();
	}
	gameState = 2;

	// Stop all pipes
	pipes.forEach(function(pipe) {
		pipe.body.velocity.x = 0;
		pipe.body.enable = false;
	}, this);

	// Stops ground motion
	blocks.forEach(function(ground) {
		ground.body.velocity.x = 0;
	}, this);
	
	// Prevents spawning of new obstacles
	game.time.events.remove(pipeTimer);
	game.time.events.remove(groundTimer);
	if (debrisToggle) {
		game.time.events.remove(debrisTimer);
	}

	// Bird falls straight down
	player.body.velocity.x = 0;

	// Display score
	if (player.y > 460) {
		$("#score").text("Score: " + score);
		if (score > highScore) {
			highScore = score;
			$("#highScore").text("High score: " + highScore);
		}

		$("#endBox").show();
	}
};

// When alien hits debris
function bounce() {
	debris.forEach(function(db) {
		db.body.velocity.x = 25;
	}, this);
	collisionToggle = 1;
};

function addGround() {
	var ground = game.add.sprite(450, 520, "ground");
	blocks.add(ground);
	game.physics.arcade.enable(ground);

	// Move ground left
	ground.body.immovable = true;
	ground.body.velocity.x = -200;

	// Destroy when out of bounds
	ground.checkWorldBounds = true;
	ground.outOfBoundsKill = true;
};

function addPipeColumn() {
	// Randomize where the hole is
	var offset = 30 * game.rnd.integerInRange(0, 7);
	var evilOffset = pipeToggle ? 30 * game.rnd.integerInRange(0, 7) : 0;

	// Add pipe top and bottom
	addPipePiece(evilOffset, -250,
		game.add.sprite(pipeInitialX, -250 + offset, "pipeTop"));
	addPipePiece(evilOffset, 200, 
		game.add.sprite(pipeInitialX, 200 + offset, "pipeBottom"));
};

function addPipePiece(evilOffset, initialY, piece) {
	pipes.add(piece);
	game.physics.arcade.enable(piece);

	game.world.bringToTop(blocks);
	if (debrisToggle) {
		game.world.bringToTop(debris);
	}
	game.world.bringToTop(player);

	// Move pipes left
	piece.body.immovable = true;
	piece.body.velocity.x = -200;

	// Evil pipes
	if (pipeToggle) {
		game.add.tween(piece).to(
			{y: initialY + evilOffset}, 1800).start();
	}

	// Destroy when out of bounds
	piece.checkWorldBounds = true;
	piece.outOfBoundsKill = true;

	// Scoring
	piece.scored = false;
};

// Throw evil aliens at the player
function throwDebris() {
	evilAlienSound.play();
	evilAlienBuffer.play(); // sync buffer, then addDebris
};

function addDebris() {
	var db = game.add.sprite(410, 270, "debris");
	debris.add(db);
	game.physics.arcade.enable(db);
	
	// Randomize trajectory of debris
	db.body.gravity.y = 600 + 200 * game.rnd.integerInRange(0, 4);
	db.body.bounce.y = 0.7;
	db.body.velocity.x = -60 * game.rnd.integerInRange(3, 8);;
	db.body.velocity.y = -100 * game.rnd.integerInRange(3, 8);;

	// Destroy when out of bounds
	db.checkWorldBounds = true;
	db.outOfBoundsKill = true;
};

// Change gravity (grey the unused setting)
$("#lowG").click(function() {
	$("#lowG").css("background-color", "#2dd22d");
	$("#mediumG").css("background-color", "#669966");
	$("#highG").css("background-color", "#669966");
	return false;
});

$("#mediumG").click(function() {
	$("#lowG").css("background-color", "#669966");
	$("#mediumG").css("background-color", "#2dd22d");
	$("#highG").css("background-color", "#669966");
	return false;
});

$("#highG").click(function() {
	$("#lowG").css("background-color", "#669966");
	$("#mediumG").css("background-color", "#669966");
	$("#highG").css("background-color", "#2dd22d");
	return false;
});

// Change pipe frequency (grey the unused setting)
$("#lowF").click(function() {
	$("#lowF").css("background-color", "#2dd22d");
	$("#mediumF").css("background-color", "#669966");
	$("#highF").css("background-color", "#669966");
	return false;
});

$("#mediumF").click(function() {
	$("#lowF").css("background-color", "#669966");
	$("#mediumF").css("background-color", "#2dd22d");
	$("#highF").css("background-color", "#669966");
	return false;
});

$("#highF").click(function() {
	$("#lowF").css("background-color", "#669966");
	$("#mediumF").css("background-color", "#669966");
	$("#highF").css("background-color", "#2dd22d");
	return false;
});

// Toggling evil aliens (grey the unused setting)
$("#offA").click(function() {
	$("#offA").css("background-color", "#2dd22d");
	$("#onA").css("background-color", "#669966");
	return false;
});

$("#onA").click(function() {
	$("#offA").css("background-color", "#669966");
	$("#onA").css("background-color", "#2dd22d");
	return false;
});

// Toggling moving pipes (grey the unused setting)
$("#offP").click(function() {
	$("#offP").css("background-color", "#2dd22d");
	$("#onP").css("background-color", "#669966");
	return false;
});

$("#onP").click(function() {
	$("#offP").css("background-color", "#669966");
	$("#onP").css("background-color", "#2dd22d");
	return false;
});

function jump() {
	if (gameState !== 2) {
		player.body.velocity.y = -350;
		jumpSound.play();

		// Alien angles up
		game.add.tween(player).to(
			{angle: -25}, 100 - (gravity << 4)).start();

		if (gameState === 0) {
			start();
		}
	}
	// Hit space bar to reset game after loss
	else if ($("#endBox").is(":visible")){
		reset();
	}
};

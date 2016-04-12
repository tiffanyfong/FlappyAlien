var pipeInitialX = 440;

var game = new Phaser.Game(450, 600, Phaser.AUTO, "screen", 
	{preload: preload, create: create, update: update});

var spaceKey;
var gameState; // start = 0, in play = 1, end = 2
var difficulty = 0; // 0 = easy, 1 = hard
var score;
var highScore = 0;
var scoreText;

function preload() {
	$("#endBox").hide();
	game.load.image("background", "img/background.png");
	game.load.image("ground", "img/ground.png");
	game.load.image("alien", "img/alien.png");
	game.load.image("pipeTop", "img/PipeTop.png");
	game.load.image("pipeBottom", "img/PipeBottom.png")
};

function create() { 
	// Hide scores box
	$("#endBox").hide();

	// Enable Arcade physics system
	game.physics.startSystem(Phaser.Physics.ARCADE);

	background = game.add.sprite(0,0,"background");

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

	// Player
	player = game.add.sprite(150, 250, "alien");
	game.physics.arcade.enable(player);
	player.body.collideWorldBounds = true;
	player.anchor.setTo(0.5, 0.5);

	// Jump on Space key
	spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
	spaceKey.onDown.add(jump, this);

	// Display score
	score = 0;
	scoreText = game.add.text(18, 18, "0", { fontSize: '32px', fill: '#FFFFFF' });

	// Initialize game
	gameState = 0;
	player.body.gravity.y = 0;
	player.body.velocity.y = 0;
};

function update() {
	game.physics.arcade.collide(player, blocks, gameOver, null, this);
	game.physics.arcade.collide(player, pipes, gameOver, null, this);
	
	if (gameState === 1) {
		// Make alien turn downwards
		if (player.angle < 40) 
			player.angle += 1;

		// Update score
		pipes.forEach(function(pipe) {
			if (!pipe.scored && (pipe.x + 15 < player.x)) {
				pipe.scored = true;
				score += 0.5; // Because each column has two pipes
				scoreText.text = score;
			}
		}, this);
	}
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

	// Add pipe top and bottom
	addPipePiece(
		game.add.sprite(pipeInitialX, -250 + offset, "pipeTop"));
	addPipePiece(
		game.add.sprite(pipeInitialX, 200 + offset, "pipeBottom"));
};

function addPipePiece(piece) {
	pipes.add(piece);
	game.world.bringToTop(blocks);
	game.physics.arcade.enable(piece);

	// Move pipes left
	piece.body.immovable = true;
	piece.body.velocity.x = -200;

	// Destroy when out of bounds
	piece.checkWorldBounds = true;
	piece.outOfBoundsKill = true;

	// Scoring
	piece.scored = false;
};

// When user pushes space key for the first time
function start() {
	gameState = 1;

	player.body.gravity.y = 1000;

	// Send out pipes if game is in play
	pipeTimer = game.time.events.loop(1750, addPipeColumn, this);

	// Move ground left
	initialGround.body.velocity.x = -200;
	addGround();
	groundTimer = game.time.events.loop(1770, addGround, this);

};

function gameOver() {
	gameState = 2;

	// Stop all pipes
	pipes.forEach(function(pipe) {
		pipe.body.velocity.x = 0;
		pipe.body.enable = false;
	}, this);

	game.time.events.remove(pipeTimer); // Prevents pipe spawning

	// Stops ground motion
	blocks.forEach(function(ground) {
		ground.body.velocity.x = 0;
	}, this);
	game.time.events.remove(groundTimer);

	// Bird falls
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

// Reset
$("#reset").click(function() {
	player.destroy();
	blocks.destroy();
	pipes.destroy();
	scoreText.destroy();
	background.destroy();

	if ($("#easy").css("background") === "rgb(0, 179, 0)") {
		difficulty = 0;
	}
	else {
		difficulty = 1;
	}

	create();
});

// Change difficulty (grey the unused setting)
$("#easy").click(function() {
	$("#easy").css("background", "#00B300");
	$("#hard").css("background", "#C45E5E");
});

$("#hard").click(function() {
	$("#easy").css("background", "#64A364");
	$("#hard").css("background", "#E60000");
});

function jump() {
	if (gameState !== 2) {
		if (gameState === 0) {
			start();
		}
		player.body.velocity.y = -350;

		// Alien angles up
		game.add.tween(player).to({angle: -25}, 100).start();
	}
};

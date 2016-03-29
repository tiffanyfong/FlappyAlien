var pipeInitialX = 440;

var game = new Phaser.Game(450, 600, Phaser.AUTO, "screen", 
	{preload: preload, create: create, update: update});

var spaceKey;
var gameState; // start = 0, playing = 1, and end = 2

function preload() {
	game.load.image("background", "img/background.png");
	game.load.image("ground", "img/ground.png");
	game.load.image("alien", "img/alien.png");
	game.load.image("pipeTop", "img/PipeTop.png");
	game.load.image("pipeBottom", "img/PipeBottom.png")
};

function create() {
	// Enable Arcade physics system
	game.physics.startSystem(Phaser.Physics.ARCADE);

	game.add.sprite(0,0,"background");

	// Ground
	blocks = game.add.group();
	blocks.enableBody = true;
	ground = blocks.create(0,520,"ground");
	ground.body.immovable = true;

	// Pipes
	pipes = game.add.group();

	// Player
	player = game.add.sprite(150, 250, "alien");
	game.physics.arcade.enable(player);
	player.body.collideWorldBounds = true;

	// Jump on Space key
	spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
	spaceKey.onDown.add(jump, this);

	// Initialize game
	gameState = 0;
	player.body.gravity.y = 0;
	player.body.velocity.y = 0;
};

function update() {
	game.physics.arcade.collide(player, blocks);
};

function addPipeColumn() {
	// TODO: Randomize where the hole is
	// var randomNumber = game.rnd.integerInRange(1, 6);

	// Add pipe top and bottom
	var sendTop = game.add.sprite(pipeInitialX, 0, "pipeTop");
	var sendBottom = game.add.sprite(pipeInitialX, 450, "pipeBottom");

	addPipePiece(sendTop);
	addPipePiece(sendBottom);
};

function addPipePiece(piece) {
	pipes.add(piece);
	game.world.bringToTop(blocks);
	game.physics.arcade.enable(piece);

	// Move pipes left
	piece.body.velocity.x = -200;

	// Destroy when out of bounds
	piece.checkWorldBounds = true;
	piece.outOfBoundsKill = true;
};

// When user pushes space key for the first time
function start() {
	gameState = 1;

	player.body.gravity.y = 1000;

	// Send out pipes if game is in play
	timer = game.time.events.loop(2000, addPipeColumn, this);
};

function jump() {
	if (gameState === 0) {
		start();
	}
	player.body.velocity.y = -350;
};



var game = new Phaser.Game(450, 600, Phaser.AUTO, "screen", 
	{preload: preload, create: create, update: update});

var spaceKey;

function preload() {
	game.load.image("background", "img/background.png");
	game.load.image("ground", "img/ground.png");
	game.load.image("alien", "img/alien.png");

};

function create() {
	// Enable Arcade physics system
	game.physics.startSystem(Phaser.Physics.ARCADE);

	game.add.sprite(0,0,"background");

	// Group for ground and pipes
	blocks = game.add.group();
	blocks.enableBody = true;
	var ground = blocks.create(0,520,"ground");
	ground.body.immovable = true;
	var pipes = blocks.createMultiple(20, "PipeTop");


	// Player
	player = game.add.sprite(150, 250, "alien");
	game.physics.arcade.enable(player);
	player.body.gravity.y = 0;
	player.body.velocity.y = 0;
	player.body.collideWorldBounds = true;

	// Space key
	spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);




};

function update() {
	cursors = game.input.keyboard.createCursorKeys();

	game.physics.arcade.collide(player, blocks);

	

	// Press spacebar to jump
	if (spaceKey.isDown) {
		player.body.velocity.y = -300;
		player.body.gravity.y = 1000;
	}
};

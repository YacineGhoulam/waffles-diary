const canvasWidth = 600;
const canvasHeight = 600;
const fieldSize = 30;
const waffleSize = 30;
let waffleSpeed = 1;
let waffleCount = 5;
let world = {};
const waffles = [];
let paused = false;
async function loadSprite() {
	const spriteSizeX = 16;
	const spriteSizeY = 20;
	const spriteDirections = ["down", "left", "right", "up"];

	const animations = [];
	for (let w = 0; w < waffleCount; w++) {
		let spriteSheet = await loadImage(`assets/player${w + 1}.png`);
		const spriteRows = {};

		for (let i = 0; i < spriteDirections.length; i++) {
			let direction = spriteDirections[i];
			spriteRows[direction] = [];
			for (let j = 0; j < 3; j++) {
				spriteRows[direction].push(
					spriteSheet.get(
						spriteSizeX * j,
						spriteSizeY * i,
						spriteSizeX,
						spriteSizeY,
					),
				);
			}
		}

		animations.push(spriteRows);
	}

	return animations;
}

function mouseClicked() {
	paused = !paused;
}

function getInfo() {
	for (waffle of waffles) {
		let isOver = waffle.isMouseOver();

		if (isOver) {
			waffle.displayInfo();
		}
	}
}

async function setup() {
	frameRate(30);
	createCanvas(canvasWidth, canvasHeight);

	animations = await loadSprite();
	world = new World(canvasWidth, canvasHeight, fieldSize);

	await world.initiate();

	for (let i = 0; i < 20; i++) {
		const waffle = new Waffle(
			i,
			random(waffleSize, canvasWidth - waffleSize),
			random(waffleSize, canvasHeight - waffleSize),
			waffleSize, // size
			waffleSpeed, // speed
			randomGaussian(200, 2), // energy between 0 and 200
			randomGaussian(5), // exploration between 0 and 10
			randomGaussian(50), // aggressivity between 0 and 100
			randomGaussian(0, 2), //  friendlinessbetween -5 and 5
			animations[i % waffleCount],
		);
		await waffle.initiate();
		waffles.push(waffle);
	}
}

function draw() {
	if (paused) {
		world.render();
		for (let waffle of waffles) {
			waffle.stop = true;
			waffle.display();
			waffle.stop = false;
		}
		getInfo();
		return;
	}
	world.render();

	for (let waffle of waffles) {
		const waffleWorld = world.getFieldsInfo(waffle.x, waffle.y);

		waffle.render(waffleWorld);
	}
}

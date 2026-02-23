const canvasWidth = 600;
const canvasHeight = 600;
const fieldSize = 30;
const waffleSize = 30;
let waffleSpeed = 5;
let waffleCount = 5;
let world = {};
const waffles = [];

async function createWaffle(x, y, size, speed, animations) {
	const waffle = new Waffle(x, y, size, speed, animations);
	await waffle.initiate();
	waffles.push(waffle);
}

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

async function setup() {
	frameRate(30);
	createCanvas(canvasWidth, canvasHeight);

	animations = await loadSprite();
	world = new World(canvasWidth, canvasHeight, fieldSize);

	await world.initiate();

	for (let i = 0; i < 10; i++) {
		await createWaffle(
			random(waffleSize, canvasWidth - waffleSize),
			random(waffleSize, canvasHeight - waffleSize),
			waffleSize,
			waffleSpeed,
			animations[i % waffleCount],
		);
	}
}

function draw() {
	world.render();

	for (let waffle of waffles) {
		const waffleWorld = world.getFieldsInfo(waffle.x, waffle.y);

		waffle.render(waffleWorld);
	}
}

const worldWidth = 600;
const worldHeight = 600;
const fr = 30; // ideally 15, 30 or 60
const fieldSize = 30;
const waffleSize = 30;
let waffleSpeed = 1;
let waffleAssetsCount = 10;
let waffleCount = 10;
let world = {};
const waffles = [];
let paused = true;
let selectedWaffle = false;
let gameStarted = false;
let animtions, font, tomb, dialog, yumSound;

async function loadSprite() {
	const spriteSizeX = 16;
	const spriteSizeY = 20;
	const spriteDirections = ["down", "left", "right", "up"];

	animations = [];
	for (let w = 0; w < waffleAssetsCount; w++) {
		let spriteSheet = await loadImage(`assets/player${w + 1}.png`);
		const spriteRows = {};
		let x = 0;

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

async function loadAssets() {
	await loadSprite();
	font = await loadFont("assets/Minecraft.ttf");
	tomb = await loadImage("assets/tomb.png");
	dialog = await loadImage("assets/dialog.png");
	backgroundMusic = await loadSound("assets/blossom.wav");
	clickSound = await loadSound("assets/click.wav");
	select(`#loadingButton`).hide();
	select(`#startButton`).removeAttribute("style");
}

// handling the diary body
function initiateCharactersView() {
	const div = select(".characters-container");

	for (waffle of waffles) {
		let char = createDiv();
		char.class("characters");
		let image = createImg(
			`assets/fronts/player${(waffle.name % waffleAssetsCount) + 1}_front.png`,
			waffle.name,
		);
		image.id(waffle.name);

		char.child(image);

		image.mousePressed(() => {
			selectedWaffle = image.id();
		});
		div.child(char);
	}
}

function drawRelationshipMatrix() {
	const charactersMatrix = select(".characters-relationships");
	const title = createElement("h2", "Relationship Table");
	charactersMatrix.child(title);
	let row = createDiv();
	row.class("row");

	for (let id = -1; id < waffleCount; id++) {
		let img = "";

		if (id == -1) {
			img = createP("");
		} else {
			img = createImg(
				`assets/fronts/player${(id % waffleAssetsCount) + 1}_front.png`,
				id,
			);
		}

		img.class("cell");

		row.child(img);
	}

	charactersMatrix.child(row);

	for (let waffle of waffles) {
		let row = createDiv();
		row.class("row");
		let image = createImg(
			`assets/fronts/player${(waffle.name % waffleAssetsCount) + 1}_front.png`,
			waffle.name,
		);
		image.class("cell");
		row.child(image);
		for (let newWaffle of waffles) {
			let txt = "";

			if (newWaffle == waffle) {
				txt = "/";
			} else {
				let rel = waffle.findFriendship(newWaffle);
				txt = rel ? rel.feelings : 0;
			}

			let p = createP(txt);
			p.class("cell");
			p.id(`cell${waffle.name}${newWaffle.name}`);

			row.child(p);
		}
		charactersMatrix.child(row);
	}
}

function updateRelationshipMatrix() {
	for (let waffle of waffles) {
		for (let newWaffle of waffles) {
			let txt = "";
			const cell = select(`#cell${waffle.name}${newWaffle.name}`);

			if (newWaffle == waffle) {
				txt = "/";
			} else {
				let rel = waffle.findFriendship(newWaffle);
				txt = rel ? rel.feelings : 0;
			}

			cell.html(txt);
		}
	}
}

function showDiary(waffle) {
	const diary = waffle.diary;
	const charactersContainer = select(".characters-container");
	const relationshipMatrix = select(".characters-relationships");

	charactersContainer.hide();
	relationshipMatrix.hide();

	const diaryContainer = select(".diary-container");
	diaryContainer.removeAttribute("style");
	let backButton = createButton("Go Back");
	backButton.id(`waffle${waffle.name}`);

	backButton.mousePressed(() => {
		removeElements();
		charactersContainer.removeAttribute("style");
		relationshipMatrix.removeAttribute("style");
		selectedWaffle = false;

		initiateCharactersView();
		drawRelationshipMatrix();
	});

	diaryContainer.child(backButton);

	let entries = createDiv();
	entries.class("diary-entries");
	diaryContainer.child(entries);

	for (message of diary) {
		let entry = createDiv();
		entry.class("diary-entry");
		let text = createP(message);
		text.class("diary-text");
		entry.child(text);
		entries.child(entry);
	}
}

function updateDiary() {
	let diary = waffles[selectedWaffle].diary;
	const previousEntriesCount = selectAll(".diary-entry").length;
	const newEntries = diary.slice(previousEntriesCount);
	const diaryEntries = select(".diary-entries");
	for (message of newEntries) {
		let entry = createDiv();
		entry.class("diary-entry");
		let text = createP(message);
		text.class("diary-text");
		entry.child(text);
		diaryEntries.child(entry);
	}
}

function displayDiaryMenu() {
	if (selectedWaffle) {
		// see if diary is already displayed
		const isDiarydisplayed = selectAll(`#waffle${selectedWaffle}`);

		//if diary is displayed, update it
		if (isDiarydisplayed.length > 0) {
			updateDiary();
			return;
		}
		// if Diary is not displayed, display it
		showDiary(waffles[selectedWaffle]);
	}
}

function displayStartMenu() {
	const diary = select(".diary");
	const diaryBody = select(`.diary-body`);
	const menu = select(`.menu`);
	const startButton = select(`#startButton`);
	const canvas = select("canvas");

	startButton.mousePressed(() => {
		menu.hide();
		diaryBody.removeAttribute("style");
		selectedWaffle = false;
		paused = false;
		initiateCharactersView();
		backgroundMusic.play();
		backgroundMusic.loop();
		diary.style("margin", 0);
		canvas.show();
		gameStarted = true;
	});
	diaryBody.hide();
	startButton.hide();
	canvas.hide();
}

// handling pause

function mouseClicked() {
	clickSound.play();
	if (
		mouseX > 0 &&
		mouseX < worldWidth &&
		mouseY > 0 &&
		mouseY < worldHeight &&
		gameStarted
	) {
		paused = !paused;
		paused == true ? backgroundMusic.pause() : backgroundMusic.start();
	}
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
	frameRate(fr);

	createCanvas(worldWidth, worldHeight);

	displayStartMenu();

	await loadAssets();

	world = new World(worldWidth, worldHeight, fieldSize);

	await world.initiate();

	for (let i = 0; i < waffleCount; i++) {
		const waffle = new Waffle(
			i,
			random(waffleSize, worldWidth - waffleSize),
			random(waffleSize, worldHeight - waffleSize),
			waffleSize, // size
			waffleSpeed, // speed
			randomGaussian(200, 2), // energy between 0 and 200
			int(max(1, randomGaussian(5, 1))), // sight
			randomGaussian(5), // exploration between 0 and 10
			randomGaussian(50), // aggressivity between 0 and 100
			randomGaussian(0, 2), //  friendlinessbetween -5 and 5
			animations[i % waffleAssetsCount],
			font,
			tomb,
			dialog,
		);

		waffles.push(waffle);
	}
	drawRelationshipMatrix();
}

function draw() {
	displayDiaryMenu();
	updateRelationshipMatrix();

	if (paused) {
		world.render(paused);
		for (let waffle of waffles) {
			waffle.stop = true;
			waffle.display();
			waffle.stop = false;
		}
		getInfo();
		return;
	}

	let clock = floor(frameCount / fr);

	world.render();

	for (let waffle of waffles) {
		const waffleWorld = world.getFieldsInfo(
			waffle.x,
			waffle.y,
			waffle.sight,
		);
		waffle.render(waffleWorld, clock);
	}
}

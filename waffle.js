class Waffle {
	constructor(x, y, size, speed, animations) {
		this.name = random().toString(36).substring(2, 7);
		this.x = x;
		this.y = y;
		this.size = size;

		this.directionX = random(-1, 1);
		this.directionY = random(-1, 1);
		this.speed = speed;
		this.energy = 100;
		this.exploration = randomGaussian(5, 1);
		this.aggressivity = randomGaussian(50, 1);

		this.speech = { message: "", timer: 0 };
		this.inbox = [];
		this.awaitingResponse = []; // Waffles that you send message to but go no response from
		this.friendsList = [];
		this.enemyList = [];

		this.animations = animations;
		this.tomb = "";
		this.dialog = "";
		this.font = "";
	}

	async initiate() {
		this.font = await loadFont("/assets/Minecraft.ttf");
		this.tomb = await loadImage("/assets/tomb.png");
		this.dialog = await loadImage("/assets/dialog.png");
	}

	render(world) {
		// if dead
		if (this.speed <= 0) {
			image(this.tomb, this.x, this.y, 32, 40);
			return 0;
		}

		this.display();

		// limit waffle speed
		this.speed = min(2, this.speed);
		this.speed = max(0, this.speed);

		// apply fatigue
		if (this.energy == 0) {
			this.speed -= 0.001;
		}

		this.bonjour(world);

		return 1;
	}

	display() {
		let dir = "";
		if (abs(this.directionX) >= abs(this.directionY)) {
			dir = this.directionX > 0 ? "right" : "left";
		} else {
			dir = this.directionY > 0 ? "down" : "up";
		}
		imageMode(CENTER);
		image(
			this.animations[dir][frameCount % 3],
			this.x,
			this.y,
			this.size,
			this.size,
		);
	}

	bonjour(world) {
		world[0].waffleList.push(this); // update current field to say it contains this waffle
		this.checkInbox();

		// say what you have to say
		if (this.speech.timer > 0) {
			this.speak();
		} else {
			this.speech = {};
		}

		this.think(world);

		this.move();
	}

	checkInbox() {
		for (let mail of this.inbox) {
			if (mail.isResponse) {
				this.awaitingResponse = this.awaitingResponse.filter(
					(r) => mail.sender.name != r,
				);
			} else {
				this.communicate(mail.sender, true);
			}
		}
		this.inbox = [];
	}

	move() {
		let direction = createVector(this.directionX, this.directionY);
		direction.setMag(1);
		let minLimit = this.size / 2;
		let maxLimit = 600 - this.size / 2;

		let xMovement = this.x + direction.x * this.speed;
		let yMovement = this.y + direction.y * this.speed;

		if (xMovement > minLimit && xMovement < maxLimit) {
			this.x = xMovement;
		} else if (xMovement < minLimit) {
			this.changeDefaultDirection(1, 0);
		} else if (xMovement > maxLimit) {
			this.changeDefaultDirection(-1, 0);
		}
		if (yMovement > minLimit && yMovement < maxLimit) {
			this.y = yMovement;
		} else if (yMovement < minLimit) {
			this.changeDefaultDirection(0, 1);
		} else if (yMovement > maxLimit) {
			this.changeDefaultDirection(0, -1);
		}

		this.energy = max(0, this.energy - 1);
	}

	changeDefaultDirection(x, y) {
		switch (x) {
			case 1:
				this.directionX = random(0, 1);
				break;

			case -1:
				this.directionX = random(-1, 0);
				break;

			default:
				this.directionX = random(-1, 1);
				break;
		}
		switch (y) {
			case 1:
				this.directionY = random(0, 1);
				break;

			case -1:
				this.directionY = random(-1, 0);
				break;

			default:
				this.directionY = random(-1, 1);
				break;
		}
	}

	think(fieldsArray) {
		// If another waffle is on this field, do something. Important: only one waffle (one who came later) will initiate to the other
		let currField = fieldsArray[0];

		let otherWaffles = currField.waffleList.filter(
			(w) => w.name != this.name,
		);

		for (let otherWaffle of otherWaffles) {
			if (this.awaitingResponse.includes(otherWaffle.name))
				continue;

			this.communicate(otherWaffle);
		}

		// If crop nearby, go get it !
		for (let field of fieldsArray) {
			if (field.hasCrop) {
				// find field and go toward it
				let fieldCenterX = field.x + field.size / 2;
				let fieldCenterY = field.y + field.size / 2;
				let cropVector = createVector(
					fieldCenterX,
					fieldCenterY,
				);
				let waffleVector = createVector(this.x, this.y);
				let direction = p5.Vector.sub(cropVector, waffleVector);
				direction.normalize();
				direction.mult(this.speed);

				if (p5.Vector.dist(cropVector, waffleVector) < 5) {
					this.consume(field);
				}

				this.directionX = direction.x;
				this.directionY = direction.y;

				return;
			}
		}

		// randomly can change directions
		if (this.rollDice(this.exploration)) {
			this.changeDefaultDirection(0, 0);
		}
	}

	rollDice(percentage) {
		return random(100) < percentage;
	}

	consume(field) {
		this.energy += 500;
		this.speed += 0.1;
		field.deleteCrop();
	}

	communicate(otherWaffle, isResponse) {
		if (this.friendsList.includes(otherWaffle)) {
			this.sendMessage(otherWaffle, "Helloooo", isResponse);
		} else if (this.enemyList.includes(otherWaffle)) {
			this.sendMessage(otherWaffle, "Fuck you", isResponse);
		} else {
			this.sendMessage(otherWaffle, "Bonjour", isResponse);

			this.rollDice(this.aggressivity)
				? this.enemyList.push(otherWaffle)
				: this.friendsList.push(otherWaffle);
		}
	}

	sendMessage(destWaffle, message, isResponse = false) {
		destWaffle.inbox.push({ sender: this, message, isResponse });
		if (!isResponse) {
			this.awaitingResponse.push(destWaffle.name);
		}
		this.speech = { message, timer: 10 };
	}

	speak() {
		fill("white");
		stroke(0);
		strokeWeight(2);
		ellipse(this.x, this.y - 25, 50, 25);

		textSize(10);
		textFont(this.font);
		fill(0);
		noStroke();
		text(this.speech.message, this.x - 18, this.y - 21);

		this.speech.timer--;
	}
}

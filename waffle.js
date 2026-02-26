class Waffle {
	constructor(
		name,
		x,
		y,
		size,
		speed,
		energy,
		sight,
		exploration,
		aggressivity,
		friendliness,
		animations,
		font,
		tomb,
		dialog,
	) {
		// movements
		this.name = name;
		this.x = x;
		this.y = y;
		this.size = size;
		this.directionX = random(-1, 1);
		this.directionY = random(-1, 1);
		this.stop = false;
		this.surroundings = [];

		// traits
		this.speed = speed;
		this.energy = energy; // between 0 and 200
		this.sight = sight; // between 1 and 5 how blocks far you can see
		this.exploration = exploration; // between 0 and 10
		this.aggressivity = aggressivity; // between 0 and 100
		this.friendliness = friendliness; // between -5 and 5

		// socials
		this.clock = 0;
		this.speech = { message: "", timer: 0 };
		this.inbox = [];
		this.awaitingResponse = []; // Waffles that you send message to but go no response from
		this.relationships = [];
		this.diary = ["Nothing to say for today..."];

		// assets
		this.animations = animations;
		this.tomb = tomb;
		this.dialog = dialog;
		this.font = font;
	}

	render(world, clock) {
		this.clock = clock;

		// if dead
		if (this.speed <= 0 && this.energy <= 0) {
			//image(this.tomb, this.x, this.y, 32, 40);
			this.stop = true;
			this.display();
			this.speech = { message: "HELP", timer: 1 };
			this.speak();
			this.surroundings = world;
			const currField = this.surroundings[0];
			currField.waffleList.push(this);

			return 0;
		}

		// regain speed or apply fatigue
		this.speed += 0.01 * (this.energy / 100) - 0.001;

		// limit waffle speed
		this.speed = min(3, this.speed);
		this.speed = max(0, this.speed);

		this.display();
		this.stop = false;

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

		const frame = this.stop ? 1 : frameCount % 3;
		imageMode(CENTER);
		image(
			this.animations[dir][frame],
			this.x,
			this.y,
			this.size,
			this.size,
		);
	}

	bonjour(world) {
		this.surroundings = world;
		const currField = this.surroundings[0];
		currField.waffleList.push(this); // update current field to say it contains this waffle

		if (currField.hasCrop) {
			this.consume(currField);
		}

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
					(r) => mail.sender != r,
				);

				let shift = 0;

				if (mail.message.includes("Hello")) shift = 1;
				else if (mail.message.includes("Fuck")) shift = -1;

				shift *= random(0.5);
				let feelings =
					float(this.findFriendship(mail.sender).feelings) +
					shift;

				this.updateFriendship(mail.sender, feelings);
			} else {
				this.communicate(mail.sender, true);
			}
		}
		this.inbox = [];
	}

	move() {
		if (this.stop) return;
		let direction = createVector(this.directionX, this.directionY);
		direction.setMag(1);
		let minLimit = this.size / 2; // 30
		let maxLimit = 600 - this.size / 2; //585

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

	think() {
		// If another waffle is on this field, communicate. Important: Waffle who came later will initiate
		let currField = this.surroundings[0];

		let otherWaffles = currField.waffleList.filter(
			(w) => w.name != this.name,
		);

		for (let otherWaffle of otherWaffles) {
			if (this.awaitingResponse.includes(otherWaffle)) continue;
			this.communicate(otherWaffle);
		}

		if (this.stop) return;

		// scanning
		for (let field of this.surroundings) {
			// if someone needs help, go help
			let waffleList = field.waffleList.filter(
				(w) => w.name != this.name,
			);
			for (let waffle of waffleList) {
				let waffleRelationship = this.findFriendship(waffle);
				if (waffleRelationship && waffle.speed <= 0) {
					waffleRelationship.feelings > 0
						? this.help(waffle, 500)
						: "";
				}
			}
			// If crop nearby, go get it !
			if (field.hasCrop) {
				// find field and go toward it
				let fieldCenterX = field.x + field.size / 2;
				let fieldCenterY = field.y + field.size / 2;
				this.goToward(fieldCenterX, fieldCenterY);
				return;
			}
		}

		// randomly can change directions
		if (this.flipCoin(this.exploration)) {
			this.changeDefaultDirection(0, 0);
		}
	}

	goToward(x, y) {
		let destVector = createVector(x, y);
		let waffleVector = createVector(this.x, this.y);
		let direction = p5.Vector.sub(destVector, waffleVector);
		direction.normalize();
		direction.mult(this.speed);

		this.directionX = direction.x;
		this.directionY = direction.y;
	}

	flipCoin(percentage) {
		//  % change of happening
		return random(100) < percentage;
	}

	rollDice(chance) {
		return randomGaussian(chance).toFixed(2);
	}

	consume(field) {
		this.energy += 500;
		field.deleteCrop();
	}

	communicate(otherWaffle, isResponse) {
		let relationship = this.findFriendship(otherWaffle);

		if (relationship) {
			const delta = this.clock - relationship.lastContact; // how long since they talked
			if (delta < 10) return;

			const message =
				relationship.feelings > 0 ? "Hellooo" : "Fuck you";

			this.sendMessage(otherWaffle, message, isResponse);
			this.updateFriendship(otherWaffle, relationship.feelings);
		} else {
			this.sendMessage(otherWaffle, "Bonjour", isResponse);

			this.updateFriendship(
				otherWaffle,
				this.rollDice(this.friendliness),
			);
		}
	}

	sendMessage(destWaffle, message, isResponse = false) {
		destWaffle.inbox.push({ sender: this, message, isResponse });
		if (!isResponse) {
			this.awaitingResponse.push(destWaffle);
		}
		this.speech = { message, timer: 10 };
	}

	findFriendship(otherWaffle) {
		return this.relationships.find(
			(r) => r.waffle.name == otherWaffle.name,
		);
	}

	updateFriendship(otherWaffle, feelings) {
		const relationship = this.findFriendship(otherWaffle);
		const newRelationship = {
			waffle: otherWaffle,
			feelings: float(feelings).toFixed(2),
			lastContact: this.clock,
		};
		let feel = newRelationship.feelings > 0 ? "like" : "hate";

		if (relationship) {
			let delta = this.clock - relationship.lastContact; // how long since it updated
			if (delta < 10) return;

			const idx = this.relationships.indexOf(relationship);
			this.relationships[idx] = newRelationship;

			this.diary.push(
				`Today I met ${otherWaffle.name} again and I ${feel}s a bit more ! (${newRelationship.feelings})`,
			);
		} else {
			this.relationships.push(newRelationship);
			this.diary.push(
				`Today I met ${otherWaffle.name} for the first time and I ${feel}d them ! (${newRelationship.feelings})`,
			);
		}
	}

	help(otherWaffle, ammount) {
		if (this.energy > ammount) {
			this.speech = { message: "Helping", timer: 10 };
			this.speak();
			this.energy -= ammount;
			otherWaffle.energy += ammount;

			let r = otherWaffle.findFriendship(this);

			const feelings = r
				? r.feelings
				: this.rollDice(otherWaffle.friendliness);

			otherWaffle.updateFriendship(this, int(feelings) + 5);
			this.diary.push(`Today I helped ${otherWaffle.name} !`);
		}
	}

	speak() {
		fill("white");
		stroke(0);
		strokeWeight(2);
		ellipse(this.x, this.y - 25, 50, 25);

		textSize(10);
		textAlign(CENTER);
		textFont(this.font);
		fill(0);
		noStroke();
		text(this.speech.message, this.x, this.y - 21);

		this.speech.timer--;
	}

	displayInfo() {
		fill("white");
		stroke(0);
		strokeWeight(2);
		let sizeX = 100;
		let sizeY = 200;
		let factorX = this.x < 200 ? 0 : 1;
		let factorY = this.y < 200 ? 0 : 1;
		let startX = this.x - 100 * factorX;
		let startY = this.y - 200 * factorY;
		rect(startX, startY, sizeX, sizeY);

		textAlign(LEFT);

		let paddingX = 10;
		let paddingY = 20;

		textSize(10);
		textFont(this.font);
		fill(0);
		noStroke();
		text(`name: ${this.name}`, startX + paddingX, startY + paddingY);

		text(
			`X: ${this.x.toFixed(0)}, Y: ${this.y.toFixed(0)}`,
			startX + paddingX,
			startY + paddingY * 2,
		);

		noStroke();
		text(
			`speed: ${this.speed.toFixed(2)}`,
			startX + paddingX,
			startY + paddingY * 3,
		);

		text(
			`energy: ${this.energy.toFixed(2)}`,
			startX + paddingX,
			startY + paddingY * 4,
		);

		text(
			`dX: ${this.directionX.toFixed(2)}, dY: ${this.directionY.toFixed(2)}`,
			startX + paddingX,
			startY + paddingY * 5,
		);

		noStroke();
		text(
			`sight: ${this.sight.toFixed(2)}`,
			startX + paddingX,
			startY + paddingY * 6,
		);

		noStroke();
		text(
			`exploration: ${this.exploration.toFixed(2)}`,
			startX + paddingX,
			startY + paddingY * 7,
		);

		noStroke();
		text(
			`friendliness: ${this.friendliness.toFixed(2)}`,
			startX + paddingX,
			startY + paddingY * 8,
		);
	}

	isMouseOver() {
		let isOverX =
			mouseX >= this.x - this.size / 2 &&
			mouseX <= this.x + this.size / 2;
		let isOverY =
			mouseY >= this.y - this.size / 2 &&
			mouseY <= this.y + this.size / 2;
		return isOverX && isOverY;
	}
}

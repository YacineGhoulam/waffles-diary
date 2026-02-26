class Field {
	constructor(x, y, size, bg, cropImg) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.fertility = random(0.008); // percentage of crop appearing
		this.hasCrop = false;
		this.waffleList = [];
		this.bg = bg;
		this.cropImg = cropImg;
	}

	render(paused) {
		imageMode(CORNER);
		image(this.bg, this.x, this.y, this.size, this.size);

		this.waffleList = [];

		if (this.hasCrop) {
			let center = this.size / 2;
			imageMode(CENTER);
			image(
				this.cropImg,
				this.x + center,
				this.y + center,
				this.size * 0.8,
				this.size * 0.8,
			);
		} else {
			this.hasCrop = paused ? 0 : random(100) < this.fertility;
		}
	}

	changeColor() {
		fill("pink");
		stroke("yellow");
		square(this.x, this.y, this.size);
	}

	deleteCrop() {
		this.hasCrop = false;
	}
}

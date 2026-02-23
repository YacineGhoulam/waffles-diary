class World {
	constructor(width, height, fieldSize) {
		this.width = width;
		this.height = height;
		this.fieldSize = fieldSize;
		this.fields = [];
	}

	async initiate() {
		let bg = await loadImage("/assets/grass.png");
		let cropImage = await loadImage("/assets/waffle.png");

		const fs = this.fieldSize;

		for (let i = 0; i < this.width; i += fs) {
			this.fields[i / fs] = [];
			for (let j = 0; j < this.height; j += fs) {
				const field = new Field(i, j, fs, bg, cropImage);
				field.render();
				this.fields[i / fs][j / fs] = field;
			}
		}
	}

	render() {
		for (let row of this.fields) {
			for (let field of row) {
				field.render();
			}
		}
	}

	getFieldsInfo(x, y) {
		const fieldList = [];
		let fieldCountX = this.width / this.fieldSize;
		let fieldCountY = this.height / this.fieldSize;
		let fieldX = floor(x / this.fieldSize);
		let fieldY = floor(y / this.fieldSize);

		fieldList.push(this.fields[fieldX][fieldY]);
		// This is hurrendous I know..
		if (fieldX > 0) {
			fieldList.push(this.fields[fieldX - 1][fieldY]);
		}
		if (fieldX < fieldCountX - 1) {
			fieldList.push(this.fields[fieldX + 1][fieldY]);
		}
		if (fieldY > 0) {
			fieldList.push(this.fields[fieldX][fieldY - 1]);
		}
		if (fieldY < fieldCountY - 1) {
			fieldList.push(this.fields[fieldX][fieldY + 1]);
		}
		if (fieldX > 0 && fieldY > 0) {
			fieldList.push(this.fields[fieldX - 1][fieldY - 1]);
		}
		if (fieldX < fieldCountX - 1 && fieldY < fieldCountY - 1) {
			fieldList.push(this.fields[fieldX + 1][fieldY + 1]);
		}
		if (fieldX > 0 && fieldY < fieldCountY - 1) {
			fieldList.push(this.fields[fieldX - 1][fieldY + 1]);
		}
		if (fieldX < fieldCountX - 1 && fieldY > 0) {
			fieldList.push(this.fields[fieldX + 1][fieldY - 1]);
		}

		return fieldList;
	}
}

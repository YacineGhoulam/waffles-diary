class World {
	constructor(width, height, fieldSize) {
		this.width = width;
		this.height = height;
		this.fieldSize = fieldSize;
		this.fields = [];
	}

	async initiate() {
		let bg = await loadImage("assets/grass.png");
		let cropImage = await loadImage("assets/waffle.png");

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

	render(paused) {
		for (let row of this.fields) {
			for (let field of row) {
				field.render(paused);
			}
		}
	}

	getFieldsInfo(x, y, sight) {
		const fieldList = [];
		let fieldCountX = this.width / this.fieldSize;
		let fieldCountY = this.height / this.fieldSize;

		let fieldX = floor(x / this.fieldSize);
		let fieldY = floor(y / this.fieldSize);

		fieldList.push(this.fields[fieldX][fieldY]);
		// This is hurrendous I know..
		let i = 0;
		while (fieldX - i > 0 && i < sight) {
			fieldList.push(this.fields[fieldX - i - 1][fieldY]);
			i++;
		}
		i = 0;
		while (fieldX + i < fieldCountX - 1 && i < sight) {
			fieldList.push(this.fields[fieldX + i + 1][fieldY]);
			i++;
		}
		i = 0;
		while (fieldY - i > 0 && i < sight) {
			fieldList.push(this.fields[fieldX][fieldY - i - 1]);
			i++;
		}
		i = 0;
		while (fieldY + i < fieldCountY - 1 && i < sight) {
			fieldList.push(this.fields[fieldX][fieldY + i + 1]);
			i++;
		}
		i = 0;
		while (fieldX - i > 0 && fieldY - i > 0 && i < sight) {
			fieldList.push(this.fields[fieldX - i - 1][fieldY - i - 1]);
			i++;
		}
		i = 0;
		while (
			fieldX + i < fieldCountX - 1 &&
			fieldY + i < fieldCountY - 1 &&
			i < sight
		) {
			fieldList.push(this.fields[fieldX + 1][fieldY + 1]);
			i++;
		}
		i = 0;
		while (
			fieldX - i > 0 &&
			fieldY + i < fieldCountY - 1 &&
			i < sight
		) {
			fieldList.push(this.fields[fieldX - 1][fieldY + 1]);
			i++;
		}
		i = 0;
		while (
			fieldX + i < fieldCountX - 1 &&
			fieldY - i > 0 &&
			i < sight
		) {
			fieldList.push(this.fields[fieldX + 1][fieldY - 1]);
			i++;
		}

		return fieldList;
	}
}

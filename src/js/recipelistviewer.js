import { getPicture } from './main'

const RecipelistViewer = class {
	constructor(targetSelector, recipelist, config) {
		this.targetSelector = targetSelector
		this.recipelist = recipelist ? recipelist : recipes.all
		this.config = Object.assign({ autoUpdate: true }, config)
		this._order = 'relevancy'
		this._searchvalue = ''
		this._maxCookingTime = ''
		this._difficulty = 0
		this._diets = []
		if (this.config.autoUpdate) this.render()
	}
	render() {
		const recipesFragment = document.createDocumentFragment()
		let recipes = this.recipelist.filtrate({ searchvalue: this._searchvalue, maxCookingTime: this._maxCookingTime, difficulty: this._difficulty, diets: this._diets }).order(this._order)
		if (this.config.length) recipes = recipes.slice(0, this.config.length)
		recipes.forEach((recipe) => {
			const recipeArticle = document.getElementById('recipeArticle').content.cloneNode(true)
			recipeArticle.querySelector('a').href = 'Rezept.html#' + recipe.identifier
			const widths = [320, 480, 640, 960, 1280]
			const imagedata = {
				alt: recipe.name,
				formats: ['avif', 'webp', 'jpeg'],
				sizes: '(min-width: 65rem) calc((60rem - 2rem) / 3), (min-width: 50rem) calc((100vw - 4rem) / 3), calc((100vw - 3rem) / 2)',
			}
			if (recipe.thumbnail) {
				imagedata.src = `assets/recipes/${recipe.identifier}/thumbnails/${widths[0]}.jpeg`
				imagedata.srcset = imagedata.formats.map((format) => widths.map((width) => `assets/recipes/${recipe.identifier}/thumbnails/${width}.${format} ${width}w`).join(', '))
			} else {
				imagedata.src = `assets/thumbnails/${widths[0]}.jpeg`
				imagedata.srcset = imagedata.formats.map((format) => widths.map((width) => `assets/thumbnails/${width}.${format} ${width}w`).join(', '))
			}

			if (recipe.source === 'JSONFile') recipeArticle.querySelector('a').appendChild(getPicture(imagedata))
			else {
				if (recipe.titleimage) {
					const targetSelector = recipeArticle.querySelector('a')
					initializedlocalRecipeImages.then(() => {
						const objectStore = localRecipeImages.transaction('imagesStore', 'readonly').objectStore('imagesStore')
						const request = objectStore.get(recipe.identifier)
						request.onsuccess = (e) => {
							if (!e.target.result) return
							const img = document.createElement('img')
							img.setAttribute('alt', imagedata.alt)
							img.setAttribute('src', e.target.result.titleimageDataURL)
							targetSelector.appendChild(img)
						}
					})
				} else recipeArticle.querySelector('a').appendChild(getPicture(imagedata))
			}
			recipeArticle.querySelector('span').innerText = recipe.name
			recipesFragment.appendChild(recipeArticle)
		})
		document.querySelector(this.targetSelector).innerHTML = ''
		document.querySelector(this.targetSelector).appendChild(recipesFragment)
	}
	set order(newOrder) {
		this._order = newOrder
		if (this.config.autoUpdate) this.render()
	}
	set searchvalue(newSearchvalue) {
		this._searchvalue = newSearchvalue
		if (this.config.autoUpdate) this.render()
	}
	set maxCookingTime(newMaxCookingTime) {
		this._maxCookingTime = newMaxCookingTime
		if (this.config.autoUpdate) this.render()
	}
	set difficulty(newDifficulty) {
		this._difficulty = newDifficulty
		if (this.config.autoUpdate) this.render()
	}
	set diets(newDiets) {
		this._diets = newDiets
		if (this.config.autoUpdate) this.render()
	}
}

export default RecipelistViewer

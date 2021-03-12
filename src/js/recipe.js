const Recipe = class {
	constructor(recipeObject) {
		this.name = ''
		this.identifier = ''
		this.thumbnail = false
		this.titleimage = false
		this.cookingTime = 0
		this.difficulty = 0
		this.diets = []
		this.ingredients = []
		this.steps = []
		this.published = 0
		this.favourisations = 0
		this.favourised = false
		Object.assign(this, recipeObject)
	}
	openViewer() {
		router.loadRoute('Rezept.html', this.identifier)
	}
	favourise() {
		let favourites = JSON.parse(localStorage.favourites)
		this.favourised = !this.favourised
		if (this.favourised) favourites.push(this.identifier)
		else favourites = favourites.filter((favourite) => favourite !== this.identifier)
		localStorage.favourites = JSON.stringify(favourites)
		console.log(`${this.name} favourisation is: ${this.favourised}`, this.favourisations + this.favourised)
		return this
	}
}

const LocalRecipe = class extends Recipe {
	openEditor() {
		router.loadRoute('Rezept_Bearbeiten.html', this.identifier)
	}
	delete() {
		console.log(this.name, 'is removed')
		if (this.favourised) this.favourise()
		recipes.local = recipes.local.filter((recipe) => recipe.identifier !== this.identifier)
		recipes.updateLocalRecipes()
		initializedlocalRecipeImages.then(() => {
			const objectStore = localRecipeImages.transaction('imagesStore', 'readwrite').objectStore('imagesStore')
			objectStore.delete(this.identifier)
		})
	}
	save(newData) {
		let favourites = JSON.parse(localStorage.favourites)
		if (this.favourised) favourites = favourites.filter((favourite) => favourite !== this.identifier)
		Object.assign(this, newData)
		this.source = 'localStorage'
		recipes.local = recipes.local.filter((recipe) => recipe.identifier !== this.identifier)
		const newIdentifier = 'Mein_Rezept_' + this.name.toLowerCase().replace(/\s+/g, '')
		let number = 0
		let newUniqueIdentifier = newIdentifier
		while (recipes.local.find((recipe) => recipe.identifier === newUniqueIdentifier)) {
			number++
			newUniqueIdentifier = newIdentifier + number
		}
		this.identifier = newUniqueIdentifier
		if (this.favourised) favourites.push(this.identifier)
		localStorage.favourites = JSON.stringify(favourites)
		recipes.local.push(this)
		console.log(this.name, 'is saved')
		recipes.updateLocalRecipes()
		return this
	}
}

export { Recipe as default, LocalRecipe }

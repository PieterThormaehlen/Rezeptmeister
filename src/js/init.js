const pageloadPromise = new Promise((resolve) => {
	if (document.readyState === 'interactive') resolve()
	else window.addEventListener('DOMContentLoaded', () => resolve())
})

window.recipes = {
	public: [],
	local: [],
	get all() {
		return this.public.concat(this.local)
	},
	get favourised() {
		const favourites = JSON.parse(localStorage.favourites)
		return this.all.filter((recipe) => favourites.includes(recipe.identifier))
	},
	updateLocalRecipes() {
		saveLocalRecipes()
		loadLocalRecipes()
	},
}

const Recipelist = class extends Array {
	constructor(recipes) {
		super()
		Object.assign(this, recipes)
	}
	filtrate({ searchvalue = '', maxCookingTime, difficulty, diets = [] }) {
		const now = new Date().getTime()
		const searchvalues = searchvalue
			.toLowerCase()
			.split(/\s+/g)
			.filter((s) => !!s)
		return this.filter((element) => {
			if (searchvalues.length > 0 && searchvalues.every((searchvalue) => element.name.toLowerCase().search(searchvalue) < 0)) return
			if (maxCookingTime !== '' && (!element.cookingTime || element.cookingTime > maxCookingTime)) return
			if (difficulty && (!element.difficulty || element.difficulty !== Number(difficulty))) return
			if (diets.length !== 0 && (!element.diets || !diets.every((val) => element.diets.indexOf(val) >= 0))) return
			element.relevancy = 0
			if (searchvalue) {
				searchvalues.forEach((searchvalue) => {
					if (element.name.toLowerCase().includes(searchvalue)) element.relevancy += 1
				})
				if (searchvalues.every((searchvalue) => element.name.toLowerCase().search(searchvalue) >= 0)) element.relevancy += 2
			}
			let daysAgo = (now - element.published) / 1000 / 60 / 60 / 24
			element.relevancy += Math.min(element.favourisations / daysAgo / 5, 2)
			if (daysAgo < 7) element.relevancy += 0.5 - daysAgo / 14
			if (element.source === 'localStorage') element.relevancy += 1
			return true
		})
	}
	order(orderBy) {
		this.sort((a, b) => new Intl.Collator('de').compare(a.name, b.name))
		if (orderBy === 'relevancy') {
			this.sort((a, b) => b.relevancy - a.relevancy)
		} else if (orderBy === 'cookingTime') {
			this.sort((a, b) => a.cookingTime - b.cookingTime)
			return this.filter((element) => element.cookingTime)
		} else if (orderBy === 'creationDate') {
			this.sort((a, b) => b.published - a.published)
		} else if (orderBy === 'popularity') {
			this.sort((a, b) => b.favourisations - a.favourisations)
		}
		return this
	}
}

const loadRecipesFromJSONFile = async () => {
	const response = await fetch('assets/recipelist.json')
	const data = await response.json()
	recipes.public = new Recipelist(
		data.map((recipe) => {
			recipe.source = 'JSONFile'
			return recipe
		})
	)
}

const loadLocalRecipes = () => {
	recipes.local = new Recipelist(
		JSON.parse(localStorage.recipes).map((recipe) => {
			recipe.source = 'localStorage'
			return recipe
		})
	)
}

const saveLocalRecipes = () => {
	localStorage.recipes = JSON.stringify(recipes.local)
}

window.initialized = new Promise(async (resolve) => {
	if (!localStorage.recipes) localStorage.recipes = JSON.stringify([])
	if (!localStorage.favourites) localStorage.favourites = JSON.stringify([])
	loadLocalRecipes()
	await loadRecipesFromJSONFile()
	await pageloadPromise
	resolve()
})

window.initializedlocalRecipeImages = new Promise((resolve) => {
	const request = indexedDB.open('images', 1)
	request.onupgradeneeded = (e) => {
		localRecipeImages = e.target.result
		localRecipeImages.createObjectStore('imagesStore', { keyPath: 'identifier' })
	}
	request.onerror = (e) => console.log(e.target.error)
	request.onsuccess = async (e) => {
		localRecipeImages = e.target.result
		localRecipeImages.onerror = (e) => console.log(e.target.error)
		await pageloadPromise
		resolve()
	}
})

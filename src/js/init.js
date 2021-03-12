import Recipelist from './recipelist'

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
		window.localRecipeImages = e.target.result
		localRecipeImages.createObjectStore('imagesStore', { keyPath: 'identifier' })
	}
	request.onerror = (e) => console.log(e.target.error)
	request.onsuccess = async (e) => {
		window.localRecipeImages = e.target.result
		localRecipeImages.onerror = (e) => console.log(e.target.error)
		await pageloadPromise
		resolve()
	}
})

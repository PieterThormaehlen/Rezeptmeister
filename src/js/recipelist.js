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

export default Recipelist

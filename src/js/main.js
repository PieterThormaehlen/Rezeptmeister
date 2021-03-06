import 'web-animations-js'
import '../scss/main.scss'
import routes from './routes'
import Router from './router'

const router = new Router(routes)

document.querySelector('.navtoggle').addEventListener('click', () => {
	document.querySelector('body').toggleAttribute('data-shownav')
})

document.querySelector('main').addEventListener('change', (e) => {
	const label = e.target.closest('label')
	if (e.target.type === 'radio') {
		label.parentElement.querySelectorAll(`label`).forEach((element) => {
			element.removeAttribute('data-checked')
		})
		label.setAttribute('data-checked', '')
	} else if (e.target.type === 'checkbox') {
		label.toggleAttribute('data-checked')
	}
})

document.querySelector('main').addEventListener('click', (e) => {
	if (!e.target.closest('button[data-reset], button[data-remove]')) return
	const target = e.target.closest('button')
	if (target.hasAttribute('data-reset')) {
		target.parentElement.querySelectorAll('input').forEach((element) => {
			element.checked = false
			element.parentElement.removeAttribute('data-checked')
		})
	} else if (target.hasAttribute('data-remove')) {
		target.parentElement.remove()
	}
})

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

const getPicture = (image) => {
	const picture = document.createElement('picture')
	image.formats.forEach((format, i) => {
		const sourceElement = document.createElement('source')
		sourceElement.setAttribute('type', `image/${format}`)
		sourceElement.setAttribute('srcset', image.srcset[i])
		sourceElement.setAttribute('sizes', image.sizes)
		picture.appendChild(sourceElement)
	})
	const img = document.createElement('img')
	img.setAttribute('alt', image.alt)
	img.setAttribute('src', image.src)
	picture.appendChild(img)
	return picture
}

const placeRecipes = (recipelist, targetSelector) => {
	let recipesFragment = document.createDocumentFragment()
	recipelist.forEach((recipe) => {
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
	document.querySelector(targetSelector).innerHTML = ''
	document.querySelector(targetSelector).appendChild(recipesFragment)
}

const displayRecipeList = (source, targetSelector) => {
	document.querySelector('.controls').addEventListener('click', (e) => {
		if (!e.target.closest('button')) return
		const target = e.target.closest('button')
		if (target.classList.contains('filter')) {
			document.querySelector('main').toggleAttribute('data-showFilters')
			document.querySelector('main').removeAttribute('data-showOrderBy')
		} else if (target.classList.contains('order')) {
			document.querySelector('main').toggleAttribute('data-showOrderBy')
			document.querySelector('main').removeAttribute('data-showFilters')
		} else if (target.classList.contains('newRecipe')) {
			console.log('created new recipe')
			new LocalRecipe({ name: 'Neues Rezept', published: new Date().getTime() }).save().favourise().openEditor()
		}
	})
	const filter = { searchvalue: '', maxCookingTime: '', difficulty: 0, diets: [] }
	let order = 'relevancy'
	const updateRecipelist = () => {
		const recipelist = recipes[source].filtrate(filter).order(order)
		placeRecipes(recipelist, targetSelector)
	}
	updateRecipelist()
	document.querySelector('input[name="search"]').addEventListener('keyup', (e) => {
		if (e.key !== 'Enter' || e.keyCode !== 13) return
		filter.searchvalue = e.target.value
		updateRecipelist()
	})
	document.querySelector('.filters').addEventListener('change', (e) => {
		const label = e.target.closest('label')
		if (e.target.type === 'radio') filter[e.target.name] = e.target.value
		if (e.target.type === 'checkbox') {
			filter.diets = []
			label.parentElement.querySelectorAll(`input`).forEach((element) => {
				if (element.checked) filter.diets.push(element.value)
			})
		}
		updateRecipelist()
	})
	document.querySelector('.filters').addEventListener('click', (e) => {
		if (!e.target.closest('button')) return
		const target = e.target.closest('button')
		filter[target.parentElement.className] = ''
		if (target.parentElement.className === 'diets') filter.diets = []
		updateRecipelist()
	})
	document.querySelector('.orderBy').addEventListener('change', (e) => {
		order = e.target.value
		updateRecipelist()
	})
}

const getRecipe = async (identifier) => {
	const recipe = recipes.all.find((recipe) => recipe.identifier === identifier)
	const favourites = JSON.parse(localStorage.favourites)
	let responseRecipe
	if (recipe.source === 'JSONFile') {
		const response = await fetch(`assets/recipes/${recipe.identifier}/recipe.json`)
		const data = await response.text()
		responseRecipe = new Recipe(JSON.parse(data))
		responseRecipe.source = 'JSONFile'
	} else if (recipe.source === 'localStorage') {
		responseRecipe = new LocalRecipe(recipe)
	}
	responseRecipe.favourised = favourites.includes(responseRecipe.identifier)
	return responseRecipe
}

const initRecipePage = async () => {
	const recipe = await getRecipe(window.decodeURI(window.location.hash.split('#').pop()))
	document.querySelector('.controls').addEventListener('click', (e) => {
		if (!e.target.closest('button')) return
		const target = e.target.closest('button')
		if (target.classList.contains('edit')) recipe.openEditor()
		if (target.classList.contains('favourise')) {
			recipe.favourise()
			document.querySelector('.favourise').toggleAttribute('favourised')
			document.querySelector('.favourise .label').textContent = recipe.favourisations + recipe.favourised
		}
	})
	document.querySelector('h1').innerText = recipe.name
	document.title = recipe.name
	if (recipe.favourised) {
		document.querySelector('.favourise').setAttribute('favourised', '')
	}
	document.querySelector('.favourise .label').textContent = recipe.favourisations + recipe.favourised
	if (recipe.source === 'localStorage') {
		document.getElementById('editButton').after(document.getElementById('editButton').content)
	}
	const widths = [1360, 1600, 1920, 2560]
	const imagedata = {
		alt: '',
		formats: ['avif', 'webp', 'jpeg'],
		sizes: '(min-width: 65rem) 60rem, 100vw',
	}
	if (recipe.thumbnail) {
		imagedata.src = `assets/recipes/${recipe.identifier}/titleimage/${widths[0]}.jpeg`
		imagedata.srcset = imagedata.formats.map((format) => widths.map((width) => `assets/recipes/${recipe.identifier}/titleimage/${width}.${format} ${width}w`).join(', '))
	} else {
		imagedata.src = `assets/titleimage/${widths[0]}.jpeg`
		imagedata.srcset = imagedata.formats.map((format) => widths.map((width) => `assets/titleimage/${width}.${format} ${width}w`).join(', '))
	}
	if (recipe.source === 'JSONFile') document.querySelector('.controls').after(getPicture(imagedata))
	else {
		if (recipe.titleimage) {
			initializedlocalRecipeImages.then(() => {
				const objectStore = localRecipeImages.transaction('imagesStore', 'readonly').objectStore('imagesStore')
				const request = objectStore.get(recipe.identifier)
				request.onsuccess = (e) => {
					if (!e.target.result) return
					const img = document.createElement('img')
					img.setAttribute('alt', imagedata.alt)
					img.setAttribute('src', e.target.result.titleimageDataURL)
					document.querySelector('.controls').after(img)
				}
			})
		} else document.querySelector('.controls').after(getPicture(imagedata))
	}
	let portions = 1
	populateIngredients('.ingredients', recipe.ingredients, portions)
	document.querySelector('.ingredientHeader').addEventListener('click', (e) => {
		if (!e.target.closest('button')) return
		const target = e.target.closest('button')
		if (target.name === 'increase') portions++
		if (target.name === 'decrease' && portions > 1) portions--
		document.querySelector('.portions').innerText = portions + ' portionen'
		populateIngredients('.ingredients', recipe.ingredients, portions)
	})
	const metadataFragment = document.createDocumentFragment()
	if (recipe.cookingTime) {
		const article = document.getElementById('metadataArticle').content.cloneNode(true)
		article.querySelector('.label').textContent = 'Arbeitszeit'
		const dataSpan = document.createElement('span')
		dataSpan.innerText = `${recipe.cookingTime} Min.`
		article.querySelector('article').appendChild(dataSpan)
		metadataFragment.appendChild(article)
	}
	if (recipe.difficulty) {
		let difficulties = [, 'Einfach', 'Mittel', 'Schwer']
		const article = document.getElementById('metadataArticle').content.cloneNode(true)
		article.querySelector('.label').textContent = 'Schwierigkeitsgrad'
		const dataSpan = document.createElement('span')
		dataSpan.innerText = difficulties[recipe.difficulty]
		article.querySelector('article').appendChild(dataSpan)
		metadataFragment.appendChild(article)
	}
	if (recipe.diets.length) {
		const article = document.getElementById('metadataArticle').content.cloneNode(true)
		article.querySelector('.label').textContent = 'Ernährungsformen'
		recipe.diets.forEach((diet) => {
			const dataSpan = document.createElement('span')
			dataSpan.innerText = diet
			article.querySelector('article').appendChild(dataSpan)
		})
		metadataFragment.appendChild(article)
	}
	document.querySelector('.metadata').appendChild(metadataFragment)
	if (recipe.steps.length) {
		const h2 = document.createElement('h2')
		h2.innerText = 'Zubereitung'
		document.querySelector('.stepList').prepend(h2)
		const stepsFragment = document.createDocumentFragment()
		recipe.steps.forEach((step, index) => {
			const article = document.getElementById('stepArticle').content.cloneNode(true)
			article.querySelector('.label').textContent = `Schritt ${index + 1}`
			article.querySelector('.text').textContent = step
			stepsFragment.appendChild(article)
		})
		document.querySelector('.steps').appendChild(stepsFragment)
	}
	const date = new Date(recipe.published).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
	document.querySelector('.publication').textContent = `Hinzugefügt am ${date}.`
}

const populateIngredients = (targetSelector, ingredients, portions) => {
	document.querySelector(targetSelector).innerHTML = ''
	const ingredientsFragment = document.createDocumentFragment()
	ingredients.forEach((ingredient) => {
		let unit = ingredient.unit
		if (ingredient.unit === 'amount') unit = ''
		const article = document.getElementById('ingredientArticle').content.cloneNode(true)
		article.querySelector('.label').textContent = ingredient.name
		article.querySelector('.text').textContent = ingredient.amount * portions + unit
		ingredientsFragment.appendChild(article)
	})
	document.querySelector(targetSelector).appendChild(ingredientsFragment)
}

const getImage = (image) => {
	return new Promise((resolve) => {
		if (!(image && /^image\//i.test(image.type))) return
		const reader = new FileReader()
		reader.onloadend = function () {
			const maxWidth = 1360
			const maxHeight = 1360
			const imageElement = new Image()
			imageElement.src = reader.result
			imageElement.onload = function () {
				const width = imageElement.width
				const height = imageElement.height
				const shouldResize = width > maxWidth || height > maxHeight
				if (!shouldResize) resolve(reader.result)
				let newWidth
				let newHeight
				if (width > height) {
					newHeight = height * (maxWidth / width)
					newWidth = maxWidth
				} else {
					newWidth = width * (maxHeight / height)
					newHeight = maxHeight
				}
				const canvas = document.createElement('canvas')
				canvas.width = newWidth
				canvas.height = newHeight
				const context = canvas.getContext('2d')
				context.drawImage(this, 0, 0, newWidth, newHeight)
				const dataURL = canvas.toDataURL(image.type)
				resolve(dataURL)
			}
		}
		reader.readAsDataURL(image)
	})
}

const modal = (question, callback) => {
	const modal = document.getElementById('modalTemplate').content.cloneNode(true)
	modal.querySelector('.content').textContent = question
	modal.querySelector('.modal').addEventListener('click', (e) => {
		if (!e.target.closest('button')) return
		const target = e.target.closest('button')
		if (target.classList.contains('yes')) {
			callback()
		}
		e.target.closest('.modal-container').remove()
		document.querySelector('body').removeAttribute('data-showModal')
	})
	document.querySelector('body').setAttribute('data-showModal', '')
	document.querySelector('main').appendChild(modal)
	document.querySelector('.modal').style.transform = `translateY(${scrollY + (innerHeight - document.querySelector('header').offsetHeight - document.querySelector('.modal').offsetHeight) / 2}px)`
}

const initEditRecipePage = async () => {
	const recipe = await getRecipe(window.decodeURI(window.location.hash.split('#').pop()))
	const form = document.querySelector('form')
	document.querySelector('.controls').addEventListener('click', (e) => {
		if (!e.target.closest('button')) return
		const target = e.target.closest('button')
		if (target.classList.contains('delete')) {
			modal(`Möchtest du das Rezept "${recipe.name}" Löschen?`, () => {
				recipe.delete()
				router.loadRoute('/Meine_Rezepte.html')
			})
		}
	})
	form.addEventListener('submit', async (e) => {
		e.preventDefault()
		let valid = true
		if (!form.title.checkValidity()) {
			valid = false
			form.title.reportValidity()
		}
		if (!form.cookingTime.checkValidity()) {
			valid = false
			form.cookingTime.reportValidity()
		}
		document.querySelectorAll(`.ingredients article`).forEach((ingredientInput) => {
			if (!ingredientInput.querySelector('[name="name"]').value) return
			ingredientInput.querySelectorAll('input').forEach((element) => {
				if (!element.checkValidity()) {
					valid = false
					element.reportValidity()
				}
			})
		})
		if (!valid) return
		const previousIdentifier = recipe.identifier
		recipe.save({
			name: form.title.value,
			cookingTime: Number(form.cookingTime.value),
			difficulty: Number(form.difficulty.value),
			diets: Array.from(document.querySelectorAll(`[name="diet"]:checked`)).map((element) => element.value),
			ingredients: Array.from(document.querySelectorAll(`.ingredients article`))
				.map((element) => ({
					name: element.querySelector('[name="name"]').value,
					amount: Number(element.querySelector('[name="amount"]').value),
					unit: element.querySelector('[name="unit"]').value,
				}))
				.filter((element) => element.name),
			steps: Array.from(document.querySelectorAll(`[name="step"]`))
				.map((element) => element.value)
				.filter((element) => element),
		})
		if ((recipe.identifier !== previousIdentifier || form.image.files[0]) && !imageDeleted) {
			initializedlocalRecipeImages.then(async () => {
				let image
				if (form.image.files[0]) image = await getImage(form.image.files[0])
				const objectStore = localRecipeImages.transaction('imagesStore', 'readwrite').objectStore('imagesStore')
				const request = objectStore.get(previousIdentifier)
				request.onsuccess = (e) => {
					if (e.target.result && !image) image = e.target.result.titleimageDataURL
					if (image) {
						objectStore.put({ titleimageDataURL: image, identifier: recipe.identifier })
						recipe.save({ titleimage: true }).openViewer()
					} else recipe.openViewer()
					if (recipe.identifier !== previousIdentifier) objectStore.delete(previousIdentifier)
				}
			})
		} else if (imageDeleted) {
			initializedlocalRecipeImages.then(async () => {
				const objectStore = localRecipeImages.transaction('imagesStore', 'readwrite').objectStore('imagesStore')
				objectStore.delete(previousIdentifier)
				recipe.save({ titleimage: false }).openViewer()
			})
		} else {
			recipe.openViewer()
		}
	})
	form.title.value = recipe.name
	document.title = recipe.name + ' Bearbeiten'
	const placeholderImageSRC = 'assets/titleimage.jpg'
	let previousImageSRC = 'assets/titleimage.jpg'
	let imageSRCChanged
	let imageDeleted = false
	initializedlocalRecipeImages.then(() => {
		const objectStore = localRecipeImages.transaction('imagesStore', 'readonly').objectStore('imagesStore')
		const request = objectStore.get(recipe.identifier)
		request.onsuccess = (e) => {
			if (!e.target.result) return
			previousImageSRC = e.target.result.titleimageDataURL
			document.querySelector('img').src = previousImageSRC
		}
	})
	form.image.addEventListener('change', async () => {
		const image = await getImage(form.image.files[0])
		document.querySelector('img').src = image
		imageSRCChanged = true
		imageDeleted = false
	})
	document.querySelector('.image button').addEventListener('click', () => {
		form.image.value = ''
		if (imageSRCChanged) {
			document.querySelector('img').src = previousImageSRC
			imageSRCChanged = false
		} else {
			if (document.querySelector('img').src.includes(placeholderImageSRC)) return
			modal('Möchtest du das Bild Löschen?', () => {
				imageDeleted = true
				document.querySelector('img').src = placeholderImageSRC
			})
		}
	})
	if (recipe.cookingTime) form.cookingTime.value = recipe.cookingTime
	form.difficulty.value = recipe.difficulty
	if (form.difficulty.value) document.querySelector('[name="difficulty"]:checked').parentElement.setAttribute('data-checked', '')
	document.querySelectorAll(`[name="diet"]`).forEach((element) => {
		if (recipe.diets.includes(element.value)) {
			element.checked = true
			element.parentElement.setAttribute('data-checked', '')
		}
	})
	const ingredientsFragment = document.createDocumentFragment()
	let ingredientsI = 0
	do {
		ingredientsFragment.appendChild(ingredientInput(recipe.ingredients[ingredientsI]))
		ingredientsI++
	} while (ingredientsI < recipe.ingredients.length)
	document.querySelector('.ingredients').appendChild(ingredientsFragment)
	const stepsObserver = new MutationObserver(() => {
		document.querySelectorAll('.step .label').forEach((label, index) => {
			label.textContent = `Schritt ${index + 1}`
		})
	})
	stepsObserver.observe(document.querySelector('.steps'), { childList: true })
	const stepsFragment = document.createDocumentFragment()
	let stepsI = 0
	do {
		stepsFragment.appendChild(stepInput(recipe.steps[stepsI]))
		stepsI++
	} while (stepsI < recipe.steps.length)
	document.querySelector('.steps').appendChild(stepsFragment)
	document.querySelector('[name="AddIngredient"]').addEventListener('click', () => {
		document.querySelector('.ingredients').appendChild(ingredientInput())
	})
	document.querySelector('[name="AddStep"]').addEventListener('click', () => {
		document.querySelector('.steps').appendChild(stepInput(''))
	})
}

const ingredientInput = (ingredient = { name: '', amount: 0, unit: '' }) => {
	const article = document.getElementById('ingredientInput').content.cloneNode(true)
	article.querySelector('[name="name"]').value = ingredient.name
	if (ingredient.amount) article.querySelector('[name="amount"]').value = ingredient.amount
	if (ingredient.unit) article.querySelector(`[value="${ingredient.unit}"]`).setAttribute('selected', '')
	return article
}

const stepInput = (step = '') => {
	const article = document.getElementById('stepInput').content.cloneNode(true)
	article.querySelector('.label').textContent = `Schritt`
	article.querySelector('[name="step"]').value = step
	return article
}

const initMainPage = () => {
	document.querySelectorAll('main > section').forEach((section) => {
		let recipelist
		if (section.id === 'quickAndEasy') recipelist = recipes.public.filtrate({ difficulty: 1 }).order('cookingTime')
		if (section.id === 'mostPopular') recipelist = recipes.public.order('popularity')
		if (section.id === 'sugarfree') recipelist = recipes.public.filtrate({ diets: ['Zuckerfrei'] }).order('relevancy')
		if (section.id === 'recentlyAdded') recipelist = recipes.public.order('creationDate')
		if (section.id === 'vegetarian') recipelist = recipes.public.filtrate({ diets: ['Vegetarisch'] }).order('relevancy')
		placeRecipes(recipelist.slice(0, 3), `#${section.id} .recipes`)
	})
}

export { initMainPage, displayRecipeList, initRecipePage, initEditRecipePage }

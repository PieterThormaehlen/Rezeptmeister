const fs = require('fs/promises')

;(async () => {
	const recipes = await fs.readdir('./recipes/')
	const newRecipelist = []
	const promises = []
	recipes.forEach(async (recipe) => {
		promises.push(
			(async () => {
				const recipeData = JSON.parse(await fs.readFile(`./recipes/${recipe}/recipe.json`))
				const recielistEntry = (({ name, identifier, thumbnail, cookingTime, difficulty, diets, published, favourisations }) => ({ name, identifier, thumbnail, cookingTime, difficulty, diets, published, favourisations }))(recipeData)
				newRecipelist.push(recielistEntry)
			})()
		)
	})
	await Promise.all(promises)
	await fs.writeFile('recipelist.json', JSON.stringify(newRecipelist))
	console.log('new recipelist created')
})()

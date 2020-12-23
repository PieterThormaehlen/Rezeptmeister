const routes = [
	{
		path: '',
		init() {
			initMainPage()
		},
	},
	{
		path: 'index.html',
		init() {
			initMainPage()
		},
	},
	{
		path: 'Rezepte.html',
		init() {
			displayRecipeList('all', '.recipes')
		},
	},
	{
		path: 'Meine_Rezepte.html',
		init() {
			displayRecipeList('local', '.recipes')
		},
	},
	{
		path: 'Lieblingsrezepte.html',
		init() {
			displayRecipeList('favourised', '.recipes')
		},
	},
	{
		path: 'Rezept.html',
		init() {
			initRecipePage()
		},
	},
	{
		path: 'Rezept_Bearbeiten.html',
		init() {
			initEditRecipePage()
		},
	},
]

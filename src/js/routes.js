import { initMainPage, displayRecipeList, initRecipePage, initEditRecipePage } from './main'

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
			displayRecipeList('.recipes', 'all')
		},
	},
	{
		path: 'Meine_Rezepte.html',
		init() {
			displayRecipeList('.recipes', 'local')
		},
	},
	{
		path: 'Lieblingsrezepte.html',
		init() {
			displayRecipeList('.recipes', 'favourised')
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

export default routes

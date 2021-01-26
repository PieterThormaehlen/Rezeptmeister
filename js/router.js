Router = class {
	constructor(routes) {
		this.routes = routes

		const matchedRoute = this.matchPathnameToRoute(window.decodeURI(window.location.pathname))
		this.updateRouterOutlet(matchedRoute)

		window.addEventListener('popstate', () => {
			const matchedRoute = this.matchPathnameToRoute(window.decodeURI(window.location.pathname))
			this.updateRouterOutlet(matchedRoute)
		})

		//from https://dennisreimann.de/articles/delegating-html-links-to-vue-router.html
		window.addEventListener('click', (e) => {
			// ensure we use the link, in case the click has been received by a subelement
			let target = e.target
			while (target && target.tagName !== 'A') target = target.parentNode
			// handle only links that do not reference external resources
			if (target && target.matches("a:not([href*='://'])") && target.href) {
				const { altKey, ctrlKey, metaKey, shiftKey, button, defaultPrevented } = e
				// don't handle with control keys
				if (altKey || ctrlKey || metaKey || shiftKey) return
				// don't handle when preventDefault called
				if (defaultPrevented) return
				// don't handle right clicks
				if (button !== undefined && button !== 0) return
				// don't handle if `target="_blank"`
				if (target && target.getAttribute) {
					const linkTarget = target.getAttribute('target')
					if (/\b_blank\b/i.test(linkTarget)) return
				}
				e.preventDefault()
				let fragment = ''
				if (target.href.includes('#')) fragment = target.href.split('#').pop()
				this.loadRoute(target.pathname, fragment)
			}
		})
	}
	matchPathnameToRoute(pathname) {
		let currentPathname = pathname
		if (currentPathname.startsWith('/')) currentPathname = currentPathname.substring(1)
		if (currentPathname.startsWith('Rezeptmeister')) currentPathname = currentPathname.substring(currentPathname.indexOf('/') + 1)
		return routes.find((route) => route.path.replace(/^\//, '') === currentPathname.replace(/^\//, ''))
	}
	loadRoute(pathname, fragment) {
		const matchedRoute = this.matchPathnameToRoute(pathname)
		let targetPath = matchedRoute.path
		if (fragment) {
			targetPath = matchedRoute.path + '#' + fragment
		}
		history.pushState({}, '', targetPath)
		this.updateRouterOutlet(matchedRoute)
	}
	async updateRouterOutlet(matchedRoute) {
		const routerOutlet = document.querySelector('main')
		const fadeIn = { transform: ['translateY(-5px)', 'translateY(0px)'], opacity: [0, 1] }
		const options = { duration: 150, fill: 'forwards', easing: 'ease' }
		routerOutlet.animate(fadeIn, { ...options, direction: 'reverse' })
		const timer = new Promise((resolve) => setTimeout(() => resolve(), 200)).then(() => {
			document.querySelector('body').removeAttribute('data-shownav')
			document.querySelector('body').removeAttribute('data-showModal')
			document.querySelector('body').removeAttribute('data-loaded')
			document.querySelector('main').removeAttribute('data-showFilters')
			document.querySelector('main').removeAttribute('data-showOrderBy')
			routerOutlet.scrollTo(0, 0)
		})
		const response = await fetch(matchedRoute.path)
		const data = await response.text()
		const parsedHtml = new DOMParser().parseFromString(data, 'text/html')
		await timer
		routerOutlet.innerHTML = parsedHtml.querySelector('main').innerHTML
		document.title = parsedHtml.querySelector('title').innerHTML
		document.querySelector('body').setAttribute('data-loaded', '')
		routerOutlet.animate(fadeIn, options)
		await initialized
		matchedRoute.init()
	}
}

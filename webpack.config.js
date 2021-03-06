// node modules
const path = require('path')
const fs = require('fs')
const { mergeWithCustomize, customizeObject, merge } = require('webpack-merge')

// webpack plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

// postcss plugins
const postcssPresetEnv = require('postcss-preset-env')

// config files
const pkg = require('./package.json')

const configureBabelLoader = (browserList) => {
	return {
		test: /\.js$/,
		exclude: [/node_modules/],
		use: {
			loader: 'babel-loader',
			options: {
				cacheDirectory: true,
				sourceType: 'unambiguous',
				presets: [
					[
						'@babel/preset-env',
						{
							modules: false,
							corejs: {
								version: 3.9,
								proposals: true,
							},
							useBuiltIns: 'usage',
							targets: {
								browsers: browserList,
							},
						},
					],
				],
			},
		},
	}
}

const htmlPlugins = (pagesDir, startPagesDir) => {
	if (!startPagesDir) startPagesDir = pagesDir
	const elements = fs.readdirSync(path.resolve(__dirname, pagesDir), { withFileTypes: true })
	return elements
		.map((element) => {
			if (element.isDirectory()) return htmlPlugins(path.join(pagesDir, element.name), startPagesDir ? startPagesDir : pagesDir)
			else {
				const parts = element.name.split('.')
				const name = parts[0]
				const extension = parts[1]
				return new HtmlWebpackPlugin({
					filename: path.join(pagesDir.slice(startPagesDir.length + 1), `${name}.html`),
					template: path.resolve(__dirname, `${pagesDir}/${name}.${extension}`),
					inject: false,
				})
			}
		})
		.flat()
}

const commonBase = {
	entry: {
		init: './src/js/init.js',
		main: './src/js/main.js',
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		assetModuleFilename: 'assets/[name][ext]',
	},
}

const commonModern = {
	output: {
		filename: path.join('./js', '[name].js'),
	},
	module: {
		rules: [
			configureBabelLoader(pkg.browserslist.map((e) => e.concat(' and supports es6-module'))),
			{
				test: /\.html$/,
				loader: 'html-loader',
				options: {
					sources: {
						list: [
							'...',
							{
								tag: 'script',
								attribute: 'src',
								type: 'src',
								filter: () => false,
							},
							{
								tag: 'link',
								attribute: 'href',
								type: 'src',
								filter: () => false,
							},
						],
					},
				},
			},
		],
	},
	plugins: [new CopyPlugin({ patterns: [{ from: 'src/assets', to: 'assets' }] }), new CleanWebpackPlugin()].concat(htmlPlugins('src/pages')),
}

const commonLegacy = {
	output: {
		filename: path.join('./js', '[name]-legacy.js'),
	},
	module: {
		rules: [configureBabelLoader(pkg.browserslist.map((e) => e.concat(' and not supports es6-module')))],
	},
}

const common = (mode) => {
	let config
	if (mode === 'modern') config = commonModern
	if (mode === 'legacy') config = commonLegacy
	return mergeWithCustomize({
		customizeObject: customizeObject({
			module: 'prepend',
			plugins: 'prepend',
		}),
	})(commonBase, config)
}

const development = {
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
		],
	},
	devtool: 'source-map',
	target: 'web', // fix for webpack 5 live reload not working with browserslist
	devServer: {
		contentBase: path.resolve(__dirname, 'dist'),
		host: '0.0.0.0',
		port: '8080',
	},
}

const productionBase = {
	mode: 'production',
}

const productionModern = {
	plugins: [new MiniCssExtractPlugin({ filename: path.join('./css', '[name].css') })],
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { plugins: [postcssPresetEnv({ browsers: pkg.browserslist })] },
						},
					},
					'sass-loader',
				],
			},
		],
	},
}

const productionLegacy = {
	module: {
		rules: [
			{
				test: /\.scss$/,
				loader: 'ignore-loader',
			},
		],
	},
}

const production = (mode) => {
	let config
	if (mode === 'modern') config = productionModern
	if (mode === 'legacy') config = productionLegacy
	return mergeWithCustomize({
		customizeObject: customizeObject({
			module: 'prepend',
			plugins: 'prepend',
		}),
	})(productionBase, config)
}

if (process.env.NODE_ENV === 'development') module.exports = merge(common('modern'), development)
else if (process.env.NODE_ENV === 'production') module.exports = [merge(common('modern'), production('modern')), merge(common('legacy'), production('legacy'))]
else throw 'NODE_ENV must be "development" or "production"'

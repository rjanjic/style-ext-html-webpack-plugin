[![npm version](https://badge.fury.io/js/style-ext-html-webpack-plugin.svg)](http://badge.fury.io/js/style-ext-html-webpack-plugin) [![Dependency Status](https://david-dm.org/numical/style-ext-html-webpack-plugin.svg)](https://david-dm.org/numical/style-ext-html-webpack-plugin) [![Build status](https://travis-ci.org/numical/style-ext-html-webpack-plugin.svg)](https://travis-ci.org/numical/style-ext-html-webpack-plugin) [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

[![NPM](https://nodei.co/npm/style-ext-html-webpack-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/style-ext-html-webpack-plugin/)

> **tl;dr:**
>
> If you use HtmlWebpackPlugin and ExtractTextPlugin in your Webpack builds to create HTML `<link>`s to external stylesheet files, add this plugin to convert the links to ` <style>` elements containing internal (sometimes incorrectly called 'in-line') CSS.

This is an extension plugin for the [Webpack](http://webpack.github.io) plugin [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin) - a plugin that simplifies the creation of HTML files to serve your webpack bundles.

The raw [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin) can bundle CSS assets as `<link>` elements if used in conjunction with [ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin).  This extension plugin builds on this by moving the CSS content generated by [ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin) from an external CSS file to an internal `<style>` element.  

As of v3.2.x you can specify _where_ in the html this `<style>` element is inserted.

As of v3.3.x, you can specify minification options for the inlined styles.

Note: this is for internalizing `<style>`'s only - if you wish to inline `<scripts>`'s please take a look at:
- inlining feature of sister plugin
[script-ext-html-webpack-plugin](https://github.com/numical/script-ext-html-webpack-plugin);
- the [HtmlWebpackPlugin inline example](https://github.com/jantimon/html-webpack-plugin/tree/master/examples/inline) based on jade templates.


## Installation
You can be running webpack (3.x, 4.x) on node v6 or higher.

Install the plugin with npm:
```shell
$ npm install style-ext-html-webpack-plugin
```

Note: you may see warnings of the following type:
```shell
npm WARN html-webpack-plugin@XXX requires a peer of webpack@* but none was installed.
```
This is fine - for testing, we dynamically download multiple version of webpack and its plugins (via the [dynavers](https://github.com/numical/dynavers) module).


## Important Upgrade Note

**Your v2.x configuration will no longer work**

Version 3.x is a complete rewrite of the plugin with a completely new configuration and using a completely new mechanism.

The plugin now piggy-backs on [ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin)'s functionality so works in any use case that [ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin) works.  This has the convenient effect of fixing all raised issues with v2.x.

However  [ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin) does **not** support HMR (Hot Module Replacement).  See the 'Use Case: Hot Module Replacement' below for more.


## Basic Usage

### Use Case: Internalize all your CSS
Add the plugin to your webpack config.

The order is important - the plugin must come **after** HtmlWebpackPlugin and ExtractTextWebpackPlugin:
```javascript
module: {
  loaders: [
    { test: /\.css$/, loader: ExtractTextPlugin.extract(...)}
  ]
}
plugins: [
  new HtmlWebpackPlugin({...}),
  new ExtractTextWebpackPlugin('styles.css'),
  new StyleExtHtmlWebpackPlugin()  << add the plugin
]
```
That's it.

Note that for this simple configuration, HtmlWebpackPlugin's [inject](https://github.com/jantimon/html-webpack-plugin#configuration) option must not be `false`.  However, this constraint does not apply if you specify the `position` - see 'Use Case: Specifying Position of Style Element' below


### Use Case: Internalize critical CSS only
Add the plugin and use more than one loader for your CSS:
```javascript
module: {
  loaders: [
    { test: /critical.css/, loader: ExtractTextPlugin.extract(...)},
    { test: /other.css/, loader: 'style-loader!css-loader'},  << add separate loader
  ]
}
plugins: [
  new HtmlWebpackPlugin({...}),
  new ExtractTextWebpackPlugin('styles.css'),
  new StyleExtHtmlWebpackPlugin()
]
```

### Use Case: Internalize critical CSS with all other CSS in an external file
Use two instances of ExtractTextPlugin and tell StyleExtWebpackPlugin which one to target by giving it the name of the output file:
```javascript
const internalCSS = new ExtractTextPlugin('internal.css');
const externalCSS = new ExtractTextPlugin('styles.css');
return {
  ...
  module: {
    loaders: [
      { test: /critical.css/, loader: internalCSS.extract(...)},
      { test: /other.css/, loader: externalCSS.extract(...)},
    ]
  }
  plugins: [
    new HtmlWebpackPlugin({...}),
    internalCSS,
    externalCSS,
    new StyleExtHtmlWebpackPlugin('internal.css') << tell the plugin which to target
  ]
}
```

### Use Case: Specifying Position of Style Element
In the above cases, the positioning of the `<style` element is controlled by the [`inject` option](https://github.com/jantimon/html-webpack-plugin#configuration) specified by html-webpack-plugin.
For more control, you can use an extended, hash version of the configuration. This can have the following properties:
- `enabled`: [`true|false`] - for switching the plugin on and off (default: `true`);
- `file`: the css filename - previously, the single `String` argument (default: `undefined` - uses the first css file found in the compilation);
- `chunks`: which chunks the plugin scans for the css file - see the next Use Case: Multiple HTML files for usage (default: `undefined` - scans all chunks);
- `position`: [`head-top`|`head-bottom`|`body-top`|`body-bottom`|`plugin`] - all (hopefully) self-explanatory except `plugin`, which means defer to html-webpack-plugin's `inject` option (default: `plugin`);
- `minify`: see next section
- `cssRegExp`:  A regular expression that indicates the css filename (default: /\.css$/);

So to put the CSS at the bottom of the `<head>` element:
```javascript
module: {
  loaders: [
    { test: /\.css$/, loader: ExtractTextPlugin.extract(...)}
  ]
}
plugins: [
  new HtmlWebpackPlugin({...}),
  new ExtractTextWebpackPlugin('styles.css'),
  new StyleExtHtmlWebpackPlugin({
    position: 'head-bottom'
  })
]
```

### Use Case: Minification/Optimisation
The inlined CSS can be minified/optimised using the extended, hash version of the configuration.  Use the `minify` property with one of the following values:
- `false`: the default, does not minify;
- `true`: minifies with default options;
- a hash of the minification options.
Minification is carried out by the [clean-css](https://github.com/jakubpawlowicz/clean-css) optimizer (thanks, @jakubpawlowicz!).  See its [documentation](https://github.com/jakubpawlowicz/clean-css#constructor-options) for the available options.

Default minification:
```javascript
plugins: [
  ...
  new StyleExtHtmlWebpackPlugin({
    minify: true
  })
]
```

Custom minification:
```javascript
plugins: [
  ...
  new StyleExtHtmlWebpackPlugin({
    minify: {
      level: {
        1: {
          all: false,
          tidySelectors: true
        }
      }
    }
  })
]
```


### Use Case: Sass/PostCSS Processing etc.
All as per [ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin).

### Use Case: Multiple HTML files
html-webpack-plugin can generate multiple html files if you [use multiple instances of the plugin](https://github.com/jantimon/html-webpack-plugin#generating-multiple-html-files).  If you want each html page to be based on different assets (e.g a set of pages) you do this by focussing each html-webpack-plugin instance on a particular entry point via its [`chunks` configuration option](https://github.com/jantimon/html-webpack-plugin#configuration).

style-ext-html-webpack-plugin supports this approach by offering the same `chunks` option.  As you also need an instance of extract-text-webpack-plugin, the configuration is quite unwieldy:
```javascript
...
const page1Extract = new ExtractTextPlugin('page1.css');
const page2Extract = new ExtractTextPlugin('page2.css');
const webpackConfig = {
  ...
  entry: {
    entry1: 'page-1-path/script.js',
    entry2: 'page-2-path/script.js'
  },
  output.filename = '[name].js',
  module.loaders: [
    {
      test: /\.css$/,
      loader: page1Extract.extract('style-loader', 'css-loader'),
      include: [
        'page-1-path'
      ]
    },
    {
      test: /\.css$/,
      loader: page2Extract.extract('style-loader', 'css-loader'),
      include: [
        'page-2-path'
      ]
    }
  ],
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['entry1'],
      filename: 'page1.html'
    }),
    new HtmlWebpackPlugin({
      chunks: ['entry2'],
      filename: 'page2.html'
    }),
    page1Extract,
    page2Extract,
    new StyleExtHtmlWebpackPlugin({
      chunks: ['entry1']
    }),
    new StyleExtHtmlWebpackPlugin({
      chunks: ['entry2']
    })
  ],
  ...
}
return webpackConfig;
```
Phew!  A loop is recommended instead.


### Use Case: Hot Module Replacement
As discussed earlier, ExtractTextPlugin does not support HMR.  If you really need this for your CSS you have two options:
1. revert to/stick with [v2.x](https://github.com/numical/style-ext-html-webpack-plugin/tree/v2.0.6) of the plugin;
2. only internalize the CSS on production builds.

The former option is viable if v2.x supports your requirements but that version is no longer maintained hence the second approach is recommended.

For this, use a conditional in your webpack.config to:
* select between ExtractTextPlugin or a loader that supports HMR such as the [style-loader](https://github.com/webpack/style-loader);
* either remove the StyleExtPlugin or disable it by passing `false` to its constructor:
```javascript
const DEBUG = (process.env.NODE_ENV !== 'production');
return {
  ...
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: DEBUG ? 'style-loader|css-loader' : ExtractTextPlugin.extract({...})
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({...}),
    new ExtractTextPlugin('styles.css'),
    new StyleExtHtmlWebpackPlugin(!DEBUG)
  ]
}
```

## Debugging
If you have any problems, check the HTML file outputted by HtmlWebpackPlugin.  As long as it has the `showErrors` [configuration option](https://github.com/jantimon/html-webpack-plugin#configuration) set (the default), any errors from StyleExt will be displayed there.

Your next step is to simply remove the StyleExtPlugin and check that ExtractTextPlugin works by itself.  

If it does and reintroducing StyleExtPlugin still has problems, please [raise an issue](https://github.com/numical/style-ext-html-webpack-plugin/issues) giving your configuration **and**, please, DEBUG output.  The DEBUG output is generated by the [debug](https://www.npmjs.com/package/debug) tool which is enabled by setting the `DEBUG=StyleExt` environmental variable:
```bash
DEBUG=StyleExt webpack
```
The output of a working configuration will look something like:
```bash
StyleExt constructor: enabled=true, filename=undefined
StyleExt html-webpack-plugin-alter-asset-tags: CSS file in compilation: 'styles.css'
StyleExt html-webpack-plugin-alter-asset-tags: CSS in compilation: @import url(https://fonts.googleapis.com/css?family=Indie+Flower);...
StyleExt html-webpack-plugin-alter-asset-tags: link element found for style path 'styles.css'
StyleExt html-webpack-plugin-alter-asset-tags: completed)
```



Change History
--------------

* 4.1.0 - remove webpack v1.x and webpack v2.x support
        - updated webpack 4 testing to 4.35.2
* 4.0.0 - webpack4 support
        - removed node 5.x support
        - node 9.x, 10,x, 11.x testing
        - support for UglifyJsPlugin in Wepack 1 removed - CSS minification tested using [cssnano](https://cssnano.co/) with [postcss-loader](https://github.com/postcss/postcss-loader)  
* 3.4.7 - removed legacy dependencies (thanks @ngyikp)
* 3.4.6 - [PR 34](https://github.com/numical/style-ext-html-webpack-plugin/pull/34) - fix case where public path is a URL (thanks @jlwogren, @gvitelli)
        - updated dependencies
* 3.4.5 - further fix for [issue 33](https://github.com/numical/style-ext-html-webpack-plugin/issues/33) when css filenames include '?'
* 3.4.4 - partial resolution to [issue 33](https://github.com/numical/style-ext-html-webpack-plugin/issues/33) - link element not removed (thanks orenklein)
* 3.4.3 - added node 7 & 8 testing
* 3.4.2 - resolved [issue 29](https://github.com/numical/style-ext-html-webpack-plugin/issues/29) - link to stylsheet not being updated (thanks @ballwood)
        - updated dependencies
        - added webpack3 testing
* 3.4.1 - updating dependencies / typos on README
* 3.4.0 - add explicit css file matching (thanks @mastilver for the complete PR), updated dependecies
* 3.3.0 - add minification option (thanks @pablohpsilva for the idea)
* 3.2.0 - runs even if `inject: false` for html-webpack-plugin; supports explicit positioning of style tags; update dependencies
* 3.1.1 - updated README (sorry @rastasheep)
* 3.1.0 - support multiple entry points (thanks @hagmandan); README typos fixed (thanks @eahlberg); updated all dependencies (including webpack 2.2.0)
* v3.0.8 - webpack2 tests moved to webpack 2.2.0-rc3
* v3.0.7 - webpack2 tests moved to webpack 2.2.0-rc.2 and minor fix to maintain compatability  
* v3.0.6 - webpack1 tests moved to webpack 1.14.0
* v3.0.5 - updated README after [issue 10](https://github.com/numical/style-ext-html-webpack-plugin/issues/10) (thanks, @Birowsky)
* v3.0.4 - support `output.publicPath` configuration and better debugging support
* v3.0.3 - instrument code with [debug](https://github.com/visionmedia/debug)
* v3.0.2 - include `lib` folder in deployment (thanks, @Aweary)
* v3.0.1 - minor REAME and error handling improvements
* v3.0.0 - complete rewrite to piggback off ExtractTextPlugin
* v2.0.5 - modified test to use dynavers with webpack 1.13.2 and 2.1.0-beta.16
* v2.0.4 - fixed jasmine dependency to explicit version v2.4.1 due to [bug](https://github.com/jasmine/jasmine-npm/issues/90) in v2.5
* v2.0.3 - updated dependency versions, reclassified some dependencies
* v2.0.2 - merged pull request by 7pass fixing 2.0.1 - thanks!
* v2.0.1 - added explicit guard against use of `devtool eval` option
* v2.0.0 - webpack 1.x and 2.x compatible, including hot reloading
* v2.0.0.beta.3 - warnings about beta testing (!), debug enhancements, and better unescaping
* v2.0.0.beta.2 - Travis timeout and tag spacing fixes
* v2.0.0-beta.1 - node 4.x fix and fixed handling of multiple scripts
* v2.0.0-beta.0 - hot module reload working (with `HtmlWebpackPlugin` cache switched off)
* v1.1.1 - hot module reload not working with webpack 2
* v1.1.0 - now Webpack 2.x compatible
* v1.0.7 - added warning that not compatible with Webpack 2
* v1.0.6 - updated tests to match changes in
[script-ext-html-webpack-plugin](https://github.com/numical/script-ext-html-webpack-plugin)
* v1.0.5 - updated code to match changes in [semistandard](https://github.com/Flet/semistandard)
* v1.0.4 - added debug options
* v1.0.3 - documentation update
* v1.0.2 - documentation update
* v1.0.1 - now plays happily with plugins on same event
* v1.0.0 - initial release

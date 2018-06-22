Backbone.js Subviews
===================

![Version 0.6.0](https://img.shields.io/badge/Version-0.6.0-blue.svg)

>Extends `Backbone.View` with support for nested subviews that can be reused and cleaned up when need be. (helps mitigate ghosted views)

## Features

- Cleanup views when no longer needed
- Provided access to parent views
- Add methods to help with reusing Views
- Keeps views uninitialized until needed
- And more

## Using Subviews

```javascript
var MySubview = Backbone.View.extend({
	
	render: function(){
		console.log(this.parentView.className) // 'my-view'
		console.log(this.viewName) // 'my-subview'
	},
	
	cleanup: function(){
		console.log('perform cleanup')
		// such as this.stopListening(this.model)
	}
});

var MyView = Backbone.View.extend({
	
	className: 'my-view',
	 
	initialize: function(){
		this.sv('my-subview', MySubview).renderTo(this)
	},
	
	render: function(){
	
		// render the child view
		this.sv('my-subview').render();
	
		return this;
	}
})
```

When you remove a view, all subviews will be informed and told to cleanup

```javascript
MyView.remove() // MySubview:'perform cleanup'
```

You can reuse views too instead of recreating over and over.

```javascript
var MyListSubivew = Backbone.View.extend({});

var MyListView = Backbone.View.extend({
	
	render: function(){
	
		this.$el.html('')
		// assuming this view has a collection...
		this.collection.each(this.addOne, this)
	
		return this;
	},
	
	addOne: function(model){
		
		let viewName = 'item-'+model.id
		
		// MyListSubivew will only be initialized once for the given viewName
		this.sv(viewName, MyListSubivew)
			.setModel(model)
			.renderTo(this)
		
		// if you data/options are needed upon initialization of the view, you can do This
		// this.sv(viewName, MyListSubivew, {model: model, another:'option'})
	}
})
```

## Defining Views

Since creating and appending subviews to a view is a common routine, backbone.subviews provides a way to setup and render them automatically for you.

```js
var View1 = Backbone.View.extend({className: 'v1'});
var View2 = Backbone.View.extend({className: 'v2'});
var BadgeView = Backbone.View.extend({className: 'badge'});
var ViewColl = Backbone.View.extend({className: 'v-coll', tagName: 'ul'});

var RootView = Backbone.View.extend({

	className: 'rootview',
	template: '<h1 class="title">Title</h1>',

	views: {
		'view1': View1,
		'view2': View2,
		'badge': {
			view: BadgeView,
			appendTo: '.title'
		},
		'view-collection': {
			view: ViewColl,
			setModel: function(v, model){
				v.collection = model.get('a-child-collection')
			}
		}
	}

});
```

When the RootView is rendered, all the views defined in `views` will be initialized, appended to RootView and then their `render()` method called.

**This will give us the following DOM structure**

```html
<div class="rootview">
	<h1 class="title">Title<div class="badge"></div></h1>
	<div class="v1"></div>
	<div class="v2"></div>
	<ul class="v-coll"></ul>
</div>
```

> If you override `render` you'll need to remember to call `renderViews()` on your own.

## Methods & References

There are some useful methods added to Backbone.Views

`.sv()` or `.subview()` - save and access subviews

`.renderTo()` - render and append to a backbone view (or jquery element)

`.empty()` - clears the view of contents

`.inDOM()` - whether or not the view is presented in the DOM or just stored in memory

`.reRender()` - will only render if in the DOM

`.renderViews()` - init and append (if needed) and then render all defined views (`this.views`)

`.forEachView(callback)` - perform an action on all defined `views`

`.renderTemplate()` - will take `this.template` and merge with `this.model` and append to el. (See [backbone.template-data](https://github.com/kjantzer/backbone-template-data))

`.parentView` - a reference to the parent view of this child

`.parent(viewName, returnPromise=false)` - will traverse up parent views until matched view name. Use `root` to get the top level view. Dot notation is supported for traversing up to a parent and then down to a subview.

`.viewName` - the name the child is stored under in the parent


## Changelog

#### v0.6.0
- return `this` in `setModel` for chainability
- add `renderTo` method
- `view` arg in `.sv()` can be uninitialized - the view will only initialize once.
- defined view in `views` has `setModel` option available

#### v0.5.0
- new `.parent(viewName, returnPromise=false)` method for traversing up the parent views to the one matching the given name

#### v0.4.0
- add support for defining and automating subviews on a view

## License

MIT © [Kevin Jantzer](https://twitter.com/kjantzer) - [Blackstone Publishing](http://www.blackstonepublishing.com/)
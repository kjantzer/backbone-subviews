Backbone.js Subviews
===================

![Version 0.4.0](https://img.shields.io/badge/Version-0.4.0-blue.svg)

>Extends `Backbone.View` with support for nested subviews that can be reused and cleaned up when need be. (helps mitigate ghosted views)

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
		this.sv('my-subview', new MySubview())
		this.$el.append( this.sv('my-subview').el )
	}
	
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
		var viewName = 'item-'+model.id
		var view = this.sv(viewName) || this.sv(viewName, new MyListSubivew({model: model}))
				
		this.appendSubview(viewName);
	}
})
```

## Defining Views

Since creating and appending subviews to a view is a common routine, backbone.subviews provides a way to setup and render them automatically for you.

```js
var View1 = Backbone.View.extend({className: 'v1'});
var View2 = Backbone.View.extend({className: 'v2'});
var BadgeView = Backbone.View.extend({className: 'badge'});

var RootView = Backbone.View.extend({

	className: 'rootview',
	template: '<h1 class="title">Title</h1>',

	views: {
		'view1': View1,
		'view2': View2,
		'badge': {view: BadgeView, appendTo: '.title' }
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
</div>
```

> If you override `render` you'll need to remember to call `renderViews()` on your own.

## Methods & References

There are some useful methods added to Backbone.Views

`.sv()` or `.subview()` - save and access subviews

`.empty()` - clears the view of contents

`.inDOM()` - whether or not the view is presented in the DOM or just stored in memory

`.reRender()` - will only render if in the DOM

`.renderViews()` - init and append (if needed) and then render all defined views (`this.views`)

`.forEachView(callback)` - perform an action on all defined `views`

`.renderTemplate()` - will take `this.template` and merge with `this.model` and append to el. (See [backbone.template-data](https://github.com/kjantzer/backbone-template-data))

`.parentView` - a reference to the parent view of this child

`.viewName` - the name the child is stored under in the parent


## Changelog

#### v0.4.0
- add support for defining and automating subviews on a view

## License

MIT © [Kevin Jantzer](http://kevinjantzer.com) - Blackstone Publishing

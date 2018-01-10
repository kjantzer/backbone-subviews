Backbone.js Subviews
===================

![Version 0.3.1](https://img.shields.io/badge/Version-0.3.1-blue.svg)
[![GitHub stars](https://img.shields.io/github/stars/badges/shields.svg?style=social&label=Stars&style=flat-square)](https://github.com/kjantzer/backbonejs-subviews)

>Extends `Backbone.View` with support for nested subviews that can be reused and cleaned up when need be. (helps mitigate ghosted views)

## Example use

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
		this.addAll();
	
		return this;
	},
	
	addAll: function(){
		// assuming this view has a collection...
		this.collection.each(this.addOne, this)
	},
	
	addOne: function(model){
		var viewName = 'item-'+model.id
		var view = this.sv(viewName) || this.sv(viewName, new MyListSubivew({model: model}))
				
		this.appendSubview(viewName);
	}
})
```

## Methods & References

There are some useful methods added to Backbone.Views

`.sv()` or `.subview()` - save and access subviews

`.empty()` - clears the view of contents

`.inDOM()` - whether or not the view is presented in the DOM or just stored in memory

`.reRender()` - will only render if in the DOM

`.parentView` - a reference to the parent view of this child

`.viewName` - the name the child is stored under in the parent

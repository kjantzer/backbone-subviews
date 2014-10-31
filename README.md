Backbone.js Subviews
===================

Extends Backbone.View with support for nested subviews that can be reused and cleaned up when need be.

https://github.com/kjantzer/backbonejs-subviews

```javascript
var MySubview = Backbone.View.extend({});

var MyView = Backbone.View.extend({
	
	initialize: function(){
		
		this.subview('my-subview', new MySubview());
		this.appendSubview('my-subview');
		
	}
	
	render: function(){
	
		// render the child view
		this.subview('my-subview').render();
	
		return this;
	}
})


// ...later..

MyView.cleanup() // the child view will also be cleaned up
```

You can reuse views too

```javascript
var MyListSubivew = Backbone.View.extend({});

var MyListView = Backbone.View.extend({
	
	initialize: function(){}
	
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
		var viewName = 'item-'+model.id,
			view = this.subview(viewName)	// reuse the view or create a new one
				|| this.subview(viewName, new MyListSubivew({model: model}))
				
		this.appendSubview(viewName);
	}
})
```
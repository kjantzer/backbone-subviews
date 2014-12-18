/*
	Backbone Subviews 0.1.0

	Extends Backbone.View with support for nested subviews that can be reused and cleaned up when need be.

	https://github.com/kjantzer/backbonejs-subviews

	@author Kevin Jantzer
	@since 2014-10-28
*/

_.extend(Backbone.View.prototype, {
	

/*
	Subview - adds or retrieves subview

	When adding a subview, you can choose to pass in a view instance
	or just the class to use when initialized view

		var myView = Backbone.View.extend();

		this.subview('my-view', new myView());	// initialized right away
		this.subview('my-view', myView;			// only inialized the first time it is accessed
*/
	subview: function(viewName, view){

		this.__subviews = this.__subviews || {};

		if( view ){

			// if this view already existed, clean it up first
			if( this.__subviews[viewName] ) this.__subviews[viewName].cleanup();

			// set the new view
			this.__subviews[viewName] = view;
			
			if( typeof view === 'object' ) // only setup view if it has been intialized
				this._setupSubview(viewName, view);

			return view;
		
		// return the requested view
		}else{
			var view = this.__subviews[viewName];

			if( typeof view === 'function' )
				view = this.__subviews[viewName] = this._setupSubview(viewName, new view() );

			return view;
		}
	},

	_setupSubview: function(viewName, view){
		view.viewName = viewName;
		view.parentView = this;
		return view;
	},

	_removeSubview: function(view){
		delete this.__subviews[view.viewName];
		delete view.parentView;
	},

	_removeFromParentView: function(){
		if( this.parentView ) this.parentView._removeSubview(this);
	},

	clearSubviews: function(){
		_.each(this.__subviews, function(view){ delete view.parentView; })
		this.__subviews = {};
	},

	appendSubview: function(viewName, doRender){
		var subview = this.subview(viewName);

		if( !subview )
			console.error('No subview called: '+viewName)
		else if( doRender !== false )
			this.$el.append( subview.render().el ); 
		else
			this.$el.append( subview.el ); 
	},

	// default empty cleanup method - use to remove event listeners	
	cleanup: function(andClear){

		this.cleanupSubviews(andClear);

		if( this.stopListeningOnCleanup && this.stopListeningOnCleanup == true ){
			this.stopListening();

			this._removeFromParentView();
		}
	},

	cleanupSubviews: function(andClear){

		this.view && this.view.cleanup && this.view.cleanup();		// main child view if it exists
		this.editor && this.editor.cleanup && this.editor.cleanup();	// model editor if it exists

		// all subviews
		_.each(this.__subviews, function(view){
			if( view.cleanup ) // test since view may not be initialized
				view.cleanup();
		});

		andClear && this.clearSubviews();		// clear subviews if requested
	},

	remove: function(animated, callback){
		
		// if extra cleanup is desired, do it now
		this.cleanup();

		// animate requested and animation function is defined...?
		if( (animated === true || animated > 1) && $.fn.slideUpRemove !== undefined ){

			var speed = animated === true ? null : animated;
			this.$el.slideUpRemove(speed, callback);

		}else{

			this.$el.remove();
			if( callback && _.isFunction(callback) ) callback();
		}

		this.stopListening();

		return this;
	}

})
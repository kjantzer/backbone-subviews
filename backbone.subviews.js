/*
	Backbone Subviews 0.3.0

	Extends Backbone.View with support for nested subviews that can be reused and cleaned up when need be.

	https://github.com/kjantzer/backbonejs-subviews

	@author Kevin Jantzer
	@since 2014-10-28
*/

_.extend(Backbone.View.prototype, {

	// stopListeningOnCleanup: false,
	// removeOnCleanup: false,
	
	inDOM: function(){
		return this.el.parentElement != null;
	},

	// only calls `render` if this view is in the DOM
	reRender: function(){
		if( this.inDOM() )
			this.render();
	},

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

		return view 
			? this._setSubview(viewName, view)
			: this._getSubview(viewName) 
	},

	// high level subview - used to open views and can support opening a view with require.js
	openSubview: function(viewName){
		this._getSubview(viewName, 'open');
	},

	_setSubview: function(viewName, view){
		// if this view already existed, clean it up first
		if( this.__subviews[viewName] ) this.__subviews[viewName].cleanup();

		// set the new view
		this.__subviews[viewName] = view;
		
		if( typeof view === 'object' ) // only setup view if it has been intialized
			this._setupSubview(viewName, view);

		return view;
	},

	_getSubview: function(viewName, method){

		var view = this.__subviews[viewName];

		// if view is a string, it is assumed that require.js is being used
		if( _.isString(view) )
			return this._requireSubview(viewName, view, method);

		else if( typeof view === 'function' )
			view = this.__subviews[viewName] = this._setupSubview(viewName, new view() );

		if( method && view[method] )
			view[method].call(view);

		return view;
	},

	_requireSubview: function(viewName, name, method){

		var self = this;

		// not sure I really need this promise here...but we'll leave for now
		return new Promise(function(resolve, reject) {
		
			require([name], function(view){

				if( view ){

					// initialize and setup view
					view = self.__subviews[viewName] = self._setupSubview(viewName, new view() );

					method && view[method] && view[method].call(view)

					resolve(view)
				
				}else{
					reject(view);
				}

			})

		});
	},

	_setupSubview: function(viewName, view){
		view.viewName = viewName;
		view.parentView = this;
		return view;
	},

	_removeSubview: function(view){
		if( view && view.viewName && this.__subviews )
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

		if( this.removeOnCleanup && this.removeOnCleanup == true ){
			this.stopListening();
			this._removeFromParentView();
		}
		else if( this.stopListeningOnCleanup && this.stopListeningOnCleanup == true ){
			this.stopListening();
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
/*
	Backbone Subviews 0.4.0

	Extends Backbone.View with support for nested subviews that can be reused and cleaned up when need be.

	https://github.com/kjantzer/backbonejs-subviews

	@author Kevin Jantzer
	@since 2014-10-28
*/

_.extend(Backbone.View.prototype, {

	// stopListeningOnCleanup: false,
	// removeOnCleanup: false,
	
	// setup a list of views to be appended and rendered on this view
	/*
	views: {
		'view': Backbone.View,
		'sidebar': MySidebarView,
		'badge': {view: BadgeView, appendTo: '.title.badge' }
	},*/
	
	// optional setup logic for views
	//onViewSetup: function(vName, view){},
	
	empty: function(){
		this.el.innerHTML = ''
	},
	
	inDOM: function(){
		return document.body.contains(this.el)
	},

	// only calls `render` if this view is in the DOM
	reRender: function(){
		if( this.inDOM() ){
			this.render();
			return true;
		}else{
			return false;
		}
	},

	// default render method
    render: function(){
        if( this.template ){
            this.renderTemplate();
            this.delegateEvents();
        }
		
		this.renderViews()
		
        return this;
    },
	
	renderTemplate: function(data, template){
        var html;
		
		if( !data && this.model )
			data = this.model.toTemplateData ? this.model.toTemplateData() : this.model.toJSON()

        html = data ? _.template(template||this.template, data) : (template||this.template)

        this.$el.html(html);

        return this;
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
	
	// shorter alias
	sv: function(viewName, view){
		return this.subview(viewName, view)
	},

	// high level subview - used to open views and can support opening a view with require.js
	openSubview: function(viewName){
		this._getSubview(viewName, 'open');
	},
	
	// render this.views – will also init and append the view if needed
	renderViews: function(){

		if( this.views )
        _.each(this.views, (v, vName)=>{
            
			// get view info/options
			/*
			{
				view: Backbone.View,
				appendTo: 'css-query' // defaults to this.el
			}
			
			v could be a backbone.view with no options, so convert to object
			*/
			let vInfo = _.isFunction(v) && v.prototype.render ? {view:v}: v
			
			// no view given
			if( !vInfo.view )
				return console.warn('No view given for: ', vName)
			
            // if view has not be created, create it
            if( !this.sv(vName) ){
                
				this.sv(vName, (vInfo.view.prototype.render ? new vInfo.view({model:this.model}) : vInfo.view.call(this)));
				
				// let others hook into the setup
	            this.onViewSetup && this.onViewSetup(vName, this.sv(vName))
            }
			
			// add view to this parent element if needed
			if( !this.el.contains( this.sv(vName).el ) ){
			
				let $renderTo = this.$el
				
				// if view definition requested to append view somewhere specific
				if( vInfo.appendTo ){
					$renderTo = this.$(vInfo.appendTo)
					if( !$renderTo )
						return console.warn('Cannot append `'+vName+'` to ', vInfo.appendTo)
				}
				
				$renderTo.append( this.sv(vName).el );
			}
			
			// render the subview
			this.sv(vName).render()
        })
    },
	
	forEachView: function(fnAction){
        if( fnAction )
        _.each(this.views, function(v, vName){
            this.sv(vName) && fnAction(this.sv(vName))
        }.bind(this))
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

	_getSubview: function(viewName, method, args){

		var view = this.__subviews[viewName];

		// if view is a string, it is assumed that require.js is being used
		if( _.isString(view) )
			return this._requireSubview(viewName, view, method, args);

		else if( typeof view === 'function' )
			view = this.__subviews[viewName] = this._setupSubview(viewName, new view() );

		if( method && view[method] )
			view[method].apply(view, args||[]);

		return view;
	},

	_requireSubview: function(viewName, name, method, args){

		var self = this;

		// not sure I really need this promise here...but we'll leave for now
		return new Promise(function(resolve, reject) {
		
			require([name], function(view){

				if( view ){

					// initialize and setup view
					view = self.__subviews[viewName] = self._setupSubview(viewName, new view() );

					method && view[method] && view[method].apply(view, args||[])

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
		view.subviewSetup && view.subviewSetup();
		return view;
	},

	_removeSubview: function(view){
		if( view && view.viewName && this.hasOwnProperty('__subviews') && this.__subviews[view.viewName] )
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

		this.view && this.view != this.parentView && this.view.cleanup && this.view.cleanup();
		var pv = this.parentView;
		this.editor && this.editor.cleanup && this.editor.cleanup();	// model editor if it exists

		// all subviews
		_.each(this.__subviews, function(view){
			if( view.cleanup && view != pv) // test since view may not be initialized
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

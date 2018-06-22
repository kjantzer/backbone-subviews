/*
	Backbone Subviews 0.6.0

	Extends Backbone.View with support for nested subviews that can be reused and cleaned up when need be.

	https://github.com/kjantzer/backbonejs-subviews

	@author Kevin Jantzer
	@since 2014-10-28
*/

let BackboneSubviews = {

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
	
	parent: function(viewName, returnPromise=false){
	
		var vNames = viewName.split('.') // support dot notation
		var parentName = vNames.shift()
		var view = this
		
		while( view = view.parentView ){
			if( view.viewName == parentName )
				break;
			
			if( parentName == 'root' && !view.parentView )
				break;
		}
		
		// if any view names remaining from dot notation, attempt to traverse down subviews to find the last view
		if( vNames.length > 0 ){
			var lastSV
			vNames.forEach(svName=>{
				lastSV = svName;
				view = view && view.sv(svName)
			})
		}
		
		// return the found view (could be undefined) or a promise?
		return returnPromise !== true ? view : new Promise((resolve, reject)=>{
			view ? resolve(view) : reject(new Error('No subview named `'+lastSV+'`'))
		})
	},

/*
	Subview - adds or retrieves subview

	When adding a subview, you can choose to pass in a view instance
	or just the class to use when initialized view

		var myView = Backbone.View.extend();

		this.subview('my-view', new myView());	// initialized right away
		this.subview('my-view', myView);		// only inialized if not already
*/
	subview: function(viewName, view, opts){

		this.__subviews = this.__subviews || {};
			
		// new way allows for passing an uninitialized view – will only be initialized if not already
		if( view && view.prototype && !this.__subviews[viewName]){
			return this._setSubview(viewName, new view(opts))
		}
		else if( view && view.prototype ){
			return this._getSubview(viewName) 
		}
		
		// old way
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
	
	// default set model
	setModel: function(model){
		this._setModel(model)
		return this
	},
	
	_setModel: function(model){
		if( this.model )
			this.stopListening(this.model)
		this.model = model
		this.forEachView(v=>{
			let info = this.views && this.views[v.viewName]
			
			if( info && info.setModel )
				info.setModel.call(this, v, model)
			else
				v.setModel&&v.setModel(model)
		})
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
				
				if( vInfo.setModel )
					vInfo.setModel.call(this, this.sv(vName), this.model)
				
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
		
		if( typeof view === 'function' )
			view = this.__subviews[viewName] = this._setupSubview(viewName, new view() );

		if( method && view[method] )
			view[method].apply(view, args||[]);

		return view;
	},

	_setupSubview: function(viewName, view){
		view.viewName = viewName;
		view.parentView = this;
		view.subviewSetup && view.subviewSetup();
		if( view.gridArea )
			view.el.style.gridArea = view.gridArea
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
	
	renderTo($el){
		if( $el.cid ) $el = $el.$el; // if given a Backbone.View instance
		$el.append( this.render().el )
		return this
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

}

if( typeof Backbone != 'undefined' )
	Object.assign(Backbone.View.prototype, BackboneSubviews)
else if( typeof module != 'undefined' )
	module.exports = BackboneSubviews
	
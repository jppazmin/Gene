/**
 * Shows a cloud of tags in different sizes depending on the frequencies/weights.
 * Colors for each tag can be applied as well.
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="mailto:johncar@gmail.com">John Gomez</a>
 * 
 * @requires <a href="../biojs/css/biojs.TagCloud.css">TagCloud CSS</a>
 * @dependency <link href="../biojs/css/biojs.TagCloud.css" rel="stylesheet" type="text/css"></link>
 * 
 * @param {Object} options 
 *    An object with the options for TagCloud component.
 *    
 * @option {string} target 
 *    Identifier of the DIV tag where the component should be displayed.
 * 
 * @example
 *    // Lets do a list of synthetic values by using Random.
 *    var tagList = [];
 *    var colors = ["DarkBlue", "Chocolate", "FF0000", "#008500", "Silver", "#CD0074", "#FF7400"];
 *    var randomFreq, randomColor;
 *  
 *    // Generates 40 tags with random frequency between 1..50 and random color
 *    for (var i=0; i < 40; i++ ) {
 *       randomFreq = Math.floor( Math.random()*50 ) + 1;
 *       randomColor = colors[ Math.floor( Math.random()*7 ) ];
 *       tagList.push( { name: "tag" + i, freq: randomFreq, color: randomColor });
 *    }
 *    
 *    // Instantiation of the TagCloud by using the synthetic data
 *    var instance = new Biojs.TagCloud({
 *       target: "YourOwnDivId",
 *       tags: tagList
 *    });
 *    
 */
Biojs.TagCloud = Biojs.extend (
/** @lends Biojs.TagCloud# */
{
	constructor: function (options) {

	    if ( "string" == typeof this.opt.target  ) {
        	this._container = jQuery( '#' + this.opt.target );

        } else if ( this.opt.target instanceof jQuery ){
            this._container = this.opt.target;
            
        } else {
            this._container = jQuery(this.opt.target);
        }

		this._container.addClass("TagCloud");
		this._initialize( this._container );
		
		if ( this.opt.tags != undefined ) {
			this.setTags(this.opt.tags, this.opt.cbRenderValue );
		}
		
	},

	/**
	 * Default values for the options
	 * @name Biojs.TagCloud-opt
	 */
	opt: {
		target: "YourOwnDivId",
		title: undefined,
		tags: undefined,
		cbRenderValue: function ( tagName, tagValueNode ) {
			return "";
		} 
	},
  
	/**
	 * Array containing the supported event names
	 * @name Biojs.TagCloud-eventTypes
	 */
	eventTypes: [
	    /**
	     * @name Biojs.TagCloud#onTagClicked
	     * @event
	     * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
	     * @eventData {Object} source The component which did triggered the event.
	     * @eventData {string} type The name of the event.
	     * @eventData {string} tagName Name of the clicked tag.
	     * @example 
	     * instance.onTagClicked(
	     *    function( e ) {
	     *       alert("Tag clicked: " + e.tagName );
	     *    }
	     * ); 
	     * 
	     */
	    "onTagClicked",
	    
	    /**
	     * @name Biojs.TagCloud#onTagOver
	     * @event
	     * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
	     * @eventData {Object} source The component which did triggered the event.
	     * @eventData {string} type The name of the event.
	     * @eventData {string} tagName Name of the clicked tag.
	     * @example 
	     * instance.onTagOver(
	     *    function( e ) {
	     *       alert("Tag clicked: " + e.tagName );
	     *    }
	     * ); 
	     * 
	     */
	    "onTagOver"
	],
  
	_initialize: function ( container ) {
	  
		var opt = this.opt;
		
		if ( opt.title !== undefined ) {
			this._title = jQuery('<div>' + opt.title + '</div>').appendTo( container );
		}

		this._tags = jQuery('<ul class="tags"></ul>').appendTo( container );
	},
	
	/**
     * Description of the method
	 * 
	 * @param {object} tags As defined in the option called tags.
	 *
	 * @example 
	 * instance.setTags([
	 *    {  name: "tag1",
	 *       freq: 1
	 *    },
	 *    {  name: "tag2",
	 *       freq: 27,
	 *       color: "red"
	 *    },
	 *    {  name: "tag3",
	 *       freq: 10
	 *    }
	 * ]);
	 * 
	 * @example 
	 * var tagList = [];
	 * var colors = ["FF0000", "#008500", "Silver", "#CD0074", "#FF7400"];
	 * var randomFreq, randomColor;
	 *  
	 * // Generates 40 tags with random frequency between 1..50 and random color
	 * for (var i=0; i < 40; i++ ) {
	 *    randomFreq = Math.floor( Math.random()*50 ) + 1;
	 *    randomColor = colors[ Math.floor( Math.random()*5 ) ];
	 *    tagList.push( { name: "tag" + i, freq: randomFreq, color: randomColor });
	 * }
	 * 
	 * instance.setTags( tagList );
	 */
	setTags: function ( tags, cbRenderValue ) {
		
		var self = this;
		var tagsNode = this._tags;
		
		tagsNode.children().remove();

		jQuery.each( tags, function ( i, tag ) {		  
			self.addTag( tag, cbRenderValue );
		});
		
	},
	
	/**
     * Removes all the tags from the cloud.
	 * 
	 * @example 
	 * instance.removeAll();
	 */
	removeAll: function() {
		this._tags.children().remove();
	},
	
	/**
     * Add a single tag to the cloud.
	 * 
	 * @param {object} tags As defined in the option called tags.
	 *
	 * @example 
	 * instance.addTag( { name: "tag1", freq: 45, color: "#A52A2A" } );
	 */
	addTag: function ( tag, cbRenderValue ) {
		
		var self = this;
		var tagsNode = this._tags;
		var tagId = (tag.id) ? 'id="'+ tag.id +'"' : "";
		
		var oneTag = jQuery('<li class="tag" '+ tagId +' ></li>').appendTo( tagsNode );
		var tagName = jQuery('<span class="name">' + tag.name.toLowerCase() + '</span>').appendTo( oneTag );
		var tagValue = jQuery('<span class="value" style="display:none"></span>').appendTo( oneTag );
		
		if ( cbRenderValue === undefined || "function" != typeof cbRenderValue ) {
			cbRenderValue = function ( tagId, tagName, tagValueNode ) {
				return "";
			}
		}

		tagName.css({
			"fontSize": ( tag.freq / 10 < 1) ? tag.freq / 10 + 1 + "em": (tag.freq / 10 > 2) ? "2em" : tag.freq / 10 + "em",
			"cursor": 'pointer'

		}).click( function() {

			tagsNode.find('.value:visible').hide();
			tagValue.html( cbRenderValue.call( oneTag, tag.id, tag.name, tagValue ) );
			tagValue.show(1000); 

			tagsNode.find('.name.active').removeClass('active');
			tagName.addClass('active');
			
			self.raiseEvent( Biojs.TagCloud.EVT_ON_TAG_CLICKED, {
				tagName: tag.name
			});
			
		}).mouseover(function(){
		
			self.raiseEvent( Biojs.TagCloud.EVT_ON_TAG_OVER, {
				'tagName': tag.name,
				'tagId': tag.id,
				'tagValue': tagValue
			})
			
		}).append('<span style="vertical-align:super; font-size:10px;">' + tag.freq + '</super>');  
		
		if ( tag.color ) {
			tagName.css('color', tag.color);
		}
	}

},{
	
	// Events 
	EVT_ON_TAG_CLICKED: "onTagClicked",
	EVT_ON_TAG_OVER: "onTagOver"
	
});
/**
 * Shows a list of annotations as a cloud in different sizes and colors depending on the size of ...
 * 
 * @class
 * @extends Biojs.TagCloud
 * 
 * @author <a href="mailto:johncar@gmail.com">John Gomez</a>
 * 
 * @requires <a href="../biojs/css/biojs.AnnotationsCloud.css">AnnotationsCloud CSS</a>
 * @dependency <link href="../biojs/css/biojs.AnnotationsCloud.css" rel="stylesheet" type="text/css"></link>
 * 
 * @requires <a href='http://blog.jquery.com/2011/09/12/jquery-1-6-4-released/'>jQuery 1.6.4+</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery/jquery-1.6.4.js"></script>
 * 
 * @requires <a href='../biojs/Biojs.Tooltip.js'>Biojs.Annotations</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/Biojs.Annotations.js"></script>
 * 
 * @param {Object} options 
 *    An object with the options for TagCloud component.
 *    
 * @option {string} target 
 *    Identifier of the DIV tag where the component should be displayed.
 * 
 * @example
 *    var instance = new Biojs.AnnotationsCloud({
 *       target: "YourOwnDivId",
 *       proxyUrl: '../biojs/dependencies/proxy/proxy.php',
 *       groupBy: Biojs.Annotations.GROUP_BY_TERM
 *    });
 *    
 */
Biojs.AnnotationsCloud = Biojs.TagCloud.extend (
/** @lends Biojs.AnnotationsCloud# */
{
	constructor: function (options) {
        this.base();
		this._container.addClass('AnnotationsCloud');
		this._annotations = new Biojs.Annotations({
			sparqlUrl: this.opt.sparqlUrl,
			proxyUrl: this.opt.proxyUrl,
			groupBy: this.opt.groupBy,
			filterBy: this.opt.filterBy
		});
	},

	/**
	 * Default values for the options
	 * @name Biojs.AnnotationsCloud-opt
	 */
	opt: {
		target: "YourOwnDivId",
		sparqlUrl: 'http://biotea.idiginfo.org/sparql',
		//sparqlUrl: 'http://virtuoso.idiginfo.org/sparql',
		proxyUrl: 'biojs/dependencies/proxy/proxy.php',
		groupBy: Biojs.Annotations.GROUP_BY_TERM,
		filterBy: { field:"topic", value:"uniprot|GO|CHEBI|ICD9|UMLS|fma|MSH|PO|MDDB|NDDF|NDFRT|NCBITaxon" }
	},
  
	/**
	 * Array containing the supported event names
	 * @name Biojs.AnnotationsCloud-eventTypes
	 */
	eventTypes: [
	    /**
	     * @name Biojs.AnnotationsCloud#onTopicOver
	     * @event
	     * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
	     * @eventData {Object} source The component which did triggered the event.
	     * @eventData {string} type The name of the event.
	     * @eventData {string} tagName Name of the clicked tag.
	     * @example 
	     * instance.onTopicOver(
	     *    function( e ) {
	     *       alert("Topic : " + e.topicType + ", Identifier: " + e.topicId );
	     *    }
	     * ); 
	     * 
	     */
	    "onTopicOver",
	    "onTopicClicked",
	    "onAnnotationClicked",
	    "onAnnotationOver"
	],
  
	_initialize: function ( container ) {
	  
		var opt = this.opt;
		
		if ( opt.title !== undefined ) {
			this._title = jQuery('<div>' + opt.title + '</div>').appendTo( container );
		}

		this._tags = jQuery('<ul class="tags"></ul>').appendTo( container );
	},
	
	/**
     * Filters the current data. It does not a new request for data.
     * It just filters the already gotten data. 
	 * 
	 * @param {object} filter It must have both members frequency and topics. 
	 *    filter.frequency must be an integer which filters by the minimum frequency.
	 *    filter.topics must be an array containing the name of topics to avoid.
	 * 
	 * @returns {object} Filtered data.
	 * 
	 * @example 
	 * instance.applyFilter({ frequency: 7, topics: ['uniprot','chebi'] });
	 * 
	 */
	applyFilter: function ( filter ) {
		this._annotations.applyFilter(filter);
		this.repaint();
	},
	
	/**
     * Request the annotations for an URI resource and fills up the cloud with them.
	 * 
	 * @param {string} resourceURI Universal resource identifier 
	 *
	 * @example 
	 * instance.requestAnnotations("http://biotea.idiginfo.org/pubmedOpenAccess/rdf/PMC3018821");
	 * 
	 * @example 
	 * instance.requestAnnotations(["http://biotea.idiginfo.org/pubmedOpenAccess/rdf/PMC3018821","<http://biotea.idiginfo.org/pubmedOpenAccess/rdf/PMC3215666>"]);
	 * 
	 */
	requestAnnotations: function ( resourceURI, fnCallback ) {

		//TODO: show loading image
		var self = this;

	    this.removeAll();
        this._container.addClass('loading');
        
        this._annotations.requestAnnotations(resourceURI, function ( data ) {
			
			self.repaint();
			
		    if (fnCallback) {
		    	fnCallback.call();
		    }
			
		});

	},
	
	setAnnotations: function ( a ) {
		var self = this;

	    this.removeAll();
        this._container.addClass('loading');
        this._annotations = a;
        this.repaint();
	},
	
	cancelRequest: function () {
		this._annotations.cancelRequest();
	},
	
	repaint: function () {
		
		var self = this;

		this.removeAll();
		this._paintAnnotations();
		this._container.removeClass('loading');
		
		this.onTagOver( function(e) {
			var annotation = self._getAnnotation(e.tagId);
			// raising event 
			self.raiseEvent(Biojs.AnnotationsCloud.EVT_ON_ANNOTATION_OVER, {
				name: annotation.name,
				freq: annotation.freq,	
				comments: self._getComments(annotation)
			});
		}); 
	},

    _getAnnotation: function( key ) {
        return this._annotations.getItem(key);
    },

	_paintAnnotations: function () {

	    var self = this;
	    var i = this._annotations.iterator();
	    var a;

	    while ( i.hasNext() ) {

	    	a = i.next();
	    	
	    	Biojs.console.log("ADDING");
	    	Biojs.console.log( a );

            this.addTag({ id: a.id, name: a.name, freq: a.freq },
                // Function to be triggered whenever a tag is clicked
                function ( tagId, tagName, tagValueNode ) {

            		Biojs.console.log("Searching for tag " + tagId);
            	
                    var annot = self._getAnnotation(tagId);
                    
                    Biojs.console.log(annot);
                    
                    // raising event
                    self.raiseEvent(Biojs.AnnotationsCloud.EVT_ON_ANNOTATION_CLICKED, {
                        name: annot.name, 
                        freq: annot.freq,
                        comments: self._getComments(annot)
                    });

                    var topicList = jQuery('<span class="topics"></span>');
                    var e, anchor; 

                    var items = ( self.opt.groupBy == Biojs.Annotations.GROUP_BY_TERM) ? annot.topics : annot.terms;
                    
                    for ( key in items ) {

                        e = items[key].map;
                        anchor = jQuery('<a class="topic ' + key + '">' + key + '</a>')
                        
                        if ( !Biojs.Utils.isEmpty(e) ) {
                        	
                        	anchor.attr({
                                href: e.baseUrl,
                                target: '_blank',
                                topicType: e.shortName
                            })
                            .css('color',e.color)
                            
                        } else {
                        	
                        	anchor.attr({
                                topicType: key
                            })
                        }

                        anchor.appendTo(topicList);

                    }
                    
                    // Draw a tooltip containing the topics of the topicType selected
                    // Example: the identifiers of uniprot
                    var simpleTip = new Biojs.Tooltip({
                        targetSelector: topicList.children(),
                        cbRender: function( element ) {
                            return self._paintTopics( tagId, jQuery(element).attr('topicType') );
                        },
                        arrowType: Biojs.Tooltip.ARROW_TOP_MIDDLE
                    });

                    return topicList;
                }
            );
        }
	},
	
	_paintTopics: function ( tagId, topicType ) {

        var self = this;
        var annotation = self._getAnnotation(tagId);
        var pattern=/(#|_|:|\/)([A-Za-z0-9])*$/g;

        
        Biojs.console.log("tagID " + tagId + ", topicType " + topicType);
        
        // raising event
        self.raiseEvent(Biojs.AnnotationsCloud.EVT_ON_ANNOTATION_CLICKED, {
            name: annotation.name,
            freq: annotation.freq,
            comments: self._getComments(annotation)
        });

        var topicList = jQuery('<span class="topics"></span>');
        var topic, identifier;
        
        var topicsByType = ( this.opt.groupBy == Biojs.Annotations.GROUP_BY_TERM) ? annotation.topics[topicType] : annotation.terms[topicType];
        
        for ( i in topicsByType.entities ) {

        	//topic = topicsByType.map;
        	topic = ( this.opt.groupBy == Biojs.Annotations.GROUP_BY_TERM) ?  topicsByType.map : annotation.map;
        	
        	identifier = ( topicsByType.entities[i].match(pattern)[0] ).substr(1);

            jQuery('<a class="topic ' + topic.shortName + '">' + topic.prefix + identifier + '</a>')
                .attr({
                    href: topic.baseUrl + identifier,
                    target: '_blank',
                    topicType: topic.shortName,
                    topicId: identifier
                })
                .css('color',topic.color)
                .mouseover( function(e){
                    var target = jQuery(e.target);
                    self.raiseEvent(Biojs.AnnotationsCloud.EVT_ON_TOPIC_OVER, {
                        href: target.attr("href"),
                        topicType: target.attr("topicType"),
                        topicId: target.attr("topicId")
                    });
                })
                .click(function(e){

                    // Do not open the href
                    e.preventDefault();

                    var target = jQuery(e.target);
                    self.raiseEvent(Biojs.AnnotationsCloud.EVT_ON_TOPIC_CLICKED, {
                        href: target.attr("href"),
                        topicType: target.attr("topicType"),
                        topicId: target.attr("topicId")
                    });
                })
                .appendTo(topicList);

        }

        return topicList;
    },

    _getComments: function( annotation ) {
    	
    	var compareTo = 30;
    	var comments = [];
    	var comment;
    	var last="";
    	var t = annotation.name;
    	
    	for ( var i in annotation.comments ) {
    		
    		if ( ! ( annotation.comments[i][0].slice(0, compareTo) == last ) ) {
    			comment = annotation.comments[i][0].replace( new RegExp( t.toLowerCase(), 'gi' ), "<span class='highlight'>" + t + "</span>" );
    			comments.push( [ comment ] );
    		}
    		last = annotation.comments[i][0].slice(0, compareTo);
    	}
    	
    	return comments;
    	
    }

},{
	
	// Events 
	EVT_ON_TOPIC_OVER: "onTopicOver",
	EVT_ON_TOPIC_CLICKED: "onTopicClicked",
	EVT_ON_ANNOTATION_CLICKED: "onAnnotationClicked",
	EVT_ON_ANNOTATION_OVER: "onAnnotationOver"
	
});
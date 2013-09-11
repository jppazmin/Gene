/**
 * Shows a graph with customizable node content. It uses a force-based algorithm to spread the nodes on the screen, nicely.
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="mailto:johncar@gmail.com">John Gomez</a>
 * 
 * @requires <a href="../biojs/css/biojs.Graph.css">Graph CSS</a>
 * @dependency <link href="../biojs/css/biojs.Graph.css" rel="stylesheet" type="text/css"></link>
 * 
 * @requires <a href='http://www.jquery.com'>jQuery 1.8.0+</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery/jquery-1.8.1.js"></script>
 * 
 * @requires <a href='http://www.jquery.com'>jQuery UI 1.8.23+</a>
 * @dependency <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min.js"></script>
 * 
 * @requires <a href='http://www.jquery.com'>jsPlumb 1.3.14</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery.jsPlumb-1.3.14-all.js"></script>
 * 
 * @param {Object} options 
 *    An object with the options for Graph component.
 *    
 * @option {string} target 
 *    Identifier of the DIV tag where the component should be displayed.
 * 
 * @example
 *    var instance = new Biojs.Graph({
 *       target: "YourOwnDivId",
 *    });
 *    
 *    var e1 = instance.addNode('element1');
 *    var e2 = instance.addNode('element2');
 *    var e3 = instance.addNode('<div id="element3"><p>Node 3 created from an HTML string</p></div>');
 *
 *    e1.append("Node 1, appended by using the returned object");
 *    jQuery(e2).append("Node 3, using jQuery");
 *    
 *    instance.addLink(e1,'element2','Catalase');
 *	  instance.addLink('element1','element2','Insulin');
 * 	  instance.addLink('element1','element2','Progester');
 *	  instance.addLink('element1','element2','LL2');
 *	  instance.addLink('element2','element3','Catalase');
 *
 *
 *    
 */
Biojs.Graph = Biojs.extend(
/** @lends Biojs.Graph# */
{
	constructor: function(options) {
		
		this._container = jQuery('#'+this.opt.target);
		this._container.addClass('Graph');
		
		this._init();	
		
		// TODO: reset funciton
		
	},
	
	_init: function () {
		this._jsPlumb = jsPlumb.getInstance();
		this._nodeIdCounter = 0;
		
		var d = this._jsPlumb.Defaults;
		
		d.Anchor = this.opt.anchor;
		d.PaintStyle = this.opt.paintStyle;
		d.Endpoint = this.opt.endPoint;
		d.EndpointStyle =  this.opt.endPointStyle;
		d.Scope = this._container.attr('id');
		d.Connector = this.opt.connector;
		d.HoverPaintStyle = this.opt.hoverPaintStyle;
		
		if ( this.opt.viewport == undefined ) {
			this.opt.viewport = { 
				xMin: this._container.offset().left, 
				xMax: this._container.offset().left + ( this._container.width() > 0 ? this._container.width() : jQuery(window).width() ), 
				yMin: this._container.offset().top, 
				yMax: this._container.offset().top + ( this._container.height() > 0 ? this._container.height() : jQuery(window).height() )
			};
		}

    	this.opt.attractionConstant = this.opt.influenceConstant/(this.opt.normalDistance*this.opt.normalDistance*this.opt.normalDistance);

	},
	
	/**
	 * Default values for the options
	 * @name Biojs.Graph-opt
	 */
	opt: {
		target: "YourOwnDivId",
		
		// Graph settings:
		anchor: "Continuous",
		paintStyle: { lineWidth : 2, strokeStyle : "#456" },
		endPoint: "Dot",
		endPointStyle: { fillStyle:"myEndpoint", radius:2 },
		connector: [ "Bezier", { curviness:50 } ],
		hoverPaintStyle: {strokeStyle:"#ec9f2e" },
		
		// Force-based algorithm options:
	    // normal distance in pixels
	    normalDistance: 100,
	    // adjusts the size of the influence square by this factor
	    influenceConstant: 7,
	    // 4 percent damping (simulated friction)
	    damping: 0.96,
	    // stopping velocity is one tenth of a pixel per second
	    stoppingVelocity: 0.1,
	    // minimum starting velocity is a whole pixel
	    minimumStartingVelocity: 1,
	    // maximum starting velocity is higher (to remove "twitching" when few nodes are moving)
	    maximumStartingVelocity: 5,
	    // calculated as influenceConstant/normalDistance^3, assuming that the repelling factor is -1
	    attractionConstant: 7/(100*100*100),
	    // Repelling factor to calculate the repeling force
	    repellingFactor: 70,
	    // frames per second
	    fps: 100,
	    // animation enable/disable flag
	    animate: true,
	    // visible square in the screen where the nodes will move into
	    viewport: undefined
	},
  
	/**
	 * Array containing the supported event names
	 * @name Biojs.Graph-eventTypes
	 */
	eventTypes: [
	    /**
	     * @name Biojs.Graph#onClick
	     * @event
	     * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
	     * @eventData {Object} source The component which did triggered the event.
	     * @example 
	     * instance.onLabelClicked(
	     *    function( e ) {
	     *       alert("Label "+ e.label.getLabel() + " clicked");
	     *    }
	     * ); 
	     * 
	     */
	    "onLabelClicked",
	    "onLinkOver"
	],
	
	
	/**
     * Creates a new link into graph. Source and target nodes must exist.
	 * 
	 * @param {string|object} source 
	 *	Starting point of the new link. If a string is provided, an identifier is expected; HTMLNode in other case.  
	 *
	 * @param {string|object} target 
	 *	Target of the new link. If a string is provided, an identifier is expected; HTMLNode in other case.  
	 *
	 * @param {string} label 
	 *  Label to be shown on mouseover event
	 * 
	 * @param {string} [id] 
	 *  Optional identifier for the new link
	 *
	 * @returns {object} Reference to the link created. 	
	 *
	 * @example  
	 * // Creates a link with label Catalase and id linkCatalase
	 * instance.addLink('element1','element2','Catalase','linkCatalase');
	 * 
	 * @example
	 * instance.addLink('element5','element6','Testing');
	 * 
	 */
	addLink: function(source, target, label, id) {
		
		var idSource = source;
		var idTarget = target;
		var link;
		var settings;
		var self = this;

		// Creates the new connection

		if ( "number" == typeof source ) {
			idSource = (source).toString();
			
		} else if ( "object" == typeof source ) { 
			idSource = jQuery(source).attr('id');
		}
		
		if ( "number" == typeof target ) {
			idTarget = (target).toString();
			
		} else if ( "object" == typeof target ) {
			idTarget = jQuery(target).attr('id');
		}

		settings = {
			source:idSource, 
			target:idTarget,
		};
		
		if ( id != undefined ) {
			settings.id = id;
		}
		
		// Label
		settings.overlays = [ 
			[ "Label", {													   					
	   			cssClass:"label",
	   			label : label, 
	   			id:"label",
	   			events:{
					"click":function(label, evt) {
						self.raiseEvent(Biojs.Graph.EVT_ON_LABEL_CLICKED, {
							'label': label
						});
	   				}
	   			}
			  }
			]
		];
		
				
		try {
			link = this._jsPlumb.connect(settings);
			
			var overlay = link.getOverlay("label").hide();
			
			// Add behavior for the connection 
			link.bind("mouseenter", function(conn) {
					var overlay = conn.getOverlay("label");
					// now you can show this Overlay:
					overlay.show();
					// trigger the event on connection over 
					self.raiseEvent(Biojs.Graph.EVT_ON_LINK_OVER, {
						'link': link,
						'label': conn.getOverlay("label"),
						'source': idSource,
						'target': idTarget
					});
					
				}).bind("mouseexit", function(conn) {
					var overlay = conn.getOverlay("label");
					// now you can hide this Overlay:
					overlay.hide();
				});
			
		} catch (e) {
			Biojs.console.log(e);
		}
		
		var nodeSource = this._nodes[idSource];
		var nodeTarget = this._nodes[idTarget];
		
		nodeSource.links[idTarget] = nodeTarget;
		nodeTarget.links[idSource] = nodeSource;
		
		nodeSource.linksLength++;
		nodeTarget.linksLength++;
		
		nodeSource.moving = true;
		nodeTarget.moving = true;
		
		this.start();
		
		return link;

	},
	
	/**
     * Removes a link from the graph.
	 * 
	 * @param {string|object} link 
	 *	Can be either an identifier as string or the link object itself returned by the method addLink.  
	 *
	 * @returns {boolean} True on successful deletion, false in other case. 
	 * 		
	 * @example  
	 * // Removes the link with linkCatalase as identifier.
	 * instance.removeLink('linkCatalase');
	 * 
	 */
	removeLink: function(link) {

		var cnn = link;
		// If an identifier is provided
		// it will search for the connection object
		if ( "string" == typeof link ){
			
			var i;
			var conns = this._jsPlumb.getConnections();
			
			for ( var i=0; i < conns.length && ( link != conns[i].getId() ) ; i++ ) {
				; // breaks on link found
			}
			
			cnn = ( i < conns.length )? conns[i] : {};
		} 
		
		if ( cnn.hasOwnProperty("removeOverlays") ) {
			
			//Remove references from involved nodes 
			delete this._nodes[cnn.sourceId].links[cnn.targetId];
			delete this._nodes[cnn.targetId].links[cnn.sourceId];
			// Remove the labels
			cnn.removeOverlays();
			// remove all endpoints
			for ( var e in cnn.endpoints ) {
				this._jsPlumb.deleteEndpoint(cnn.endpoints[e]);
			}
			
			this.start();
			
			return true;
		}
		
		return false;
	},
	/**
     * Removes all the links from a node.
	 * 
	 * @param {string|object} node 
	 *	Can be either and identifier as string or the node object itself, which is returned by the addNode method.	
	 * 
	 * @example
	 * instance.removeLinksFromNode("element1");
	 * 
	 */
	removeLinksFromNode: function(node) {
		Biojs.console.log("Removing links from node " + node );
		// node can be either an identifier or the node object itself
		var id = ( "string" == typeof node )? node : node.id;
		// get all the connection objects of the node
		var conns = ( this._jsPlumb.getConnections({source:id}) ).concat( this._jsPlumb.getConnections({target:id}) );
		// remove every single connection
		for ( var c in conns ) {
			this.removeLink(conns[c]);
		}
		
		this._jsPlumb.removeAllEndpoints(node);
	},
	/**
     * Creates a new node into graph.
	 * 
	 * @param {string|object} data 
	 *	Data could be either an identifier or an HTML element. 
	 *	If it's an identifier, a DIV element with that identifier will be created as node. 
	 *	In case of HTML element, can be either a string containing the HTML code or an instance of HTMLElement. 
	 *
	 * @returns {object} The node instance created/added to the graph.	
	 *
	 * @example  
	 * // Creates a node with 'element1' as id
	 * instance.addNode('element4');
	 * 
	 * @example 
	 * // Creates a node with 'element1' as id and then it is assigned to var 'node' 
	 * var node = instance.addNode('element5');
	 * 
	 * @example 
	 * // Creates a node since the HTML string provided
	 * instance.addNode('<div id="element6"></div>');
	 * 
	 */
	addNode: function ( data ) {
		
		var node = jQuery('<div></div>');
		var self = this;
		
		if ( "string" == typeof data ) {
			
			if ( data.match(/<\/?.*(?=>|\s.*>)\/?.*?>/g) ) {
				node = jQuery( data );
				
			} else {
				node.attr('id', (!Biojs.Utils.isEmpty(data))? data : "node" + this._nodeIdCounter++ );
			}

		} else if ( "number" == typeof data ) {
			node.attr('id', (data).toString() );

		} else {
			// Object is expected 
			node = jQuery( data );
		}
		
		// Setting id for the node
		node.id = node.attr('id');
		if ( Biojs.Utils.isEmpty(node.id) ) {
			node.id = "node" + this._nodeIdCounter++;
			node.attr('id',node.id);
		}
		
		// TODO: improve positioning by Force-based algorithm
		// Randomly positioned at beginning
		node.x = this.opt.viewport.xMin + Math.floor( Math.random() * this.opt.viewport.xMax/3 );
		node.y = this.opt.viewport.yMin + Math.floor( Math.random() * this.opt.viewport.yMax/3 );
		
		//Initilizing values for Force-based algorithm
		node.velocity={x:0,y:0}; node.mass=1;
		node.fixed = false;
		node.moving = true;
		node.links = {};
		node.linksLength = 0;
		
		this._nodes[node.id] = node;
		//this._links[node.id] = [];

		node.css({
				position:"absolute",
				top: node.x,
				left: node.y 
			})
			.addClass('node')
			.appendTo(this._container);

		this._jsPlumb.draggable(node.id);
		
		// Node close button
		var closeButton = jQuery('<span class="close-btn-18" title="Close">Close</span>')
			.click(function(){
				self.removeNode(node);
			})
			.hide()
			.prependTo(node);
		
		//Update position in dragging 	
		node.mousedown(function() {
	        jQuery(window).mousemove(function() {
	        	node.x = node.offset().left;
	        	node.y = node.offset().top;
	        	
	        	// Release other nodes
	        	self._setPivotNode(node);
	        	
	        	for (var i in node.links) {
	        		node.links[i].moving = true;
	        	}
	        	
	        	self.start();
	        });
	    })
	    .mouseup(function() {
	        jQuery(window).unbind("mousemove");
	        self._releasePivotNode(node);
	    })
	    .mouseover(function() {
	    	closeButton.show();
	    })
	    .mouseout(function() {
	    	closeButton.hide();
	    });
		
		this.start();

		return node;
	},
	/**
     * Returns the node which holds a specified id
	 * 
	 * @param {string} node 
	 *	Identifier of the node.	
	 * 
	 * @example 
	 * instance.getNode("element1");
	 * 
	 */
	getNode: function ( id ) {
		return ( "string" == typeof id )? this._nodes[id] : {};
	},
	/**
     * Returns all nodes in the graph	
	 * 
	 * @example 
	 * instance.getAllNodes();
	 * 
	 */
	getAllNodes: function () {
		return this._nodes;
	},
	
	/**
     * Removes a node from the graph.
	 * 
	 * @param {string|object} node 
	 *	Can be either and identifier as string or the node object itself, which is returned by the addNode method.	
	 * 
	 * @example 
	 * instance.removeNode("element1");
	 * 
	 */
	removeNode: function (node) {
		// node can be either an identifier or the node object itself
		var nodeObj = ( "string" == typeof node )? this._nodes[node] : node;
		// Mark the current linked nodes as moving for animation
		for (var i in nodeObj.links) {
			nodeObj.links[i].moving = true;
    	}
		// Removes all connections from the node drawing
		this.removeLinksFromNode(nodeObj); 
		// Removes the reference to the node object
		delete this._nodes[nodeObj.id];
		// Removes the node object
		nodeObj.remove();
		// start animation 
		this.start();
	},
	
	/**
     * Removes all the nodes in the graph	
	 * 
	 * @example 
	 * instance.removeAllNodes();
	 * 
	 */
	removeAllNodes: function () {
		for ( var i in this._nodes ) {
			this.removeNode(this._nodes[i]);
		}
	},
	
	/**
     * Removes all the links in the graph	
	 * 
	 * @example 
	 * instance.removeAllLinks();
	 * 
	 */
	removeAllLinks: function () {
		Biojs.console.log("Removing all the links");
		for ( var nodeID in this._nodes ) {
			this.removeLinksFromNode( nodeID );
		}
	},
	
	
	/**
     * Starts the nodes positioning animation by using a force-based algorithm. 
     * Stops automatically when the system reaches the equilibrium, i.e. all nodes are stopped.
     * 
	 * @example 
	 * instance.start();
	 * 
	 */
	start: function() {
    	var self = this;
        if(!this._running && this.opt.animate) {
            this._running = true;
            this._drawId = setInterval(function() { self._forceBasedAlgorithm(self.opt); }, 1000 / this.opt.fps);
        }
    },
    /**
     * Stops the nodes positioning animation. 
     * 
	 * @example 
	 * instance.stop();
	 * 
	 */
    stop: function() {
        if(this._running) {
            clearInterval(this._drawId);
            this._running = false;
        }
    },
    /**
     * Disables/enables node positioning animation. 
     * 
	 * @example 
	 * instance.animate(true);
	 * 
	 * @example 
	 * instance.animate(false);
	 * 
	 */
    animate: function(value) {
    	this.stop();
    	this.opt.animate = value;
    	this.start();
    },
    
    /**
     * Set the distance in pixels between nodes. 
     * 
     * @param {int} value 
     * 	Minimum separation distance, in pixels, allowed between each two nodes. 
     *  Use this setting to either disperse or compact the whole graph. 
     * 
	 * @example 
	 * instance.setDistance(200);
	 * 
	 */
    setDistance: function ( distance ){
    	this.stop();
    	this.opt.normalDistance = distance;
    	this.opt.attractionConstant = this.opt.influenceConstant/(distance*distance*distance);
    	this._moveEveryThing();
    }, 
    /**
     * Sets the simulated damping value. 
     * 
     * @param {int} value
     *  Values from 0 to 100 to set the damping factor.
     *  Where, 0 means no damping and 100 means maximum damping, i.e. nodes cannot move.
     *  A value of 4 is acceptable.
     * 
	 * @example 
	 * instance.setDamping(4);
	 * 
	 */
    setDamping: function( value ) {
    	this.opt.damping = (100-value)/100;
    	this._moveEveryThing();
    },
    /**
     * Sets the repelling factor to calculate the repelling force. 
     * 
     * @param {int} value
     *  Repelling factor as a positive number.
     *  By default, value is 5
     * 
	 * @example 
	 * instance.setRepellingFactor(7);
	 * 
	 */
    setRepellingFactor: function ( factor ) {
    	this.opt.repellingFactor = factor; 	
    	this._moveEveryThing();
    },
    
    /**
     * Sets the velocity of the animation in frames per second.
     * 
     * @param {int} fps
     *  Velocity of the animation in frames per second.
     *  This value is used to invoke the force-based algorithm fps times each second. 
     *  Take in account that more velocity means more usage of CPU.
     *  A value of 100 is a normal velocity.
     * 
	 * @example 
	 * instance.setVelocity(100);
	 * 
	 */
    setVelocity: function( fps ) {
    	this.stop();
    	this.opt.fps = fps;
    	this._moveEveryThing();
    },
    /**
     * Sets the attraction constant to calculate the attraction force by Hooke's Law for strings.
     * 
     * @param {float} value
     *  Constant value to calculate the attraction force between nodes.
     *  By default, it's setted to 1/(normaldistance^3). 
     * 
	 * @example 
	 * instance.setAttractionConstant(0.00001);
	 * 
	 */
    setAttractionConstant: function( value ) {
    	this.opt.attractionConstant = value;
    	this._moveEveryThing();
    },
    /**
     * Sets the boundary of the graph. 
     * All the nodes will fall and move within this area
     * 
     * @param {object} window
     *  Boundary as object having the members: xMin, yMin, xMax, yMax.
     * 
	 * @example 
	 * instance.setViewPort({ xMin: 100, yMin: 100, xMax:400, yMax:500 });
	 * 
	 */
    setViewPort: function ( window ) {
    	if ( window != undefined ) {
			this.opt.viewport.xMin = window.xMin ? window.xMin : this.opt.viewport.xMin;
			this.opt.viewport.xMax = window.xMax ? window.xMax : this.opt.viewport.xMax;
			this.opt.viewport.yMin = window.yMin ? window.yMin : this.opt.viewport.yMin;
			this.opt.viewport.yMax = window.yMax ? window.yMax : this.opt.viewport.yMax;
		} 
    },

    /* Private members */
    
    _nodes: {},
	// Whenever a node is dragged, it must have a fixed-position 
	// to avoid all the nodes move together 
	_pivotNode: undefined,
	// when the layout has reached equilibrium
    _equilibrium: false,
	// animation running flag
    running: false,
    
    _moveEveryThing: function () {
    	this.stop();
    	for(var j in this._nodes) {
    		this._nodes[j].moving = true;
    	}
    	this.start();
    },
    
	_setPivotNode: function( node ) {

		if ( this._pivotNode == undefined ) {
			this._pivotNode = node;
			
		} else if ( node != this._pivotNode ) {
			// Release current pivot if there is any
			this._releasePivotNode( this._pivotNode, 0 );
			// Mark it as pivot
			this._pivotNode = node;
			
		} else {
			// Node is the current pivot already
			// just do cancel the timer if there is any
			this._cancelPivotTimer(node);
		}
		
		// Don't move this node
		node.fixed = true;
	},
	
	_releasePivotNode: function( node, time ) {
		// time waiting to be released
		var ms = (time != undefined) ? time : 1000;
		// wait?
		if ( ms > 0 ) {
			// On releasing the node, keep fixed until equilibrium
	        // Otherwise, all nodes could move together for long time
			this._setPivotTimer(node, ms);
			
		} else {
			// release it now! 
			this._cancelPivotTimer(node);
		}
		
	},
	
	_setPivotTimer: function(node, ms) {
		var self = this;
		this._cancelPivotTimer(node);
		node.fixed = true;
		node.waitingReleaseId = setInterval(function() { 
        	if (self._equilibrium) {
        		self._cancelPivotTimer(node);
        	}
        }, ms );
	},
	
	_cancelPivotTimer: function ( node ) {
		node.fixed = false;
		if ( node.waitingReleaseId > 0 ) {
    		clearInterval(node.waitingReleaseId);
    		node.waitingReleaseId = 0;
		}
	},
    
    // Moves every node until whole system is under equilibrium
    _forceBasedAlgorithm: function(o) {
        
    	// assume equilibrium - set to false below if a node moves
        this._equilibrium = true;

        var repellingForce, attractingForce, node, otherNode, square, direction;
        var numberOfNodes = this._nodes.length;
        var numberOfStoppedNodes = 0;
        var startingVelocityDelta = o.maximumStartingVelocity - o.minimumStartingVelocity;

        for(var i in this._nodes) {
        	
        	node = this._nodes[i];
        	
            square = this._createSquare(node, o.influenceConstant * o.normalDistance);
            
            for(var j in this._nodes) {
            
            	otherNode = this._nodes[j];
            	
                // not the same node
                if(i != j) {
                    // for nodes within range, add the repelling velocity
                    if(this._withinSquare(otherNode, square)) {
                    	repellingForce = this._repelling(node, otherNode);
                    	node.velocity.x += repellingForce.x;
                        node.velocity.y += repellingForce.y;
                    }
                }
                // the first iteration we count the number of stopped nodes
                if(j == 0 && (!otherNode.moving || otherNode.fixed )) {
                    numberOfStoppedNodes++;
                }
            }

            // for all links, add the attracting velocity
            for( var k in node.links ) {
                //if(link.visible) {
	            	attractingForce = this._attracting(node, node.links[k]);
	            	node.velocity.x += attractingForce.x/node.linksLength;
	                node.velocity.y += attractingForce.y/node.linksLength;
                //}
            }
            
            // apply damping
            node.velocity.x *= o.damping;
            node.velocity.y *= o.damping;
            node.velocityLength = this._absolute(node.velocity.x) + this._absolute(node.velocity.y);
            
            // check to see if the node has stopped moving
            if(node.velocityLength <= o.stoppingVelocity){
            	node.moving = false;
            }
                
            // the more nodes that have stopped, the larger the starting velocity must be
            if( node.velocityLength >= o.minimumStartingVelocity + startingVelocityDelta * numberOfStoppedNodes / numberOfNodes ) {
            	node.moving = true;
            }
                
            // Check the node is inside viewport
            // otherwise change velocity's direction
            this._setNodeDirection(node, this.opt.viewport);
            
            // if the node is moving and not fixed then calculate the new position
            if(node.moving && !node.fixed ) {
                this._equilibrium = false;
                node.x += node.velocity.x;
                node.y += node.velocity.y;
            }

            node.offset({ left: node.x, top: node.y });
            this._jsPlumb.repaint(node.id);
            
        }
        
        //this._jsPlumb.repaintEverything();
        
        if (this._equilibrium) {
        	this.stop();
        }
        
        return this._equilibrium;
        
    },
	
	// create the square of influence
    _createSquare: function(node, offset) {
        return {
            xMin: node.x - offset,
            xMax: node.x + offset + node.width(),
            yMin: node.y - offset,
            yMax: node.y + offset + node.height()
        };
    },
    
    // is the node inside of the square of influence?
    _withinSquare: function(otherNode, square) {
        return  otherNode.x >= square.xMin &&
                otherNode.x <= square.xMax &&
                otherNode.y >= square.yMin &&
                otherNode.y <= square.yMax;
    },
    
    _setNodeDirection: function(node, square) {
    	
    	if ( ( (node.x <= square.xMin) && (node.velocity.x < 0) ) ||
    	     ( ( ( node.x + node.width() ) >= square.xMax) && (node.velocity.x > 0) ) ) {
    		node.velocity.x *= -1;

    	} 
    	
    	if ( ( (node.y <= square.yMin) && (node.velocity.y < 0) ) ||
    	     ( ( ( node.y + node.height() ) >= square.yMax) && (node.velocity.y > 0) ) ) {
    		node.velocity.y *= -1;
    		
    	}

    },
    
    _absolute: function(value) {
        return value < 0 ? -value : value;
    },

    _square: function(value) {
        return value * value;
    },
    
    _manhattanDistance: function(node, otherNode) {
        var d = this._absolute(otherNode.x - node.x) + this._absolute(otherNode.y - node.y);
        if(d > 0) return d;
        // move one node a pixel to the right if both nodes overlap
        node.x +=1;
        return 1;
    },
    
    _repelling: function(node, otherNode) {
    	var repelling = this.opt.repellingFactor / this._square(this._manhattanDistance(node, otherNode));
        return { x: repelling * (node.x - otherNode.x), 
        	     y: repelling * (node.y - otherNode.y) };
    },
    
    _attracting: function (node, otherNode) {
    	var attraction = this.opt.attractionConstant * this._manhattanDistance(node, otherNode);
    	return { x: (otherNode.x - node.x) * attraction, 
    			 y: (otherNode.y - node.y) * attraction };        
    }
    
    // TODO: define static values for events and other constants 
},{
	EVT_ON_LABEL_CLICKED: "onLabelClicked",
	EVT_ON_LINK_OVER: "onLinkOver"
	
});

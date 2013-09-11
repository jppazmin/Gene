/** 
 * Shows a set of RDF papers in a graph.
 * 
 * @class
 * @extends Biojs.Graph
 * 
 * @author <a href="mailto:johncar@gmail.com">John Gomez</a>
 * @version 1.0.0
 * 
 * @requires <a href="../biojs/css/biojs.Tooltip.css">Tooltip CSS</a>
 * @dependency <link href="../biojs/css/biojs.Tooltip.css" rel="stylesheet" type="text/css"></link>
 * 
 * @requires <a href='../biojs/Biojs.Tooltip.js'>Biojs.Tooltip</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/Biojs.Tooltip.js"></script>
 * 
 * @requires <a href='../biojs/Biojs.Tooltip.js'>Biojs.Annotations</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/Biojs.Annotations.js"></script>
 * 
 * @requires <a href='../biojs/Biojs.TagCloud.js'>Biojs.TagCloud</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/Biojs.TagCloud.js"></script>
 * 
 * @requires <a href='../biojs/Biojs.AnnotationsCloud.js'>Biojs.AnnotationsCloud</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/Biojs.AnnotationsCloud.js"></script>
 * 
 * @requires <a href="../biojs/css/biojs.AnnotationsCloud.css">AnnotationsCloud CSS</a>
 * @dependency <link href="../biojs/css/biojs.AnnotationsCloud.css" rel="stylesheet" type="text/css"></link>
 * 
 * @param {Object} options An object with the options for ResultsGraph component.
 *    
 * @option {string} target 
 *    Identifier of the DIV tag where the component should be displayed.
 *    
 *     
 * @example 
 * var instance = new Biojs.ResultsGraph({
 * 		target : "YourOwnDivId"
 * });	
 * 
 */
Biojs.ResultsGraph = Biojs.Graph.extend (
/** @lends Biojs.ResultsGraph# */
{
  constructor: function (options) {
	  this.base();
	  
	  var self = this;
	  this.onLinkOver(function (e) {
		  self._buildTooltip( e.label.canvas, e.source, e.target );
	  });
  },

  /**
   *  Default values for the options
   *  @name Biojs.ResultsGraph-opt
   */
  opt: {
     target: "YourOwnDivId",
	 sparqlUrl: 'http://biotea.idiginfo.org/sparql',
	//sparqlUrl: 'http://virtuoso.idiginfo.org/sparql',
	 proxyUrl: '../biojs/dependencies/proxy/proxy.php',
	 // minimum value to create a link between papers
	 minSharedEntities: 14, // to make links 
	 groupBy: Biojs.Annotations.GROUP_BY_TERM,
	 filterBy: { frequency: 7, topics: [] }
  },
  
  /**
   * Array containing the supported event names
   * @name Biojs.ResultsGraph-eventTypes
   */
  eventTypes : [
	/**
	 * @name Biojs.ResultsGraph#onClick
	 * @event
	 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
	 * @eventData {Object} source The component which did triggered the event.
	 * @eventData {string} type The name of the event.
	 * @eventData {int} selected Selected character.
	 * @example 
	 * instance.onClick(
	 *    function( objEvent ) {
	 *       alert("The character " + objEvent.selected + " was clicked.");
	 *    }
	 * ); 
	 * 
	 * */
	 "onClick",
	 "onQueryRequest",
	 "onDataArrived"
	 
  ], 
  
  
  
  applyFilter: function( f ) {
	  if ( this.opt.filterBy != f ) {
		  Biojs.console.log("Applying filter freq: " + f.frequency + " topics: " + f.topics );
		  this.opt.filterBy = f;
		  this._repaint();
	  }
  },
  
  
  // Holds the relations between papers by through the terms
  
  // Total of the terms in the graph
  _annotationsByNode: {},

  
  addLink: function ( source, target, label, id ) {
	  
	  var link = this.base( source, target, label, id );
//	  
//	  this._buildTooltip( link.getOverlay("label").canvas, source, target );
//	  
//	  Biojs.console.log("added link");
//	  Biojs.console.log(link);
  
	  return link;
  },
  
  /**
   * Change grouping of links by term or topic 
   * 
   * @param {string} g Grouping field
   * 
   * @example 
   * instance.groupBy( Biojs.Annotations.GROUP_BY_TERM );
   * 
   * @example 
   * instance.groupBy( Biojs.Annotations.GROUP_BY_TOPIC );   
   *  
   */
  groupBy: function ( g ) {
	  
	  if ( this.opt.groupBy != g ) {
		  this.opt.groupBy = g;
		  this._repaint();
	  }
	  
  },
  
  /**
   * Do a query to SPARQL server by using the provided query.
   * 
   * @param {string} query The query
   * 
   * @example 
   * instance.setQuery("catalase");
   * 
   * @example
   * instance.setQuery("WrongQuery");
   * 
   */
   setQuery: function ( userQuery ) {

		var self = this;
		
		// TODO: show a loading image 
		this._showLoading();
		
		this.removeAllNodes();
		this._removeData();
		
		this._requestUniprotAccession ( userQuery, function( accession ) {

          if ( !Biojs.Utils.isEmpty ( accession ) && accession.match(/^[A-z]([0-9])*$/g) ) {

              //this.raiseEvent( 'onQueryRequest', { 'accession': accession, 'query': userQuery });

              var strQuery =
            	'SELECT ?article ?title ?seeAlso ?sameAs ?date ?abstract ?journalTitle ?volume ?issue ?start ?end fn:concat(?authorLastName, ", ", ?authorFirstName) AS ?author ' +
              	'WHERE {'+
              	   '?article a bibo:AcademicArticle ; '+
              	   'dcterms:source ?pmc ; '+
              	   'dcterms:title ?title ; '+
              	   'dcterms:publisher ?publisher ; '+
              	   'bibo:volume ?volume ; '+
              	   'bibo:pageStart ?start ; '+
              	   'bibo:pageEnd ?end ; '+
              	   'bibo:authorList ?authorList ; '+
              	   'bibo:abstract ?abstract . '+
              	   '?pmc owl:sameAs ?sameAs . '+
              	   'OPTIONAL {?pmc rdfs:seeAlso ?seeAlso} . '+
              	   'OPTIONAL {?article dcterms:issued ?date } . '+
              	   '?authorList rdfs:member ?member . '+
              	   '?member foaf:givenName ?authorFirstName ; '+
              	   'foaf:familyName ?authorLastName. '+
              	   '?article dcterms:hasPart ?issueJournal . '+
              	   '?issueJournal a bibo:Issue ; '+
              	   'dcterms:hasPart ?journal . '+
              	   'OPTIONAL {?issueJournal bibo:issue ?issue } . '+
              	   '?journal a bibo:Journal ; '+
              	   'dcterms:title ?journalTitle . '+
              	   '?annot a aot:ExactQualifier ; '+
              	   'pav:createdBy <http://www.ebi.ac.uk/webservices/whatizit#whatizitUkPmcAll> ; '+
              	   'ao:annotatesResource ?article ; '+
              	   'ao:hasTopic <http://purl.uniprot.org/core/' + accession + '> . '+
              	'} LIMIT 100';

              Biojs.console.log("Applying SPARQL query: " + strQuery);

              self._doQuery(strQuery);

          } else {

              // NO ACCESSION 
          }

		});
		
	},
	
	_buildTooltip: function ( labelElement, sourceID, targetID ) {

		var self = this;
		var labelText = jQuery(labelElement).text();
		var divID = labelText + sourceID + targetID;
		
		if ( this._currentCloud != divID ) {
			if (this._tooltip != undefined) this._tooltip.remove();
			delete this._tooltip;
			
			this._tooltip = new Biojs.Tooltip({
			      targetSelector: labelElement,
			      cbRender: function( element, contentDiv ) {

			    	  if ( contentDiv.attr('id') != divID ) {
				    	  
			    		  contentDiv.attr( 'id', divID );
			    		  
			    		  // cancel other requests 
			    		  if ( this._annotations != undefined ) {
			    		     this._annotations.cancelRequest();
			    			 delete this._annotations;
			    		  }
			    		  
					      // here, this refers to the tooltip object
					      this._annotations = new Biojs.AnnotationsCloud({
					         target: contentDiv,
							 proxyUrl: self.opt.proxyUrl,
							 groupBy: self.opt.groupBy,
						     filterBy: { field: self.opt.groupBy, value: labelText }
						  });

					      var a = self._annotationsByNode[sourceID].join( self._annotationsByNode[targetID] );
					      a.applyFilter( self.opt.filterBy );
					      a.getDataBy( self.opt.groupBy, labelText );
					      
					      this._annotations.setAnnotations( a );
			    	  } 
			    	  
			      },
			      position: Biojs.Tooltip.ELEMENT_POSITION,
			      arrowType: Biojs.Tooltip.ARROW_LEFT_MIDDLE
			});
		}

		this._currentCloud = divID;

	},
	
	
	_showLoading: function() {
		// TODO: show loading image
	},
  
	_doQuery: function( query ) {

		var params = { query: query, format: 'application/json' };
		
		this._showLoading();
		this._fetchData( this.opt.sparqlUrl, params, function(data) {
			
			var columns = Biojs.ResultsGraph.COLUMNS;
			var decodedData, results, obj, articles;
			var jsonData = { iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] };
				
			try {
				decodedData = jQuery.parseJSON( data );
				results = decodedData.results.bindings;

			} catch ( e ) {
				Biojs.console.log("Error decoding response data: " + e.message );
				return jsonData;
			}
			
			Biojs.console.log(decodedData);
			articles = {};
			
			// Group by title
			for ( r in results ) {
				obj = results[r];
				
				if ( ! articles.hasOwnProperty( obj.title.value ) ) {
					articles[ obj.title.value ] = new Array( columns.length );
					
					for ( c = 0; c < columns.length; c++ ) {
					    try {
					        articles[ obj.title.value ][ c ] = obj[ columns[c].key ].value;

					    } catch (e) {
					        if ( c.optional ) {
	                            articles[ obj.title.value ][ c ] = "";

					        } else {
					            articles[ obj.title.value ][ c ] = "";
	                            Biojs.console.log("Missing value for column: "+ c.name );
					        }
					    }
					}
					
				} else {
					// Concat multiple values
					for ( c = 0; c < columns.length; c++ ) {
						if ( ! columns[c].unique ) {
							if ( articles[ obj.title.value ][ c ].indexOf( obj[ columns[c].key ].value ) == -1 ) {
								articles[ obj.title.value ][ c ] += '; ' + obj[ columns[c].key ].value;
							}
						}
					}
				}
			}

			// Add to data
			for ( title in articles ) {	
				jsonData.aaData.push( articles[ title ] );
			}
			
			jsonData.iTotalRecords = jsonData.aaData.length;
			//jsonData.iTotalDisplayRecords = this.getTotalRecords();
			
			this._setData(jsonData);
			
		});
		
		
	},
	
	_getResourceID: function ( nodeID ) {
		return this._resourceURI[nodeID];
	},
	
	_setResourceID: function ( nodeID, resourceURI ) {
		return this._resourceURI[nodeID] = resourceURI;
	},
	
	_setData: function( json ) {
		// TODO: improve this
		
		var nodeURI;
		var nodeTitle;
		
		this._removeData();
		
		for( var i in json.aaData ) {
			resourceURI = json.aaData[i][0];
			resourceTitle = json.aaData[i][1];
			nodeID = this._digest(resourceURI);
			this.addNode('<div id='+ nodeID +'>'+ resourceTitle +'</div>');
			this._setResourceID(nodeID,resourceURI);
			this._requestAnnotations(resourceURI);
		}
		
	},
	
	_removeData: function() {
		delete this._resourceURI;
		this._resourceURI = {};
		delete this._links;
		this._links = {};
	},

	_requestUniprotAccession: function ( userQuery, fnCallback ) {
		var self = this;
		var query = 
			'SELECT distinct ?gene str(?uniprotAcc) as ?humanUniprotAcc '+
				'WHERE { '+
				   '?wikiArticle rdf:type gw_wiki:Category-3AHuman_proteins ; '+
				   'rdfs:label ?gene ; '+
				   'gw_property:Has_entrez_id ?entrezId ; '+
				   'gw_property:Has_uniprot_id ?uniprotAcc . '+
				   'FILTER (regex(?gene, "' + userQuery + '", "i")) . '+
			    '} LIMIT 1';
		var params = { query: query, format: 'application/json' };		
		
		Biojs.console.log("Requesting the accession: " + query );
		
		this._fetchData( this.opt.sparqlUrl, params, function(data) {
			var accession = "";
			
			try {
				var jsonData = jQuery.parseJSON( data );
				accession = jsonData.results.bindings[0].humanUniprotAcc.value;

			} catch ( e ) {
				Biojs.console.log("Error decoding response data: " + e.message );
			}
			
			Biojs.console.log("Accession: " + accession );
			fnCallback.call( self, accession );
		});
		
	},
	
	_requestAnnotations: function ( resourceURI, fnCallback ) {

		//TODO: show loading image
		var self = this;

		// Get annotations with Biojs component
		var annots = new Biojs.Annotations({
			sparqlUrl: this.opt.sparqlUrl,
			proxyUrl: this.opt.proxyUrl,
			groupBy: this.opt.groupBy
		});
		
		annots.requestAnnotations(resourceURI, function (data) { 
			
			self._paintLinksOf(resourceURI); 

		});
		
    	// save data 
    	this._annotationsByNode[ this._digest(resourceURI) ] = annots;

	},
	
	_repaint: function(){
		delete this._links;
		this._links = {};
		this.removeAllLinks();
		for( var i in this._resourceURI ) {
			this._paintLinksOf( this._resourceURI[i] );
		} 
	},
	
	_paintLinksOf: function (resourceURI) {
		
		Biojs.console.log("Painting links of "+resourceURI);
		
		var nodeID = this._digest(resourceURI);
		var linkID, matchedItems;
		
		for ( var otherNodeID in this._resourceURI ) {
			
			// exclude itself
			if ( otherNodeID != nodeID ) {
				// create an identifier for the link   
	    		linkID = parseInt(nodeID,10) + parseInt(otherNodeID,10);
				
				// isn't the link already drawn?
	    		if ( this._links[linkID] == undefined ) {
	    			// Get matched items to create links 
	    			matchedItems = this._matchNodes(nodeID+'',otherNodeID+'');
	    			for ( var i in matchedItems ) {
	    				this.addLink( nodeID, otherNodeID, matchedItems[i] );
	    				// mark the link as created   
	    	    		this._links[linkID] = true;
	    			}
	    		}

			} 
    	}

	},
	
	/* 
     * Function: _fetchData
     * Purpose:  do the Ajax request to get the data from server. Note that 'this' will not refered to the Biojs.Table instance
     * 	due to this function will be linked to the internal DataTables object.
     * Returns:  -
     * Inputs:   
     * 	sourceUrl -> {string} HTTP source to obtain the data.
     * 	params -> {Object[]} a key/value pair object containing the data to send to the server.
     * 	fnCallback -> {function} to be called on completion of the data get process that will draw the data on the page.
     */
    _fetchData: function ( sourceUrl, params, fnCallback ) {

    	 var self = this;
	   	 var httpRequest = { url: sourceUrl };
	
	   	 // Data type expected 
	   	 httpRequest.dataType = 'json';
	
	   	 // Using proxy?
	   	 // Redirect using the proxy and encode all params as url data
	   	 if ( this.opt.proxyUrl != undefined ) {
	
	   		 // Redirect to proxy url
	   		 httpRequest.url = this.opt.proxyUrl;
	
	   		 // Encode both url and parameters under the param url
	   		 params = [{ name: "url", value: sourceUrl + '?' + jQuery.param(params) }];
	
	   		 // Data type 
	   		 httpRequest.dataType = "text";
	   	 }
	   	 
	   	// Wrap the callback function 
		httpRequest.success = function ( data ) {

			fnCallback.call(self, data);

			 // fire event
			 // TODO: change this event
			 self.raiseEvent( Biojs.ResultsGraph.EVT_ON_DATA_ARRIVED, { 
				 "data": data 
			 });
		 }
	
	   	 httpRequest.type = 'GET';
	   	 httpRequest.data = params;
	   	 //httpRequest.sEcho = aoData[0].value;
	
	   	 jQuery.ajax( httpRequest );
    },

    _matchNodes: function ( nodeID1, nodeID2 ) {
    	
    	Biojs.console.log("Matching nodes "+ this._resourceURI[nodeID1] + "<>" + this._resourceURI[nodeID2]);
    	
    	// Perform a join to determine if some entity is shared between them
    	var a1 = this._annotationsByNode[nodeID1];
    	var a2 = this._annotationsByNode[nodeID2];
    	var item, res = [];
    	//var item1, item2, i, res = [];
    	
    	// If there is no annotations, nothing to match 
    	if ( (a1 == undefined) || (a2 == undefined) || (a1.getRawData() == undefined) || (a2.getRawData() == undefined) ) {
    		return res;
    	}

    	// Refresh grouping criteria in case of changed
    	a1.getDataBy( this.opt.groupBy );
    	a2.getDataBy( this.opt.groupBy );
    	
    	var a = a1.join(a2);
    	a.applyFilter( this.opt.filterBy );
    	
    	var i = a.iterator();
    	while ( i.hasNext() ) {

    		item = i.next();
    		
    		if ( item.freq >= this.opt.minSharedEntities ) {
    			res.push( item.id );
    		}

    	}

//    	// Apply Filters 
//    	a1.applyFilter( this.opt.filterBy );
//    	a2.applyFilter( this.opt.filterBy );
//    	
//    	// Do matching of topics
//    	i = a1.iterator();
//    	while ( i.hasNext() ) {
//
//    		item1 = i.next();
//    		item2 = a2.getItem(item1.id);
//    		
//    		if ( item2 != undefined ) {
//    			
//    			Biojs.console.log("Matching entities for item " + item1.id );
//        		
//        		if (  this._matchEntities( item1.getEntities(), item2.getEntities(), this.opt.minSharedEntities ) ) {
//        			res.push( item1.id );
//        		}
//    		}
//    	}
    	
    	Biojs.console.log(res);
 
    	return res;
    	
    },
    
    _matchEntities: function( e1, e2, minMatchedEntities ) {

    	var count = 0;
    	
    	for ( var i in e1 ) {
    		for ( var j in e2 ) {
        		if ( e1[i] == e2[j] ) {
        			if ( (count++ >= minMatchedEntities) && (count >= this.opt.filterBy['frequency']) ) return true;
        		}
        	}
    	}
    	
    	Biojs.console.log("No entities matched");
    	
    	return false;
    },
    
    
    // djb2 algorithm (k=33) by Dan Bernstein
    // returns a valid HTML id string from any string 
    _digest: function( str ) {
	    var hash = 5381;
	    for (i = 0; i < str.length; i++) {
	        char = str.charCodeAt(i);
	        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
	    }
	    return hash.toString();  
    }
    
    // TODO: override removeNode
    // TODO: method removeTermFromNode
  
},{
	
	EVT_ON_DATA_ARRIVED: "onDataArrived",

	/**
     * Columns for RDF result 
     * @type {Object[]}
     */
	COLUMNS: [    
        { unique: true,  optional: false, name: "Article",  key: "article" },
        { unique: true,  optional: false, name: "Title",    key: "title" },
//        { unique: false, optional: false, name: "See Also", key: "seeAlso" },
//        { unique: false, optional: false, name: "Same As",  key: "sameAs" },
//        { unique: true,  optional: true,  name: "Date",     key: "date" },
//        { unique: true,  optional: false, name: "Abstract", key: "abstract" },
//        { unique: true,  optional: false, name: "Journal",  key: "journalTitle" },
//        { unique: true,  optional: false, name: "Volume",   key: "volume" },
//        { unique: true,  optional: true,  name: "Issue",    key: "issue" },
//        { unique: true,  optional: false, name: "Start",    key: "start" },
//        { unique: true,  optional: false, name: "End",      key: "end" },
//        { unique: false, optional: false, name: "Author",   key: "author" }
    ],
    
    
 // Topics map
	TOPIC: {
        //chemical
        "http://purl.obolibrary.org/obo/CHEBI": {
            shortName: "chebi",
            baseUrl: "http://identifiers.org/obo.chebi/CHEBI:",
            prefix: "CHEBI:",
            color: "#D6A100"
        },

        //genes, proteins
        "http://purl.org/obo/owl/GO#GO": {
            shortName: "go",
            baseUrl: "http://identifiers.org/obo.go/GO:",
            prefix: "GO:",
            color: "#0067E6"
        },

        "http://purl.org/obo/owl/PW#PW": {
            shortName: "pw",
            baseUrl: "http://purl.org/obo/owl/PW#PW_",
            prefix: "",
            color: "#00DAE6"
        },

        "http://mged.sourceforge.net/ontologies/MGEDOntology.owl": {
            shortName: "mged",
            baseUrl: "http://mged.sourceforge.net/ontologies/MGEDOntology.owl#",
            prefix: "",
            color: "#6961FF"
        },

        "http://purl.uniprot.org/core": {
            shortName: "uniprot",
            baseUrl: "http://identifiers.org/uniprot/",
            prefix: "",
            color: "#61A8FF"
        },

//		"http://www.uniprot.org/taxonomy": {
//			shortName: "taxonomy",
//			baseUrl: "http://www.uniprot.org/taxonomy/"
//		},

        //drugs
        "http://purl.bioontology.org/ontology/MDDB": {
            shortName: "mddb",
            baseUrl: "http://purl.bioontology.org/ontology/MDDB/",
            prefix: "",
            color: "#FF61A8"
        },

        "http://purl.bioontology.org/ontology/NDDF": {
            shortName: "nddf",
            baseUrl: "http://purl.bioontology.org/ontology/NDDF/",
            prefix: "",
            color: "#C7005A"
        },

        "http://purl.bioontology.org/ontology/NDFRT": {
            shortName: "ndfrt",
            baseUrl: "http://purl.bioontology.org/ontology/NDFRT/",
            prefix: "",
            color: "#FF0F4B"
        },

        //medicine
        "http://purl.bioontology.org/ontology/MEDLINEPLUS": {
            shortName: "medline",
            baseUrl: "http://purl.bioontology.org/ontology/MEDLINEPLUS/",
            prefix: "",
            color: "#329D27"
        },

        "http://purl.bioontology.org/ontology/SNOMEDCT": {
            shortName: "snomed",
            baseUrl: "http://purl.bioontology.org/ontology/SNOMEDCT/",
            prefix: "",
            color: "#AAD864"
        },

        "http://purl.org/obo/owl/SYMP#SYMP": {
            shortName: "symptom",
            baseUrl: "http://purl.org/obo/owl/SYMP#SYMP_",
            prefix: "",
            color: "#A2E7BD"
        },

        "http://purl.bioontology.org/ontology/MDR": {
            shortName: "meddra",
            baseUrl: "http://purl.bioontology.org/ontology/MDR/",
            prefix: "",
            color: "#99CC00"
        },

        "http://purl.bioontology.org/ontology/MSH": {
            shortName: "mesh",
            baseUrl: "http://purl.bioontology.org/ontology/MSH/",
            prefix: "",
            color: "#669980"
        },

        "http://purl.bioontology.org/ontology/OMIM": {
            shortName: "omim",
            baseUrl: "http://identifiers.org/omim/",
            prefix: "",
            color: "#989966"
        },

//		"http://sig.uw.edu/fma": {
//			shortName: "fma",
//			baseUrl: "http://identifiers.org/obo.fma/FMA:"
//		},

        "http://purl.bioontology.org/ontology/ICD9-9": {
            shortName: "icd9",
            baseUrl: "http://identifiers.org/icd/",
            prefix: "",
            color: "#CABDAF"
        },

        "http://www.ifomis.org/bfo/1.1/span": {
            shortName: "obi",
            baseUrl: "http://identifiers.org/obo.obi/OBI_",
            prefix: "",
            color: "#806699"
        },

        "http://berkeleybop.org/obo/UMLS": {
            shortName: "umls",
            baseUrl: "http://berkeleybop.org/obo/UMLS:",
            prefix: "",
            color: "#CC00FF"
        },

        //plants
        "http://purl.bioontology.org/ontology/PO": {
            shortName: "po",
            baseUrl: "http://purl.bioontology.org/ontology/PO/",
            prefix: "",
            color: "#007D00"
        },

        //thesaurus
        "http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl": {
            shortName: "ncithesaurus",
            baseUrl: "http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl",
            prefix: "",
            color: "#9C38FF"
        },

        //organisms
        "http://purl.org/obo/owl/NCBITaxon#NCBITaxon": {
            shortName: "ncbitaxon",
            baseUrl: "http://identifiers.org/taxonomy/",
            prefix: "",
            color: "#5E00BD"
        }
        
	}
});








/**
 * Shows the article information.  
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="mailto:johncar@gmail.com">John Gomez</a>
 * 
 * @requires <a href="../biojs/css/biojs.Article.css">Article CSS</a>
 * @dependency <link href="../biojs/css/biojs.Article.css" rel="stylesheet" type="text/css"></link>
 * 
 * @param {Object} options 
 *    An object with the options for Article component.
 *    
 * @option {string} target 
 *    Identifier of the DIV tag where the component should be displayed.
 * 
 * @example
 *    var myArticle = new Biojs.Article({
 *       target: "YourOwnDivId"
 *    });
 * 
 **/
Biojs.Article = Biojs.extend (
/** @lends Biojs.Article# */
{
	constructor: function (options) {
		this._container = jQuery( '#' + this.opt.target ).addClass('Article');
		this._articleContainer = jQuery('<div class="content">').appendTo( this._container );
		this._initialize( this._articleContainer );
	},
	
	/**
	 * Default values for the options
	 * @name Biojs.Article-opt
	 */
	opt: {
		target: "YourOwnDivId",
		sparqlUrl: 'http://biotea.idiginfo.org/sparql',
		//sparqlUrl: 'http://virtuoso.idiginfo.org/sparql',
		proxyUrl: '../biojs/dependencies/proxy/proxy.php'
	},
	
	/**
     * Array containing the supported event names
     * @name Biojs.Article-eventTypes
     */
	eventTypes: [ 
		/**
		 * @name Biojs.Article#onAnnotationsLoaded
		 * @event
		 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} 
		 * object as argument.
		 * @eventData {Object} source The component which did triggered the event.
		 * @eventData {string} type The name of the event.
		 * @eventData {int} textSelected Selected text, will be 'Hello' obviously.
		 * @example 
		 * instance.onAnnotationsLoaded(
		 *    function( e ) {
		 *       alert("The word " + objEvent.textSelected + " was selected.");
		 *    }
		 * ); 
		 * 
		 */
		"onAnnotationsLoaded"
	],

	_initialize: function ( container ) {
		this._title = jQuery('<h1></h1>').appendTo( container );
		this._authors = jQuery('<span class="authors"></span>').appendTo( container );
		this._summary = jQuery('<span class="summary"></span>').appendTo( container );
		this._abstract = jQuery('<p class="abstract"></p>').appendTo( container );
		this._seeAlso = jQuery('<ul class="seeAlso"></ul>').appendTo( container );
		this._sameAs = jQuery('<ul class="sameAs"></ul>').appendTo( container );
		
		this._annotationsTitle = jQuery('<h1>Annotations Cloud</h1>').appendTo( container );
		this._annotations = jQuery('<ul class="annotations"></ul>').appendTo( container );
		
		this._referencesTitle = jQuery('<h1>References</h1>').appendTo( container );
		this._references = jQuery('<ul class="references"></ul>').appendTo( container );
	},
	
	/**
     * Set the data.
     * @param {array} data 1D array containing the article's data
     * 
     * @example 
     * myArticle.setData([]);
     * 
     */
	setData: function ( dataRow ) {
		var self = this;
		
		var seeAlso = dataRow[2].split(';');
		var interval = ( dataRow[9].length > 0 ) ? ', ' + dataRow[9] + '-' + dataRow[10] : '';
		var sameAs = dataRow[3].split(';');
		
		this._title.html( dataRow[1] );
		this._authors.html( dataRow[11] );
		this._summary.html( '<strong>' + dataRow[6] + '</strong>, '+ dataRow[4] +', Volume ' + dataRow[7] + ' (' + dataRow[8] + ')'+ interval );
		this._abstract.html( '<strong>Abstract: </strong>' +dataRow[5] );	
		this._seeAlso.html('');
		this._sameAs.html('');
		this._annotations.html('Loading...').css('text-align','left');
		this._references.html('Loading...');

		jQuery.each( seeAlso, function ( i, value ) {
			self._seeAlso.append('<li><a href="' + value + '">' + value + '</a></li>');
		});

		jQuery.each( sameAs, function ( i, value ) {
			var prefix = ( value.indexOf('doi') != -1 )? "DOI:" : ( value.indexOf('pubmed') != -1 )? "pmid:" : "";
			self._sameAs.append('<li><a href="' + value + '">' + prefix + value.substr( value.lastIndexOf("/") + 1 ) + '</a></li>');
		});
		
		
		this._setAnnotations( dataRow[0], this._annotations ); 
		this._setReferences( dataRow[0], this._references ); 
		

	},
	
	_setAnnotations: function ( resourceURI, node ) {
		
		var terms;
		
		this._requestAnnotations( resourceURI, function (data) {
			
			this._annotations.html('').css('text-align','center');
			
			terms = this._decodeAnnotations(data);
			
			jQuery.each( terms, function ( term, topics ) {
				var termNode = jQuery('<li class="term"><span class="name">' + term.toLowerCase() + '</span></li>');
				var topicList = jQuery('<span class="topics" style="display:none"></span>').appendTo( termNode ); 
				var pattern=/(#|_|:|\/)([A-Za-z0-9])*$/g;
				var topic, topicKey, identifier, freq = 0;
				
				for ( t in topics ) {
					
					try {

						topicKey = topics[t].replace(pattern, '');
						topic = Biojs.Article.TOPIC[ topicKey ];
						
						identifier = ( topics[t].match(pattern)[0] ).substr(1);
						
						jQuery('<a class="topic ' + topic.shortName + '">' + topic.prefix + identifier + '</a>')
							.attr({
								href: topic.baseUrl + identifier,
								topicType: topic.shortName,
								topicId: identifier
							})
							.appendTo(topicList);
						
						freq++;
						
					} catch ( e ) {
						Biojs.console.log("Error searching topic for " + topics[t] + ". message:" + e.message);
					}

				}
				
				if ( topicList.children().length > 0 ) {
					topicList.last().addClass("last");
					termNode.appendTo(node);
				}
				
				termNode.children(':first-child')
					.css({
						"fontSize": (freq / 10 < 1) ? freq / 10 + 1 + "em": (freq / 10 > 2) ? "2em" : freq / 10 + "em",
						"cursor": 'pointer'
					})
					.click( function() { 
						node.find('.topics').hide();
						topicList.toggle(); 
					})
					.append('<span style="vertical-align:super; font-size:10px;">' + freq + '</super>');  

			});
			
			Biojs.console.log("Raising event "+Biojs.Article.EVT_ON_ANNOTATIONS_LOADED);
			
			this.raiseEvent(Biojs.Article.EVT_ON_ANNOTATIONS_LOADED, { uri: resourceURI });
			
		});
			
	},
	
	_requestAnnotations: function ( resourceURI, actionCb ) {

		strQuery = 
			'select ?annot fn:upper-case(str(?body)) AS ?term ?topic str(?init) AS ?posInit str(?end) AS ?posEnd ?comment '+
			'   where { '+
			'     ?annot a aot:ExactQualifier ; '+ //no mostrar, mœltiple, sirve para agrupamiento de primer nivel, se puede omitir
			'     ao:annotatesResource <' + resourceURI + '>;'+
			'     ao:body ?body ; '+ //mœltiple, se usa para el agrupamiento de primer nivel
			'     ao:hasTopic ?topic ;'+  //mœltiple, se usa parcialmente para agrupamiento de segundo nivel, la combinaci—n body+topic es œnica
			'     ao:context ?context . '+ //no mostrart, no est‡ incluido en los resultados
			'     ?context rdfs:resource ?resource . '+ //no mostar, no est‡ incluido en los resultados
			'     OPTIONAL {?context aos:init ?init }. '+ //œnico, posici—n inicial de la anotaci—n
			'     OPTIONAL {?context aos:end ?end } . '+ //œnico, posici—n final de la anotaci—n 
			'     ?resource rdfs:comment ?comment .  '+ //œnico, contiene el texto donde aparece la anotaci—n
			'     FILTER (regex(str(?topic), "(uniprot|GO|CHEBI|ICD9|UMLS|fma|MSH|PO|MDDB|NDDF|NDFRT|NCBITaxon)")) . '+
			'} ORDER BY ?term ?topic';

		this._doSparqlQuery( this.opt, strQuery, 'application/json', actionCb );
	},
	
	_setReferences: function ( resourceURI, node ) {
		
		var references;
		
		this._requestReferences( resourceURI, function (data) {
			
			references = this._decodeReferences(data);
			
			if ( Biojs.Utils.isEmpty( references ) ) {
				jQuery( node ).html( 'No references available' );
				
			} else {
				jQuery.each( references, function ( refId, ref ) {
					
					var interval = "";
					
					if ( ref.complete ) {
						interval = ( ref.start.length > 0 ) ? ', ' + ref.start + '-' + ref.end : '';
						'<li>' + ref.author + '. <strong>' + ref.jornalTitle + '</strong>, '+ ref.data +', Volume ' + ref.volume + ' (' + ref.issue + ')'+ interval +'</li>';

					} else {
						jQuery( node ).append( '<li>' + ref.title + '</li>' );
					}

				});
			}
			
		});
	},
	
	_requestReferences: function ( resourceURI, actionCb ) {

		strQuery = 
			'select fn:substring(?ref, 82) AS ?refId ?title ?sameAs ?date ?journalTitle ?volume ?issue ?start ?end fn:concat(?authorLastName, ", ", ?authorFirstName) AS ?author ' +
			'where { ' +
			'   { <' + resourceURI + '> bibo:cites ?ref.' +
			'      ?ref dcterms:title ?title ;  ' +              //unique
			'      owl:sameAs ?sameAs ;  ' +                     //multiple
			'      dcterms:publisher ?publisher ;  ' +           //unique but not to show              
			'      bibo:volume ?volume ;  '  +                   //unique
			'      bibo:pageStart ?start ; ' +                   //unique
			'      bibo:pageEnd ?end ;  ' +                      //unique
			'      dcterms:issued ?date ;   ' +                  //unique
			'      bibo:authorList ?authorList . ' +             //unique but not to show
			'      OPTIONAL {?ref bibo:issue ?issue } . ' +      //unique, optional
			'      ?publisher dcterms:title ?journalTitle . ' +
			'      ?authorList rdfs:member ?member .  ' +        //multiple, not to show
			'      ?member foaf:givenName ?authorFirstName ; ' + //multiple
			'      foaf:familyName ?authorLastName. ' +          //multiple
			'   } UNION { <' + resourceURI + '> bibo:cites ?ref. ' +
			'      ?ref dcterms:title ?title . ' +
			'      OPTIONAL {?ref dcterms:publisher ?publisher } ' +
			'      FILTER (!bound(?publisher)) ' +
			'   } ' +
			'} ORDER BY ?refId ';

		Biojs.console.log("SPARQL query for refs: " + strQuery );
		
		this._doSparqlQuery( this.opt, strQuery, 'application/json', actionCb );
	},

	_doSparqlQuery: function ( opt, query, format, actionCb ) {
		
		var self = this;
		var dataParams = [];
		
		dataParams.push({ name: "url", value: opt.sparqlUrl });
		dataParams.push({ name: "query", value: escape(query) }); 
		dataParams.push({ name: "format", value: format });
		
		Biojs.console.log("Requesting Query: " + query );
		
		jQuery.ajax({ 
			url: opt.proxyUrl,
			dataType: "text",
			data: dataParams,
			success: function ( data ) {
				Biojs.console.log("Data received");
				actionCb.call( self, data );
			}
		});

	},
	
	
	_decodeAnnotations: function ( dataReceived ) {
		
		var decodedData = {};
		var results = [];
		var obj;
		var terms = {};
		
		try {
			decodedData = jQuery.parseJSON( dataReceived );
			results = decodedData.results.bindings;
			//Biojs.console.log( results );

		} catch ( e ) {
			Biojs.console.log("Error decoding response data: " + e.message );
			return jsonData;
		}
		
		for ( r in results ) {
			obj = results[r];
			
			// Group by term. The terms objects should be like this:
			// terms {
			//   term1 : {topic1,topic2,...}
			//   term2 : {topic1,topic2,...}
			//   ...
			// }
			//
			if ( ! terms.hasOwnProperty( obj.term.value ) ) {
				terms[ obj.term.value ] = {};
			} 
			
			terms[ obj.term.value ][ obj.topic.value ] = obj.topic.value;
			
		}
		
		return terms;
		
	},
	
	_decodeReferences: function ( dataReceived ) {
		
		var decodedData = {};
		var results = [];
		var obj;
		var refs = {};
		
		try {
			
			decodedData = jQuery.parseJSON( dataReceived );
			results = decodedData.results.bindings;
			
			Biojs.console.log( "References:" );
			//Biojs.console.log( results );
			for ( r in results ) {
				obj = results[r];
				
				// Group by term. The refs objects should be like this:
				// refs {
				//   ref1 : { title: "..", sameAs: ".." ... }
				//   ref2 : { title: "..", sameAs: ".." ... }
				// }
				//
				if ( ! refs.hasOwnProperty( obj.refId.value ) ) {
					
					// Create a member object called refId
					var reference = refs[ obj.refId.value ] = {};
					reference.title = obj.title.value;
					
					try {
						// These values might either be present or not 
						reference.author = obj.author.value;
						reference.sameAs = obj.sameAs.value;
						reference.date = obj.date.value;
						reference.journalTitle = obj.journalTitle.value;
						reference.volume = obj.volume.value;
						reference.issue = obj.issue.value;
						reference.start = obj.start.value;
						reference.end = obj.end.value;
						reference.complete = true;
						
					} catch (e) { 
						reference.complete = false; continue; 
					}		
					
				} else {
					// object already created, copy multiple values sameAs and author
					reference.sameAs += ", " + obj.sameAs.value;
					reference.author += ", " + obj.author.value;
				}

			}

		} catch ( e ) {
			Biojs.console.log("Error decoding response data: " + e.message );
		}
		
		
		
		return refs;
		
	}
	
	
},
{
	//Events
	EVT_ON_ANNOTATIONS_LOADED: 'onAnnotationsLoaded',
	
	// Topics map
	TOPIC: {
		//chemical
		"http://purl.obolibrary.org/obo/CHEBI": { 
			shortName: "chebi", 
			baseUrl: "http://identifiers.org/obo.chebi/CHEBI:",
			prefix: "CHEBI:"
		},
		
		//genes, proteins
		"http://purl.org/obo/owl/GO#GO": { 
			shortName: "go", 
			baseUrl: "http://identifiers.org/obo.go/GO:",
			prefix: ""
		},
		
		"http://purl.org/obo/owl/PW#PW": { 
			shortName: "pw", 
			baseUrl: "http://purl.org/obo/owl/PW#PW_",
			prefix: ""
		},
		
		"http://mged.sourceforge.net/ontologies/MGEDOntology.owl": { 
			shortName: "mged", 
			baseUrl: "http://mged.sourceforge.net/ontologies/MGEDOntology.owl#",
			prefix: "" 
		},
			
		"http://purl.uniprot.org/core": { 
			shortName: "uniprot", 
			baseUrl: "http://identifiers.org/uniprot/",
			prefix: "" 
		},
		
//		"http://www.uniprot.org/taxonomy": { 
//			shortName: "taxonomy", 
//			baseUrl: "http://www.uniprot.org/taxonomy/" 
//		},
		
		//drugs
		"http://purl.bioontology.org/ontology/MDDB": { 
			shortName: "mddb", 
			baseUrl: "http://purl.bioontology.org/ontology/MDDB/",
			prefix: "" 
		},
		
		"http://purl.bioontology.org/ontology/NDDF": { 
			shortName: "nddf", 
			baseUrl: "http://purl.bioontology.org/ontology/NDDF/",
			prefix: "" 
		},
		
		"http://purl.bioontology.org/ontology/NDFRT": { 
			shortName: "ndfrt", 
			baseUrl: "http://purl.bioontology.org/ontology/NDFRT/",
			prefix: "" 
		},
		
		//medicine
		"http://purl.bioontology.org/ontology/MEDLINEPLUS": { 
			shortName: "medline", 
			baseUrl: "http://purl.bioontology.org/ontology/MEDLINEPLUS/",
			prefix: "" 
		},
		
		"http://purl.bioontology.org/ontology/SNOMEDCT": { 
			shortName: "snomed", 
			baseUrl: "http://purl.bioontology.org/ontology/SNOMEDCT/",
			prefix: "" 
		},
		
		"http://purl.org/obo/owl/SYMP#SYMP": { 
			shortName: "symptom", 
			baseUrl: "http://purl.org/obo/owl/SYMP#SYMP_",
			prefix: "" 
		},
		
		"http://purl.bioontology.org/ontology/MDR": { 
			shortName: "meddra", 
			baseUrl: "http://purl.bioontology.org/ontology/MDR/",
			prefix: "" 	
		},
		
		"http://purl.bioontology.org/ontology/MSH": { 
			shortName: "mesh", 
			baseUrl: "http://purl.bioontology.org/ontology/MSH/",
			prefix: "" 
		},
		
		"http://bio2rdf.org/ns/mesh": { 
			shortName: "bio2rdf_mesh", 
			baseUrl: "http://bio2rdf.org/ns/mesh#",
			prefix: "" 
		},
		
		"http://purl.bioontology.org/ontology/OMIM": { 
			shortName: "omim", 
			baseUrl: "http://identifiers.org/omim/",
			prefix: "" 
		},
		
//		"http://sig.uw.edu/fma": { 
//			shortName: "fma", 
//			baseUrl: "http://identifiers.org/obo.fma/FMA:" 
//		},
		
		"http://purl.bioontology.org/ontology/ICD9-9": { 
			shortName: "icd9", 
			baseUrl: "http://identifiers.org/icd/",
			prefix: "" 
		},
		
		"http://www.ifomis.org/bfo/1.1/span": { 
			shortName: "obi", 
			baseUrl: "http://identifiers.org/obo.obi/OBI_",
			prefix: "" 
		},
			
		"http://berkeleybop.org/obo/UMLS": { 
			shortName: "umls", 
			baseUrl: "http://berkeleybop.org/obo/UMLS:",
			prefix: "" 
		},
		
		//plants
		"http://purl.bioontology.org/ontology/PO": { 
			shortName: "po", 
			baseUrl: "http://purl.bioontology.org/ontology/PO/",
			prefix: "" 
		},
		
		//thesaurus	
		"http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl": { 
			shortName: "ncithesaurus", 
			baseUrl: "http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl",
			prefix: "" 
		},
		
		//organisms
		"http://purl.org/obo/owl/NCBITaxon#NCBITaxon": { 
			shortName: "ncbitaxon", 
			baseUrl: "http://identifiers.org/taxonomy/",
			prefix: "" 
		}
	}
});
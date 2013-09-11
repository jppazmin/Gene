/** 
 * @description Table to show binary molecular interactions.  
 * 
 * @class
 * @extends Biojs.Table
 * 
 * @requires <a href='../biojs/css/biojs.ResultsTable.css'>ResultsTable CSS</a>
 * @dependency <link href="../biojs/css/biojs.ResultsTable.css" rel="stylesheet" type="text/css" />
 * 
 * @option {string[][]|Object} dataSet 
 *    Either 2D string array containing the whole data to be displayed or a plain object defining the data source. 
 *    
 *    <pre class="brush: js" title="Syntax of the plain object:">
 *    {
 * 		url: &lt;url&gt;,
 * 		proxyUrl: &lt;proxy&gt;,
 * 		paramsMap: { "iDisplayStart": &lt;newName1&gt;, "iDisplayLength": &lt;newName2&gt;, ... },
 * 		filter: &lt;flag&gt;,
 *      totalRecords:&lt;number&gt;
 *    }
 *    </pre>
 *      
 *    <pre class="brush: js" title="Example of plain object: ">
 *    {
 * 		sparqlUrl: 'http://199.102.237.69:8890/sparql',
 * 		proxyUrl: '../biojs/dependencies/proxy/proxy.php',
 *      query: "",
 *      filter: false
 *    }
 *    </pre>  
 *  
 *    <pre class="brush: js" title="Example of 2D array of data: ">
 *    ...soon
 *    </pre>
 * 
 * @example 
 * var myTable = new Biojs.ResultsTable({
 *  	target: "YourOwnDivId",
 *  	dataSet: {
 *  		sparqlUrl: 'http://virtuoso.idiginfo.org/sparql',
 *  		proxyUrl: '../biojs/dependencies/proxy/proxy.php',
 *          filter: false
 *      },
 *      rowSelection: false,
 *      showColumnSelector: false
 * });
 * 
 * myTable.setQuery("Insulin");
 * 
 */
Biojs.ResultsTable = Biojs.Table.extend(
/** @lends Biojs.ResultsTable# */
{
	constructor: function (options) {

		var self = this;
		var offset = {};
		
		this.opt.columns = Biojs.Utils.clone(Biojs.ResultsTable.COLUMNS);
		
		this.opt.columns[0].render = this._columnRender.showArticleSummary;
		this.opt.columns[0].bSortable = false;
		
		this.opt.hideColumns= [1,2,3,4,5, 6,7,8,9,10,11];
		
		// Calling super's constructor
		this.base(this.opt.options);
		
		this._container = jQuery( '#' + self.opt.target );
		this._container.addClass("ResultsTable grid12");
        //
		var rowIndex = 0;
		
		this.onRowRendered( function(e) {

			var row = jQuery(e.node);
			var cell = row.find('td:eq(0)');
			var result = cell.find( 'div.result' );
			var resumme = cell.find( 'div.abstract' );
			var annotations = cell.find( 'div.annotations' );
			var contextual = cell.find( 'div.contextual' );

            cell.children('.content').addClass('page-curl shadow-bottom');

			contextual.attr( 'id','context_' + rowIndex ).addClass('fancybox2').css({ width: "90%", left: "5%"});
			annotations.attr( 'id','annotations_' + rowIndex ).height( "100%" );

			// Abstract expand/collapse
			resumme.find( 'span.toggle' )
				.click(function(e){		
					resumme.children('p').toggle();
					resumme.children('h2').children().toggle();
					annotations.height( result.outerHeight() );
				});

            annotations.height(200);
			self._requestAnnotations( annotations, unescape( annotations.attr('uri') ), contextual );

			rowIndex++;

		});

        jQuery( self._tableSelector ).css('width','100%');

	},

	
	/**
	 * Default values for the options
	 * @name Biojs.ResultsTable-opt
	 */
	opt: {
		target: "YourOwnDivId",
		rowSelection: false,
		sparqlUrl: 'http://biotea.idiginfo.org/sparql',
		//sparqlUrl: 'http://virtuoso.idiginfo.org/sparql',
		proxyUrl: '../biojs/dependencies/proxy/proxy.php',
		showColumnSelector: false
	},

	_timer: 0,
	
	/**
	 * Array containing the supported event names
	 * @name Biojs.ResultsTable-eventTypes
	 */
	eventTypes: ['onQueryRequest'],
	
	/**
     * Do a query to SPARQL server by using the provided query.
     * 
     * @param {string} query The query
     * 
     * @example 
     * myTable.setQuery("Gemin-1");
     * 
     * @example
     * myTable.setQuery("WrongQuery");
     * 
     */
	setQuery: function ( userQuery ) {
		
		var strSPARQLQuery = "";
		
		this._container.find("biojs_Table_" + this.getId() + "_processing").show();
		
		this._requestUniprotAccession ( userQuery, this.opt.dataSet, function( accession ) {

            if ( !Biojs.Utils.isEmpty ( accession ) && accession.match(/^[A-z]([0-9])*$/g) ) {

                this.raiseEvent( 'onQueryRequest', { 'accession': accession, 'query': userQuery });

                var strSPARQLQueryWhere =
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

                strSPARQLQuery = 'select ?article ?title ?seeAlso ?sameAs ?date ?abstract ?journalTitle ?volume ?issue ?start ?end fn:concat(?authorLastName, ", ", ?authorFirstName) AS ?author ' +
                    strSPARQLQueryWhere;

                Biojs.console.log("Applying SPARQL query: " + strSPARQLQuery);

                // remove this properties to set a new query
                delete this.opt.dataSet.url;
                delete this.opt.totalRecords;

                // set the new query
                this.opt.dataSet.query = strSPARQLQuery;
                this.opt.dataSet.queryWhere = strSPARQLQueryWhere;

                // request data
                this.setDataSource(this.opt.dataSet);

            } else {

                // TODO: raise this event on the table component, not here
                this.raiseEvent( Biojs.Table.EVT_ON_DATA_ARRIVED, { 'accession': accession, 'query': userQuery });

                this.opt.dataSet.url = "";
                this.opt.totalRecords = 0;

                this.setDataSource(this.opt.dataSet);
            }

		});
		
	},

	_requestUniprotAccession: function ( userQuery, dataSet, action ) {
		var self = this;
		var dataParams = [];
		var countStr;
		
		var strQueryAccession = 
			'SELECT distinct ?gene str(?uniprotAcc) as ?humanUniprotAcc '+
				'WHERE { '+
				   '?wikiArticle rdf:type gw_wiki:Category-3AHuman_proteins ; '+
				   'rdfs:label ?gene ; '+
				   'gw_property:Has_entrez_id ?entrezId ; '+
				   'gw_property:Has_uniprot_id ?uniprotAcc . '+
				   'FILTER (regex(?gene, "' + userQuery + '", "i")) . '+
			    '} LIMIT 1';
		
		//dataSet.url = dataSet.sparqlUrl;
		//dataSet.paramsMap = { "iDisplayStart": "firstResult", "iDisplayLength": "maxResults" };
		
		dataParams.push({ name: "url", value: dataSet.sparqlUrl });
		dataParams.push({ name: "query", value: escape(strQueryAccession) }); 
		dataParams.push({ name: "format", value: 'application/json' });
		
		Biojs.console.log("Requesting the accession: " + strQueryAccession);
		
		jQuery.ajax({ 
			url: dataSet.proxyUrl,
			dataType: "text",
			data: dataParams,
			success: function ( dataReceived ) {
				
				var accession = "";
				
				try {
					var jsonData = jQuery.parseJSON( dataReceived );
					accession = jsonData.results.bindings[0].humanUniprotAcc.value;

				} catch ( e ) {
					Biojs.console.log("Error decoding response data: " + e.message );
				}
				
				dataSet.accessionId = accession;
				Biojs.console.log("Accession: " + accession );
				action.call( self, accession );
			}
		});
	},

	_requestAnnotations: function ( annotations, documentId, contextualArea ) {

        // Request annotations
        var cloud = new Biojs.AnnotationsCloud({ target: annotations });
        var self = this;

        // Show comments
        cloud.onAnnotationClicked(function(e){
            self._showComments( contextualArea, e.comments );
        });

        //Biojs.registerGlobal( 'showComponent', self._showComponent );

        // Show topics
        cloud.onTopicClicked(
            function(e){

                if ( e.topicType.match(/(chebi|uniprot)/g) !== null ) {
                    self._showComponent( contextualArea, e.topicType, e.topicId  )

                } else {
                    self._showComments( contextualArea, e.href );
                }
            }
        );

        cloud.requestAnnotations( documentId, function() {
            annotations.height( annotations.parent().height() );
        });

	},

    _showComponent: function ( contextContainer, topicType, topicId ) {

        contextContainer.children().fadeOut('slow');
        contextContainer.children().remove();

        var content = jQuery('<div></div>')
            .attr('id', contextContainer.attr('id') +'_content' )
            .html( "Loading..." )
            .appendTo( contextContainer );

        if ( topicType == 'chebi' ) {

            content.css( { width: '100%', height: '350px', left: "25%" } );

            contextContainer
                .animate({ width: '60%', height: '350px', left: "15%" },
                function(){
                    var component = new Biojs.ChEBICompound({
                        id: topicId,
                        target: content.attr('id'),
                        proxyUrl: 'biojs/dependencies/proxy/proxy.php'
                    });
                }
            );

            //var divChebi = jQuery('<div id="biojs_chebi_' + divId + '"></div>').appendTo(container);
            //container.height( divChebi.outerHeight() );

        } else if ( topicType == 'uniprot' ) {

            content.css( { width: '100%', height: '350px' } ).html('');

            contextContainer
                .animate( { width: '90%', height: 'auto', left: "5%" },
                function(){

                    var portafolio = new Biojs.ProteinPortafolio({
                        target : content.attr('id'),
                        accession : topicId,
                        proxyUrl: 'biojs/dependencies/proxy/proxy.php',
                        jmolFolder: 'biojs/dependencies/jmol-12.0.48'
                    });

                }
            );

        }

    },

	/**
     * Get the actual query.
     * Uses the structure of the URL to fetch data from PSICQUIC.
     * 
     * @return {string} Current query.
     * 
     * @example 
     * alert( "The query is " + myTable.getQuery() );
     */
	getQuery: function () {
		return unescape(this.opt.dataSet.query);
	},
	
	/* 
	 * Function: Biojs.InteractionTable._requestQueryCount
	 * Purpose:  Request total rows counting with the provided query for pagination purposes. 
	 * 			 Since the PSIQUIC service does not provides the total row count with retrieved data,
	 * 			 it's necessary to do another request in order to get it.
	 * Inputs:   dataSet -> {Object} Settings of the data set. 
	 * 			 action -> {function} Callback function having the dataSet as argument.
	 */
	_requestQueryCount: function ( dataSet, action ) {
		var self = this;
		var dataParams = [];
		var countStr;
		
		var strQueryCount = //this._getQueryCount();
			'select count(distinct ?title) '+ dataSet.queryWhere;
		
		//dataSet.url = dataSet.sparqlUrl;
		dataSet.paramsMap = { "iDisplayStart": "firstResult", "iDisplayLength": "maxResults" };
		
		dataParams.push({ name: "url", value: dataSet.sparqlUrl });
		dataParams.push({ name: "query", value: escape(strQueryCount) }); // TODO: query total results ??? 
		dataParams.push({ name: "format", value: 'text/csv' });
		
		Biojs.console.log("Requesting the counting of total results. Query: " + strQueryCount);
		
		jQuery.ajax({ 
			url: dataSet.proxyUrl,
			dataType: "text",
			data: dataParams,
			success: function ( data ) {
				countStr = data.substr( data.indexOf('\n') );
				//dataSet.totalRecords = parseInt(countStr) | 0;
				dataSet.totalRecords = 1;
				Biojs.console.log("Counting received: " + countStr );
				action.call( self, dataSet );
			}
		});

//		dataSet.totalRecords = 100;
//		action.call( self, dataSet );
		
	},
	
    /**
     * Rebuild the table
     * 
     * @example 
     * myTable.setDataSource({
     * 		sparqlUrl: '',
     *  	proxyUrl: '../biojs/dependencies/proxy/proxy.php',
     *  	query: "pubid:(10837477 OR 12029088)",
     *      filter: false
	 * });
     * 
     */
    setDataSource: function ( dataSet ) {
     	   	
		// Remote data 
    	if ( dataSet.hasOwnProperty("totalRecords") && dataSet.hasOwnProperty("url") ) {
    		// Already have the number of records for pagination 
    		// then, invoke parent's setDataSource
    		this.base( dataSet );
    		
    	} else if ( this.opt.dataSet.query !== undefined ) {
    		// Set the new query
    		this.opt.dataSet = {};
    		this.opt.dataSet.sparqlUrl = dataSet.sparqlUrl;
    		this.opt.dataSet.proxyUrl = dataSet.proxyUrl;
    		this.opt.dataSet.filter = dataSet.filter;
    		this.opt.dataSet.query = escape(dataSet.query);
    		this.opt.dataSet.queryWhere = dataSet.queryWhere;
    		this.opt.dataSet.url = dataSet.sparqlUrl + '?query=' + this.opt.dataSet.query + "&format=application/json";
    		this.opt.dataSet.paramsMap = { "iDisplayStart": "firstResult", "iDisplayLength": "maxResults" };
    		// Request query counting rows and apply setDataSource then
    		this._requestQueryCount( this.opt.dataSet, this.base );
    	}
    	
    },
	/* 
	 * Function: Biojs.InteractionTable._decodeToJSON
	 * Purpose:  Overrides the parent method to decode the received MITAB data into the expected JSON format. 
	 * Returns:  {Object} formatted in the expected JSON. 
	 * Inputs:   data -> {*} MITAB data received from the PSIQUIC server or another one. 
	 */
	_decodeToJSON: function ( dataReceived ) {
		Biojs.console.log("DATA DECODING FROM RDF RESULT to JSON");

		var jsonData = { iTotalRecords: 0, iTotalDisplayRecords: 0, aaData: [] };
		var columns = Biojs.ResultsTable.COLUMNS;
		var decodedData, results, obj, articles;
			
		try {
			dataReceived = dataTable();
			//decodedData = jQuery.parseJSON( dataReceived );
			//results = decodedData.results.bindings;
			results = dataReceived.results.bindings;

		} catch ( e ) {
			Biojs.console.log("Error decoding response data: " + e.message );
			return jsonData;
		}
		
		//Biojs.console.log(decodedData);
		Biojs.console.log(dataReceived);
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
		
		jsonData.iTotalRecords = this.getTotalRecords();
		jsonData.iTotalDisplayRecords = this.getTotalRecords();
		
		Biojs.console.log(jsonData);
		
		this._jsonData = jsonData;
		
		return jsonData;
	},
	
	getData: function ( rowIndex, colIndex ) {
		
		var result = this._jsonData.aaData;
		
		if ( undefined !== rowIndex ) {
			if ( undefined !== colIndex ) {
				result = this._jsonData.aaData[rowIndex][colIndex];
			} else {
				result = this._jsonData.aaData[rowIndex];
			}
		} 
		
		return result;
	},
	
	/* 
	 * Object: Biojs.InteractionTable._columnRender.showProteinXRef
	 * Purpose:  Store the render functions to format values on the table cells.
	 */
	_columnRender: {
		/**
		 * @ignore
		 * 
		 * Function: Biojs.InteractionTable._columnRender
		 * Purpose:  Format the string <KEY>:<VALUE>(DESC) as link to Protein
		 * Returns: {string} the formatted value
		 * Inputs:   
		 * 		col -> {int} column index (0-based)
		 * 		dataRow -> {string[]} 1D array containing the whole row on the cell being formatted.
		 * 		currentValue -> {string} raw cell value.
		 */
		showArticleSummary: function (col, dataRow, currentValue) { 

            var cell = jQuery('<div></div>');
			var container = jQuery('<div class="content"></div>').appendTo(cell);
			var contextual = jQuery('<div class="contextual grid11 first"></div>').appendTo(cell);

			var result = jQuery('<div class="result grid7 first"></div>').appendTo(container);
			var annotations = jQuery('<div class="annotations grid5"></div>').appendTo(container);
			
			var summary = jQuery('<div class="summary"></div>').appendTo(result);
			var resumme = jQuery('<div class="abstract"></div>').appendTo(result);

			var interval = ( dataRow[9].length > 0 ) ? ', ' + dataRow[9] + '-' + dataRow[10] : '';

			// Crate annotations container
			annotations.attr('uri', escape(dataRow[0]) );
						
			// Create summary
			summary.append('<h1 class="title">' + dataRow[1] + '</h1>')
				.append('<p></p>')
				.append('<ul></ul>')
				.children('p:first')
					.append('<span class="authors">' + dataRow[11] + '. </span>')
					.append('<span class="summary"><strong>' + dataRow[6] + '</strong>, '+ dataRow[4] +', Volume ' + dataRow[7] + ' (' + dataRow[8] + ')'+ interval +'</span>');
			
			var seeAlso = jQuery('<li>See Also &raquo; </li>').appendTo(summary.children('ul:first'));
			var sameAs = jQuery('<li>Same As &raquo; </li>').appendTo(summary.children('ul:first'));
			var prefix;
			
			jQuery.each( dataRow[2].split(';'), function ( i, value ) {
				seeAlso.append('<a href="' + value + '" class="link" target="_blank">' + value + '</a>');
			});
			
			jQuery.each( dataRow[3].split(';'), function ( i, value ) {
				prefix = ( value.indexOf('doi') != -1 )? "DOI:" : ( value.indexOf('pubmed') != -1 )? "pmid:" : "";
				sameAs.append('<a href="' + value + '" class="link" target="_blank">' + prefix + value.substr( value.lastIndexOf("/") + 1 ) + '</a>');
			});
			
			// Abstract
			resumme.append('<h2 class="title">Abstract</h2>')
			    .append('<p class="text"></p>');

			resumme.children('p')
			    .append(dataRow[5]);
			
			resumme.children('h2')
				.append('<span class="toggle collapse"></span>')
				.append('<span style="display:none;" class="toggle expand"></span>');

			annotations.height( result.outerHeight() );

			return cell.html();
		}

	},

    _showComments: function( contextContainer, comments ) {

        contextContainer.children().fadeOut('slow');
        contextContainer.children().remove();

        var dimension = { width: "90%", height: "100%", left: "5%" };

        var content = jQuery('<div></div>')
            .attr('id', contextContainer.attr('id') +'_content' )
            .appendTo( contextContainer );

        contextContainer
            .animate( dimension,
            function(){
                if ( "string" == typeof comments ) {
                    content.html( '<a href="' + comments + '" class="link" target="_blank">' + comments + '</a>' );

                } else {
                	
            		this._tableOfComments = new Biojs.Table({
                        target: content.attr('id'),
                        columns: ['Comments'],
                        dataSet: comments,
                        pageLength: 1,
                        showColumnSelector: false,
                        rowSelection: false,
                        filter: false
                    });
                	
                }

            }
        );

    }
},
{
	/**
     * Columns for RDF result 
     * @type {Object[]}
     */
	COLUMNS: [    
        { unique: true,  optional: false, name: "Article",  key: "article" },
        { unique: true,  optional: false, name: "Title",    key: "title" },
        { unique: false, optional: false, name: "See Also", key: "seeAlso" },
        { unique: false, optional: false, name: "Same As",  key: "sameAs" },
        { unique: true,  optional: true,  name: "Date",     key: "date" },
        { unique: true,  optional: false, name: "Abstract", key: "abstract" },
        { unique: true,  optional: false, name: "Journal",  key: "journalTitle" },
        { unique: true,  optional: false, name: "Volume",   key: "volume" },
        { unique: true,  optional: true,  name: "Issue",    key: "issue" },
        { unique: true,  optional: false, name: "Start",    key: "start" },
        { unique: true,  optional: false, name: "End",      key: "end" },
        { unique: false, optional: false, name: "Author",   key: "author" }
    ],   
    /**
     * Map to translate the ns prefix to URL
     * @type {Object}
     */        
	DATABASE_URL: {
		uniprotkb: 'http://www.uniprot.org/uniprot/',
		intact: 'http://www.ebi.ac.uk/intact/',
		taxid: 'http://www.uniprot.org/taxonomy/',
		psimi: 'http://www.ebi.ac.uk/ontology-lookup/browse.do?ontName=MI&termId='
	},

	NAMESPACES:
	    'PREFIX  owl:<http://www.w3.org/2002/07/owl#/>' +
        'PREFIX  foaf:<http://xmlns.com/foaf/0.1/>' +
        'PREFIX  xsp:<http://www.owl-ontologies.com/2005/08/07/xsp.owl#/>' +
        'PREFIX  ao:<http://purl.org/ao/core/>' +
        'PREFIX  aot:<http://purl.org/ao/types/>' +
        'PREFIX  aos:<http://purl.org/ao/selectors/>' +
        'PREFIX  aoa:<http://purl.org/ao/annotea/>' +
        'PREFIX  aof:<http://purl.org/ao/foaf/>' +
        'PREFIX  pav:<http://purl.org/swan/pav/provenance/>' +
        'PREFIX  aold:<http://biotea.ws/ontologies/aold/>' +
        'PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#/>' +
        'PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#/>' +
        'PREFIX  doco:<http://purl.org/spar/doco/>' +
        'PREFIX  bibo:<http://purl.org/ontology/bibo/>' +
        'PREFIX  sioc:<http://rdfs.org/sioc/ns#/>' +
        'PREFIX  dcterms:<http://purl.org/dc/terms/>' +
        'PREFIX  dc:<http://purl.org/dc/elements/1.1/>' +
        'PREFIX  chebi:<http://purl.obolibrary.org/obo/CHEBI_/>' +
        'PREFIX  go:<http://purl.org/obo/owl/GO#GO_/>' +
        'PREFIX  pw:<http://purl.org/obo/owl/PW#PW_/>' +
        'PREFIX  mged:<http://mged.sourceforge.net/ontologies/MGEDOntology.owl#/>' +
        'PREFIX  uniprot:<http://purl.uniprot.org/core/>' +
        'PREFIX  taxonomy:<http://www.uniprot.org/taxonomy/>' +
        'PREFIX  mddb:<http://purl.bioontology.org/ontology/MDDB/>' +
        'PREFIX  nddf:<http://purl.bioontology.org/ontology/NDDF/>' +
        'PREFIX  ndfrt:<http://purl.bioontology.org/ontology/NDFRT/>' +
        'PREFIX  medline:<http://purl.bioontology.org/ontology/MEDLINEPLUS/>' +
        'PREFIX  snomed:<http://purl.bioontology.org/ontology/SNOMEDCT/>' +
        'PREFIX  symptom:<http://purl.org/obo/owl/SYMP#SYMP_/>' +
        'PREFIX  meddra:<http://purl.bioontology.org/ontology/MDR/>' +
        'PREFIX  mesh:<http://purl.bioontology.org/ontology/MSH/>' +
        'PREFIX  bio2rdf_mesh:<http://bio2rdf.org/ns/mesh#/>' +
        'PREFIX  omim:<http://purl.bioontology.org/ontology/OMIM/>' +
        'PREFIX  fma:<http://purl.org/obo/owl/FMA#FMA_/>' +
        'PREFIX  icd9:<http://purl.bioontology.org/ontology/ICD9-9/>' +
        'PREFIX  obi:<http://purl.obolibrary.org/obo/OBI_/>' +
        'PREFIX  umls:<http://berkeleybop.org/obo/UMLS:/>' +
        'PREFIX  po:<http://purl.bioontology.org/ontology/PO/>' +
        'PREFIX  ncithesaurus :<http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl#/>' +
        'PREFIX  ncbitaxon:<http://purl.org/obo/owl/NCBITaxon#NCBITaxon_/>' +
        'PREFIX  bio2rdf_ns:<http://bio2rdf.org/ns/bio2rdf#/>' +
        'PREFIX  gw_wiki:<http://genewikiplus.org/wiki/Special:URIResolver/>' +
        'PREFIX gw_property:<http://genewikiplus.org/wiki/Special:URIResolver/Property-3A>'
});

function dataTable(){
	var data = { 
			  "head": { 
				    "link": [], 
					"vars": ["article", "title", "seeAlso", "sameAs", "date", "abstract", "journalTitle", "volume", "issue", "start", "end", "author"] 
				  },
				  "results": { 
				    "distinct": false, 
				    "ordered": true, 
				    "bindings": [
				      { 
				        "article": { "type": "uri", "value": "http://biotea.idiginfo.org/msrcdoc/id/8" }	, 
				        "title": { "type": "literal", "value": "Subsyndromal Posttraumatic Stress Disorder Symptomatology in Primary Care Military Veterans: Treatment Implications" }	, 
				        "seeAlso": { "type": "uri", "value": "" }	, 
				        "sameAs": { "type": "uri", "value": "" }	, 
				        "date": { "type": "literal", "value": "2012" }	, 
				        "abstract": { "type": "literal", "value": "Subsyndromal posttraumatic stress disorder (PTSD) is highly prevalent in Veterans Affairs Medical Centers' primary-care clinics and is associated with significant impairment. We used a cross-sectional design to examine PTSD symptoms and depressive disorders endorsed by two cohorts of Veterans meeting less than full PTSD criteria who presented to primary care at the Philadelphia VA Medical Center (i.e., those from Operation Enduring Freedom/Operation Iraqi Freedom/Operation New Dawn (OEF/OIF/OND) and non-OEF/OIF/OND Veterans). The Philadelphia VA Behavioral Health Lab (BHL) assessed 141 Veterans who screened positive for subsyndromal PTSD. Avoidance was endorsed significantly less often than arousal in the total group. When the groups were split by cohort era, higher levels of avoidance and lower levels of arousal were reported in the non-OEF/OIF/OND group than the OEF/OIF/OND group. Comorbid depression was present in 43.9% of the total group with no significant differences between groups. Exposure-based treatments for PTSD offered in specialty mental health clinics target avoidance symptoms. Because the endorsement of avoidance symptoms was low in both of the cohorts that were studied this may not be the most effective treatment target for Veterans with subsyndromal PTSD receiving treatment in primary care settings. For these Veterans, treatments that target reexperiencing and arousal symptoms and/or comorbid depression may be more effective. " }	, 
				        "journalTitle": { "type": "literal", "value": "Psychological Services" }	, 
				        "volume": { "type": "literal", "value": "9" }	, 
				        "start": { "type": "literal", "value": "383" }	, 
				        "end": { "type": "literal", "value": "389" }	, 
				        "author": { "type": "literal", "value": "Kornfield, Sarah L." }
					  },
					  { 
				        "article": { "type": "uri", "value": "http://biotea.idiginfo.org/msrcdoc/id/8" }	, 
				        "title": { "type": "literal", "value": "Subsyndromal Posttraumatic Stress Disorder Symptomatology in Primary Care Military Veterans: Treatment Implications" }	, 
				        "seeAlso": { "type": "uri", "value": "" }	, 
				        "sameAs": { "type": "uri", "value": "" }	, 
				        "date": { "type": "literal", "value": "2012" }	, 
				        "abstract": { "type": "literal", "value": "Subsyndromal posttraumatic stress disorder (PTSD) is highly prevalent in Veterans Affairs Medical Centers' primary-care clinics and is associated with significant impairment. We used a cross-sectional design to examine PTSD symptoms and depressive disorders endorsed by two cohorts of Veterans meeting less than full PTSD criteria who presented to primary care at the Philadelphia VA Medical Center (i.e., those from Operation Enduring Freedom/Operation Iraqi Freedom/Operation New Dawn (OEF/OIF/OND) and non-OEF/OIF/OND Veterans). The Philadelphia VA Behavioral Health Lab (BHL) assessed 141 Veterans who screened positive for subsyndromal PTSD. Avoidance was endorsed significantly less often than arousal in the total group. When the groups were split by cohort era, higher levels of avoidance and lower levels of arousal were reported in the non-OEF/OIF/OND group than the OEF/OIF/OND group. Comorbid depression was present in 43.9% of the total group with no significant differences between groups. Exposure-based treatments for PTSD offered in specialty mental health clinics target avoidance symptoms. Because the endorsement of avoidance symptoms was low in both of the cohorts that were studied this may not be the most effective treatment target for Veterans with subsyndromal PTSD receiving treatment in primary care settings. For these Veterans, treatments that target reexperiencing and arousal symptoms and/or comorbid depression may be more effective. " }	, 
				        "journalTitle": { "type": "literal", "value": "Psychological Services" }	, 
				        "volume": { "type": "literal", "value": "9" }	, 
				        "start": { "type": "literal", "value": "383" }	, 
				        "end": { "type": "literal", "value": "389" }	, 
				        "author": { "type": "literal", "value": "Klaus, Johanna" }
					  },
					  { 
				        "article": { "type": "uri", "value": "http://biotea.idiginfo.org/msrcdoc/id/8" }	, 
				        "title": { "type": "literal", "value": "Subsyndromal Posttraumatic Stress Disorder Symptomatology in Primary Care Military Veterans: Treatment Implications" }	, 
				        "seeAlso": { "type": "uri", "value": "" }	, 
				        "sameAs": { "type": "uri", "value": "" }	, 
				        "date": { "type": "literal", "value": "2012" }	, 
				        "abstract": { "type": "literal", "value": "Subsyndromal posttraumatic stress disorder (PTSD) is highly prevalent in Veterans Affairs Medical Centers' primary-care clinics and is associated with significant impairment. We used a cross-sectional design to examine PTSD symptoms and depressive disorders endorsed by two cohorts of Veterans meeting less than full PTSD criteria who presented to primary care at the Philadelphia VA Medical Center (i.e., those from Operation Enduring Freedom/Operation Iraqi Freedom/Operation New Dawn (OEF/OIF/OND) and non-OEF/OIF/OND Veterans). The Philadelphia VA Behavioral Health Lab (BHL) assessed 141 Veterans who screened positive for subsyndromal PTSD. Avoidance was endorsed significantly less often than arousal in the total group. When the groups were split by cohort era, higher levels of avoidance and lower levels of arousal were reported in the non-OEF/OIF/OND group than the OEF/OIF/OND group. Comorbid depression was present in 43.9% of the total group with no significant differences between groups. Exposure-based treatments for PTSD offered in specialty mental health clinics target avoidance symptoms. Because the endorsement of avoidance symptoms was low in both of the cohorts that were studied this may not be the most effective treatment target for Veterans with subsyndromal PTSD receiving treatment in primary care settings. For these Veterans, treatments that target reexperiencing and arousal symptoms and/or comorbid depression may be more effective. " }	, 
				        "journalTitle": { "type": "literal", "value": "Psychological Services" }	, 
				        "volume": { "type": "literal", "value": "9" }	, 
				        "start": { "type": "literal", "value": "383" }	, 
				        "end": { "type": "literal", "value": "389" }	, 
				        "author": { "type": "literal", "value": "McKay, Caroline" }
					  },
					  { 
				        "article": { "type": "uri", "value": "http://biotea.idiginfo.org/msrcdoc/id/8" }	, 
				        "title": { "type": "literal", "value": "Subsyndromal Posttraumatic Stress Disorder Symptomatology in Primary Care Military Veterans: Treatment Implications" }	, 
				        "seeAlso": { "type": "uri", "value": "" }	, 
				        "sameAs": { "type": "uri", "value": "" }	, 
				        "date": { "type": "literal", "value": "2012" }	, 
				        "abstract": { "type": "literal", "value": "Subsyndromal posttraumatic stress disorder (PTSD) is highly prevalent in Veterans Affairs Medical Centers' primary-care clinics and is associated with significant impairment. We used a cross-sectional design to examine PTSD symptoms and depressive disorders endorsed by two cohorts of Veterans meeting less than full PTSD criteria who presented to primary care at the Philadelphia VA Medical Center (i.e., those from Operation Enduring Freedom/Operation Iraqi Freedom/Operation New Dawn (OEF/OIF/OND) and non-OEF/OIF/OND Veterans). The Philadelphia VA Behavioral Health Lab (BHL) assessed 141 Veterans who screened positive for subsyndromal PTSD. Avoidance was endorsed significantly less often than arousal in the total group. When the groups were split by cohort era, higher levels of avoidance and lower levels of arousal were reported in the non-OEF/OIF/OND group than the OEF/OIF/OND group. Comorbid depression was present in 43.9% of the total group with no significant differences between groups. Exposure-based treatments for PTSD offered in specialty mental health clinics target avoidance symptoms. Because the endorsement of avoidance symptoms was low in both of the cohorts that were studied this may not be the most effective treatment target for Veterans with subsyndromal PTSD receiving treatment in primary care settings. For these Veterans, treatments that target reexperiencing and arousal symptoms and/or comorbid depression may be more effective. " }	, 
				        "journalTitle": { "type": "literal", "value": "Psychological Services" }	, 
				        "volume": { "type": "literal", "value": "9" }	, 
				        "start": { "type": "literal", "value": "383" }	, 
				        "end": { "type": "literal", "value": "389" }	, 
				        "author": { "type": "literal", "value": "Helstrom, Amy" }
					  },
					  { 
				        "article": { "type": "uri", "value": "http://biotea.idiginfo.org/msrcdoc/id/8" }	, 
				        "title": { "type": "literal", "value": "Subsyndromal Posttraumatic Stress Disorder Symptomatology in Primary Care Military Veterans: Treatment Implications" }	, 
				        "seeAlso": { "type": "uri", "value": "" }	, 
				        "sameAs": { "type": "uri", "value": "" }	, 
				        "date": { "type": "literal", "value": "2012" }	, 
				        "abstract": { "type": "literal", "value": "Subsyndromal posttraumatic stress disorder (PTSD) is highly prevalent in Veterans Affairs Medical Centers' primary-care clinics and is associated with significant impairment. We used a cross-sectional design to examine PTSD symptoms and depressive disorders endorsed by two cohorts of Veterans meeting less than full PTSD criteria who presented to primary care at the Philadelphia VA Medical Center (i.e., those from Operation Enduring Freedom/Operation Iraqi Freedom/Operation New Dawn (OEF/OIF/OND) and non-OEF/OIF/OND Veterans). The Philadelphia VA Behavioral Health Lab (BHL) assessed 141 Veterans who screened positive for subsyndromal PTSD. Avoidance was endorsed significantly less often than arousal in the total group. When the groups were split by cohort era, higher levels of avoidance and lower levels of arousal were reported in the non-OEF/OIF/OND group than the OEF/OIF/OND group. Comorbid depression was present in 43.9% of the total group with no significant differences between groups. Exposure-based treatments for PTSD offered in specialty mental health clinics target avoidance symptoms. Because the endorsement of avoidance symptoms was low in both of the cohorts that were studied this may not be the most effective treatment target for Veterans with subsyndromal PTSD receiving treatment in primary care settings. For these Veterans, treatments that target reexperiencing and arousal symptoms and/or comorbid depression may be more effective. " }	, 
				        "journalTitle": { "type": "literal", "value": "Psychological Services" }	, 
				        "volume": { "type": "literal", "value": "9" }	, 
				        "start": { "type": "literal", "value": "383" }	, 
				        "end": { "type": "literal", "value": "389" }	, 
				        "author": { "type": "literal", "value": "Oslin, David" }
					  }
				    ] 
				  }
				};
	return data;
}
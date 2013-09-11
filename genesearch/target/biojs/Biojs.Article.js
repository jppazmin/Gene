
Biojs.Article=Biojs.extend({constructor:function(options){this._container=jQuery('#'+this.opt.target).addClass('Article');this._articleContainer=jQuery('<div class="content">').appendTo(this._container);this._initialize(this._articleContainer);},opt:{target:"YourOwnDivId",sparqlUrl:'http://biotea.idiginfo.org/sparql',proxyUrl:'../biojs/dependencies/proxy/proxy.php'},eventTypes:["onAnnotationsLoaded"],_initialize:function(container){this._title=jQuery('<h1></h1>').appendTo(container);this._authors=jQuery('<span class="authors"></span>').appendTo(container);this._summary=jQuery('<span class="summary"></span>').appendTo(container);this._abstract=jQuery('<p class="abstract"></p>').appendTo(container);this._seeAlso=jQuery('<ul class="seeAlso"></ul>').appendTo(container);this._sameAs=jQuery('<ul class="sameAs"></ul>').appendTo(container);this._annotationsTitle=jQuery('<h1>Annotations Cloud</h1>').appendTo(container);this._annotations=jQuery('<ul class="annotations"></ul>').appendTo(container);this._referencesTitle=jQuery('<h1>References</h1>').appendTo(container);this._references=jQuery('<ul class="references"></ul>').appendTo(container);},setData:function(dataRow){var self=this;var seeAlso=dataRow[2].split(';');var interval=(dataRow[9].length>0)?', '+dataRow[9]+'-'+dataRow[10]:'';var sameAs=dataRow[3].split(';');this._title.html(dataRow[1]);this._authors.html(dataRow[11]);this._summary.html('<strong>'+dataRow[6]+'</strong>, '+dataRow[4]+', Volume '+dataRow[7]+' ('+dataRow[8]+')'+interval);this._abstract.html('<strong>Abstract: </strong>'+dataRow[5]);this._seeAlso.html('');this._sameAs.html('');this._annotations.html('Loading...').css('text-align','left');this._references.html('Loading...');jQuery.each(seeAlso,function(i,value){self._seeAlso.append('<li><a href="'+value+'">'+value+'</a></li>');});jQuery.each(sameAs,function(i,value){var prefix=(value.indexOf('doi')!=-1)?"DOI:":(value.indexOf('pubmed')!=-1)?"pmid:":"";self._sameAs.append('<li><a href="'+value+'">'+prefix+value.substr(value.lastIndexOf("/")+1)+'</a></li>');});this._setAnnotations(dataRow[0],this._annotations);this._setReferences(dataRow[0],this._references);},_setAnnotations:function(resourceURI,node){var terms;this._requestAnnotations(resourceURI,function(data){this._annotations.html('').css('text-align','center');terms=this._decodeAnnotations(data);jQuery.each(terms,function(term,topics){var termNode=jQuery('<li class="term"><span class="name">'+term.toLowerCase()+'</span></li>');var topicList=jQuery('<span class="topics" style="display:none"></span>').appendTo(termNode);var pattern=/(#|_|:|\/)([A-Za-z0-9])*$/g;var topic,topicKey,identifier,freq=0;for(t in topics){try{topicKey=topics[t].replace(pattern,'');topic=Biojs.Article.TOPIC[topicKey];identifier=(topics[t].match(pattern)[0]).substr(1);jQuery('<a class="topic '+topic.shortName+'">'+topic.prefix+identifier+'</a>').attr({href:topic.baseUrl+identifier,topicType:topic.shortName,topicId:identifier}).appendTo(topicList);freq++;}catch(e){Biojs.console.log("Error searching topic for "+topics[t]+". message:"+e.message);}}
if(topicList.children().length>0){topicList.last().addClass("last");termNode.appendTo(node);}
termNode.children(':first-child').css({"fontSize":(freq/10<1)?freq/10+1+"em":(freq/10>2)?"2em":freq/10+"em","cursor":'pointer'}).click(function(){node.find('.topics').hide();topicList.toggle();}).append('<span style="vertical-align:super; font-size:10px;">'+freq+'</super>');});Biojs.console.log("Raising event "+Biojs.Article.EVT_ON_ANNOTATIONS_LOADED);this.raiseEvent(Biojs.Article.EVT_ON_ANNOTATIONS_LOADED,{uri:resourceURI});});},_requestAnnotations:function(resourceURI,actionCb){strQuery='select ?annot fn:upper-case(str(?body)) AS ?term ?topic str(?init) AS ?posInit str(?end) AS ?posEnd ?comment '+'   where { '+'     ?annot a aot:ExactQualifier ; '+'     ao:annotatesResource <'+resourceURI+'>;'+'     ao:body ?body ; '+'     ao:hasTopic ?topic ;'+'     ao:context ?context . '+'     ?context rdfs:resource ?resource . '+'     OPTIONAL {?context aos:init ?init }. '+'     OPTIONAL {?context aos:end ?end } . '+'     ?resource rdfs:comment ?comment .  '+'     FILTER (regex(str(?topic), "(uniprot|GO|CHEBI|ICD9|UMLS|fma|MSH|PO|MDDB|NDDF|NDFRT|NCBITaxon)")) . '+'} ORDER BY ?term ?topic';this._doSparqlQuery(this.opt,strQuery,'application/json',actionCb);},_setReferences:function(resourceURI,node){var references;this._requestReferences(resourceURI,function(data){references=this._decodeReferences(data);if(Biojs.Utils.isEmpty(references)){jQuery(node).html('No references available');}else{jQuery.each(references,function(refId,ref){var interval="";if(ref.complete){interval=(ref.start.length>0)?', '+ref.start+'-'+ref.end:'';'<li>'+ref.author+'. <strong>'+ref.jornalTitle+'</strong>, '+ref.data+', Volume '+ref.volume+' ('+ref.issue+')'+interval+'</li>';}else{jQuery(node).append('<li>'+ref.title+'</li>');}});}});},_requestReferences:function(resourceURI,actionCb){strQuery='select fn:substring(?ref, 82) AS ?refId ?title ?sameAs ?date ?journalTitle ?volume ?issue ?start ?end fn:concat(?authorLastName, ", ", ?authorFirstName) AS ?author '+'where { '+'   { <'+resourceURI+'> bibo:cites ?ref.'+'      ?ref dcterms:title ?title ;  '+'      owl:sameAs ?sameAs ;  '+'      dcterms:publisher ?publisher ;  '+'      bibo:volume ?volume ;  '+'      bibo:pageStart ?start ; '+'      bibo:pageEnd ?end ;  '+'      dcterms:issued ?date ;   '+'      bibo:authorList ?authorList . '+'      OPTIONAL {?ref bibo:issue ?issue } . '+'      ?publisher dcterms:title ?journalTitle . '+'      ?authorList rdfs:member ?member .  '+'      ?member foaf:givenName ?authorFirstName ; '+'      foaf:familyName ?authorLastName. '+'   } UNION { <'+resourceURI+'> bibo:cites ?ref. '+'      ?ref dcterms:title ?title . '+'      OPTIONAL {?ref dcterms:publisher ?publisher } '+'      FILTER (!bound(?publisher)) '+'   } '+'} ORDER BY ?refId ';Biojs.console.log("SPARQL query for refs: "+strQuery);this._doSparqlQuery(this.opt,strQuery,'application/json',actionCb);},_doSparqlQuery:function(opt,query,format,actionCb){var self=this;var dataParams=[];dataParams.push({name:"url",value:opt.sparqlUrl});dataParams.push({name:"query",value:escape(query)});dataParams.push({name:"format",value:format});Biojs.console.log("Requesting Query: "+query);jQuery.ajax({url:opt.proxyUrl,dataType:"text",data:dataParams,success:function(data){Biojs.console.log("Data received");actionCb.call(self,data);}});},_decodeAnnotations:function(dataReceived){var decodedData={};var results=[];var obj;var terms={};try{decodedData=jQuery.parseJSON(dataReceived);results=decodedData.results.bindings;}catch(e){Biojs.console.log("Error decoding response data: "+e.message);return jsonData;}
for(r in results){obj=results[r];if(!terms.hasOwnProperty(obj.term.value)){terms[obj.term.value]={};}
terms[obj.term.value][obj.topic.value]=obj.topic.value;}
return terms;},_decodeReferences:function(dataReceived){var decodedData={};var results=[];var obj;var refs={};try{decodedData=jQuery.parseJSON(dataReceived);results=decodedData.results.bindings;Biojs.console.log("References:");for(r in results){obj=results[r];if(!refs.hasOwnProperty(obj.refId.value)){var reference=refs[obj.refId.value]={};reference.title=obj.title.value;try{reference.author=obj.author.value;reference.sameAs=obj.sameAs.value;reference.date=obj.date.value;reference.journalTitle=obj.journalTitle.value;reference.volume=obj.volume.value;reference.issue=obj.issue.value;reference.start=obj.start.value;reference.end=obj.end.value;reference.complete=true;}catch(e){reference.complete=false;continue;}}else{reference.sameAs+=", "+obj.sameAs.value;reference.author+=", "+obj.author.value;}}}catch(e){Biojs.console.log("Error decoding response data: "+e.message);}
return refs;}},{EVT_ON_ANNOTATIONS_LOADED:'onAnnotationsLoaded',TOPIC:{"http://purl.obolibrary.org/obo/CHEBI":{shortName:"chebi",baseUrl:"http://identifiers.org/obo.chebi/CHEBI:",prefix:"CHEBI:"},"http://purl.org/obo/owl/GO#GO":{shortName:"go",baseUrl:"http://identifiers.org/obo.go/GO:",prefix:""},"http://purl.org/obo/owl/PW#PW":{shortName:"pw",baseUrl:"http://purl.org/obo/owl/PW#PW_",prefix:""},"http://mged.sourceforge.net/ontologies/MGEDOntology.owl":{shortName:"mged",baseUrl:"http://mged.sourceforge.net/ontologies/MGEDOntology.owl#",prefix:""},"http://purl.uniprot.org/core":{shortName:"uniprot",baseUrl:"http://identifiers.org/uniprot/",prefix:""},"http://purl.bioontology.org/ontology/MDDB":{shortName:"mddb",baseUrl:"http://purl.bioontology.org/ontology/MDDB/",prefix:""},"http://purl.bioontology.org/ontology/NDDF":{shortName:"nddf",baseUrl:"http://purl.bioontology.org/ontology/NDDF/",prefix:""},"http://purl.bioontology.org/ontology/NDFRT":{shortName:"ndfrt",baseUrl:"http://purl.bioontology.org/ontology/NDFRT/",prefix:""},"http://purl.bioontology.org/ontology/MEDLINEPLUS":{shortName:"medline",baseUrl:"http://purl.bioontology.org/ontology/MEDLINEPLUS/",prefix:""},"http://purl.bioontology.org/ontology/SNOMEDCT":{shortName:"snomed",baseUrl:"http://purl.bioontology.org/ontology/SNOMEDCT/",prefix:""},"http://purl.org/obo/owl/SYMP#SYMP":{shortName:"symptom",baseUrl:"http://purl.org/obo/owl/SYMP#SYMP_",prefix:""},"http://purl.bioontology.org/ontology/MDR":{shortName:"meddra",baseUrl:"http://purl.bioontology.org/ontology/MDR/",prefix:""},"http://purl.bioontology.org/ontology/MSH":{shortName:"mesh",baseUrl:"http://purl.bioontology.org/ontology/MSH/",prefix:""},"http://bio2rdf.org/ns/mesh":{shortName:"bio2rdf_mesh",baseUrl:"http://bio2rdf.org/ns/mesh#",prefix:""},"http://purl.bioontology.org/ontology/OMIM":{shortName:"omim",baseUrl:"http://identifiers.org/omim/",prefix:""},"http://purl.bioontology.org/ontology/ICD9-9":{shortName:"icd9",baseUrl:"http://identifiers.org/icd/",prefix:""},"http://www.ifomis.org/bfo/1.1/span":{shortName:"obi",baseUrl:"http://identifiers.org/obo.obi/OBI_",prefix:""},"http://berkeleybop.org/obo/UMLS":{shortName:"umls",baseUrl:"http://berkeleybop.org/obo/UMLS:",prefix:""},"http://purl.bioontology.org/ontology/PO":{shortName:"po",baseUrl:"http://purl.bioontology.org/ontology/PO/",prefix:""},"http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl":{shortName:"ncithesaurus",baseUrl:"http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl",prefix:""},"http://purl.org/obo/owl/NCBITaxon#NCBITaxon":{shortName:"ncbitaxon",baseUrl:"http://identifiers.org/taxonomy/",prefix:""}}});
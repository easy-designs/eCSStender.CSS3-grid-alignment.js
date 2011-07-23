/*------------------------------------------------------------------------------
Function:				eCSStender.CSS3-grid-alignment.js
Author:					Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:	2011-06-23
Version:				0.1
Homepage:				http://github.com/easy-designs/eCSStender.CSS3-grid-alignment.js
License:				MIT License 
Note:						If you change or improve on this script, please let us know by
								emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
(function(e){
	
	if ( typeof e == 'undefined' ){ return; }
	
	var
	UNDEFINED,
	NULL		= null,
	TRUE		= true,
	FALSE		= false,
	WINDOW		= window,
	DOCUMENT	= document,
	DOCELMT		= DOCUMENT.documentElement,
	
	PROPERTY	= 'property',
	MOZ			= '-moz-',
	MS			= '-ms-',
	WEBKIT		= '-webkit-',
	KHTML		= '-khtml-',
	OPERA		= '-o-',
	SPACE		= ' ',
	COLON		= ': ',
	SEMICOL		= '; ',
	DISPLAY		= 'display',
	ONRESIZE	= 'onresize',
	
	// properties, etc.
	GRID				= 'grid',
	INLINEGRID			= "inline-grid",
	GRIDCOLUMNS			= "grid-columns",
	GRIDCOLUMN			= "grid-column",
	GRIDCOLUMNSPAN		= "grid-column-span",
	GRIDCOLUMNALIGN		= "grid-column-align",
	GRIDROWS 			= "grid-rows",
	GRIDROW				= "grid-row",
	GRIDROWSPAN			= "grid-row-span",
	GRIDROWALIGN		= "grid-row-align",
	BOXSIZING			= "box-sizing",
	BLOCKPROGRESSION	= "block-progression",

	precision					= 0, // decimal places
	agentTruncatesLayoutLengths	= TRUE,

	regexSpaces = /\s+/,
	intrinsicSizeCalculatorElement			= NULL,
	intrinsicSizeCalculatorElementParent	= NULL,
	
	calculatorOperationEnum					= {
		minWidth: {},
		maxWidth: {},
		minHeight: {},
		maxHeight: {},
		shrinkToFit: {}
	},
	gridTrackValueEnum = {
		  auto: { keyword: "auto" },
		  minContent: { keyword: "min-content" },
		  maxContent: { keyword: "max-content" },
		  fitContent: { keyword: "fit-content" },
		  minmax: { keyword: "minmax" }
	},
	gridAlignEnum = {
		  stretch: { keyword: "stretch" },
		  start: { keyword: "start" },
		  end: { keyword: "end" },
		  center: { keyword: "center" }
	},
	positionEnum = {
		  'static': { keyword: "static" },
		  relative: { keyword: "relative" },
		  absolute: { keyword: "absolute" },
		  fixed: { keyword: "fixed" }
	},
	blockProgressionEnum = {
		  tb: { keyword: "tb" },
		  bt: { keyword: "bt" },
		  lr: { keyword: "lr" },
		  rl: { keyword: "rl" }
	},
	sizingTypeEnum = {
		  valueAndUnit: {},
		  keyword: {}
	},
	
	// aliasing eCSStender's built-ins
	getCSSValue = e.getCSSValue;
	
	// helpers
	function defined( test )
	{
		return test != UNDEFINED;
	}
	function select( selector, context )
	{
		if ( defined( document.querySelectorAll ) )
		{
			select = function( selector, context )
			{
				return (context||document).querySelectorAll(selector);
			};
		}
		// jQuery fallback
		else
		{
			if ( ! defined( window.jQuery ) )
			{
				e.loadScript(
					'http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js',
					function(){
						select( selector, context );
					});
			}
			select = function( selector, context )
			{
				return window.jQuery(selector, context).get();
			};
		}
		return select( selector, context );
	}
	function elementMatchesSelector( element, selector )
	{
		if ( defined( element.matchesSelector ) )
		{
			elementMatchesSelector = function( element, selector )
			{
				return element.matchesSelector( selector );
			};
		}
		else if ( defined( element.mozMatchesSelector ) )
		{
			elementMatchesSelector = function( element, selector )
			{
				return element.mozMatchesSelector( selector );
			};
		}
		else if ( defined( element.webkitMatchesSelector ) )
		{
			elementMatchesSelector = function( element, selector )
			{
				return element.webkitMatchesSelector( selector );
			};
		}
		else
		{
			var
			testStyleSheet = e.newStyleElement('screen','selector-matching-test',false);
			elementMatchesSelector = function( element, selector )
			{
				var
				property	= 'page-break-after',
				value		= 'avoid',
				ret;
				
				e.addRules( testStyleSheet, selector+'{'+property+':'+value+'};' );
				ret = ( e.getCSSValue( element, property ) == value );
				emptyStyleSheet( testStyleSheet );
				return ret;
			};
		}
		return elementMatchesSelector( element, selector );
	}
	function emptyStyleSheet( stylesheet )
	{
		if ( defined( stylesheet.styleSheet ) )
		{
			emptyStyleSheet = function( stylesheet ) 
			{
				stylesheet.styleSheet.cssText = '';
			};
		}
		else
		{
			emptyStyleSheet = function( stylesheet ) 
			{
				stylesheet.innerHTML = '';
			};
		}
		emptyStyleSheet( stylesheet );
	}
		
	e.register(
		{
			property:		DISPLAY,
			filter:			{ value: /(inline-)?grid/ },
			test:			function()
			{
				return ! e.isSupported( PROPERTY, DISPLAY, GRID );
			},
			fingerprint:	'net.easy-designs.' + GRID
		},
		'*',
		function( selector, properties, media, specificity )
		{
			var bullpen = e.lookup(
				{ fragment: GRID },
				'*'
			);

			function gridify( selector, properties, media, specificity )
			{
				var
				els		= select( selector ),
				eLen	= els.length,
				children, grid_items, c, b, found, f,
				gridObject;

				// loop
				// TODO: Don't forget non-layed out children
				while ( eLen-- )
				{
					children	= els[eLen].children;
					grid_items	= [];

					// determine which elements in the bullpen are 
					// actual children of this element
					c = children.length;
					while ( c-- )
					{
						b = bullpen.length;
						while ( b-- )
						{
							found	= select( bullpen[b]['selector'] );
							f		= found.length;
							while ( f-- )
							{
								if ( found[f] == children[c] )
								{
									grid_items.push({
										element: children[c],
										details: bullpen[b]
									});
									break;
								}
							}
						}
					}
					new Grid( els[eLen], selector, properties, media, grid_items );
				}
			}
			
			// trigger the actual function and re-define the callback
			gridify( selector, properties, media, specificity );
			return gridify;
		}
	
	);
	
	function WidthAndHeight()
	{
		this.width	= NULL;
		this.height = NULL;
	}
	
	function CSSValueAndUnit()
	{
		this.value	= NULL;
		this.unit	= NULL;
	}
	
	function Grid( element, selector, properties, media, grid_items )
	{
		this.gridElement				= element;
		this.selector					= selector;
		this.properties					= properties;
		this.media						= media;
		this.grid_items					= grid_items;
		this.blockProgression			= this.blockProgressionStringToEnum(
											getCSSValue( element, BLOCKPROGRESSION )
										  );
		this.availableSpaceForColumns	= NULL;
		this.availableSpaceForRows		= NULL;
		this.items						= NULL;
		this.columnTrackManager			= new TrackManager();
		this.rowTrackManager			= new TrackManager();
		this.useAlternateFractionalSizingForColumns = FALSE;
		this.useAlternateFractionalSizingForRows	= FALSE;
		
		this.setup();
	}
	Grid.prototype.setup = function()
	{
		var
		gridElement = this.gridElement,
		gridCols	= this.properties['grid-columns'] || 'none',
		gridRows	= this.properties['grid-rows'] || 'none';

		// console.log('laying out');

		// Get the available space for the grid since it is required
		// for determining track sizes for auto/fit-content/minmax 
		// and fractional tracks.
		this.determineGridAvailableSpace();

		// console.log( "Grid element content available space: columns = " + 
		//			 this.availableSpaceForColumns.getPixelValueString() + "; rows = " +
		//			 this.availableSpaceForRows.getPixelValueString() );
        
		GridTest.propertyParser.parseGridTracksString( gridCols, this.columnTrackManager );
		GridTest.propertyParser.parseGridTracksString( gridRows, this.rowTrackManager );
        
		this.mapGridItemsToTracks();
		this.saveItemPositioningTypes();
		
		this.determineTrackSizes( "width" );
		this.determineTrackSizes( "height" );
        
		this.calculateGridItemShrinkToFitSizes();
        
		//this.verifyGridItemSizes();
		//this.verifyGridItemPositions(gridObject);
        // console.log(this);
		this.layout();
		//return ! this.error;
	};
	Grid.prototype.layout = function()
	{
		// console.log('laying out now');
		var
		items		= this.items,
		i			= items.length,
		item, details, position, dimensions,
		styles		= '',
		gridstyles	= '',
		height		= 0,
		calcHeight	= ( this.availableSpaceForRows.internalMeasure < 1 ),
		rows		= this.rowTrackManager.tracks,
		width		= 0,
		calcWidth	= ( this.availableSpaceForColumns.internalMeasure < 1 ),
		cols		= this.columnTrackManager.tracks;
		
		while ( i-- )
		{
			item		= items[i];
			details		= item.styles;
			newclass	= e.makeUniqueClass();
			e.addClass( item.itemElement, newclass );
			position	= this.getPosition( item );
			dimensions	= this.getDimensions( item );
			styles += details.selector + '.' + newclass + '{position: absolute;';
			styles += 'top:' + position.top + ';';
			styles += 'left:' + position.left + ';';
			styles += 'width:' + dimensions.width + 'px;';
			styles += 'height:' + dimensions.height + 'px;';
			styles += '}';
		}
				
		// console.log(getCSSValue( this.gridElement, 'position' ));
		if ( getCSSValue( this.gridElement, 'position' ) == 'static' )
		{
			gridstyles += 'position: relative;';
		}
		if ( calcHeight )
		{ 
			i = rows.length;
			while ( i-- )
			{
				height += rows[i].measure.internalMeasure;
			}
			gridstyles += 'height:' + height + 'px;';
		}
		if ( calcWidth )
		{ 
			i = cols.length;
			while ( i-- )
			{
				width += cols[i].measure.internalMeasure;
			}
			gridstyles += 'width:' + width + 'px;';
		}
		if ( gridstyles != '' )
		{
			styles += this.selector + '{' + gridstyles + '}';
		}
		
		// console.log(styles);
		e.embedCSS( styles, this.media );
	};
	Grid.prototype.getPosition = function( item )
	{
		var
		col	= item.column - 1,
		row	= item.row - 1,
		pos	= {
			top:	0,
			left:	0
		};
		while ( col-- )
		{
			pos.left += this.columnTrackManager.tracks[col].measure.internalMeasure;
		}
		while ( row-- )
		{
			pos.top += this.rowTrackManager.tracks[row].measure.internalMeasure;
		}
		
		pos.left += 'px';
		pos.top += 'px';
		return pos;
	};
	Grid.prototype.getDimensions = function( item )
	{
		var
		dimensions	= item.shrinkToFitSize,
		element		= item.itemElement,
		margins = {}, padding = {}, borders = {},
		sides		= ['top','right','bottom','left'],
		s			= sides.length;
		dimensions	= {
			height:	dimensions.height.internalMeasure,
			width:	dimensions.width.internalMeasure
		};
		while ( s-- )
		{
			margins[sides[s]] = parseInt( getCSSValue( element, 'margin-' + sides[s] ), 10 );
			padding[sides[s]] = parseInt( getCSSValue( element, 'padding-' + sides[s] ), 10 );
			borders[sides[s]] = parseInt( getCSSValue( element, 'border-' + sides[s] + '-width' ), 10 );
		}
		dimensions.height -= ( margins.top + margins.bottom + padding.top + padding.bottom + borders.top + borders.bottom );
		dimensions.width -= ( margins.left + margins.right + padding.left + padding.right + borders.left + borders.right );
		return dimensions;
	};
	/* Determines the available space for the grid by:
	 * 1. Swapping in a dummy block|inline-block element where the grid 
	 *    element was with one fractionally sized column and one fractionally sized row,
	 *    causing it to take up all available space.
	 *    a. If getting the cascaded (not used) style is possible (IE only),
	 * 		 copy the same width/height/box-sizing values to ensure the available
	 *	 	 space takes into account explicit constraints.
	 * 2. Querying for the used widths/heights
	 * 3. Swapping back the real grid element
	 * Yes, this depends on the dummy block|inline-block sizing to work correctly.
	 **/
	Grid.prototype.determineGridAvailableSpace = function()
	{
		var
		gridElement			= this.gridElement,
		dummy				= gridElement.cloneNode(),
		gridProperties		= this.properties,
		gridElementParent	= gridElement.parentNode,
		isInlineGrid,
		sides	= ['top','right','bottom','left'],
		s		= sides.length,
		margins = {}, padding = {}, borders = {}, innerHTML, width, height,
		widthToUse, heightToUse, marginToUse, borderWidthToUse, borderStyleToUse, paddingToUse,
		cssText, scrollWidth, scrollHeight, removedElement,
		widthAdjustment, heightAdjustment, widthMeasure, heightMeasure, widthAdjustmentMeasure, heightAdjustmentMeasure;
        
		// we need to get grid props from the passed styles
		isInlineGrid = gridProperties.display === INLINEGRID ? TRUE : FALSE;
        
		// Get each individual margin, border, and padding value for
		// using with calc() when specifying the width/height of the dummy element.
		while ( s-- )
		{
			margins[sides[s]] = getCSSValue( gridElement, 'margin-' + sides[s] );
			padding[sides[s]] = getCSSValue( gridElement, 'padding-' + sides[s] );
			borders[sides[s]] = getCSSValue( gridElement, 'border-' + sides[s] + '-width' );
		}
        
		// If the grid has an explicit width and/or height, that determines the available space for the tracks.
		// If there is none, we need to use alternate fractional sizing. The exception is if we are a non-inline grid;
		// in that case, we are a block element and take up all available width.
		// TODO: ensure we do the right thing for floats.
		// need to remove the content to ensure we get the right height
		dummy.innerHTML = '';
		gridElementParent.insertBefore( dummy, gridElement );
		width = getCSSValue( dummy, 'width' );
		if ( width == '0px' ){ width = 'auto'; }
		if ( width == "auto" &&
		 	 ( isInlineGrid || getCSSValue( gridElement, 'float' ) !== "none" ) )
		{
			this.useAlternateFractionalSizingForColumns = TRUE;
		}
		height = getCSSValue( dummy, 'height' );
		if ( height == '0px' ){ height = 'auto'; }
		if ( height == "auto" )
		{
			this.useAlternateFractionalSizingForRows = TRUE;
		}
		// remove the dummy
		gridElementParent.removeChild( dummy );
        
		// build the straw man for getting dimensions
		dummy = document.createElement( gridElement.tagName );
		widthToUse	= width !== "auto"	? width
										: this.determineSize( 'width', margins, padding, borders );
		heightToUse = height !== "auto" ? height
										: this.determineSize( 'height', margins, padding, borders );
		marginToUse			= getCSSValue( gridElement, 'margin' );
		borderWidthToUse	= getCSSValue( gridElement, 'border-width' );
		borderStyleToUse	= getCSSValue( gridElement, 'border-style' );
		paddingToUse		= getCSSValue( gridElement, 'padding' );
		cssText = "display: " + ( ! isInlineGrid ? "block" : "inline-block" )
				+ "; margin: " + marginToUse + "; border-width: " + borderWidthToUse
				+ "; padding: " + paddingToUse + "; border-style: " + borderStyleToUse
				+ "; width: " + widthToUse
				+ "; height: " + heightToUse
				+ "; box-sizing: " + getCSSValue( gridElement, 'box-sizing' )
				+ "; min-width: " + getCSSValue( gridElement, 'min-width' )
				+ "; min-height: " + getCSSValue( gridElement, 'min-height' )
				+ "; max-width: " + getCSSValue( gridElement, 'max-width' )
				+ "; max-height: " + getCSSValue( gridElement, 'max-height' );
		dummy.style.cssText = cssText;
        
		// Determine width/height (if any) of scrollbars are showing with the grid element on the page.
		scrollWidth		= this.verticalScrollbarWidth();
		scrollHeight	= this.horizontalScrollbarHeight();
        
		// Insert before the real grid element.
		gridElementParent.insertBefore(dummy, gridElement);
		
		// Remove the real grid element.
		removedElement = gridElementParent.removeChild(gridElement);
        
		// The dummy item should never add scrollbars if the grid element didn't.
		widthAdjustment		= width !== "auto" ? 0 : scrollWidth - this.verticalScrollbarWidth();
		heightAdjustment	= height !== "auto" ? 0 : scrollHeight - this.horizontalScrollbarHeight();
        
		// get the final measurements
		widthMeasure			= LayoutMeasure.measureFromStyleProperty( dummy, 'width' );
		heightMeasure			= LayoutMeasure.measureFromStyleProperty( dummy, 'height' );
		widthAdjustmentMeasure	= LayoutMeasure.measureFromPx( widthAdjustment );
		heightAdjustmentMeasure	= LayoutMeasure.measureFromPx( heightAdjustment );
		
		// Get the content width/height; this is the available space for tracks and grid items to be placed in.
		if ( ! this.shouldSwapWidthAndHeight() )
		{
			this.availableSpaceForColumns	= widthMeasure.subtract(widthAdjustmentMeasure);
			this.availableSpaceForRows		= heightMeasure.subtract(heightAdjustmentMeasure);
		}
		else
		{
			this.availableSpaceForColumns	= heightMeasure.subtract(heightAdjustmentMeasure);
			this.availableSpaceForRows		= widthMeasure.subtract(widthAdjustmentMeasure);
		}
        
		// Restore the DOM.
		gridElementParent.insertBefore( removedElement, dummy );
		gridElementParent.removeChild( dummy );
	};
	Grid.prototype.determineSize = function ( dimension, margins, padding, borders )
	{
		var
		parent = this.gridElement.parentNode,
		one	   = dimension == 'width' ? 'left' : 'top',
		two	   = dimension == 'width' ? 'right' : 'bottom',
		size   = dimension == 'width' ? parent.offsetWidth : parent.offsetHeight;
		size  -= getCSSValue( parent, 'border-' + one );
		size  -= getCSSValue( parent, 'padding-' + one );
		size  -= getCSSValue( parent, 'padding-' + two );
		size  -= getCSSValue( parent, 'border-' + two );
		size  -= ( margins[one] + margins[two] );
		size  -= ( borders[one] + borders[two] );
		size  -= ( padding[one] + padding[two] );
		// console.log('size: ' +size);
		return size;
	};
	Grid.prototype.verticalScrollbarWidth = function()
	{
		return ( self.innerWidth - DOCELMT.clientWidth );
	};
	Grid.prototype.horizontalScrollbarHeight = function()
	{
		return ( self.innerHeight - DOCELMT.clientHeight );
	};
	Grid.prototype.mapGridItemsToTracks = function ()
	{
		var
		items	= [],
		i		= this.grid_items.length,
		curItem, column, columnSpan, row, rowSpan,
		columnAlignString, columnAlign, rowAlignString, rowAlign,
		boxSizing, newItem, firstColumn, lastColumn, firstRow, lastRow;
		
		while ( i-- )
		{
			curItem = this.grid_items[i];

			column	= parseInt( curItem.details.properties[GRIDCOLUMN], 10 );
			if ( isNaN(column) )
			{
				this.error = TRUE;
				// console.log("column is NaN");
				column = 1;
			}

			columnSpan = parseInt( curItem.details.properties[GRIDCOLUMNSPAN], 10 );
			if ( isNaN(columnSpan) )
			{
				this.error = TRUE;
				// console.log("column-span is NaN");
				columnSpan = 1;
			}
			
			row = parseInt( curItem.details.properties[GRIDROW], 10 );
			if ( isNaN(row) )
			{
				this.error = TRUE;
				// console.log("row is NaN");
				row = 1;
			}
			
			rowSpan = parseInt( curItem.details.properties[GRIDROWSPAN], 10 );
			if ( isNaN(rowSpan) )
			{
				this.error = TRUE;
				// console.log("row-span is NaN");
				rowSpan = 1;
			}

			columnAlignString = curItem.details.properties[GRIDCOLUMNALIGN] || '';
			if ( columnAlignString.length === 0 )
			{
				this.error = TRUE;
				// console.log("getPropertyValue for " + GRIDCOLUMNALIGN + " is an empty string");
			}
			columnAlign = this.gridAlignStringToEnum(columnAlignString);

			rowAlignString = curItem.details.properties[GRIDROWALIGN] || '';
			if ( rowAlignString.length === 0 )
			{
				this.error = TRUE;
				// console.log("getPropertyValue for " + GRIDROWALIGN + " is an empty string");
			}
			rowAlign = this.gridAlignStringToEnum(rowAlignString);

			// TODO: handle directionality. These properties are physical; we probably need to map them to logical values.
			boxSizing = getCSSValue( curItem.element, BOXSIZING );

			newItem				= new Item();
			newItem.itemElement	= curItem.element;
			newItem.styles		= curItem.details;
			newItem.column		= column;
			newItem.columnSpan	= columnSpan;
			newItem.columnAlign	= columnAlign;
			newItem.row			= row;
			newItem.rowSpan		= rowSpan;
			newItem.rowAlign	= rowAlign;

			firstColumn			= newItem.column;
			lastColumn			= firstColumn + newItem.columnSpan - 1;
			firstRow			= newItem.row;
			lastRow				= firstRow + newItem.rowSpan - 1;

			// Ensure implicit track definitions exist for all tracks this item spans.
			this.ensureTracksExist( this.columnTrackManager, firstColumn, lastColumn );
			this.ensureTracksExist( this.rowTrackManager, firstRow, lastRow );

			// place the items as appropriate
			this.addItemToTracks( this.columnTrackManager, newItem, firstColumn, lastColumn );
			this.addItemToTracks( this.rowTrackManager, newItem, firstRow, lastRow );
			
			items.push(newItem);
		}
		this.items = items;
	};
	Grid.prototype.gridAlignStringToEnum = function ( alignString )
	{
		switch ( alignString )
		{
			case gridAlignEnum.start.keyword:
				return gridAlignEnum.start;
			case gridAlignEnum.end.keyword:
				return gridAlignEnum.end;
			case gridAlignEnum.center.keyword:
				return gridAlignEnum.center;
			// default
			case gridAlignEnum.stretch.keyword:
			case NULL:
			case "":
				return gridAlignEnum.stretch;
			default:
				// console.log("unknown grid align string: " + alignString);
		}
	};
	Grid.prototype.positionStringToEnum = function ( positionString )
	{
		switch ( positionString )
		{
			case positionEnum.relative.keyword:
				return positionEnum.relative;
			case positionEnum.absolute.keyword:
				return positionEnum.absolute;
			case positionEnum.fixed.keyword:
				return positionEnum.fixed;
			 // default
			case positionEnum['static'].keyword:
			case NULL:
			case "":
				return positionEnum['static'];
			default:
				// console.log("unknown position string: " + positionString);
		}
	};
	Grid.prototype.blockProgressionStringToEnum = function (positionString)
	{
		switch ( positionString )
		{
			// default
			case blockProgressionEnum.tb.keyword:
			case NULL:
			case "":
				return blockProgressionEnum.tb;
			case blockProgressionEnum.bt.keyword:
				return blockProgressionEnum.bt;
			case blockProgressionEnum.lr.keyword:
				return blockProgressionEnum.lr;
			case blockProgressionEnum.rl.keyword:
				return blockProgressionEnum.rl;
			default:
				// console.log("unknown block-progression string: " + positionString);
		}
	};
	Grid.prototype.gridTrackValueStringToEnum = function (trackValueString)
	{
		switch (trackValueString)
		{
			case gridTrackValueEnum.auto.keyword:
				return gridTrackValueEnum.auto;
			case gridTrackValueEnum.minContent.keyword:
				return gridTrackValueEnum.minContent;
			case gridTrackValueEnum.maxContent.keyword:
				return gridTrackValueEnum.maxContent;
			case gridTrackValueEnum.fitContent.keyword:
				return gridTrackValueEnum.fitContent;
			default:
				// console.log("unknown grid track string: " + trackValueString);
		}
	};
	// Creates track objects for implicit tracks if needed.
	Grid.prototype.ensureTracksExist = function ( trackManager, firstTrackNumber, lastTrackNumber )
	{
		/* TODO: we need a better data structure for tracks created by spans.
		 * If a grid item has a really high span value,
		 * we currently end up creating implicit tracks for every one of the
		 * implicit tracks (span 100000=>100000 tracks created).
		 * Instead, a single track object should be able to represent multiple
		 * implicit tracks. The number of implicit tracks it represents would 
		 * be used during the track sizing algorithm when redistributing space
		 * among each of the tracks to ensure it gets the right proportional amount.
		 **/
		trackManager.ensureTracksExist( firstTrackNumber, lastTrackNumber );
	};
	// Traverses all tracks that the item belongs to and adds a reference to it in each of the track objects.
	Grid.prototype.addItemToTracks = function (trackManager, itemToAdd, firstTrackNumber, lastTrackNumber)
	{
		var
		i					= 0,
		tracks				= trackManager.tracks.length,
		implicitTrackIndex	= 0,
		implicitTracks		= trackManager.implicitTracks;
		
		for ( ; i < tracks; i++)
		{
			if ( trackManager.tracks[i].number === firstTrackNumber )
			{
				trackManager.tracks[i].items.push(itemToAdd);
			}
			else if ( trackManager.tracks[i].number > firstTrackNumber )
			{
				break;
			}
		}
		// TODO: check if we can remove this.
		for ( ; implicitTrackIndex < implicitTracks; implicitTrackIndex++ )
		{
			if ( firstTrackNumber >= trackManager.implicitTracks[implicitTrackIndex].firstNumber &&
				 lastTrackNumber <= trackManager.implicitTracks[implicitTrackIndex].length )
			{
				trackManager.implicitTracks[implicitTrackIndex].items.push(itemToAdd);
			}
		}
	};
	Grid.prototype.saveItemPositioningTypes = function()
	{
		// console.log('saving positioning types');
		var
		items	= this.items,
		i		= items.length;
		while ( i-- )
		{
			if ( items[i].position === NULL )
			{
				items[i].position	= this.positionStringToEnum( getCSSValue( items[i].itemElement, 'position' ) );
			}
		}
	};
	/* Determines track sizes using the algorithm from sections 9.1 and 9.2 of the W3C spec.
	 * Rules:
	 *   1. If it's a defined length, that is the track size.
	 * 	 2. If it's a keyword, its sizing is based on its content. 
	 * 		Iterate over the items in the track to attempt to determine the size of the track.
	 * TODO: handle percentages
	 **/
	Grid.prototype.determineTrackSizes = function ( lengthPropertyName )
	{
		var
		computingColumns				= ( lengthPropertyName.toLowerCase() === "width" ),
		trackManager					= computingColumns	? this.columnTrackManager : this.rowTrackManager,
		availableSpace					= computingColumns	? this.availableSpaceForColumns : this.availableSpaceForRows,
		useAlternateFractionalSizing	= computingColumns	? this.useAlternateFractionalSizingForColumns
															: this.useAlternateFractionalSizingForRows,
		// Keep track of spans which could affect track sizing later.
		spans					= [],
		autoTracks				= [],
		fractionalTracks		= [],
		respectAvailableLength	= TRUE,
		iter					= trackManager.getIterator(),
		curTrack				= iter.next(),
		curSize, sizingAlternateFraction, i, iLen, curItem, minItemMeasure, maxCellMeasure,
		actualMeasure, remainingSpace, autoTrackIndex, autoTrackLength, trackShareOfSpace,
		curSpanningItem, firstTrack, numSpanned, sumOfTrackMeasures, measureSpanCanGrow,
		sumOfFractions, oneFractionMeasure, totalMeasureToAdd,
		lastNormalizedFractionalMeasure, accumulatedFactors, accumulatedFactorsInDistributionSet,
		normalizedDelta, j, spaceToDistribute;
		
		if ( useAlternateFractionalSizing &&
			 availableSpace.getRawMeasure() == 0 )
		{
			// Assume we have as much space as we want.
			respectAvailableLength = FALSE;
		}
		
		// 9.1.1/9.2.1: [Columns|Widths] are initialized to their minimum [widths|heights].
		while ( curTrack !== NULL )
		{
			if ( curTrack.sizingType !== sizingTypeEnum.keyword &&
				 curTrack.sizingType !== sizingTypeEnum.valueAndUnit )
			{
				 // console.log("Unknown grid track sizing type");
			}
            
			// TODO: add support for minmax (M3)
			curTrack.measure		= LayoutMeasure.zero();
			curTrack.minMeasure		= LayoutMeasure.zero();
			curTrack.maxMeasure		= LayoutMeasure.zero();
			sizingAlternateFraction	= ( useAlternateFractionalSizing && this.trackIsFractionSized(curTrack) );
			
			if ( curTrack.sizingType === sizingTypeEnum.keyword ||
				 sizingAlternateFraction )
			{
				curSize	= curTrack.size;

				if ( curSize !== gridTrackValueEnum.fitContent &&
					 curSize !== gridTrackValueEnum.minContent &&
					 curSize !== gridTrackValueEnum.maxContent &&
					 curSize !== gridTrackValueEnum.auto &&
					 ! sizingAlternateFraction )
				{
					// console.log("Unknown grid track sizing value " + curSize.keyword);
				}
				if ( ! sizingAlternateFraction )
				{
					curTrack.contentSizedTrack = TRUE;
				}
				
				for ( i = 0, iLen = curTrack.items.length; i < iLen; i++ )
				{
					curItem = curTrack.items[i];
					
					if ( curItem.position !== positionEnum['static'] &&
					 	 curItem.position !== positionEnum.relative )
					{
						// Only position: static and position: relative items contribute to track size.
						continue;
					}
            
					// 9.1.a.i/9.2.a.i: Spanning elements are ignored to avoid premature growth of [columns|rows].
					if ( ( computingColumns ? curItem.columnSpan : curItem.rowSpan ) > 1 )
					{
						// This is a span; determine and save its max width or height for use later in the track sizing algorithm.
						if ( curItem.maxWidthMeasure === NULL )
						{
							if ( computingColumns )
							{
								curItem.maxWidthMeasure = GridTest
															.intrinsicSizeCalculator
															.calcMaxWidth(curItem.itemElement);
							}
							else
							{
								curItem.maxHeightMeasure = GridTest
															.intrinsicSizeCalculator
															.calcMaxHeight( curItem.itemElement, curItem.usedWidthMeasure );
							}
						}
						if ( curSize === gridTrackValueEnum.fitContent ||
							 curSize === gridTrackValueEnum.auto )
						{
							/* Only keep track of this span if we found it in a non-fixed size track.
							 * Note: we are adding the span multiple times for each track but the 
							 * sizing algorithm will be unaffected by trying to
							 * process the same span multiple times.
							 **/
							spans.push(curItem);
						}
					}
					// Not a span. Let's size the track.
					else
					{
						if ( ! sizingAlternateFraction && 
							 ( curSize === gridTrackValueEnum.minContent ||
							   curSize === gridTrackValueEnum.fitContent ||
							   curSize === gridTrackValueEnum.auto ) )
						{
							if ( computingColumns )
							{
								minItemMeasure = GridTest
													.intrinsicSizeCalculator
													.calcMinWidth(curItem.itemElement);
							}
							else
							{
								minItemMeasure = GridTest
													.intrinsicSizeCalculator
													.calcMinHeight(curItem.itemElement, curItem.usedWidthMeasure);
							}
							if ( minItemMeasure.getRawMeasure() > curTrack.minMeasure.getRawMeasure() )
							{
								curTrack.minMeasure = minItemMeasure;
							}
						}
						// Auto sized tracks may grow to their maximum length. Determine that length up front.
						if ( sizingAlternateFraction ||
							 curSize === gridTrackValueEnum.maxContent ||
							 curSize === gridTrackValueEnum.auto )
						{
							if ( computingColumns )
							{
								maxCellMeasure = GridTest
													.intrinsicSizeCalculator
													.calcMaxWidth(curItem.itemElement);
							}
							else
							{
								maxCellMeasure = GridTest
													.intrinsicSizeCalculator
													.calcMaxHeight(curItem.itemElement, curItem.usedWidthMeasure);
							}
							if ( maxCellMeasure.getRawMeasure() > curTrack.maxMeasure.getRawMeasure() )
							{
								curTrack.maxMeasure = maxCellMeasure;
							}
						}
					}
				}
				/* Note: for content sized tracks, the layout engine may be using more than 1px precision.
				 * To ensure we match the layout engine's rounded result, we will get the actual track length
				 * and compare against our calculated length. If it is within 1px, we will assume that it is correct.
				 **/
				// console.log( 'dealing with content-sized tracks now' );
				switch ( curSize )
				{
					case gridTrackValueEnum.maxContent:
						actualMeasure = this.getActualTrackMeasure( trackNum, computingColumns );
						if ( actualMeasure.equals( curTrack.maxMeasure ) !== TRUE )
						{
							// Not an error; we will catch the problem later when we verify grid items.
							// console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
							//			 ": " + "max-content length difference detected; expected = " +
							//			 curTrack.maxMeasure.getPixelValueString() + ", actual = " +
							//			 actualMeasure.getPixelValueString() );
						}
						curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure;
						break;
					case gridTrackValueEnum.minContent:
						actualMeasure = this.getActualTrackMeasure( trackNum, computingColumns );
						if ( actualMeasure.equals( curTrack.minMeasure ) !== TRUE )
						{
							// Not an error; we will catch the problem later when we verify grid items.
							// console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
							// 			 ": " + "min-content length difference detected; expected = " +
							// 			 curTrack.minMeasure.getPixelValueString() + ", actual = " +
							// 			 actualMeasure.getPixelValueString() );
						}
						curTrack.measure = curTrack.maxMeasure = curTrack.minMeasure;
						break;
					case gridTrackValueEnum.fitContent:
					case gridTrackValueEnum.auto:
						// We can't determine at this point if we need to adjust 
						// to the actual track length since sizing isn't complete.
						curTrack.measure = curTrack.minMeasure;
				}
			}
			if ( curTrack.sizingType === sizingTypeEnum.keyword &&
				 ( curTrack.size === gridTrackValueEnum.auto ||
					 curTrack.size === gridTrackValueEnum.fitContent ) )
			{
				autoTracks.push(curTrack);
			}
			if ( curTrack.sizingType === sizingTypeEnum.valueAndUnit )
			{
				if (curTrack.size.unit === "px")
				{
					curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure = LayoutMeasure.measureFromPx(curTrack.size.value);
				}
				else if (curTrack.size.unit === "fr")
				{
					// 9.1.1.b/9.2.1.b: A column with a fraction-sized minimum length is assigned a 0px minimum.
					curTrack.measure = LayoutMeasure.zero();
					fractionalTracks.push(curTrack);
					// TODO: fractional tracks should go through the max calculation for 
					// use with verifying a grid in infinite/unconstrained space.
				}
				else
				{
					// Track lengths are assumed to always be in pixels or fractions. Convert before going into this function.
					this.error = TRUE;
					// console.log("track size not converted into px!");
					// TODO: throw after we start doing conversions and don't want to ignore this anymore.
				}
			}
			curTrack = iter.next();
		}
		
		// 9.1.2/9.2.2: All [columns|rows] not having a fraction-sized maximum are grown from
		// their minimum to their maximum specified size until available space is exhausted.
		remainingSpace = availableSpace.subtract( this.getSumOfTrackMeasures( trackManager ) );
		if ( remainingSpace.getRawMeasure() > 0 )
		{
			autoTracks.sort( this.compareAutoTracksAvailableGrowth );
        
			for ( autoTrackIndex=0, autoTrackLength=autoTracks.length; autoTrackIndex < autoTrackLength; autoTrackIndex++ )
			{
				if ( remainingSpace.getRawMeasure() <= 0 )
				{
					break;
				}
				trackShareOfSpace = remainingSpace.divide(autoTracks.length - autoTrackIndex);
        
				trackShareOfSpace = LayoutMeasure
										.min(trackShareOfSpace, autoTracks[autoTrackIndex]
																	.maxMeasure
																	.subtract( autoTracks[autoTrackIndex].measure ) );
				autoTracks[autoTrackIndex].measure = autoTracks[autoTrackIndex].measure.add(trackShareOfSpace);
				remainingSpace = remainingSpace.subtract(trackShareOfSpace);
			}
		}
        
		/* 9.1.2.c/9.2.2.c: After all [columns|rows] (excluding those with a fractional maximum)
		 * have grown to their maximum [width|height], consider any spanning elements that could
		 * contribute to a content-based [column|row] [width|height] (minimum or maximum) and 
		 * grow equally all [columns|rows] covered by the span until available space is exhausted.
		 **/
		for ( i=0, iLen=spans.length; i < iLen && remainingSpace > 0; i++ )
		{
			curSpanningItem	= spans[i];
			firstTrack		= (computingColumns ? curSpanningItem.column : curSpanningItem.row);
			numSpanned		= (computingColumns ? curSpanningItem.columnSpan : curSpanningItem.rowSpan);
        
			/* 9.1.2.c.i/9.2.2.c.i. Spanning elements covering [columns|rows] with
			 * fraction-sized maximums are ignored as the fraction column "eats" all
			 * the space from the spanning element which could have caused growth 
			 * in [columns|rows] with a content-based size.
			 **/
			if ( ! trackManager.spanIsInFractionalTrack(firstTrack, numSpanned) )
			{
				continue;
			}
        
			sumOfTrackMeasures	= this.getSumOfSpannedTrackMeasures(trackManager, firstTrack, numSpanned);
			measureSpanCanGrow	= (computingColumns === TRUE ? curSpanningItem.maxWidthMeasure
															 : curSpanningItem.maxHeightMeasure).subtract(sumOfTrackMeasures);
        
			if ( measureSpanCanGrow.getRawMeasure() > 0 )
			{
				// Redistribute among all content-sized tracks that this span is a member of.
				tracksToGrow	= this.getContentBasedTracksThatSpanCrosses(trackManager, firstTrack, numSpanned);
				remainingSpace	= this.redistributeSpace(tracksToGrow, remainingSpace, measureSpanCanGrow);
			}
		}
        
		// REMOVING AS IT SEEMS UNNECESSARY RIGHT NOW
		// remainingSpace = remainingSpace
		// 						.subtract( this.adjustForTrackLengthDifferences( autoTracks, computingColumns ) );
        
		/* 9.1.3/9.2.3: Fraction-sized [columns|rows] are grown 
		 * from their minimum to their maximum [width|height] in 
		 * accordance with their space distribution factor until 
		 * available space is exhausted.
		 **/
		if ( fractionalTracks.length > 0 &&
			 ( remainingSpace.getRawMeasure() > 0 ||
				 useAlternateFractionalSizing ) )
		{
			if ( ! useAlternateFractionalSizing ||
				 respectAvailableLength )
			{
				// console.log("remaining space for fractional sizing = " + remainingSpace.getPixelValueString());
			}
			fractionalTracks.sort(this.compareFractionTracksNormalMeasure);
			sumOfFractions = 0;
			for ( i=0, iLen=fractionalTracks.length; i < iLen; i++ )
			{
				sumOfFractions += fractionalTracks[i].size.value;
			}
			oneFractionMeasure = NULL;
			if ( ! useAlternateFractionalSizing )
			{
				oneFractionMeasure = remainingSpace.divide(sumOfFractions);
			}
			else
			{
				// In alternate fractional sizing, we determine the max "1fr"
				// length based on the max-content size of the track.
				oneFractionMeasure = this.determineMeasureOfOneFractionUnconstrained(fractionalTracks);
			}
        
			iLen = fractionalTracks.length;
			if ( useAlternateFractionalSizing )
			{
				if ( respectAvailableLength )
				{
					// Using alternate sizing but still need to stay within the remaining space.
					// Adjust the one fraction length so that everything will fit.
					totalMeasureToAdd = LayoutMeasure.zero();
					for ( i=0; i < iLen; i++ )
					{
						totalMeasureToAdd = totalMeasureToAdd.add(oneFractionMeasure.multiply(fractionalTracks[i].size.value));
					}
					if ( totalMeasureToAdd.getRawMeasure() > remainingSpace.getRawMeasure() )
					{
						oneFractionMeasure = oneFractionMeasure.multiply(remainingSpace.divide(totalLengthToAdd.getRawMeasure()));
					}
				}
				for ( i = 0; i < iLen; i++)
				{
					fractionalTracks[i].measure = fractionalTracks[i]
													.measure
													.add( oneFractionMeasure.multiply( fractionalTracks[i].size.value ) );
				}
			}
			else if ( iLen > 0 )
			{
				lastNormalizedFractionalMeasure		= this.getNormalFractionMeasure(fractionalTracks[0]);
				accumulatedFactors					= 0;
				accumulatedFactorsInDistributionSet	= 0;
				for ( i=0; i < iLen; i++ )
				{
					if ( lastNormalizedFractionalMeasure.getRawMeasure() <
					 	 this.getNormalFractionMeasure(fractionalTracks[i]).getRawMeasure() )
					{
						accumulatedFactorsInDistributionSet = accumulatedFactors;
						normalizedDelta = this
											.getNormalFractionMeasure(fractionalTracks[i])
											.subtract(lastNormalizedFractionalMeasure);
						for ( j=0; j < i; j++ )
						{
							spaceToDistribute = 0;
							if ( accumulatedFactorsInDistributionSet > 0 )
							{
								spaceToDistribute = remainingSpace
														.multiply(fractionalTracks[j].size.value)
														.divide(accumulatedFactorsInDistributionSet);
								spaceToDistribute = LayoutMeasure
														.min(spaceToDistribute,
															 normalizedDelta.multiply(fractionalTracks[j].size.value));
								spaceToDistribute = LayoutMeasure.min(spaceToDistribute, fractionalTracks[j].maxMeasure);
							}
        
							fractionalTracks[j].measure 		 = fractionalColumnsArray[j].measure.add(spaceToDistribute);
							remainingSpace						-= spaceToDistribute;
							accumulatedFactorsInDistributionSet	-= fractionalTracks[j].size.value;
						}
						lastNormalizedFractionalMeasure = this.getNormalFractionMeasure(fractionalTracks[i]);
					}
					accumulatedFactors += fractionalTracks[i].size.value;
					if ( remainingSpace.getRawMeasure() <= 0 )
					{
						break;
					}
				}
				// Once all fractional tracks are in the same group, do a final pass to distribute the remaining space.
				accumulatedFactorsInDistributionSet = accumulatedFactors;
				for ( i=0; i < iLen; i++)
				{
					spaceToDistribute = 0;
					if ( accumulatedFactorsInDistributionSet > 0 )
					{
						spaceToDistribute = remainingSpace
												.multiply( fractionalTracks[i].size.value / accumulatedFactorsInDistributionSet );
						//	uncomment and scope to minmax functionality
						//spaceToDistribute = LayoutMeasure.min(spaceToDistribute, fractionalTracks[i].maxMeasure);
					}
					fractionalTracks[i].measure			 = fractionalTracks[i].measure.add(spaceToDistribute);
					remainingSpace						 = remainingSpace.subtract(spaceToDistribute);
					accumulatedFactorsInDistributionSet -= fractionalTracks[i].size.value;
				}
			}
			// REMOVING AS IT SEEMS UNNECESSARY RIGHT NOW
			// remainingSpace = remainingSpace
			// 					.subtract( this.adjustForTrackLengthDifferences( fractionalTracks, computingColumns ) );
		}
		if (computingColumns)
		{
			// Save the used widths for each of the items so that it can be used during row size resolution.
			this.saveUsedCellWidths(trackManager);
		}
	};
	// Inserts an empty grid item into a given track and gets its size.
	Grid.prototype.getActualTrackMeasure = function ( trackNumber, computingColumns )
	{
		var
		blockProgression, trackMeasure,
		gridElement	= this.gridElement,
		dummyItem	= document.createElement("div"),
		cssText		= "margin: 0px; border: 0px; padding: 0px; "
					+ ( computingColumns ? GRIDCOLUMNALIGN : GRIDROWALIGN )
					+ ": stretch; "
					+ ( computingColumns ? GRIDCOLUMN : GRIDROW )
					+ ": " + trackNumber + "; ";
		dummyItem.style.cssText = cssText;

		dummyItem			= gridElement.appendChild(dummyItem);
		blockProgression	= this.blockProgressionStringToEnum(
								getCSSValue( this.gridElement, BLOCKPROGRESSION )
							  );
		trackMeasure		= this.usePhysicalWidths(blockProgression, computingColumns)
							? LayoutMeasure.measureFromStyleProperty( dummyItem, "width" )
							: LayoutMeasure.measureFromStyleProperty( dummyItem, "height" );

		gridElement.removeChild(dummyItem);
		return trackMeasure;
	};
	Grid.prototype.compareAutoTracksAvailableGrowth = function ( a, b )
	{
		var
		availableGrowthA = a.maxMeasure.subtract(a.measure),
		availableGrowthB = b.maxMeasure.subtract(b.measure);
		if ( availableGrowthA.getRawMeasure() < availableGrowthB.getRawMeasure() )
		{
			return -1;
		}
		if ( availableGrowthA.getRawMeasure() > availableGrowthB.getRawMeasure() )
		{
			return 1;
		}
		return 0;
	};
	Grid.prototype.usePhysicalWidths = function ( blockProgression, verifyingColumns )
	{
		var usePhysicalWidths = FALSE;
		if ( ( ( blockProgression === blockProgressionEnum.tb ||
				 blockProgression === blockProgressionEnum.bt ) &&
				 verifyingColumns === TRUE ) ||
			 ( ( blockProgression === blockProgressionEnum.lr ||
				 blockProgression === blockProgressionEnum.rl ) &&
				 verifyingColumns === FALSE ) )
		{
			usePhysicalWidths = TRUE;
		}
		return usePhysicalWidths;
	};
	Grid.prototype.trackIsFractionSized = function ( trackToCheck )
	{
		return ( trackToCheck.sizingType === sizingTypeEnum.valueAndUnit &&
				 trackToCheck.size.unit === "fr" );
	};
	Grid.prototype.getSumOfTrackMeasures = function ( trackManager )
	{
		var
		sum			= LayoutMeasure.zero(),
		trackIter	= trackManager.getIterator(),
		curTrack	= trackIter.next();
		while ( curTrack !== NULL )
		{
			sum = sum.add( curTrack.measure );
			curTrack = trackIter.next();
		}
		return sum;
	};
	Grid.prototype.getSumOfSpannedTrackMeasures = function ( trackManager, firstTrackNum, numSpanned )
	{
		var
		sum		= LayoutMeasure.zero(),
		tracks	= trackManager.getTracks( firstTrackNum, firstTrackNum + numSpanned - 1 ),
		i		= tracks.length;
		while ( i-- )
		{
			sum = sum.add( tracks[i].measure );
		}
		return sum;
	};
	//NOT SURE WE REALLY NEED THIS - It's faked anyway
	//Grid.prototype.adjustForTrackLengthDifferences = function ( tracks, computingColumns )
	//{
	//	var
	//	gridElement = this.gridElement,
	//	totalChange = LayoutMeasure.zero(),
	//	i, iLen = tracks.length, track,
	//	actualMeasure;
	//	for ( i = 0; i < iLen; i++ )
	//	{
	//		track = tracks[i];
	//		actualMeasure = this.getActualTrackMeasure( tracks[i].number, computingColumns );
	//		if ( actualMeasure.equals( tracks[i].measure ) !== TRUE )
	//		{
	//			// If we are one layout pixel off, just pick up what the actual value is and consider it close enough.
	//			if ( Math.abs( tracks[i].measure.subtract(actualMeasure).getRawMeasure() ) <= 1 )
	//			{
	//				// console.log( (computingColumns ? "Column" : "Row") + " " + tracks[i].number + ": " +
	//							 "adjusting for track length difference; expected = " + 
	//							 tracks[i].measure.getPixelValueString() + ", actual = " + 
	//							 actualMeasure.getPixelValueString() );
	//				totalChange.add(actualMeasure.subtract(tracks[i].measure));
	//				tracks[i].measure = actualMeasure;
	//			}
	//			else
	//			{
	//				// Not an error; we will catch the problem later when we verify grid items.
	//				// console.log( (computingColumns ? "Column" : "Row") + " " + tracks[i].number + ": " +
	//							 "track length difference > 1 layout pixel; expected = " + 
	//							 tracks[i].measure.getPixelValueString() + ", actual = " +
	//							 actualMeasure.getPixelValueString() );
	//			}
	//		}
	//	}
	//	return totalChange;
	//};
	Grid.prototype.getNormalFractionMeasure = function ( track )
	{
		if ( ! this.trackIsFractionSized( track ) )
		{
			// console.log("getNormalFractionMeasure called for non-fraction sized track");
		}
		var frValue = track.size.value;
		return frValue === 0 ? LayoutMeasure.zero() : track.measure.divide(frValue);
	};
	Grid.prototype.saveUsedCellWidths = function ( columnTrackManager )
	{
		var
		iter		= columnTrackManager.getIterator(),
		curTrack	= iter.next(),
		i, curItem;

		while ( curTrack !== NULL )
		{
			i = curTrack.items.length;
			while ( i-- )
			{
				curItem = curTrack.items[i];
				if ( curItem.usedWidthMeasure === NULL )
				{
					curItem.usedWidthMeasure	= this.getSumOfSpannedTrackMeasures(
													columnTrackManager, curItem.column, curItem.columnSpan
												  );
				}
			}
			curTrack = iter.next();
		}
	};
	Grid.prototype.calculateGridItemShrinkToFitSizes = function()
	{
		var
		columnTrackManager	= this.columnTrackManager,
		rowTrackManager		= this.rowTrackManager,
		items				= this.items,
		i, iLen 			= items.length,
		curItem, columnsBreadth, rowsBreadth,
		swapWidthAndHeight, forcedWidth = NULL, forcedHeight = NULL;

		for ( i=0; i < iLen; i++ )
		{
			curItem = items[i];
			if ( curItem.shrinkToFitSize === NULL )
			{
				// Percentage resolution is based on the size of the cell for the grid item.
				columnsBreadth	= this.getSumOfSpannedTrackMeasures(
									this.columnTrackManager, curItem.column, curItem.columnSpan
								  );
				rowsBreadth		= this.getSumOfSpannedTrackMeasures(
									this.rowTrackManager, curItem.row, curItem.rowSpan
								  );

				// Force a stretch if requested.
				if ( curItem.position === positionEnum['static'] ||
					 curItem.position === positionEnum.relative )
				{
					swapWidthAndHeight = this.shouldSwapWidthAndHeight();
					if ( curItem.columnAlign === gridAlignEnum.stretch )
					{
						if ( ! swapWidthAndHeight )
						{
							forcedWidth = columnsBreadth;
						}
						else
						{
							forcedHeight = columnsBreadth;
						}
					}
					if ( curItem.rowAlign === gridAlignEnum.stretch )
					{
						if ( ! swapWidthAndHeight )
						{
							forcedHeight = rowsBreadth;
						}
						else
						{
							forcedWidth = rowsBreadth;
						}
					}
				}

				// Only calculate an intrinsic size if we're not forcing both width and height.
				if ( forcedWidth === NULL ||
					 forcedHeight === NULL )
				{
					curItem.shrinkToFitSize	= GridTest.intrinsicSizeCalculator.calcShrinkToFitWidthAndHeight(
												curItem.itemElement, columnsBreadth, rowsBreadth, forcedWidth, forcedHeight
												);
				}
				else
				{
					curItem.shrinkToFitSize = new WidthAndHeight();
				}
				if ( forcedWidth !== NULL )
				{
					curItem.shrinkToFitSize.width = forcedWidth;
				}
				if ( forcedHeight !== NULL )
				{
					curItem.shrinkToFitSize.height = forcedHeight;
				}
			}
		}
	};
	Grid.prototype.shouldSwapWidthAndHeight = function()
	{
		return ( this.blockProgression === blockProgressionEnum.lr ||
				 this.blockProgression === blockProgressionEnum.rl );
	};
	Grid.prototype.verifyGridItemSizes = function()
	{
		this.verifyGridItemLengths( TRUE );
		this.verifyGridItemLengths( FALSE );
	};
	Grid.prototype.verifyGridItemLengths = function ( verifyingColumnBreadths )
	{
		var
		items					= this.items,
		i						= items.length,
		trackManager			= verifyingColumnBreadths ? this.columnTrackManager : this.rowTrackManager,
		blockProgression		= this.blockProgression,
		verifyingPhysicalWidths	= this.usePhysicalWidths( blockProgression, verifyingColumnBreadths ),
		dimension				= verifyingPhysicalWidths ? 'Width' : 'Height',
		curItem, curItemElement, trackNum, alignType, actualMeasure, itemId, offsetLength, offsetMeasure,
		expectedMeasure, firstTrack, trackSpan;

		// Uncomment if needed for debugging.
		//this.dumpTrackLengths(trackManager, GridTest.logger, GridTest.logger.logDebug);

		if ( verifyingColumnBreadths &&
			 ! verifyingPhysicalWidths )
		{
			// console.log("Column breadths are heights due to block-progression value '" + blockProgression.keyword + "'");
		}
		else if ( ! verifyingColumnBreadths &&
					verifyingPhysicalWidths )
		{
			// console.log("Row breadths are widths due to block-progression value '" + blockProgression.keyword + "'");
		}

		while ( i-- )
		{
			curItem			= items[i];
			curItemElement	= curItem.itemElement;

			if ( ( verifyingColumnBreadths ? curItem.verified.columnBreadth : curItem.verified.rowBreadth ) !== TRUE )
			{
				trackNum		= verifyingColumnBreadths ? curItem.column : curItem.row;
				alignType		= verifyingColumnBreadths ? curItem.columnAlign : curItem.rowAlign;
				// console.log(curItemElement.parentNode);
				// console.log(getCSSValue(curItemElement,'width'));
				actualMeasure	= BoxSizeCalculator['calcMarginBox'+dimension]( curItemElement );

				itemId = "";
				if ( curItem.itemElement.id.length > 0 )
				{
					itemId = "[ID = " + curItem.itemElement.id + "] ";
				}

				// Check the offsetWidth/offsetHeight to make sure it agrees.
				offsetLength	= curItem.itemElement['offset'+dimension];
				offsetMeasure	= LayoutMeasure.measureFromPx( offsetLength );
				if ( actualMeasure.getMeasureRoundedToWholePixel().equals(offsetMeasure) !== TRUE )
				{
					this.error = TRUE;
					// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + 
					//			 trackNum + ", item " + i + ": " +
					//			 "offset length doesn't agree with calculated margin box length (" +
					//			 ( verifyingPhysicalWidths ? "offsetWidth" : "offsetHeight" ) +
					//			 ": " + offsetMeasure.getPixelValueString() + "; expected (unrounded): " +
					//			 actualMeasure.getPixelValueString() );
				}


				if ( curItem.position === positionEnum.absolute )
				{
					// Use shrink-to-fit sizes.
					if ( curItem.shrinkToFitSize === NULL )
					{
						// console.log("Current item's shrink to fit size has not been calculated");
					}
					expectedMeasure = (verifyingPhysicalWidths ? curItem.shrinkToFitSize.width : curItem.shrinkToFitSize.height);
				}
				else
				{
					switch (alignType)
					{
						case gridAlignEnum.stretch:
							// Grid item's width/height should be equal to the lengths of the tracks it spans.
							firstTrack		= ( verifyingColumnBreadths ? curItem.column : curItem.row );
							trackSpan		= ( verifyingColumnBreadths ? curItem.columnSpan : curItem.rowSpan );
							expectedMeasure	= this.getSumOfSpannedTrackMeasures( trackManager, firstTrack, trackSpan );
							break;
						case gridAlignEnum.start:
						case gridAlignEnum.end:
						case gridAlignEnum.center:
							// Item uses its shrink-to-fit size.
							if (curItem.shrinkToFitSize === NULL)
							{
								// console.log("Current item's shrink to fit size has not been calculated");
							}
							// shrinkToFitSize is physical
							expectedMeasure = ( verifyingPhysicalWidths ? curItem.shrinkToFitSize.width
																		: curItem.shrinkToFitSize.height );
							break;
						default:
							// console.log("Unknown grid align type " + alignType.keyword);
					}
				}

				if ( expectedMeasure.equals(actualMeasure) !== TRUE )
				{
					// If the agent is more precise than whole pixels, and we are off 
					// by just one layout pixel (1/100th of a pixel for IE), it's close enough.
					if ( precision > 0 && Math.abs(expectedMeasure.subtract(actualMeasure).getRawMeasure()) === 1)
					{
						// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
						//			 "sizing check passed after adjustment for fuzzy error checking (alignment: " + 
						//			 alignType.keyword + "; expected: " + expectedMeasure.getPixelValueString() + 
						//			 "; actual: " + actualMeasure.getPixelValueString() + ")" );
					}
					else
					{
						this.error = TRUE;
						// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
						//			 "sizing check failed (alignment: " + alignType.keyword + "; expected: " +
						//			 expectedMeasure.getPixelValueString() + "; actual: " + 
						//			 actualMeasure.getPixelValueString() + ")" );
					}
				}
				else
				{
					// console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
					//			 "sizing check passed (alignment: " + alignType.keyword + "; expected: " +
					//			 expectedMeasure.getPixelValueString() + "; actual: " + actualMeasure.getPixelValueString() + ")" );
				}

				if ( verifyingColumnBreadths )
				{
					curItem.verified.columnBreadth = TRUE;
				}
				else
				{
					curItem.verified.rowBreadth = TRUE;
				}
			}
			else
			{
				// console.log( itemId + ": already verified " + (verifyingColumnBreadths ? "column" : "row") + " breadth" );
			}
		}
	};
	Grid.prototype.verifyGridItemPositions = function (gridObject)
	{
		this.verifyGridItemTrackPositions(gridObject, TRUE);
		this.verifyGridItemTrackPositions(gridObject, FALSE);
	};
	
	
	
	
	
	function Track()
	{
		this.number				= NULL;
		this.size				= NULL;
		this.sizingType			= NULL;
		this.items				= [];
		this.measure			= NULL;
		this.minMeasure			= NULL;
		this.maxMeasure			= NULL;
		this.contentSizedTrack	= FALSE;
		this.implicit			= FALSE;
	}

	function ImplicitTrackRange()
	{
		this.firstNumber	= NULL;
		this.span			= NULL;
		this.size			= gridTrackValueEnum.auto;
		this.sizingType		= sizingTypeEnum.keyword;
		this.items			= [];
		this.measure		= NULL;
	}
	
	function Item()
	{
		this.itemElement		= NULL;
		this.styles				= NULL;
		this.position			= NULL;
		this.column				= 1;
		this.columnSpan			= 1;
		this.columnAlign		= gridAlignEnum.stretch;
		this.row				= 1;
		this.rowSpan			= 1;
		this.rowAlign			= gridAlignEnum.stretch;
		// Used width calculated during column track size resolution.
		this.usedWidthMeasure	= NULL;
		this.maxWidthMeasure	= NULL;
		this.maxHeightMeasure	= NULL;
		this.shrinkToFitSize	= NULL; // physical dimensions
		this.verified = {
			columnBreadth:	FALSE,
			rowBreadth:		FALSE,
			columnPosition: FALSE,
			rowPosition:	FALSE
		};
	}

	var BoxSizeCalculator = {
		calcMarginBoxWidth: function( element )
		{
			// console.log('element',element);
			// console.log('marginBoxWidth',"'"+getCSSValue( element, 'width')+"'");
			var
			boxSizing		= getCSSValue( element, BOXSIZING ),
			marginBoxWidth	= LayoutMeasure.measureFromStyleProperty( element, "width" );
			marginBoxWidth	= marginBoxWidth
								.add( LayoutMeasure.measureFromStyleProperty( element, "margin-left" ) )
								.add( LayoutMeasure.measureFromStyleProperty( element, "margin-right" ) );
			
			if ( boxSizing === "content-box" )
			{
				marginBoxWidth = marginBoxWidth
									.add( LayoutMeasure.measureFromStyleProperty( element, "padding-left" ) )
									.add( LayoutMeasure.measureFromStyleProperty( element, "padding-right" ) );
			}
			if ( boxSizing === "content-box" ||
				 boxSizing === "padding-box" )
			{
				if ( getCSSValue( element, 'border-left-style' ) !== "none" )
				{
					marginBoxWidth = marginBoxWidth
										.add( LayoutMeasure.measureFromStyleProperty( element, "border-left-width" ) );
				}
				if ( getCSSValue( element, 'border-right-style' ) !== "none" )
				{
					marginBoxWidth = marginBoxWidth
										.add( LayoutMeasure.measureFromStyleProperty( element, "border-right-width" ) );
				}
			}
			return marginBoxWidth;
		},
		calcMarginBoxHeight: function ( element )
		{
			var
			boxSizing		= getCSSValue( element, BOXSIZING ),
			marginBoxHeight = LayoutMeasure.measureFromStyleProperty( element, "height" );

			marginBoxHeight = marginBoxHeight
								.add( LayoutMeasure.measureFromStyleProperty( element, "margin-top" ) )
								.add( LayoutMeasure.measureFromStyleProperty( element, "margin-bottom" ) );

			if ( boxSizing === "content-box" )
			{
				marginBoxHeight = marginBoxHeight
									.add( LayoutMeasure.measureFromStyleProperty( element, "padding-top" ) )
									.add( LayoutMeasure.measureFromStyleProperty( element, "padding-bottom" ) );
			}
			if ( boxSizing === "content-box" ||
				 boxSizing === "padding-box" )
			{
				if ( getCSSValue( element, 'border-top-style' ) !== "none" )
				{
					marginBoxHeight = marginBoxHeight
										.add( LayoutMeasure.measureFromStyleProperty( element, "border-top-width" ) );
				}
				if ( getCSSValue( element, 'border-bottom-style' ) !== "none" )
				{
					marginBoxHeight = marginBoxHeight
										.add( LayoutMeasure.measureFromStyleProperty( element, "border-bottom-width" ) );
				}
			}
			return marginBoxHeight;
		},
		// Calculates a box width suitable for use with the width property from a given margin box width.
		// Takes into account the box-sizing of the box.
		calcBoxWidthFromMarginBoxWidth: function ( element, marginBoxWidth )
		{
			var
			boxSizing	= getCSSValue( element, BOXSIZING ),
			boxWidth	= marginBoxWidth;

			if ( boxSizing === "content-box" )
			{
				boxWidth = boxWidth
							.subtract(
								LayoutMeasure
									.measureFromStyleProperty( element, "padding-left" )
									.add( LayoutMeasure.measureFromStyleProperty( element, "padding-right" ) )
							 );
			}
			if ( boxSizing === "content-box" ||
				 boxSizing === "padding-box" )
			{
				if ( getCSSValue( element, 'border-left-style' ) !== "none" )
				{
					boxWidth = boxWidth.subtract( LayoutMeasure.measureFromStyleProperty( element, "border-left-width" ) );
				}
				if ( getCSSValue( element, 'border-right-style' ) !== "none" )
				{
					boxWidth = boxWidth.subtract( LayoutMeasure.measureFromStyleProperty( element, "border-right-width" ) );
				}
			}
			boxWidth = boxWidth
						.subtract(
							LayoutMeasure
								.measureFromStyleProperty( element, "margin-left" )
								.add( LayoutMeasure.measureFromStyleProperty( element, "margin-right" ) )
						 );
			return boxWidth;
		},
		// Calculates a box height suitable for use with the height property from a given margin box height.
		// Takes into account the box-sizing of the box.
		calcBoxHeightFromMarginBoxHeight: function ( element, marginBoxHeight )
		{
			var
			boxSizing	= getCSSValue( element, BOXSIZING );
			boxHeight	= marginBoxHeight;

			if ( boxSizing === "content-box" )
			{
				boxHeight = boxHeight
								.subtract(
									LayoutMeasure
										.measureFromStyleProperty( element, "padding-top" )
										.add( LayoutMeasure.measureFromStyleProperty( element, "padding-bottom" ) )
								 );
			}
			if ( boxSizing === "content-box" ||
				 boxSizing === "padding-box" )
			{
				if ( getCSSValue( element, 'border-top-style' ) !== "none" )
				{
					boxHeight = boxHeight.subtract( LayoutMeasure.measureFromStyleProperty( element, "border-top-width" ) );
				}
				if ( getCSSValue( element, 'border-bottom-style' ) !== "none" )
				{
					boxHeight = boxHeight.subtract( LayoutMeasure.measureFromStyleProperty( element, "border-bottom-width" ) );
				}
			}
			boxHeight = boxHeight
							.subtract(
								LayoutMeasure
									.measureFromStyleProperty( usedStyle, "margin-top" )
									.add( LayoutMeasure.measureFromStyleProperty( usedStyle, "margin-bottom" ) )
							 );
			return boxHeight;
		}
	};
	
	var GridTest = {
		
		verifyLayout: function ( element, properties )
		{
			var gridObject = new Grid( element, properties );
			return this.layoutVerifier.verifyLayout( gridObject );
		},
		intrinsicSizeCalculator: {
			zeroLength:		{ cssText: "0px" },
			infiniteLength: { cssText: "1000000px" },
							/* last 2 params only required for shrink-to-fit calculation */
			prepare:		function ( element, calculatorOperation, containerWidth, containerHeight)
			{
				if ( intrinsicSizeCalculatorElement === NULL )
				{
					 intrinsicSizeCalculatorElement = document.createElement("div");
					 intrinsicSizeCalculatorElement.id = "intrinsicSizeCalculator";
				}

				var
				cssText		= '',
				gridElement = element.parentNode,
				gridElementUsedStyle;
				
				if ( typeof containerWidth !== "undefined" &&
					 containerWidth !== NULL )
				{
					cssText += "width: " + containerWidth.getPixelValueString() + "px";
				}
				else
				{
					switch (calculatorOperation)
					{
						case calculatorOperationEnum.minWidth:
						case calculatorOperationEnum.maxHeight:
							cssText += "width: " + this.zeroLength.cssText;
							break;
						case calculatorOperationEnum.minHeight:
						case calculatorOperationEnum.maxWidth:
							cssText += "width: " + this.infiniteLength.cssText;
							break;
						case calculatorOperationEnum.shrinkToFit:
							// console.log("Calculating shrink to fit size without specified container width");
							break;
					}
				}
				if ( typeof containerHeight !== "undefined" &&
					 containerHeight !== NULL )
				{
					cssText += "; height: " + containerHeight.getPixelValueString() + "px";
				}
				else
				{
					switch (calculatorOperation)
					{
						case calculatorOperationEnum.minWidth:
						case calculatorOperationEnum.maxHeight:
							cssText += "; height: " + this.infiniteLength.cssText;
							break;
						case calculatorOperationEnum.minHeight:
						case calculatorOperationEnum.maxWidth:
							cssText += "; height: " + this.zeroLength.cssText;
							break;
						case calculatorOperationEnum.shrinkToFit:
							// console.log("Calculating shrink to fit size without specified container height");
							break;
					}
				}
				
				/* Insert our calculator at the same level as the grid to ensure child selectors work as well as we can reasonably achieve.
				 * Special case: the grid is the body element.
				 * In that case, put the calculator under the grid anyway;
				 * it shouldn't impact calculations assuming selectors aren't impacted.
				 **/
				intrinsicSizeCalculatorElementParent = gridElement === document.body ? gridElement : gridElement.parentNode;
			
				// Copy styles from the grid to the calculator to ensure any values that are inherited by grid items still happens.
				// TODO: add additional properties if new test content requires it.
				if ( intrinsicSizeCalculatorElementParent !== gridElement )
				{
					gridElementUsedStyle = WINDOW.getComputedStyle( gridElement, NULL );
					cssText += "; font-family: " + gridElementUsedStyle.getPropertyValue("font-family")
							+ "; font-size: " + gridElementUsedStyle.getPropertyValue("font-size")
							+ "; font-size-adjust: " + gridElementUsedStyle.getPropertyValue("font-size-adjust")
							+ "; font-stretch: " + gridElementUsedStyle.getPropertyValue("font-stretch")
							+ "; font-style: " + gridElementUsedStyle.getPropertyValue("font-style")
							+ "; font-variant: " + gridElementUsedStyle.getPropertyValue("font-variant")
							+ "; font-weight: " + gridElementUsedStyle.getPropertyValue("font-weight")
							+ "; direction: " + gridElementUsedStyle.getPropertyValue("direction")
							+ "; " + BLOCKPROGRESSION + ": " + gridElementUsedStyle.getPropertyValue(BLOCKPROGRESSION);
				}
				intrinsicSizeCalculatorElement.style.cssText += cssText;
				intrinsicSizeCalculatorElementParent.appendChild(intrinsicSizeCalculatorElement);
			},
			unprepare: function()
			{
				intrinsicSizeCalculatorElementParent.removeChild(intrinsicSizeCalculatorElement);
			},
			cloneAndAppendToCalculator: function(element)
			{
				var clone = element.cloneNode(TRUE);
				// Float it so that the box won't constrain itself to the parent's size.
				clone.style.cssText = clone.style.cssText + "; float: left";
				intrinsicSizeCalculatorElement.appendChild(clone);
				return clone;
			},
			calcMinWidth: function(element)
			{
				this.prepare(element, calculatorOperationEnum.minWidth);
			
				var
				clone	= this.cloneAndAppendToCalculator(element),
				width	= BoxSizeCalculator.calcMarginBoxWidth( clone );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return width;
			},
			calcMaxWidth: function (element)
			{
				this.prepare(element, calculatorOperationEnum.maxWidth);
			
				var
				clone	= this.cloneAndAppendToCalculator(element),
				width	= BoxSizeCalculator.calcMarginBoxWidth( clone );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return width;
			},
			calcMinHeight: function (element, usedWidth)
			{
				if ( typeof usedWidth === "undefined" ||
					 usedWidth === NULL )
				{
					// console.log("calcMinHeight: no usedWidth specified");
				}
			
				this.prepare( element, calculatorOperationEnum.minHeight, usedWidth );
			
				var
				clone	= this.cloneAndAppendToCalculator(element),
				height	= BoxSizeCalculator.calcMarginBoxHeight( clone );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return height;
			},
			calcMaxHeight: function (element, usedWidth)
			{
				if ( typeof usedWidth === "undefined" ||
					 usedWidth === NULL )
				{
					// console.log("calcMaxHeight: no usedWidth specified");
				}
			
				this.prepare(element, calculatorOperationEnum.maxHeight, usedWidth);
			
				var
				clone	= this.cloneAndAppendToCalculator(element),
				height	= BoxSizeCalculator.calcMarginBoxHeight( clone );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return height;
			},
			calcShrinkToFitWidthAndHeight: function ( element, containerWidth, containerHeight, forcedMarginBoxWidth, forcedMarginBoxHeight )
			{
				// If we're forcing a specific size on the grid item, adjust the calculator's container size to accomodate it.
				if ( forcedMarginBoxWidth !== NULL )
				{
					containerWidth = forcedMarginBoxWidth;
				}
				if ( forcedMarginBoxHeight !== NULL )
				{
					containerHeight = forcedMarginBoxHeight;
				}
			
				this.prepare(element, calculatorOperationEnum.shrinkToFit, containerWidth, containerHeight);
			
				var
				clone						= this.cloneAndAppendToCalculator(element),
				cloneUsedStyle				= WINDOW.getComputedStyle(clone, NULL),
				shrinkToFitWidthAndHeight	= new WidthAndHeight(),
				forcedWidth, forcedHeight;
			
				/* Force a width or height for width/height if requested.
				 * We don't want to change the box-sizing on the box since we are not 
				 * overriding all of the border/padding/width/height properties and
				 * want the original values to work correctly. Convert the specified 
				 * forced length to the appropriate length for the width/height property.
				 **/
				if ( forcedMarginBoxWidth !== NULL )
				{
					forcedWidth = BoxSizeCalculator.calcBoxWidthFromMarginBoxWidth( clone, forcedMarginBoxWidth);
					clone.style.cssText +=	"min-width: " + forcedWidth.getPixelValueString() + "px; max-width: " +
											forcedWidth.getPixelValueString() + "px";
				}
				if ( forcedMarginBoxHeight !== NULL )
				{
					forcedHeight = BoxSizeCalculator.calcBoxHeightFromMarginBoxHeight( clone, forcedMarginBoxHeight);
					clone.style.cssText +=	"min-height: " + forcedHeight.getPixelValueString() + "; max-height: " +
											forcedHeight.getPixelValueString() + "px";
				}
				shrinkToFitWidthAndHeight.width		= BoxSizeCalculator.calcMarginBoxWidth( clone );
				shrinkToFitWidthAndHeight.height	= BoxSizeCalculator.calcMarginBoxHeight( clone );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return shrinkToFitWidthAndHeight;
			}
		},
		layoutVerifier: {
			error		: FALSE,
			verifyLayout: function ( gridObject )
			{
				var
				gridElement = gridObject.gridElement;
				
				// Get the available space for the grid since it is required
				// for determining track sizes for auto/fit-content/minmax 
				// and fractional tracks.
				this.determineGridAvailableSpace( gridObject );

				// console.log("Grid element content available space: columns = " + 
				//			gridObject.availableSpaceForColumns.getPixelValueString() + "; rows = " +
				//			gridObject.availableSpaceForRows.getPixelValueString());

				GridTest.propertyParser.parseGridTracksString(gridColumnsDefinition, gridObject.columnTrackManager);
				GridTest.propertyParser.parseGridTracksString(gridRowsDefinition, gridObject.rowTrackManager);

				gridObject.items = this.mapGridItemsToTracks(
					gridObject.gridElement, gridObject.columnTrackManager, gridObject.rowTrackManager
				);
				this.saveItemPositioningTypes(gridObject);
				
				this.determineTrackSizes(
					gridObject.gridElement, gridObject.columnTrackManager, gridObject.availableSpaceForColumns,
					"width", gridObject.useAlternateFractionalSizingForColumns
				);
				this.determineTrackSizes(
					gridObject.gridElement, gridObject.rowTrackManager, gridObject.availableSpaceForRows,
					"height", gridObject.useAlternateFractionalSizingForRows
				);

				this.calculateGridItemShrinkToFitSizes(gridObject);

				this.verifyGridItemSizes(gridObject);
				this.verifyGridItemPositions(gridObject);

				return ! this.error;
			},

			
			isPercentageValue: function ( valueString )
			{
				return ( valueString[valueString.length - 1] === '%' );
			},
			isBorderWidthKeyword: function ( valueString )
			{
				var valueLower = valueString.toLowerCase();
				return ( valueLower === "thin" || valueLower === "medium" || valueLower === "thick" );
			},
			buildCalcString: function ( width, operator, firstMargin, firstBorder, firstPadding, secondPadding, secondBorder, secondMargin )
			{
				var calcString = "calc(" + width + " " + operator + " ";
				if ( firstMargin !== "" )
				{
					calcString += firstMargin + " " + operator + " ";
				}
				if ( firstBorder !== "" )
				{
					calcString += firstBorder + " " + operator + " ";
				}
				if ( firstPadding !== "" )
				{
					calcString += firstPadding + " " + operator + " ";
				}
				if ( secondPadding !== "" )
				{
					calcString += secondPadding + " " + operator + " ";
				}
				if ( secondBorder !== "" )
				{
					calcString += secondBorder + " " + operator + " ";
				}
				if ( secondMargin !== "" )
				{
					calcString += secondMargin + " " + operator + " ";
				}
				return calcString += "0px)";
			},
			// UNUSED
			//getItemBreadth: function ( blockProgression, verifyingColumnBreadths, itemElement )
			//{
			//	if ( ( ( blockProgression === blockProgressionEnum.tb ||
			//			 blockProgression === blockProgressionEnum.bt ) &&
			//			 verifyingColumnBreadths === TRUE ) ||
			//		 ( ( blockProgression === blockProgressionEnum.lr ||
			//			 blockProgression === blockProgressionEnum.rl ) &&
			//			 verifyingColumnBreadths === FALSE ) )
			//	{
			//		return BoxSizeCalculator.calcMarginBoxWidth( itemElement );
			//	}
			//	else
			//	{
			//		return BoxSizeCalculator.calcMarginBoxHeight( itemElement );
			//	}
			//},
			// verifyingColumnBreadths == TRUE => verify length of items in the direction of columns 
			// verifyingColumnBreadths == FALSE => verify length of items in the direction of rows 
			dumpTrackLengths: function ( trackManager )
			{
				var
				trackIter	= trackManager.getIterator(),
				curTrack	= trackIter.next(),
				trackRange, trackInfoString;

				while ( curTrack !== NULL )
				{
					if ( curTrack instanceof implicitTrackRange )
					{
						trackRange = curTrack.firstNumber;
						if ( curTrack.span !== 1 )
						{
							trackRange += "-" + (curTrack.firstNumber + curTrack.span - 1);
						}
					}
					else
					{
						trackRange = curTrack.number;
					}
					trackInfoString = "track[" + trackRange + "] = " + curTrack.measure.getPixelValueString() + "px";

					// console.log(trackInfoString);

					curTrack = trackIter.next();
				}
			},
			// http://blogs.msdn.com/b/ie/archive/2009/05/29/the-css-corner-writing-mode.aspx 
			// is a great guide for how things should lay out.
			horizontalOffsetsAreReversed: function ( gridUsedStyle )
			{
				var
				reverseDirection	= FALSE,
				directionIsLTR		= gridUsedStyle.getPropertyValue("direction") === "ltr",
				blockProgression	= GridTest.layoutVerifier.blockProgressionStringToEnum(
										gridUsedStyle.getPropertyValue(BLOCKPROGRESSION)
										);
				if ( blockProgression === blockProgressionEnum.rl ||
					 ( ! directionIsLTR &&
						blockProgression !== blockProgressionEnum.lr ) )
				{
					reverseDirection = TRUE;
				}
				return reverseDirection;
			},
			verticalOffsetsAreReversed: function ( gridUsedStyle )
			{
				var
				reverseDirection	= FALSE,
				directionIsLTR		= gridUsedStyle.getPropertyValue("direction") === "ltr",
				blockProgression	= GridTest.layoutVerifier.blockProgressionStringToEnum(
										gridUsedStyle.getPropertyValue(BLOCKPROGRESSION)
										);
				if ( blockProgression === blockProgressionEnum.bt ||
					 ( ! directionIsLTR &&
						 ( blockProgression === blockProgressionEnum.lr ||
						 blockProgression === blockProgressionEnum.rl ) ) )
				{
					reverseDirection = TRUE;
				}
				return reverseDirection;
			},
			// Gets the grid item's logical offset relative to the grid element. 
			// The returned offset is for the margin box.
			// This function handles the physical to logical mapping for RTL.
			getGridItemMarginBoxHorizontalOffset: function ( item )
			{
				var
				itemElement		= item.itemElement,
				parentElement	= itemElement.parentNode,

				// Map physical offset to logical offset if necessary.
				reverseDirection = this.horizontalOffsetsAreReversed(parentUsedStyle),
				gridStartingContentEdgeOffset, parentOffsetAdjustment,
				itemMarginLeft, itemStartingMarginEdgeOffset, marginBoxWidth, offsetFromGridStartingContentEdge;
				
				if ( parentUsedStyle.getPropertyValue("position") === "static" )
				{
					// Offsets are the border-box.
					gridStartingContentEdgeOffset = LayoutMeasure.measureFromPx( parentElement.offsetLeft );
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( LayoutMeasure.measureFromStyleProperty( parentElement, "border-left-width" ) )
														.add( LayoutMeasure.measureFromStyleProperty( parentElement, "padding-left" ) );
				}
				else
				{
					// Grid is positioned; offset is based on the padding edge of the grid.
					gridStartingContentEdgeOffset = LayoutMeasure.measureFromStyleProperty( parentElement, "padding-left" );
				}

				if ( reverseDirection === TRUE )
				{
					// Reversing direction; the starting edge is on the other side.
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( LayoutMeasure.measureFromStyleProperty( parentElement, "width" ) );
				}

				itemMarginLeft					= LayoutMeasure.measureFromStyleProperty( itemElement, "margin-left" );
				itemStartingMarginEdgeOffset	= LayoutMeasure
													.measureFromPx( itemElement.offsetLeft )
													.subtract(itemMarginLeft);
				if ( reverseDirection === TRUE )
				{
					// Reversing direction; the starting edge is on the other side.
					marginBoxWidth					= BoxSizeCalculator.calcMarginBoxWidth( itemElement );
					itemStartingMarginEdgeOffset	= itemStartingMarginEdgeOffset.add( marginBoxWidth );
				}
				if (reverseDirection === FALSE)
				{
					offsetFromGridStartingContentEdge = itemStartingMarginEdgeOffset
															.subtract( gridStartingContentEdgeOffset );
				}
				else
				{
					offsetFromGridStartingContentEdge = gridStartingContentEdgeOffset
															.subtract( itemStartingMarginEdgeOffset );
				}
				return offsetFromGridStartingContentEdge;
			},
			getGridItemMarginBoxVerticalOffset: function ( item )
			{
				var
				itemElement		= item.itemElement,
				parentElement	= itemElement.parentNode,

				// Map physical offset to logical offset if necessary.
				reverseDirection = this.verticalOffsetsAreReversed(parentUsedStyle),
				gridStartingContentEdgeOffset, parentOffsetAdjustment,
				itemMarginTop, itemStartingMarginEdgeOffset, marginBoxHeight, offsetFromGridStartingContentEdge;
				
				if ( parentUsedStyle.getPropertyValue("position") === "static" )
				{
					// Offsets are the border-box.
					gridStartingContentEdgeOffset = LayoutMeasure.measureFromPx( parentElement );
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( LayoutMeasure.measureFromStyleProperty( parentElement, "border-top-width" ) )
														.add( LayoutMeasure.measureFromStyleProperty( parentElement, "padding-top" ) );
				}
				else
				{
					// Grid is positioned; offset is based on the padding edge of the grid.
					gridStartingContentEdgeOffset = LayoutMeasure.measureFromStyleProperty( parentElement, "padding-top" );
				}

				if ( reverseDirection === TRUE )
				{
					// Reversing direction; the starting edge is on the other side.
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( LayoutMeasure.measureFromStyleProperty( parentElement, "height" ) );
				}

				itemMarginTop					= LayoutMeasure.measureFromStyleProperty( itemElement, "margin-top" );
				itemStartingMarginEdgeOffset	= LayoutMeasure.measureFromPx( itemElement.offsetTop )
													.subtract(itemMarginTop);

				if ( reverseDirection === TRUE )
				{
					// Reversing direction; the starting edge is on the other side.
					marginBoxHeight					= BoxSizeCalculator.calcMarginBoxHeight( itemElement );
					itemStartingMarginEdgeOffset	= itemStartingMarginEdgeOffset.add(marginBoxHeight);
				}
				if (reverseDirection === FALSE)
				{
					offsetFromGridStartingContentEdge = itemStartingMarginEdgeOffset.subtract(gridStartingContentEdgeOffset);
				}
				else {
					offsetFromGridStartingContentEdge = gridStartingContentEdgeOffset.subtract(itemStartingMarginEdgeOffset);
				}

				return offsetFromGridStartingContentEdge;
			},
			// Gets the absolute positioned grid item's offset relative 
			// to the grid element. The returned offset is for the margin box.
			getAbsolutePositionedGridItemMarginBoxOffsetLeft: function ( item )
			{
				var
				itemElement 			= item.itemElement,
				gridElement 			= itemElement.parentNode,
				containingElement		= this.getContainingBlockElementForAbsolutePositionedGridItems(itemElement.parentNode),
				itemUsedStyle			= WINDOW.getComputedStyle(itemElement),
				gridElementUsedStyle	= WINDOW.getComputedStyle(gridElement, NULL),
				itemOffset				= LayoutMeasure.measureFromPx(itemElement.offsetLeft);

				if (containingElement !== itemElement.offsetParent)
				{
					// console.log("Absolute position grid item has wrong offsetParent");
				}
				if ( itemUsedStyle.getPropertyValue("left") === "auto" &&
					 itemUsedStyle.getPropertyValue("right") === "auto" )
				{
					// Positioned where it would have been if it was in the grid.
					if ( gridElementUsedStyle.getPropertyValue("position") === "static" )
					{
						// Grid wasn't the containing block; adjust the offset based on the grid's offset and MBP since it uses the same containing block.
						itemOffset = itemOffset
										.subtract( LayoutMeasure.measureFromPx(gridElement.offsetLeft )
										.add( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "margin-left") )
										.add( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "border-left-width") )
										.add( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-left") ) );
					}
				}
				if (gridElementUsedStyle.getPropertyValue("position") !== "static")
				{
					// The grid is the containing block; adjust the offset based on the grid's border and padding.
					itemOffset = itemOffset.subtract( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-left") );
				}
				return itemOffset;
			},
			// Gets the absolute positioned grid item's offset relative to the 
			// grid element. The returned offset is for the margin box.
			getAbsolutePositionedGridItemMarginBoxOffsetTop: function ( item )
			{
				var
				itemElement				= item.itemElement,
				gridElement				= item.itemElement.parentNode,
				containingElement		= this.getContainingBlockElementForAbsolutePositionedGridItems(itemElement.parentNode),
				itemUsedStyle			= WINDOW.getComputedStyle(itemElement),
				gridElementUsedStyle	= WINDOW.getComputedStyle(gridElement, NULL),
				itemOffset				= LayoutMeasure.measureFromPx(itemElement.offsetTop);
				
				if ( containingElement !== itemElement.offsetParent )
				{
					// console.log("Absolute position grid item has wrong offsetParent");
				}
				if ( itemUsedStyle.getPropertyValue("top") === "auto" &&
					 itemUsedStyle.getPropertyValue("bottom") === "auto" )
				{
					// Positioned where it would have been if it was in the grid.
					if ( gridElementUsedStyle.getPropertyValue("position") === "static" )
					{
						// Grid wasn't the containing block; adjust the offset based on 
						// the grid's offset and MBP since it uses the same containing block.
						itemOffset = itemOffset
										.subtract( LayoutMeasure.measureFromPx(gridElement.offsetLeft )
										.add( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "margin-top") )
										.add( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "border-top-width") )
										.add( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-top") ) );
					}
				}
				if ( gridElementUsedStyle.getPropertyValue("position") !== "static" )
				{
					// The grid is the containing block; adjust the offset based on the grid's border and padding.
					itemOffset = itemOffset.subtract( LayoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-top") );
				}
				return itemOffset;
			},
			getContainingBlockElementForAbsolutePositionedGridItems: function (gridElement)
			{
				var
				curElement = gridElement,
				curUsedStyle, curPosition;

				// CSS 2.1: 10.1 Definition of "containing block"
				//	 4. If the element has 'position: absolute', the containing block is established by the
				//		nearest ancestor with a 'position' of 'absolute', 'relative' or 'fixed', ...
				// TODO: handle rtl
				do {
					curUsedStyle = WINDOW.getComputedStyle(curElement, NULL);
					curPosition = curUsedStyle.getPropertyValue("position");

					if (curPosition === "absolute" || curPosition === "relative" || curPosition === "fixed") {
						break;
					}
					curElement = curElement.parentNode;
				}
				while (curElement !== document.body && curElement !== document.documentElement);

				if (curElement !== gridElement && curElement !== gridElement.offsetParent)
				{
					// console.log("offsetParent doesn't agree with calculated containing block");
				}
				return curElement;
			},
			getContainingBlockElementForStaticPositionedGridItems: function()
			{
				// CSS 2.1: 10.1 Definition of "containing block"
				//	 3. If the element has 'position: fixed', the containing block is established by the
				//		viewport in the case of continuous media or the page area in the case of paged media.
				//
				// All browsers except for Firefox return a NULL offsetParent for fixed positioned elements.
				return ( vendorPrefix === "moz" ) ? document.body : NULL;
			},
			// verifyingColumnPositions == TRUE => verify positions of items along the columns 
			// verifyingColumnPositions == FALSE => verify positions of items along the rows 
			verifyGridItemTrackPositions: function (gridObject, verifyingColumnPositions)
			{
				var
				trackManager				= verifyingColumnPositions	? gridObject.columnTrackManager
																		: gridObject.rowTrackManager,
				verificationWord			= verifyingColumnPositions ? "column" : "row",
				curTrackStartPosition		= LayoutMeasure.zero(),
				curTrackEndPosition			= LayoutMeasure.zero(),
				inFirstTrack				= TRUE,
				lastTrackWasContentSized	= FALSE,
				trackIter					= trackManager.getIterator(),
				curTrack					= trackIter.next(),
				verifyingHorizontalOffsets	= this.usePhysicalWidths(gridObject.blockProgression, verifyingColumnPositions),
				gridUsedStyle				= WINDOW.getComputedStyle(gridObject.gridElement, NULL),
				i, len, curItem, curGridItemUsedStyle, alignType,
				actualMeasure, firstTrack, trackSpan, spannedTrackMeasure,
				itemOffset, itemId, trackNum, expectedPosition,
				expectedPositionRounded, itemOffsetRounded;

				while ( curTrack !== NULL )
				{
					// The start of this track is right after where the previous one ends.
					if ( ! inFirstTrack )
					{
						curTrackStartPosition = curTrackEndPosition.add(new LayoutMeasure(1));
					}
					else {
						inFirstTrack = FALSE;
					}
					curTrackEndPosition = curTrackStartPosition
											.add( curTrack.measure )
											.subtract(new LayoutMeasure(1));

					for (i=0, len=curTrack.items.length; i < len; i++)
					{
						curItem = curTrack.items[i];
						// For spanning elements, we can have a single cell occupying more than one track.
						// The first track that contains it will trigger its verification.
						if ( ( verifyingColumnPositions ? curItem.verified.columnPosition : curItem.verified.rowPosition ) !== TRUE )
						{
							alignType			= verifyingColumnPositions ? curItem.columnAlign : curItem.rowAlign;
							actualMeasure		= verifyingHorizontalOffsets ?
													BoxSizeCalculator.calcMarginBoxWidth( curItem ) :
													BoxSizeCalculator.calcMarginBoxHeight( curItem );
							firstTrack			= verifyingColumnPositions ? curItem.column : curItem.row;
							trackSpan			= verifyingColumnPositions ? curItem.columnSpan : curItem.rowSpan;
							spannedTrackMeasure	= this.getSumOfSpannedTrackMeasures(trackManager, firstTrack, trackSpan);

							switch (curItem.position)
							{
								case positionEnum['static']:
								case positionEnum.relative:
									itemOffset = verifyingHorizontalOffsets ?
												 this.getGridItemMarginBoxHorizontalOffset( curItem ) :
												 this.getGridItemMarginBoxVerticalOffset( curItem );
									break;
								case positionEnum.absolute:
									itemOffset = verifyingHorizontalOffsets ?
												 this.getAbsolutePositionedGridItemMarginBoxOffsetLeft( curItem ) :
												 this.getAbsolutePositionedGridItemMarginBoxOffsetTop( curItem );
									// TODO: determine if we need to check the containing block's writing mode
									// instead of the grid's.
									// Temporarily allow the current, wrong behavior, by considering it to 
									// always be "start" positioned if it is absolute with an auto position.
									if ( verifyingHorizontalOffsets &&
										 curGridItemUsedStyle.getPropertyValue("left") === "auto" &&
										 curGridItemUsedStyle.getPropertyValue("right") === "auto")
									{
										alignType = gridAlignEnum.start;
									}
									else if ( ! verifyingHorizontalOffsets &&
												curGridItemUsedStyle.getPropertyValue("top") === "auto" &&
												curGridItemUsedStyle.getPropertyValue("bottom") === "auto" )
									{
											alignType = gridAlignEnum.start;
									}
									break;
								case positionEnum.fixed:
									if ( curItem.itemElement.offsetParent !== this.getContainingBlockElementForStaticPositionedGridItems() )
									{
										// console.log("Fixed position grid item has wrong offsetParent");
									}
									itemOffset = verifyingHorizontalOffsets ?
												 LayoutMeasure.measureFromPx(curItem.itemElement.offsetLeft) :
												 LayoutMeasure.measureFromPx(curItem.itemElement.offsetTop);
									break;
								default:
									// console.log("Unknown position type " + curItem.position.keyword);
							}

							itemId = "";
							if ( curItem.itemElement.id.length > 0 )
							{
								itemId = "[ID = " + curItem.itemElement.id + "] ";
							}
							trackNum = verifyingColumnPositions ? curItem.column : curItem.row;

							if ( curItem.position === positionEnum.fixed )
							{
								/* Fixed position grid items aren't positioned by the grid.
								 * TODO: determine if the following TODO makes sense
								 * (can fixed position items be influenced by a writing mode?)
								 * TODO: update getLeftPositionForFixedPosition/getTopPositionForFixedPosition 
								 * to be named getColumnPositionForFixedPosition/getRowPositionForFixedPosition
								 * and have them check the writing mode of the root of the document.
								 **/
								expectedPosition = verifyingColumnPositions ?
													 this.getLeftPositionForFixedPosition(curGridItemUsedStyle) :
													 this.getTopPositionForFixedPosition(curGridItemUsedStyle);
							}
							else
							{
								switch (alignType)
								{
									case gridAlignEnum.stretch:
									case gridAlignEnum.start:
										// Item is placed at the beginning of the track.
										expectedPosition = curTrackStartPosition;
										break;
									case gridAlignEnum.end:
										// Item is placed at the end of the tracks it spans.
										expectedPosition = curTrackStartPosition.add(spannedTrackMeasure.subtract(actualMeasure));
										break;
									case gridAlignEnum.center:
										// Item is centered in the tracks it spans.
										expectedPosition = curTrackStartPosition
															.add( spannedTrackMeasure.subtract(actualMeasure).divide(2) );
										break;
									default:
										// console.log("Unknown grid align type " + alignType.keyword);
								}
							}

							// Relative positioned elements are sized and positioned 
							// normally and, after that is complete, have their positions adjusted.
							if ( curItem.position === positionEnum.relative )
							{
								if ( verifyingHorizontalOffsets )
								{
									expectedPosition = this.adjustLeftPositionForRelativePosition(curGridItemUsedStyle, expectedPosition);
								}
								else
								{
									expectedPosition = this.adjustTopPositionForRelativePosition(curGridItemUsedStyle, expectedPosition);
								}
							}
							else if ( curItem.position === positionEnum.absolute )
							{
								if ( verifyingColumnPositions )
								{
									if ( curGridItemUsedStyle.getPropertyValue("left") !== "auto" )
									{
										expectedPosition = LayoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "left")
																.add( LayoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "margin-left") );
									}
									else if ( curGridItemUsedStyle.getPropertyValue("right") !== "auto" )
									{
										/* We don't get a used value for "left" if it was auto 
										 * and right was specified ("auto" is returned).
										 * The only browser that returns the used values correctly is Firefox.
										 * Bug was filed for this issue but wasn't fixed for IE9. It might be for IE10.
										 * It is harder to determine the position for when right is specified because 
										 * we need to figure out our parent's box size, subtract the value for the
										 * right property from that, and then subtract the size of our box. 
										 **/
										// console.log("Not implemented: verification of absolute positioned items with 'right' specified and 'left' auto.");
									}
								}
								else
								{
									if ( curGridItemUsedStyle.getPropertyValue("top") !== "auto" )
									{
										expectedPosition = LayoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "top")
															.add( LayoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "margin-top") );
									}
									else if ( curGridItemUsedStyle.getPropertyValue("bottom") !== "auto" )
									{
										// See note above about why we didn't implement this (it's extra work).
										// console.log("Not implemented: verification of absolute positioned items with 'bottom' specified and 'top' auto.");
									}
								}
							}
							
							// offsets don't include fractional pixels; always round
							expectedPositionRounded = expectedPosition.getMeasureRoundedToWholePixel();
							// also round the offset in case it is a logical offset
							// (i.e. a different writing mode) which may contain a fractional pixel
							itemOffsetRounded = itemOffset.getMeasureRoundedToWholePixel();

							if (expectedPositionRounded.equals(itemOffsetRounded) !== TRUE)
							{
								// If it is center aligned, allow a small margin of error.
								if ( alignType === gridAlignEnum.center &&
										// less than a pixel off
									 Math.abs(expectedPosition
												.subtract(itemOffset)
												.getRawMeasure()) < Math.pow(10, precision) &&
									 // within 1 layout pixel of rounding differently
									 Math.abs(expectedPosition.getRawMeasure() - itemOffset.getRawMeasure()) % (
										5 * Math.pow(10, precision-1) ) <= 1 )
								{
									// console.log( itemId + (verifyingColumnPositions ? "column" : "row") +
									//			 " " + trackNum + ": " + verificationWord +
									//			 " position check passed for center aligned item after adjustment (alignment: " +
									//			 alignType.keyword + "; expected (unrounded): " + expectedPosition.getPixelValueString() +
									//			 "; actual: " + itemOffset.getPixelValueString() + ")" );
								}
								 // Check if offset rounding errors may have caused an allowable difference.
								else if (
									// Offset is reversed; compounding rounding error may have caused a problem.
									( verifyingHorizontalOffsets &&
										this.horizontalOffsetsAreReversed(gridUsedStyle) ||
	 									! verifyingHorizontalOffsets &&
	 									this.verticalOffsetsAreReversed(gridUsedStyle) ) &&
									// Stretch/end don't have any additional rounding problems since they hit the far edge.
									( alignType !== gridAlignEnum.stretch ||
										alignType !== gridAlignEnum.end ) &&
									// Within 1 pixel.
									Math.abs(expectedPosition.getRawMeasure() - itemOffset.getRawMeasure()) < 
										Math.pow(10, precision) )
								{
									// console.log( itemId + (verifyingColumnPositions ? "column" : "row") + " " + trackNum +
									// 			 ": " + verificationWord +
									//			 " position check passed for non-stretch/non-end aligned reversed offset item after adjustment (alignment: " +
									//			 alignType.keyword + "; expected (unrounded): " + expectedPosition.getPixelValueString() + 
									//			 "; actual: " + itemOffset.getPixelValueString() + ")" );
								}
								else
								{
									this.error = TRUE;
									// console.log( itemId + (verifyingColumnPositions ? "column" : "row") + " " + trackNum + ": " +
									// 			 verificationWord + " position check failed (alignment: " + alignType.keyword +
									//			 "; expected (unrounded): " + expectedPosition.getPixelValueString() + "; actual: " +
									//			 itemOffset.getPixelValueString() + ")" );
								}
							}
							else
							{
								// console.log( itemId + (verifyingColumnPositions ? "column" : "row") + " " + trackNum + ": " + 
								//			 verificationWord + " position check passed (alignment: " + alignType.keyword + 
								//			 "; expected (unrounded): " + expectedPosition.getPixelValueString() + "; actual: " +
								//			 itemOffset.getPixelValueString() + ")" );
							}
							if ( verifyingColumnPositions )
							{
								curItem.verified.columnPosition = TRUE;
							}
							else
							{
								curItem.verified.rowPosition = TRUE;
							}
						}
					}
					if (curTrack.contentSizedTrack)
					{
						lastTrackWasContentSized = TRUE;
					}
					else
					{
						lastTrackWasContentSized = FALSE;
					}
					curTrack = trackIter.next();
				}
			},
			adjustLeftPositionForRelativePosition: function (usedStyle, expectedLeftPosition)
			{
				var adjusted = expectedLeftPosition;
				if ( usedStyle.left !== "auto" )
				{
					adjusted = adjusted.add( LayoutMeasure.measureFromStyleProperty(usedStyle, "left") );
				}
				else if (usedStyle.right !== "auto")
				{
					adjusted = adjusted.subtract( LayoutMeasure.measureFromStyleProperty(usedStyle, "right") );
				}
				return adjusted;
			},
			adjustTopPositionForRelativePosition: function ( usedStyle, expectedTopPosition )
			{
				var adjusted = expectedTopPosition;
				if ( usedStyle.top !== "auto" )
				{
					adjusted = adjusted.add( LayoutMeasure.measureFromStyleProperty(usedStyle, "top") );
				}
				else if ( usedStyle.bottom !== "auto" )
				{
					adjusted = adjusted.subtract( LayoutMeasure.measureFromStyleProperty(usedStyle, "bottom") );
				}
				return adjusted;
			},
			getTopPositionForFixedPosition: function (usedStyle)
			{
				var expectedTopPosition = 0;
				if ( usedStyle.top !== "auto" )
				{
					expectedTopPosition = LayoutMeasure.measureFromStyleProperty(usedStyle, "top");
				}
				else if ( usedStyle.bottom !== "auto" )
				{
					expectedTopPosition = LayoutMeasure.measureFromStyleProperty(usedStyle, "bottom");
				}
				return expectedTopPosition;
			},
			getLeftPositionForFixedPosition: function (usedStyle)
			{
				var expectedLeftPosition = 0;
				if ( usedStyle.left !== "auto" )
				{
					expectedLeftPosition = LayoutMeasure.measureFromStyleProperty(usedStyle, "left");
				}
				else if ( usedStyle.right !== "auto" )
				{
					expectedLeftPosition = LayoutMeasure.measureFromStyleProperty(usedStyle, "right");
				}
				return expectedLeftPosition;
			},
			compareFractionTracksNormalMeasure: function (a, b)
			{
				if ( ! GridTest.trackIsFractionSized(a) ||
					 ! GridTest.trackIsFractionSized(b) )
				{
					// console.log("compareFractionTracksNormalMeasure called for non-fraction sized track");
				}

				var
				result = 0,
				// Called from a sort function; can't depend on "this" object being GridTest.layoutVerifier.
				normalFractionMeasureA = GridTest.layoutVerifier.getNormalFractionMeasure.call(GridTest.layoutVerifier, a),
				normalFractionMeasureB = GridTest.layoutVerifier.getNormalFractionMeasure.call(GridTest.layoutVerifier, b);
				if ( normalFractionMeasureA.getRawMeasure() < normalFractionMeasureB.getRawMeasure() )
				{
					result = -1;
				}
				else if ( normalFractionMeasureA.getRawMeasure() > normalFractionMeasureB.getRawMeasure() )
				{
					result = 1;
				}
				else
				{
					if ( a.size.value > b.size.value )
					{
						result = -1;
					}
					else if ( a.size.value < b.size.value )
					{
						result = 1;
					}
				}
				return result;
			},
			isSmallerNumberAndWithinOneOfLargerNumber: function (smaller, larger)
			{
				if ( ( larger - smaller ) <= 1 )
				{
					return TRUE;
				}
				return FALSE;
			},
			determineMeasureOfOneFractionUnconstrained: function (fractionalTracks)
			{
				// Iterate over all of the fractional tracks, 
				var
				maxOneFractionMeasure = LayoutMeasure.zero(),
				i, iLen = fractionalTracks.length,
				curTrack, curFractionValue, oneFractionMeasure;
				for ( i=0; i < iLen; i++ )
				{
					curTrack			= fractionalTracks[i];
					curFractionValue	= curTrack.size.value;
					oneFractionMeasure	= curTrack.maxMeasure.divide(curFractionValue);
					if ( oneFractionMeasure.getRawMeasure() > maxOneFractionMeasure.getRawMeasure() )
					{
						maxOneFractionMeasure = oneFractionMeasure;
					}
				}
				return maxOneFractionMeasure;
			},
			getContentBasedTracksThatSpanCrosses: function ( trackManager, firstTrackNum, numSpanned )
			{
				var
				contentBasedTracks	= [],
				tracks				= trackManager.getTracks(firstTrackNum, firstTrackNum + numSpanned - 1),
				i, iLen = tracks.length, size;
				for ( i = 0; i < iLen; i++ )
				{
					size = tracks[i].size;
					if ( tracks[i].sizingType === sizingTypeEnum.keyword &&
						 ( size === gridTrackValueEnum.fitContent ||
							 size === gridTrackValueEnum.auto ) )
					{
						contentBasedTracks.push(tracks[i]);
					}
				}
				return contentBasedTracks;
			},
			redistributeSpace: function (tracksToGrow, remainingSpace, totalSpaceToRedistribute)
			{
				var
				spaceToRedistribute	= LayoutMeasure.min(remainingSpace, totalSpaceToRedistribute),
				totalNumberOfTracks	= 0,
				i, iLen = tracksToGrow.length,
				measureToAddPerTrack;
				
				remainingSpace = remainingSpace.subtract(spaceToRedistribute);

				for ( i = 0; i < iLen; i++ )
				{
					if ( tracksToGrow[i] instanceof implicitTrackRange )
					{
						totalNumberOfTracks += tracksToGrow[i].span;
					}
					else
					{
						totalNumberOfTracks += 1;
					}
				}

				measureToAddPerTrack = spaceToRedistribute.divide(totalNumberOfTracks);
				for ( i = 0; i < iLen; i++ )
				{
					if ( tracksToGrow[i] instanceof implicitTrackRange )
					{
						tracksToGrow[i].measure = tracksToGrow[i].measure.add(measureToAddPerTrack.multiply(tracksToGrow[i].span));
					}
					else
					{
						tracksToGrow[i].measure = tracksToGrow[i].measure.add(measureToAddPerTrack);
					}
				}
				return remainingSpace;
			}
		},
		
		propertyParser: {
			// Parses property string definitions and get an associative array of track objects.
			parseGridTracksString: function ( tracksDefinition, trackManager )
			{
				// TODO: add support for minmax definitions which will involve a more complicated tokenizer than split() (a regex?).
				var
				trackStrings	= tracksDefinition.split(regexSpaces),
				length			= trackStrings.length,
				i, newTrack, valueAndUnit;
				if ( length === 1 &&
					 ( trackStrings[0].length === 0 ||
						 trackStrings[0].toLowerCase() === "none" ) )
				{
					// Empty definition.
				}
				else
				{
					for ( i = 0; i < length; i++ )
					{
						trackStrings[i] = trackStrings[i].toLowerCase();

						newTrack = NULL;
						if ( this.isKeywordTrackDefinition(trackStrings[i]) )
						{
							newTrack			= new Track();
							newTrack.number		= i + 1;
							newTrack.size		= GridTest.layoutVerifier.gridTrackValueStringToEnum(trackStrings[i]);
							newTrack.sizingType = sizingTypeEnum.keyword;
							trackManager.addTrack(newTrack);
						}
						else
						{
							// Not a keyword; this is a CSS value.
							valueAndUnit = this.tryParseCssValue(trackStrings[i]);
							if ( valueAndUnit.value === NULL ||
								 valueAndUnit.unit === NULL )
							{
								// console.log("Not a keyword or a valid CSS value; track " + (i + 1) + " = " + trackStrings[i]);
								// console.log("Invalid track definition '" + trackStrings[i] + "'");
							}

							if ( ! this.isValidCssValueUnit(valueAndUnit.unit) )
							{
								// console.log("Invalid track unit '" + valueAndUnit.unit + "'");
							}

							newTrack			= new Track();
							newTrack.number		= i + 1;
							newTrack.size		= valueAndUnit;
							newTrack.sizingType = sizingTypeEnum.valueAndUnit;
							trackManager.addTrack(newTrack);
						}
					}
				}
			},
			// Parses CSS values into their value and their unit.
			tryParseCssValue: function (typedValue)
			{
				// First match: 0 or more digits, an optional decimal, and any digits after the decimal.
				// Second match: anything after the first match (the unit).
				var
				expression		= /^(\d*\.?\d*)(.*)/,
				regexResult		= typedValue.match(expression),
				valueAndUnit	= new CSSValueAndUnit();

				if ( regexResult[0].length > 0 &&
					 regexResult[1].length > 0 &&
					 regexResult[2].length > 0 )
				{
					if ( regexResult[1].indexOf('.') < 0 )
					{
						valueAndUnit.value = parseInt(regexResult[1], 10);
					}
					else {
						valueAndUnit.value = parseFloat(regexResult[1], 10);
					}
					valueAndUnit.unit = regexResult[2];
				}
				return valueAndUnit;
			},
			isValidCssValueUnit: function (unit)
			{
				var ret = FALSE;
				switch (unit)
				{
					case 'px':
					case '%':
					case 'pt':
					case 'pc':
					case 'in':
					case 'cm':
					case 'mm':
					case 'em':
					case 'ex':
					case 'vh':
					case 'vw':
					case 'vm':
					case 'ch':
					case 'rem':
					case 'fr': // Grid only
						ret = TRUE;
				}
				return ret;
			},
			isKeywordTrackDefinition: function (definition)
			{
				var ret = FALSE;
				switch (definition)
				{
					case gridTrackValueEnum.auto.keyword:
					case gridTrackValueEnum.minContent.keyword:
					case gridTrackValueEnum.maxContent.keyword:
					case gridTrackValueEnum.fitContent.keyword:
						ret = TRUE;
				}
				return ret;
			}
		}
	};
	
	function LayoutMeasure( measure )
	{
		if ( measure % 1 !== 0 )
		{
			// console.log("LayoutMeasures must be integers, measure was " + typeof(measure) + "(" + measure + ")" );
		}
		this.internalMeasure = measure;
	}
	LayoutMeasure.measureFromPx = function( measureInPx )
	{
		// Convert to accuracy of agent's layout engine.
		return new LayoutMeasure( Math.round( measureInPx * Math.pow(10, precision) ) );
	};
	LayoutMeasure.measureFromPxString = function( measureInPxString )
	{
		var
		length			= measureInPxString.length,
		wholePart		= 0,
		fractionPart	= 0,
		decimalPosition = measureInPxString.indexOf('.');
		
		// Don't depend on a potentially lossy conversion to a float-- we'll parse it ourselves.
		measureInPxString = measureInPxString.substr( 0, measureInPxString.length - 2 );
		
		if ( decimalPosition >= 0 )
		{
			fractionPart = measureInPxString.substring( decimalPosition + 1 );
			while ( fractionPart.length < precision )
			{
				fractionPart += '0';
			}
			fractionPart = parseInt( fractionPart, 10 );
		}
		if ( decimalPosition !== 0 )
		{
			wholePart = measureInPxString.substring( 0, decimalPosition >= 0 ? decimalPosition : length );
			wholePart = parseInt( wholePart, 10 ) * Math.pow( 10, precision );
		}
		return new LayoutMeasure( wholePart + fractionPart );
	};
	LayoutMeasure.measureFromStyleProperty = function ( el, property )
	{
		return this.measureFromPxString( getCSSValue( el, property ) );
	};
	LayoutMeasure.zero = function()
	{
		return new LayoutMeasure(0);
	};
	LayoutMeasure.min = function ( a, b )
	{
		return new LayoutMeasure(Math.min(a.internalMeasure, b.internalMeasure));
	};
	LayoutMeasure.max = function ( a, b )
	{
		return new LayoutMeasure(Math.max(a.internalMeasure, b.internalMeasure));
	};
	LayoutMeasure.prototype.getRawMeasure = function()
	{
		return this.internalMeasure;
	};
	LayoutMeasure.prototype.getPixelValueString = function()
	{
		var
		wholePixelString, internalMeasureString, fractionOfPixel, fractionOfPixelString;
		if ( Math.abs( this.internalMeasure ) < Math.pow( 10, precision ) )
		{
			// Not a whole pixel.
			if ( this.internalMeasure < 0 )
			{
				wholePixelString = "-0";
			}
			else
			{
				wholePixelString = '0';
			}
		}
		else
		{
			internalMeasureString	= this.internalMeasure + '';
			wholePixelString		= internalMeasureString.substr( 0, internalMeasureString.length - precision );
		}
		fractionOfPixel = Math.abs(this.internalMeasure % Math.pow(10, precision));
		if ( fractionOfPixel == 0 )
		{
			fractionOfPixelString = '';
		}
		else
		{
			fractionOfPixelString = fractionOfPixel + '';
		}
		if ( fractionOfPixelString.length == 1 )
		{
			 fractionOfPixelString = '0' + fractionOfPixelString;
		}
		if ( fractionOfPixelString[1] === '0' )
		{
			// Remove trailing 0.
			fractionOfPixelString = fractionOfPixelString[0];
		}
		return wholePixelString + (fractionOfPixelString.length === 0 ? '' : ("." + fractionOfPixelString));
	};
	LayoutMeasure.prototype.getPixelValue = function()
	{
		return this.internalMeasure / Math.pow(10, precision);
	};
	LayoutMeasure.prototype.getMeasureRoundedToWholePixel = function()
	{
		var
		fractionOfPixel = Math.abs( this.internalMeasure % Math.pow(10, precision) ),
		adjustment;
		if ( fractionOfPixel >= 5 * Math.pow(10, precision - 1) )
		{
			// Round up.
			adjustment = Math.pow(10, precision) - fractionOfPixel;
		}
		else
		{
			// Round down.
			adjustment = 0 - fractionOfPixel;
		}
		if ( this.internalMeasure < 0 )
		{
			adjustment = 0 - adjustment;
		}
		return new LayoutMeasure( this.internalMeasure + adjustment );
	};
	LayoutMeasure.prototype.add = function( measure )
	{
		if ( ! ( measure instanceof LayoutMeasure ) )
		{
			// console.log("LayoutMeasure.add only accepts layout measures");
		}
		return new LayoutMeasure( this.internalMeasure + measure.internalMeasure );
	};
	LayoutMeasure.prototype.subtract = function( measure )
	{
		if ( ! ( measure instanceof LayoutMeasure ) )
		{
			// console.log("LayoutMeasure.subtract only accepts layout measures");
		}
		return new LayoutMeasure( this.internalMeasure - measure.internalMeasure );
	};
	LayoutMeasure.prototype.multiply = function( number )
	{
		if ( typeof number !== "number" )
		{
			// console.log("LayoutMeasure.multiply only accepts numbers");
		}
		// Integer arithmetic; drop any remainder.
		return new LayoutMeasure( Math.floor(this.internalMeasure * number) );
	};
	LayoutMeasure.prototype.divide = function( number )
	{
		if (typeof number !== "number")
		{
			// console.log("LayoutMeasure.divide only accepts number");
		}
		// Integer arithmetic; drop any remainder.
		return new LayoutMeasure( Math.floor(this.internalMeasure / number) );
	};
	LayoutMeasure.prototype.equals = function( measure )
	{
		if ( ! ( measure instanceof LayoutMeasure ) )
		{
			// console.log("LayoutMeasure.equals only accepts layout measures");
		}
		return this.internalMeasure === measure.internalMeasure;
	};


	function TrackManager()
	{
		this.tracks					= [];
		this.implicitTrackRanges	= [];
	}
	TrackManager.prototype.addTrack = function( trackToAdd )
	{
		this.tracks.push( trackToAdd );
	};
	TrackManager.prototype.getRangeLastTrackNumber = function( range )
	{
		return range.firstNumber + range.span - 1;
	};
	TrackManager.prototype.makeRoomForExplicitTrack = function( trackNumber )
	{
		var
		i = 0, len = this.implicitTrackRanges.length,
		curRange, nextRange, firstRangeNum, firstRangeSpan, secondRangeNum, secondRangeSpan, newRange, lastTrackNumber;
		
		for ( ; i < len; i++)
		{
			curRange		= this.implicitTrackRanges[i];
			lastTrackNumber = this.getRangeLastTrackNumber( curRange );
			if ( trackNumber >= curRange.firstNumber &&
				 trackNumber <= lastTrackNumber )
			{
				// This range covers the explicit track we are adding. Split, if necessary, and vacate the track.
				nextRange = i < len - 1 ? NULL : this.implicitTrackRanges[i + 1];
				// In the first track this range covers.
				if ( trackNumber === curRange.firstNumber )
				{
					if (curRange.span === 1) {
						// Remove the range.
						this.implicitTrackRanges.splice(i, 1);
					}
					else
					{
						// Vacate the track.
						curRange.firstNumber += 1;
						curRange.span -= 1;
					}
				}
				// In the last track this range covers.					
				else if ( trackNumber === lastTrackNumber )
				{
					// Vacate the track.
					curRange.span -= 1;
				}
				// Need to split the range.
				else
				{
					// Compute new range values.
					firstRangeNum	= curRange.firstNumber;
					firstRangeSpan	= trackNumber - curRange.firstNumber;
					secondRangeNum	= trackNumber + 1;
					secondRangeSpan = lastTrackNumber - secondRangeFirstNumber + 1;

					// Move the existing range to the second half and add a new range before it.
					curRange.firstNumber = secondRangeFirstNumber;
					curRange.span = secondRangeSpan;

					newRange = new ImplicitTrackRange();
					newRange.firstNumber	= firstRangeFirstNumber;
					newRange.span			= firstRangeSpan;
					// Insert before the existing range.
					this.implicitTrackRanges.splice(i, 0, newRange);
				}
				break;
			}
		}
	};
	TrackManager.prototype.ensureFirstTrackExists = function ( firstTrackNumber )
	{
		// Ensure an actual track object exists for the first track.
		this.makeRoomForExplicitTrack(firstTrackNumber);

		var 
		i					= 0,
		len					= this.tracks.length,
		newTrack			= new Track();
		newTrack.number		= firstTrackNumber;
		newTrack.sizingType = sizingTypeEnum.keyword;
		newTrack.size		= gridTrackValueEnum.auto;
		newTrack.implicit	= TRUE;
		
		if ( len === 0 ||
			 firstTrackNumber > this.tracks[len-1].number )
		{
			// No tracks OR it doesn't exist
			// add to the end.
			this.addTrack(newTrack);
		}
		else if ( firstTrackNumber === this.tracks[len-1].number )
		{
			// Already exists at the end.
		}
		else
		{
			// Doesn't belong at the end. Determine if it exists and, if not, create one and insert it.
			for ( i = 0; i < len; i++ )
			{
				if ( firstTrackNumber === this.tracks[i].number )
				{
					break; // Already exists.
				}
				else if ( firstTrackNumber < this.tracks[i].number )
				{
					this.tracks.splice(i, 0, newTrack);
					break;
				}
			}
		}
	};
	TrackManager.prototype.ensureTracksExist = function ( firstTrackNumber, lastTrackNumber )
	{
		var
		newRangeFirstNumber = firstTrackNumber,
		newRangeLastNumber	= lastTrackNumber,
		trackLength			= this.tracks.length,
		rangesToCreate, curFirstTrackNumber, curLastTrackNumber, nonRangeTrackIndex,
		existingRangeIndex, newRangeIndex, rangesToCreateLength, implicitTrackRangesLength,
		rangeToCreate, rangeToCreateFirstNumber, rangeToCreateLastNumber, needToCreateRange,
		existingRange, existingRangeFirstNumber, existingRangeLastNumber,
		firstRangeFirstNumber, firstRangeSpan,
		secondRangeFirstNumber, secondRangeSpan,
		thirdRangeFirstNumber, thirdRangeSpan,		
		newRange;

		this.ensureFirstTrackExists(firstTrackNumber);

		// First track now exists; insert one or more ranges into the set of implicit track ranges.
		firstTrackNumber++;

		if ( firstTrackNumber <= lastTrackNumber )
		{
			rangesToCreate		= [];
			curFirstTrackNumber = firstTrackNumber;
			curLastTrackNumber	= lastTrackNumber;
			// Iterate over the non-range track objects and split up our range into multiple ones if necessary.
			if ( trackLength === 0 )
			{
				// TODO: throw instead of pushing here; at least one track should have been created by ensureFirstTrackExists.
				rangesToCreate.push({ first: curFirstTrackNumber, last: curLastTrackNumber });
			}
			for ( nonRangeTrackIndex = 0; nonRangeTrackIndex < trackLength; nonRangeTrackIndex++ )
			{
				if ( curFirstTrackNumber > curLastTrackNumber ||
					 this.tracks[nonRangeTrackIndex].number > curLastTrackNumber )
				{
					break;
				}

				// This track sits inside our range.
				if ( this.tracks[nonRangeTrackIndex].number >= curFirstTrackNumber &&
					 this.tracks[nonRangeTrackIndex].number <= curLastTrackNumber)
				{
					if ( curFirstTrackNumber === this.tracks[nonRangeTrackIndex].number )
					{
						// No need to create a new range; just move out of the way.
						curFirstTrackNumber++;
					}
					else if ( curLastTrackNumber === this.tracks[nonRangeTrackIndex].number )
					{
						// No need to create a new range; just move out of the way.
						curLastTrackNumber--;
					}
					else
					{
						// Split the range
						// add the first half to the list of ranges to create,
						// and continue through the loop with the second half, searching
						// for more intersections with non-range tracks.
						rangesToCreate.push({ first: curFirstTrackNumber, last: this.tracks[nonRangeTrackIndex].number - 1 });
						curFirstTrackNumber = this.tracks[nonRangeTrackIndex].number + 1;
					}
				}
			}
			if ( curFirstTrackNumber <= curLastTrackNumber )
			{
				rangesToCreate.push({ first: curFirstTrackNumber, last: curLastTrackNumber });
			}
			existingRangeIndex		= 0;
			rangesToCreateLength	= rangesToCreate.length;
			for ( newRangeIndex = 0; newRangeIndex < rangesToCreateLength; newRangeIndex++ )
			{
				rangeToCreate				= rangesToCreate[newRangeIndex];
				rangeToCreateFirstNumber	= rangeToCreate.first;
				rangeToCreateLastNumber		= rangeToCreate.last;
				needToCreateRange			= TRUE;
				implicitTrackRangesLength	= this.implicitTrackRanges.length;
				for ( ; existingRangeIndex < implicitTrackRangesLength; existingRangeIndex++ )
				{
					// Find any ranges that might intersect.
					existingRange				= this.implicitTrackRanges[existingRangeIndex];
					existingRangeFirstNumber	= existingRange.firstNumber;
					existingRangeLastNumber		= getRangeLastTrackNumber(existingRange);

					if ( rangeToCreateLastNumber < existingRangeFirstNumber )
					{
						// We are past the existing range.
						break;
					}
					else if ( rangeToCreateFirstNumber > existingRangeLastNumber )
					{
						// Keep searching.
						continue;
					}
					// Check if this same range already exists.
					else if ( rangeToCreateFirstNumber == existingRangeFirstNumber &&
								rangeToCreateLastNumber == existingRangeLastNumber )
					{
						needToCreateRange = FALSE;
						break;
					}
					// We have some intersection. 
					// Split into up to three ranges to cover the existing range and our new one.else
					else
					{
						firstRangeFirstNumber	= Math.min(rangeToCreateFirstNumber, existingRangeFirstNumber);
						firstRangeSpan			= Math.max(rangeToCreateFirstNumber, existingRangeFirstNumber) - firstRangeFirstNumber;
						secondRangeFirstNumber	= firstRangeFirstNumber + firstRangeSpan;
						secondRangeSpan			= Math.min(rangeToCreateLastNumber, existingRangeLastNumber) - secondRangeFirstNumber;
						thirdRangeFirstNumber	= secondRangeFirstNumber + secondRangeSpan;
						thirdRangeSpan			= Math.max(rangeToCreateLastNumber, existingRangeLastNumber) - thirdRangeFirstNumber + 1;

						// Insert the new ranges in front of the existing one.
						if ( firstRangeSpan > 0 )
						{
							newRange = new ImplicitTrackRange();
							newRange.firstNumber = firstRangeFirstNumber;
							newRange.span = firstRangeSpan;
							this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
							existingRangeIndex++;
						}
						if (secondRangeSpan > 0) {
							newRange = new ImplicitTrackRange();
							newRange.firstNumber = secondRangeFirstNumber;
							newRange.span = secondRangeSpan;
							this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
							existingRangeIndex++;
						}
						if (thirdRangeSpan > 0) {
							newRange = new ImplicitTrackRange();
							newRange.firstNumber = thirdRangeFirstNumber;
							newRange.span = thirdRangeSpan;
							this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
							existingRangeIndex++;
						}
						// Remove the old range.
						this.implicitTrackRanges.splice(existingRangeIndex, 1);
						needToCreateRange = FALSE;
						break;
					}
				}
				if ( needToCreateRange )
				{
					newRange				= new ImplicitTrackRange();
					newRange.firstNumber	= rangeToCreateFirstNumber;
					newRange.span			= rangeToCreateLastNumber - rangeToCreateFirstNumber + 1;

					if ( existingRangeIndex >= this.implicitTrackRanges.length )
					{
						// Add to the end.
						this.implicitTrackRanges.push(newRange);
					}
					else
					{
						// Add before the existing one.
						this.implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
					}
				}
			}
		}
	};
	TrackManager.prototype.getIterator = function()
	{
		return new TrackIterator(this);
	};
	TrackManager.prototype.getTrack = function ( trackNumber )
	{
		var
		i, len = this.tracks.length, curRangeLastNumber;
		while ( len-- )
		{
			if ( this.tracks[len].number < trackNumber )
			{
				break;
			}
			if ( trackNumber == this.tracks[len].number )
			{
				return this.tracks[len];
			}
		}
		len = this.implicitTrackRanges.length;
		for ( i = 0; i < len; i++) {
			curRangeLastNumber = this.implicitTrackRanges[i].firstNumber + this.implicitTrackRanges[i].span - 1;
			if ( trackNumber >= this.implicitTrackRanges[i].firstNumber &&
				 trackNumber <= curRangeLastNumber )
			{
				return this.implicitTrackRanges[i];
			}
		}
		// console.log("getTrack: invalid track number " + trackNumber);
	};
	TrackManager.prototype.getTracks = function ( firstTrackNumber, lastTrackNumber )
	{
		var
		collection			= [],
		tracks				= this.tracks,
		implicitTrackRanges = this.implicitTrackRanges,
		number, i, len, curRangeLastNumber;
		for ( i=0, len=tracks.length; i < len; i++ )
		{
			number = tracks[i].number;
			if ( number > lastTrackNumber )
			{
				break;
			}
			if ( number >= firstTrackNumber &&
				 number <= lastTrackNumber )
			{
				collection.push( tracks[i] );
			}
		}
		for ( i=0, len=implicitTrackRanges.length; i < len; i++ )
		{
			curRangeLastNumber = implicitTrackRanges[i].firstNumber + implicitTrackRanges[i].span - 1;
			if ( firstTrackNumber >= implicitTrackRanges[i].firstNumber &&
				 lastTrackNumber <= curRangeLastNumber )
			{
				collection.push( implicitTrackRanges[i] );
			}
			if ( curRangeLastNumber >= lastTrackNumber )
			{
				break;
			}
		}
		if ( collection.length === 0 )
		{
			// console.log("getTracks: a track in the range " + firstTrackNumber + " - " + lastTrackNumber + " doesn't exist");
		}
		return collection;
	};
	TrackManager.prototype.spanIsInFractionalTrack = function ( firstTrackNum, numSpanned )
	{
		// Fractional tracks are always represented by actual track objects.
		for ( var i = firstTrackNum-1, len=this.tracks.length; i < len && i < (firstTrackNum + numSpanned - 1); i++ )
		{
			if ( GridTest.trackIsFractionSized( this.tracks[i] ) )
			{
				return TRUE;
			}
		}
		return FALSE;
	};
	
	function TrackIterator ( trackManager )
	{
		this.trackManager					= trackManager;
		this.iteratingtracks				= TRUE;
		this.currentTrackIndex				= 0;
		this.currentImplicitTrackRangeIndex = 0;
	}
	TrackIterator.prototype.reset = function()
	{
		this.iteratingtracks = TRUE;
		this.currentTrackIndex = 0;
		this.currentImplicitTrackRangeIndex = 0;
	};
	TrackIterator.prototype.next = function()
	{
		var
		next 							= NULL,
		returnNextTrackRange			= FALSE,
		trackManager					= this.trackManager,
		tracks							= trackManager.tracks,
		tracksLength					= tracks.length,
		implicitTrackRanges				= trackManager.implicitTrackRanges,
		implicitTrackRangesLength		= implicitTrackRanges.length,
		currentTrackIndex				= this.currentTrackIndex,
		currentImplicitTrackRangeIndex	= this.currentImplicitTrackRangeIndex;
		
		//// console.log('trackManager',trackManager);
		//// console.log('tracks',tracks);
		//// console.log('tracksLength',tracksLength);
		//// console.log('trackimplicitTrackRangesManager',implicitTrackRanges);
		//// console.log('implicitTrackRangesLength',implicitTrackRangesLength);
		//// console.log('currentTrackIndex',currentTrackIndex);
		//// console.log('currentImplicitTrackRangeIndex',currentImplicitTrackRangeIndex);
		
		if ( currentTrackIndex >= tracksLength )
		{
			returnNextTrackRange = TRUE;
		}
		else if ( currentImplicitTrackRangeIndex < implicitTrackRangesLength )
		{
			// We have both a non-range track and a range track-- check to see if we should return the track range first.
			if ( implicitTrackRanges[currentImplicitTrackRangeIndex].firstNumber < tracks[currentTrackIndex].number )
			{
				returnNextTrackRange = TRUE;
			}
		}
		if ( returnNextTrackRange &&
			 currentImplicitTrackRangeIndex < implicitTrackRangesLength )
		{
			next = implicitTrackRanges[currentImplicitTrackRangeIndex];
			this.currentImplicitTrackRangeIndex++;
		}
		else if ( currentTrackIndex < tracksLength )
		{
			next = tracks[currentTrackIndex];
			this.currentTrackIndex++;
		}
		return next;
	};
	
	
	// for Mozilla/Safari/Opera
	//if ( WINDOW.addEventListener )
	//{
	//	WINDOW.addEventListener( ONRESIZE, GridManager.layout, FALSE );
	//}
	//// If IE event model is used
	//else if ( WINDOW.attachEvent )
	//{
	//	// ensure firing before onload, maybe late but safe also for iframes
	//	WINDOW.attachEvent( ONRESIZE, GridManager.layout );
	//}
	
})(eCSStender);
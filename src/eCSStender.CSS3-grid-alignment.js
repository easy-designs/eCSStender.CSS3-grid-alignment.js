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

	precision					= 2,
	agentTruncatesLayoutLengths	= true,

	regexSpaces = /\s+/,

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
	    static: { keyword: "static" },
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
	};
	  
	e.register(
		{
			fragment: DISPLAY,
			filter: {
			value: /(inline-)?grid/
		},
		test: function()
		{
			return ( ! e.isSupported( PROPERTY, DISPLAY, GRID ) &&
					 ( e.isSupported( PROPERTY, DISPLAY, KHTML + GRID ) ||
					   e.isSupported( PROPERTY, DISPLAY, MOZ + GRID ) ||
					   e.isSupported( PROPERTY, DISPLAY, MS + GRID ) ||
					   e.isSupported( PROPERTY, DISPLAY, OPERA + GRID ) ||
					   e.isSupported( PROPERTY, DISPLAY, WEBKIT + GRID ) ) );
		},
		fingerprint: 'net.easy-designs.' + GRID
	  },
	  false,
	  gridify
	);
	
	function gridify()
	{
		
		
	}
	
	function WidthAndHeight()
	{
		this.width	= null;
		this.height = null;
	}
	
	function CSSValueAndUnit()
	{
		this.value	= null;
		this.unit	= null;
	}
	
	function Grid(element)
	{
		this.gridElement				= element;
		this.blockProgression			= GridTest.layoutVerifier.blockProgressionStringToEnum(
											element.currentStyle.getPropertyValue(BLOCKPROGRESSION)
										  );
		this.availableSpaceForColumns	= null;
		this.availableSpaceForRows		= null;
		this.items						= null;
		this.useAlternateFractionalSizingForColumns = false;
		this.useAlternateFractionalSizingForRows	= false;
		this.columnTrackManager			= new TrackManager();
		this.rowTrackManager			= new TrackManager();
	}
	
	function Track()
	{
		this.number				= null;
		this.size				= null;
		this.sizingType			= null;
		this.items				= [];
		this.measure			= null;
		this.minMeasure			= null;
		this.maxMeasure			= null;
		this.contentSizedTrack	= false;
		this.implicit			= false;
	}

	function ImplicitTrackRange()
	{
		this.firstNumber	= null;
		this.span			= null;
		this.size			= gridTrackValueEnum.auto;
		this.sizingType		= sizingTypeEnum.keyword;
		this.items			= [];
		this.measure		= null;
	}
	
	function Item()
	{
		this.itemElement		= null;
		this.position			= null;
		this.column				= 1;
		this.columnSpan			= 1;
		this.columnAlign		= gridAlignEnum.stretch;
		this.row				= 1;
		this.rowSpan			= 1;
		this.rowAlign			= gridAlignEnum.stretch;
		// Used width calculated during column track size resolution.
		this.usedWidthMeasure	= null;
		this.maxWidthMeasure	= null;
		this.maxHeightMeasure	= null;
		this.shrinkToFitSize	= null; // physical dimensions
		this.verified = {
			columnBreadth:	false,
			rowBreadth:		false,
			columnPosition: false,
			rowPosition:	false
		};
	}

	function GridTest()
	{
		var
		intrinsicSizeCalculatorElement			= null,
		intrinsicSizeCalculatorElementParent	= null,
		calculatorOperationEnum					= {
			minWidth: {},
			maxWidth: {},
			minHeight: {},
			maxHeight: {},
			shrinkToFit: {}
		};
		
		function verifyLayout ( gridElement, gridColumnsDefinition, gridRowsDefinition )
		{
			var gridObject = new Grid(gridElement);
			return LayoutVerifier.verifyLayout(gridObject, gridColumnsDefinition, gridRowsDefinition);
		}
		this.verifyLayout = verifyLayout;
		
		this.verifyLayoutByElementID = function ( gridElementID, gridColumnsDefinition, gridRowsDefinition )
		{
			return verifyLayout(document.getElementById(gridElementID), gridColumnsDefinition, gridRowsDefinition);
		};
		
		this.isGridElement = function ( element )
		{
			var display = window.getComputedStyle(element, null).display;
			return ( display === GRID ||
					 display === INLINEGRID );
		};

		this.shouldSwapWidthAndHeight = function ( blockProgression )
		{
			return ( blockProgression === blockProgressionEnum.lr ||
					 blockProgression === blockProgressionEnum.rl );
		};

		this.trackIsFractionSized = function ( trackToCheck )
		{
			return ( trackToCheck.sizingType === sizingTypeEnum.valueAndUnit &&
					 trackToCheck.size.unit === "fr" );
		};

		this.boxSizeCalculator = {
			calcMarginBoxWidth: function (usedStyle)
			{
				var
				boxSizing		= usedStyle.getPropertyValue( BOXSIZING ),
				marginBoxWidth	= layoutMeasure.measureFromStyleProperty( usedStyle, "width" );

				marginBoxWidth	= marginBoxWidth
									.add( layoutMeasure.measureFromStyleProperty( usedStyle, "margin-left" ) )
									.add( layoutMeasure.measureFromStyleProperty( usedStyle, "margin-right" ) );
				
				if ( boxSizing === "content-box" )
				{
					marginBoxWidth = marginBoxWidth
										.add( layoutMeasure.measureFromStyleProperty( usedStyle, "padding-left" ) )
										.add( layoutMeasure.measureFromStyleProperty( usedStyle, "padding-right" ) );
				}
				if ( boxSizing === "content-box" ||
					 boxSizing === "padding-box" )
				{
					if ( usedStyle.getPropertyValue("border-left-style") !== "none" )
					{
						marginBoxWidth = marginBoxWidth
											.add( layoutMeasure.measureFromStyleProperty( usedStyle, "border-left-width" ) );
					}
					if ( usedStyle.getPropertyValue("border-right-style") !== "none" )
					{
						marginBoxWidth = marginBoxWidth
											.add( layoutMeasure.measureFromStyleProperty( usedStyle, "border-right-width" ) );
					}
				}
				return marginBoxWidth;
			},
			calcMarginBoxHeight: function (usedStyle)
			{
				var
				boxSizing		= usedStyle.getPropertyValue( BOXSIZING ),
				marginBoxHeight = layoutMeasure.measureFromStyleProperty( usedStyle, "height" );

				marginBoxHeight = marginBoxHeight
									.add( layoutMeasure.measureFromStyleProperty( usedStyle, "margin-top" ) )
									.add( layoutMeasure.measureFromStyleProperty( usedStyle, "margin-bottom" ) );

				if ( boxSizing === "content-box" )
				{
					marginBoxHeight = marginBoxHeight
										.add( layoutMeasure.measureFromStyleProperty( usedStyle, "padding-top" ) )
										.add( layoutMeasure.measureFromStyleProperty( usedStyle, "padding-bottom" ) );
				}
				if ( boxSizing === "content-box" ||
					 boxSizing === "padding-box" )
				{
					if ( usedStyle.getPropertyValue("border-top-style") !== "none" )
					{
						marginBoxHeight = marginBoxHeight
											.add( layoutMeasure.measureFromStyleProperty( usedStyle, "border-top-width" ) );
					}
					if ( usedStyle.getPropertyValue("border-bottom-style") !== "none" )
					{
						marginBoxHeight = marginBoxHeight
											.add( layoutMeasure.measureFromStyleProperty( usedStyle, "border-bottom-width" ) );
					}
				}
				return marginBoxHeight;
			},
			// Calculates a box width suitable for use with the width property from a given margin box width.
			// Takes into account the box-sizing of the box.
			calcBoxWidthFromMarginBoxWidth: function ( usedStyle, marginBoxWidth )
			{
				var
				boxSizing	= usedStyle.getPropertyValue(BOXSIZING),
				boxWidth	= marginBoxWidth;

				if ( boxSizing === "content-box" )
				{
					boxWidth = boxWidth
								.subtract(
									layoutMeasure
										.measureFromStyleProperty( usedStyle, "padding-left" )
										.add( layoutMeasure.measureFromStyleProperty( usedStyle, "padding-right" ) )
								 );
				}
				if ( boxSizing === "content-box" ||
					 boxSizing === "padding-box" )
				{
					if ( usedStyle.getPropertyValue("border-left-style") !== "none" )
					{
						boxWidth = boxWidth.subtract( layoutMeasure.measureFromStyleProperty( usedStyle, "border-left-width" ) );
					}
					if ( usedStyle.getPropertyValue("border-right-style") !== "none" )
					{
						boxWidth = boxWidth.subtract( layoutMeasure.measureFromStyleProperty( usedStyle, "border-right-width" ) );
					}
				}
				boxWidth = boxWidth
							.subtract(
								layoutMeasure
									.measureFromStyleProperty(usedStyle, "margin-left")
									.add( layoutMeasure.measureFromStyleProperty(usedStyle, "margin-right") )
							 );
				return boxWidth;
			},
			// Calculates a box height suitable for use with the height property from a given margin box height.
			// Takes into account the box-sizing of the box.
			calcBoxHeightFromMarginBoxHeight: function (usedStyle, marginBoxHeight)
			{
				var
				boxSizing	= usedStyle.getPropertyValue(BOXSIZING);
				boxHeight	= marginBoxHeight;

				if ( boxSizing === "content-box" )
				{
					boxHeight = boxHeight
									.subtract(
										layoutMeasure
											.measureFromStyleProperty(usedStyle, "padding-top")
											.add( layoutMeasure.measureFromStyleProperty( usedStyle, "padding-bottom" ) )
									 );
				}
				if ( boxSizing === "content-box" ||
					 boxSizing === "padding-box" )
				{
					if ( usedStyle.getPropertyValue("border-top-style") !== "none" )
					{
						boxHeight = boxHeight.subtract( layoutMeasure.measureFromStyleProperty( usedStyle, "border-top-width" ) );
					}
					if ( usedStyle.getPropertyValue("border-bottom-style") !== "none" )
					{
						boxHeight = boxHeight.subtract( layoutMeasure.measureFromStyleProperty( usedStyle, "border-bottom-width" ) );
					}
				}
				boxHeight = boxHeight
								.subtract(
									layoutMeasure
										.measureFromStyleProperty(usedStyle, "margin-top")
										.add( layoutMeasure.measureFromStyleProperty( usedStyle, "margin-bottom" ) )
								 );
				return boxHeight;
			}
		};
		
		this.intrinsicSizeCalculator = {
			zeroLength:		{ cssText: "0px" },
			infiniteLength: { cssText: "1000000px" },
							/* last 2 params only required for shrink-to-fit calculation */
			prepare:		function ( element, calculatorOperation, containerWidth, containerHeight)
			{
				if ( intrinsicSizeCalculatorElement === null )
				{
					 intrinsicSizeCalculatorElement = document.createElement("div");
					 intrinsicSizeCalculatorElement.id = "intrinsicSizeCalculator";
				}

				var
				cssText		= '',
				gridElement = element.parentNode,
				gridElementUsedStyle;
				
				if ( typeof containerWidth !== "undefined" &&
					 containerWidth !== null )
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
							console.log("Calculating shrink to fit size without specified container width");
							break;
					}
				}
				if ( typeof containerHeight !== "undefined" &&
					 containerHeight !== null )
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
							console.log("Calculating shrink to fit size without specified container height");
							break;
					}
				}
				
				if ( ! GridTest.isGridElement(gridElement) )
				{
					console.log("Element is not a child of a grid");
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
					gridElementUsedStyle = window.getComputedStyle( gridElement, null );
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
				var clone = element.cloneNode(true);
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
				width	= GridTest.boxSizeCalculator.calcMarginBoxWidth( window.getComputedStyle(clone, null) );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return width;
			},
			calcMaxWidth: function (element)
			{
				this.prepare(element, calculatorOperationEnum.maxWidth);
			
				var
				clone	= this.cloneAndAppendToCalculator(element),
				width	= GridTest.boxSizeCalculator.calcMarginBoxWidth( window.getComputedStyle(clone, null) );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return width;
			},
			calcMinHeight: function (element, usedWidth)
			{
				if ( typeof usedWidth === "undefined" ||
					 usedWidth === null )
				{
					console.log("calcMinHeight: no usedWidth specified");
				}
			
				this.prepare( element, calculatorOperationEnum.minHeight, usedWidth );
			
				var
				clone	= this.cloneAndAppendToCalculator(element),
				height	= GridTest.boxSizeCalculator.calcMarginBoxHeight( window.getComputedStyle(clone, null) );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return height;
			},
			calcMaxHeight: function (element, usedWidth)
			{
				if ( typeof usedWidth === "undefined" ||
					 usedWidth === null )
				{
					console.log("calcMaxHeight: no usedWidth specified");
				}
			
				this.prepare(element, calculatorOperationEnum.maxHeight, usedWidth);
			
				var
				clone	= this.cloneAndAppendToCalculator(element),
				height	= GridTest.boxSizeCalculator.calcMarginBoxHeight( window.getComputedStyle(clone, null) );
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return height;
			},
			calcShrinkToFitWidthAndHeight: function ( element, containerWidth, containerHeight, forcedMarginBoxWidth, forcedMarginBoxHeight )
			{
				// If we're forcing a specific size on the grid item, adjust the calculator's container size to accomodate it.
				if ( forcedMarginBoxWidth !== null )
				{
					containerWidth = forcedMarginBoxWidth;
				}
				if ( forcedMarginBoxHeight !== null )
				{
					containerHeight = forcedMarginBoxHeight;
				}
			
				this.prepare(element, calculatorOperationEnum.shrinkToFit, containerWidth, containerHeight);
			
				var
				clone						= this.cloneAndAppendToCalculator(element),
				cloneUsedStyle				= window.getComputedStyle(clone, null),
				shrinkToFitWidthAndHeight	= new WidthAndHeight(),
				forcedWidth, forcedHeight;
			
				/* Force a width or height for width/height if requested.
				 * We don't want to change the box-sizing on the box since we are not 
				 * overriding all of the border/padding/width/height properties and
				 * want the original values to work correctly. Convert the specified 
				 * forced length to the appropriate length for the width/height property.
				 **/
				if ( forcedMarginBoxWidth !== null )
				{
					forcedWidth = GridTest.boxSizeCalculator.calcBoxWidthFromMarginBoxWidth(cloneUsedStyle, forcedMarginBoxWidth);
					clone.style.cssText +=	"min-width: " + forcedWidth.getPixelValueString() + "px; max-width: " +
											forcedWidth.getPixelValueString() + "px";
				}
				if ( forcedMarginBoxHeight !== null )
				{
					forcedHeight = GridTest.boxSizeCalculator.calcBoxHeightFromMarginBoxHeight(cloneUsedStyle, forcedMarginBoxHeight);
					clone.style.cssText +=	"min-height: " + forcedHeight.getPixelValueString() + "; max-height: " +
											forcedHeight.getPixelValueString() + "px";
				}
				shrinkToFitWidthAndHeight.width		= GridTest.boxSizeCalculator.calcMarginBoxWidth(cloneUsedStyle);
				shrinkToFitWidthAndHeight.height	= GridTest.boxSizeCalculator.calcMarginBoxHeight(cloneUsedStyle);
			
				intrinsicSizeCalculatorElement.removeChild(clone);
				this.unprepare();
			
				return shrinkToFitWidthAndHeight;
			}
		};

		this.layoutVerifier = {
			error		: false,
			verifyLayout: function ( gridObject, gridColumnsDefinition, gridRowsDefinition )
			{
				var
				gridElement = gridObject.gridElement,
				gridUsedStyle;
				if ( gridElement === null )
				{
					console.log("Grid element is null");
					this.error = true;
					return false;
				}
				gridUsedStyle = window.getComputedStyle(gridElement, null);
				if ( ! GridTest.isGridElement(gridElement) )
				{
					console.log("invalid display value");
					this.error = true;
					return false;
				}

				// Get the available space for the grid since it is required
				// for determining track sizes for auto/fit-content/minmax 
				// and fractional tracks.
				this.determineGridAvailableSpace(gridObject);

				console.log("Grid element content available space: columns = " + 
							gridObject.availableSpaceForColumns.getPixelValueString() + "; rows = " +
							gridObject.availableSpaceForRows.getPixelValueString());

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
			determineGridAvailableSpace: function (gridObject)
			{
				var
				gridElement			= gridObject.gridElement,
				gridElementParent	= gridElement.parentNode,
				usedStyle			= window.getComputedStyle(gridElement, null),
				isInlineGrid, currentStyle,
				marginLeft, marginRight, paddingLeft, paddingRight, borderLeftWidth, borderRightWidth,
				marginTop, marginBottom, paddingTop, paddingBottom, borderTopWidth, borderBottomWidth,
				dummy, widthToUse, heightToUse, marginToUse, borderWidthToUse, borderStyleToUse, paddingToUse,
				cssText, scrollWidth, scrollHeight,
				removedElement, dummyUsedStyle,
				widthAdjustment, heightAdjustment, widthMeasure, heightMeasure, widthAdjustmentMeasure, heightAdjustmentMeasure;

				// Get each individual margin, border, and padding value for
				// using with calc() when specifying the width/height of the dummy element.
				if ( typeof gridElement.currentStyle !== "undefined" )
				{
					currentStyle = gridElement.currentStyle;
					
					// Use the IE-only interface for getting computed (not used) styles via the DOM.
					isInlineGrid = currentStyle.display === INLINEGRID ? true : false;

					marginLeft = currentStyle.marginLeft;
					if ( marginLeft === "auto" )
					{
						marginLeft = "0px";
					}
					marginRight = currentStyle.marginRight;
					if ( marginRight === "auto" )
					{
						marginRight = "0px";
					}
					borderLeftWidth		= currentStyle.borderLeftWidth;
					borderRightWidth	= currentStyle.borderRightWidth;
					paddingLeft			= currentStyle.paddingLeft;
					paddingRight		= currentStyle.paddingRight;

					marginTop = currentStyle.marginTop;
					if ( marginTop === "auto" )
					{
						marginTop = "0px";
					}
					marginBottom = currentStyle.marginBottom;
					if ( marginBottom === "auto" )
					{
						marginBottom = "0px";
					}
					borderTopWidth		= currentStyle.borderTopWidth;
					borderBottomWidth	= currentStyle.borderBottomWidth;
					paddingTop			= currentStyle.paddingTop;
					paddingBottom		= currentStyle.paddingBottom;
				}
				else
				{
					// currentStyle not available; the next best thing is the used values for the grid.
					// This should work even for percentage sized margin/border/padding because the real grid
					// element should have sized those based on the size of its containing block already.
					//
					// Unfortunately, this doesn't work for fixed-width and/or fixed-height grids because this function
					// should be returning the _available_ space, not the space the current grid element is using.
					//

					// We need currentStyle support to get the computed (not used) styles of elements.
					console.log("User agent doesn't support element.currentStyle");
					return;
				}

				// If the grid has an explicit width and/or height, that determines the available space for the tracks.
				// If there is none, we need to use alternate fractional sizing. The exception is if we are a non-inline grid;
				// in that case, we are a block element and take up all available width.
				// TODO: ensure we do the right thing for floats.
				if ( currentStyle.width === "auto" &&
				 	 ( isInlineGrid || currentStyle['float'] !== "none" ) )
				{
					gridObject.useAlternateFractionalSizingForColumns = true;
					console.log("Using alternate fractional sizing for columns");
				}
				if ( currentStyle.height === "auto" )
				{
					gridObject.useAlternateFractionalSizingForRows = true;
					console.log("Using alternate fractional sizing for rows");
				}

				dummy = document.createElement( gridElement.tagName );

				/* TODO: Walk the parents of the grid until we find one that isn't
				 * auto width and height, setting any auto widths/heights to 100%.
				 * Then take our measurement and restore their original values.
				 **/
				/* TODO: handle non-pixel based margins/borders/padding
				 * Default to 100% if there is no specified width/height.
				 **/
				widthToUse	= currentStyle.width !== "auto" ? currentStyle.width
															: this.buildCalcString(
																"100%", "-", marginLeft, borderLeftWidth, 
																paddingLeft, paddingRight, borderRightWidth, marginRight
															  );
				heightToUse = currentStyle.width !== "auto" ? currentStyle.height
															: this.buildCalcString(
																"100%", "-", marginTop, borderTopWidth,
																paddingTop, paddingBottom, borderBottomWidth, marginBottom
															  );

				marginToUse = currentStyle.margin;
				if ( marginToUse === "auto" )
				{
					// Workaround for IE bug unspecified margins get returned as "auto" instead of "0px".
					// Get the used value instead which will be 0px if it was really unspecified or, if not, it really was "auto".
					if ( usedStyle.margin === "0px" )
					{
						marginToUse = usedStyle.margin;
					}
				}
				borderWidthToUse	= currentStyle.borderWidth;
				borderStyleToUse	= currentStyle.borderStyle;
				paddingToUse		= currentStyle.padding;

				/* Dummy element style:
				 * display: block | inline-block; (depending on if this was a grid | inline-grid)
				 * margin/border/padding: <computed or used value for the real grid element>
				 **/
				cssText = "display: " + (!isInlineGrid ? "block" : "inline-block")
						+ "; margin: " + marginToUse + "; border-width: " + borderWidthToUse
						+ "; padding: " + paddingToUse + "; border-style: " + borderStyleToUse
						+ "; width: " + widthToUse
						+ "; height: " + heightToUse
						+ "; box-sizing: " + gridElement.currentStyle.boxSizing
						+ "; min-width: " + gridElement.currentStyle.minWidth
						+ "; min-height: " + gridElement.currentStyle.minHeight
						+ "; max-width: " + gridElement.currentStyle.maxWidth
						+ "; max-height: " + gridElement.currentStyle.maxHeight;
				dummy.style.cssText = cssText;

				// Determine width/height (if any) of scrollbars are showing with the grid element on the page.
				scrollWidth		= this.verticalScrollbarWidth();
				scrollHeight	= this.horizontalScrollbarHeight();

				console.log("Vertical scrollbar width = " + scrollWidth + "; horizontal scrollbar height = " + scrollHeight);

				// Insert before the real grid element.
				gridElementParent.insertBefore(dummy, gridElement);
				// Remove the real grid element.
				removedElement = gridElementParent.removeChild(gridElement);

				dummyUsedStyle = window.getComputedStyle(dummy, null);

				// The dummy item should never add scrollbars if the grid element didn't.
				widthAdjustment		= scrollWidth - this.verticalScrollbarWidth();
				heightAdjustment	= scrollHeight - this.horizontalScrollbarHeight();
				if ( widthAdjustment < 0 || heightAdjustment < 0 )
				{
					console.log("determineGridAvailableSpace: dummy item added scrollbars");
				}

				// Remove any scrollbar adjustment if we weren't auto-sized
				// (if there is a specified height of, say, 2000px, we don't want to change the height of the available space).
				if ( currentStyle.width !== "auto" )
				{
					widthAdjustment = 0;
				}
				if ( currentStyle.height !== "auto" )
				{
					heightAdjustment = 0;
				}

				widthMeasure			= layoutMeasure.measureFromStyleProperty(dummyUsedStyle, "width");
				heightMeasure			= layoutMeasure.measureFromStyleProperty(dummyUsedStyle, "height");
				widthAdjustmentMeasure	= layoutMeasure.measureFromPx(widthAdjustment);
				heightAdjustmentMeasure	= layoutMeasure.measureFromPx(heightAdjustment);
				// Get the content width/height; this is the available space for tracks and grid items to be placed in.
				if ( ! GridTest.shouldSwapWidthAndHeight(gridObject.blockProgression) )
				{
					gridObject.availableSpaceForColumns	= widthMeasure.subtract(widthAdjustmentMeasure);
					gridObject.availableSpaceForRows	= heightMeasure.subtract(heightAdjustmentMeasure);
				}
				else
				{
					gridObject.availableSpaceForColumns	= heightMeasure.subtract(heightAdjustmentMeasure);
					gridObject.availableSpaceForRows	= widthMeasure.subtract(widthAdjustmentMeasure);
				}

				// Restore the DOM.
				gridElementParent.insertBefore(removedElement, dummy);
				gridElementParent.removeChild(dummy);
			},
			verticalScrollbarWidth: function()
			{
				return ( self.innerWidth - document.documentElement.clientWidth );
			},
			horizontalScrollbarHeight: function()
			{
				return (self.innerHeight - document.documentElement.clientHeight);
			},
			saveItemPositioningTypes: function (gridObject)
			{
				var
				items = gridObject.items,
				curItemUsedStyle;
				for (var i = 0; i < items.length; i++)
				{
					if ( items[i].position === null )
					{
						curItemUsedStyle	= window.getComputedStyle(items[i].itemElement, null);
						items[i].position	= this.positionStringToEnum(curItemUsedStyle.getPropertyValue("position"));
					}
				}
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
			// Inserts an empty grid item into a given track and gets its size.
			getActualTrackMeasure: function (gridElement, trackNumber, computingColumns) {
				var
				dummyItem	= document.createElement("div"),
				cssText		= "margin: 0px; border: 0px; padding: 0px; "
							+ (computingColumns ? GRIDCOLUMNALIGN : GRIDROWALIGN)
							+ ": stretch; "
							+ (computingColumns ? GRIDCOLUMN : GRIDROW)
							+ ": " + trackNumber + "; ",
				dummyUsedStyle, gridElementUsedStyle, blockProgression, trackMeasure;

				dummyItem.style.cssText = cssText;

				dummyItem				= gridElement.appendChild(dummyItem);
				dummyUsedStyle			= window.getComputedStyle(dummyItem, null);
				gridElementUsedStyle	= window.getComputedStyle(gridElement, null);

				blockProgression	= GridTest.layoutVerifier.blockProgressionStringToEnum(
										gridElementUsedStyle.getPropertyValue( BLOCKPROGRESSION )
									  );

				trackMeasure	= this.usePhysicalWidths(blockProgression, computingColumns)
								? layoutMeasure.measureFromStyleProperty(dummyUsedStyle, "width")
								: layoutMeasure.measureFromStyleProperty(dummyUsedStyle, "height");

				gridElement.removeChild(dummyItem);
				return trackMeasure;
			},
			verifyGridItemSizes: function (gridObject)
			{
				this.verifyGridItemLengths(gridObject, true);
				this.verifyGridItemLengths(gridObject, false);
			},
			verifyGridItemPositions: function (gridObject) {
				this.verifyGridItemTrackPositions(gridObject, true);
				this.verifyGridItemTrackPositions(gridObject, false);
			},
			calculateGridItemShrinkToFitSizes: function (gridObject)
			{
				var
				columnTrackManager	= gridObject.columnTrackManager,
				rowTrackManager		= gridObject.rowTrackManager,
				items				= gridObject.items,
				i, iLen 			= items.length,
				curItem, columnsBreadth, rowsBreadth,
				forcedWidth = null, forcedHeight = null;

				for ( i=0; i < iLen; i++ )
				{
					curItem = items[i];
					if ( curItem.shrinkToFitSize === null )
					{
						// Percentage resolution is based on the size of the cell for the grid item.
						columnsBreadth	= this.getSumOfSpannedTrackMeasures(
											gridObject.columnTrackManager, curItem.column, curItem.columnSpan
										  );
						rowsBreadth		= this.getSumOfSpannedTrackMeasures(
											gridObject.rowTrackManager, curItem.row, curItem.rowSpan
										  );

						// Force a stretch if requested.
						if ( curItem.position === positionEnum['static'] ||
							 curItem.position === positionEnum.relative )
						{
							if ( curItem.columnAlign === gridAlignEnum.stretch )
							{
								if ( ! GridTest.shouldSwapWidthAndHeight(gridObject.blockProgression) )
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
								if ( ! GridTest.shouldSwapWidthAndHeight(gridObject.blockProgression) )
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
						if ( forcedWidth === null ||
							 forcedHeight === null )
						{
							curItem.shrinkToFitSize	= GridTest.intrinsicSizeCalculator.calcShrinkToFitWidthAndHeight(
														curItem.itemElement, columnsBreadth, rowsBreadth, forcedWidth, forcedHeight
													  );
						}
						else
						{
							curItem.shrinkToFitSize = new WidthAndHeight();
						}
						if ( forcedWidth !== null )
						{
							curItem.shrinkToFitSize.width = forcedWidth;
						}
						if ( forcedHeight !== null )
						{
							curItem.shrinkToFitSize.height = forcedHeight;
						}
					}
				}
			},
			getItemBreadth: function (blockProgression, verifyingColumnBreadths, itemUsedStyle)
			{
				if ( ( ( blockProgression === blockProgressionEnum.tb ||
						 blockProgression === blockProgressionEnum.bt ) &&
					   verifyingColumnBreadths === true ) ||
					 ( ( blockProgression === blockProgressionEnum.lr ||
						 blockProgression === blockProgressionEnum.rl ) &&
					   verifyingColumnBreadths === false ) )
				{
					return GridTest.boxSizeCalculator.calcMarginBoxWidth(itemUsedStyle);
				}
				else
				{
					return GridTest.boxSizeCalculator.calcMarginBoxHeight(itemUsedStyle);
				}
			},
			usePhysicalWidths: function (blockProgression, verifyingColumns)
			{
				var usePhysicalWidths = false;
				if ( ( ( blockProgression === blockProgressionEnum.tb ||
						 blockProgression === blockProgressionEnum.bt ) &&
					   verifyingColumns === true ) ||
					 ( ( blockProgression === blockProgressionEnum.lr ||
						 blockProgression === blockProgressionEnum.rl ) &&
					   verifyingColumns === false ) )
				{
					usePhysicalWidths = true;
				}
				return usePhysicalWidths;
			},
			// verifyingColumnBreadths == true => verify length of items in the direction of columns 
			// verifyingColumnBreadths == false => verify length of items in the direction of rows 
			verifyGridItemLengths: function (gridObject, verifyingColumnBreadths)
			{
				var
				items					= gridObject.items,
				i, iLen					= items.length,
				trackManager			= verifyingColumnBreadths ? gridObject.columnTrackManager : gridObject.rowTrackManager,
				blockProgression		= gridObject.blockProgression,
				verifyingPhysicalWidths	= this.usePhysicalWidths(blockProgression, verifyingColumnBreadths),
				curItem, curGridItemUsedStyle, trackNum, alignType, actualMeasure, itemId, offsetLength, offsetMeasure,
				expectedMeasure, firstTrack, trackSpan;

				// Uncomment if needed for debugging.
				//this.dumpTrackLengths(trackManager, GridTest.logger, GridTest.logger.logDebug);

				if ( verifyingColumnBreadths && !verifyingPhysicalWidths )
				{
					console.log("Column breadths are heights due to block-progression value '" + blockProgression.keyword + "'");
				}
				else if ( ! verifyingColumnBreadths &&
						  verifyingPhysicalWidths )
				{
					console.log("Row breadths are widths due to block-progression value '" + blockProgression.keyword + "'");
				}

				for ( i = 0; i < iLen; i++ )
				{
					curItem					= items[i];
					curGridItemUsedStyle	= window.getComputedStyle(curItem.itemElement, null);

					if ( ( verifyingColumnBreadths ? curItem.verified.columnBreadth : curItem.verified.rowBreadth ) !== true )
					{
						trackNum		= verifyingColumnBreadths ? curItem.column : curItem.row;
						alignType		= verifyingColumnBreadths ? curItem.columnAlign : curItem.rowAlign;
						actualMeasure	= verifyingPhysicalWidths
									 	? GridTest.boxSizeCalculator.calcMarginBoxWidth(curGridItemUsedStyle)
										: GridTest.boxSizeCalculator.calcMarginBoxHeight(curGridItemUsedStyle);

						itemId = "";
						if ( curItem.itemElement.id.length > 0 )
						{
							itemId = "[ID = " + curItem.itemElement.id + "] ";
						}

						// Check the offsetWidth/offsetHeight to make sure it agrees.
						offsetLength	= verifyingPhysicalWidths ? curItem.itemElement.offsetWidth : curItem.itemElement.offsetHeight;
						offsetMeasure	= layoutMeasure.measureFromPx(offsetLength);
						if ( actualMeasure.getMeasureRoundedToWholePixel().equals(offsetMeasure) !== true )
						{
							this.error = true;
							console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + 
										 trackNum + ", item " + i + ": " +
										 "offset length doesn't agree with calculated margin box length (" +
										 ( verifyingPhysicalWidths ? "offsetWidth" : "offsetHeight" ) +
										 ": " + offsetMeasure.getPixelValueString() + "; expected (unrounded): " +
										 actualMeasure.getPixelValueString() );
						}


						if ( curItem.position === positionEnum.absolute )
						{
							// Use shrink-to-fit sizes.
							if ( curItem.shrinkToFitSize === null )
							{
								console.log("Current item's shrink to fit size has not been calculated");
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
									if (curItem.shrinkToFitSize === null)
									{
										console.log("Current item's shrink to fit size has not been calculated");
									}
									// shrinkToFitSize is physical
									expectedMeasure = ( verifyingPhysicalWidths ? curItem.shrinkToFitSize.width
																				: curItem.shrinkToFitSize.height );
									break;
								default:
									console.log("Unknown grid align type " + alignType.keyword);
							}
						}

						if ( expectedMeasure.equals(actualMeasure) !== true )
						{
							// If the agent is more precise than whole pixels, and we are off 
							// by just one layout pixel (1/100th of a pixel for IE), it's close enough.
							if ( precision > 0 && Math.abs(expectedMeasure.subtract(actualMeasure).getRawMeasure()) === 1)
							{
								console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
											 "sizing check passed after adjustment for fuzzy error checking (alignment: " + 
											 alignType.keyword + "; expected: " + expectedMeasure.getPixelValueString() + 
											 "; actual: " + actualMeasure.getPixelValueString() + ")" );
							}
							else
							{
								this.error = true;
								console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
											 "sizing check failed (alignment: " + alignType.keyword + "; expected: " +
											 expectedMeasure.getPixelValueString() + "; actual: " + 
											 actualMeasure.getPixelValueString() + ")" );
							}
						}
						else
						{
							console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
										 "sizing check passed (alignment: " + alignType.keyword + "; expected: " +
										 expectedMeasure.getPixelValueString() + "; actual: " + actualMeasure.getPixelValueString() + ")" );
						}

						if ( verifyingColumnBreadths )
						{
							curItem.verified.columnBreadth = true;
						}
						else
						{
							curItem.verified.rowBreadth = true;
						}
					}
					else
					{
						console.log( itemId + ": already verified " + (verifyingColumnBreadths ? "column" : "row") + " breadth" );
					}
				}
			},
			dumpTrackLengths: function ( trackManager )
			{
				var
				trackIter	= trackManager.getIterator(),
				curTrack	= trackIter.next(),
				trackRange, trackInfoString;

				while ( curTrack !== null )
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

					console.log(trackInfoString);

					curTrack = trackIter.next();
				}
			},
			// http://blogs.msdn.com/b/ie/archive/2009/05/29/the-css-corner-writing-mode.aspx 
			// is a great guide for how things should lay out.
			horizontalOffsetsAreReversed: function ( gridUsedStyle )
			{
				var
				reverseDirection	= false,
				directionIsLTR		= gridUsedStyle.getPropertyValue("direction") === "ltr",
				blockProgression	= GridTest.layoutVerifier.blockProgressionStringToEnum(
										gridUsedStyle.getPropertyValue(BLOCKPROGRESSION)
									  );
				if ( blockProgression === blockProgressionEnum.rl ||
					 ( ! directionIsLTR &&
						blockProgression !== blockProgressionEnum.lr ) )
				{
					reverseDirection = true;
				}
				return reverseDirection;
			},
			verticalOffsetsAreReversed: function ( gridUsedStyle )
			{
				var
				reverseDirection	= false,
				directionIsLTR		= gridUsedStyle.getPropertyValue("direction") === "ltr",
				blockProgression	= GridTest.layoutVerifier.blockProgressionStringToEnum(
										gridUsedStyle.getPropertyValue(BLOCKPROGRESSION)
									  );
				if ( blockProgression === blockProgressionEnum.bt ||
					 ( ! directionIsLTR &&
					   ( blockProgression === blockProgressionEnum.lr ||
						 blockProgression === blockProgressionEnum.rl ) ) )
				{
					reverseDirection = true;
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
				itemUsedStyle	= window.getComputedStyle(itemElement, null),
				parentUsedStyle	= window.getComputedStyle(itemElement.parentNode, null),

				// Map physical offset to logical offset if necessary.
				reverseDirection = this.horizontalOffsetsAreReversed(parentUsedStyle),
				gridStartingContentEdgeOffset, parentOffsetAdjustment,
				itemMarginLeft, itemStartingMarginEdgeOffset, marginBoxWidth, offsetFromGridStartingContentEdge;
				
				if ( parentUsedStyle.getPropertyValue("position") === "static" )
				{
					// Offsets are the border-box.
					gridStartingContentEdgeOffset = layoutMeasure.measureFromPx(itemElement.parentNode.offsetLeft);
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( layoutMeasure.measureFromStyleProperty(parentUsedStyle, "border-left-width") )
														.add( layoutMeasure.measureFromStyleProperty(parentUsedStyle, "padding-left") );
				}
				else
				{
					// Grid is positioned; offset is based on the padding edge of the grid.
					gridStartingContentEdgeOffset = layoutMeasure.measureFromStyleProperty(parentUsedStyle, "padding-left");
				}

				if ( reverseDirection === true )
				{
					// Reversing direction; the starting edge is on the other side.
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( layoutMeasure.measureFromStyleProperty(parentUsedStyle, "width") );
				}

				itemMarginLeft					= layoutMeasure.measureFromStyleProperty(itemUsedStyle, "margin-left");
				itemStartingMarginEdgeOffset	= layoutMeasure
													.measureFromPx(itemElement.offsetLeft)
													.subtract(itemMarginLeft);
				if ( reverseDirection === true )
				{
					// Reversing direction; the starting edge is on the other side.
					marginBoxWidth					= GridTest.boxSizeCalculator.calcMarginBoxWidth(itemUsedStyle);
					itemStartingMarginEdgeOffset	= itemStartingMarginEdgeOffset.add(marginBoxWidth);
				}
				if (reverseDirection === false)
				{
					offsetFromGridStartingContentEdge = itemStartingMarginEdgeOffset
															.subtract(gridStartingContentEdgeOffset);
				}
				else
				{
					offsetFromGridStartingContentEdge = gridStartingContentEdgeOffset
															.subtract(itemStartingMarginEdgeOffset);
				}
				return offsetFromGridStartingContentEdge;
			},
			getGridItemMarginBoxVerticalOffset: function ( item )
			{
				var
				itemElement		= item.itemElement,
				itemUsedStyle	= window.getComputedStyle(itemElement, null),
				parentUsedStyle	= window.getComputedStyle(itemElement.parentNode, null),

				// Map physical offset to logical offset if necessary.
				reverseDirection = this.verticalOffsetsAreReversed(parentUsedStyle),
				gridStartingContentEdgeOffset, parentOffsetAdjustment,
				itemMarginTop, itemStartingMarginEdgeOffset, marginBoxHeight, offsetFromGridStartingContentEdge;
				
				if ( parentUsedStyle.getPropertyValue("position") === "static" )
				{
					// Offsets are the border-box.
					gridStartingContentEdgeOffset = layoutMeasure.measureFromPx(itemElement.parentNode.offsetTop);
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( layoutMeasure.measureFromStyleProperty(parentUsedStyle, "border-top-width") )
														.add( layoutMeasure.measureFromStyleProperty(parentUsedStyle, "padding-top") );
				}
				else
				{
					// Grid is positioned; offset is based on the padding edge of the grid.
					gridStartingContentEdgeOffset = layoutMeasure.measureFromStyleProperty(parentUsedStyle, "padding-top");
				}

				if ( reverseDirection === true )
				{
					// Reversing direction; the starting edge is on the other side.
					gridStartingContentEdgeOffset = gridStartingContentEdgeOffset
														.add( layoutMeasure.measureFromStyleProperty(parentUsedStyle, "height") );
				}

				itemMarginTop					= layoutMeasure.measureFromStyleProperty(itemUsedStyle, "margin-top");
				itemStartingMarginEdgeOffset	= layoutMeasure.measureFromPx(itemElement.offsetTop).subtract(itemMarginTop);

				if ( reverseDirection === true )
				{
					// Reversing direction; the starting edge is on the other side.
					marginBoxHeight					= GridTest.boxSizeCalculator.calcMarginBoxHeight(itemUsedStyle);
					itemStartingMarginEdgeOffset	= itemStartingMarginEdgeOffset.add(marginBoxHeight);
				}
				if (reverseDirection === false)
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
				itemUsedStyle			= window.getComputedStyle(itemElement),
				gridElementUsedStyle	= window.getComputedStyle(gridElement, null),
				itemOffset				= layoutMeasure.measureFromPx(itemElement.offsetLeft);

				if (containingElement !== itemElement.offsetParent)
				{
					console.log("Absolute position grid item has wrong offsetParent");
				}
				if ( itemUsedStyle.getPropertyValue("left") === "auto" &&
					 itemUsedStyle.getPropertyValue("right") === "auto" )
				{
					// Positioned where it would have been if it was in the grid.
					if ( gridElementUsedStyle.getPropertyValue("position") === "static" )
					{
						// Grid wasn't the containing block; adjust the offset based on the grid's offset and MBP since it uses the same containing block.
						itemOffset = itemOffset
										.subtract( layoutMeasure.measureFromPx(gridElement.offsetLeft )
										.add( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "margin-left") )
										.add( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "border-left-width") )
										.add( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-left") ) );
					}
				}
				if (gridElementUsedStyle.getPropertyValue("position") !== "static")
				{
					// The grid is the containing block; adjust the offset based on the grid's border and padding.
					itemOffset = itemOffset.subtract( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-left") );
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
				itemUsedStyle			= window.getComputedStyle(itemElement),
				gridElementUsedStyle	= window.getComputedStyle(gridElement, null),
				itemOffset				= layoutMeasure.measureFromPx(itemElement.offsetTop);
				
				if ( containingElement !== itemElement.offsetParent )
				{
					console.log("Absolute position grid item has wrong offsetParent");
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
										.subtract( layoutMeasure.measureFromPx(gridElement.offsetLeft )
										.add( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "margin-top") )
										.add( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "border-top-width") )
										.add( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-top") ) );
					}
				}
				if ( gridElementUsedStyle.getPropertyValue("position") !== "static" )
				{
					// The grid is the containing block; adjust the offset based on the grid's border and padding.
					itemOffset = itemOffset.subtract( layoutMeasure.measureFromStyleProperty(gridElementUsedStyle, "padding-top") );
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
					curUsedStyle = window.getComputedStyle(curElement, null);
					curPosition = curUsedStyle.getPropertyValue("position");

					if (curPosition === "absolute" || curPosition === "relative" || curPosition === "fixed") {
						break;
					}
					curElement = curElement.parentNode;
				}
				while (curElement !== document.body && curElement !== document.documentElement);

				if (curElement !== gridElement && curElement !== gridElement.offsetParent)
				{
					console.log("offsetParent doesn't agree with calculated containing block");
				}
				return curElement;
			},
			getContainingBlockElementForStaticPositionedGridItems: function()
			{
				// CSS 2.1: 10.1 Definition of "containing block"
				//	 3. If the element has 'position: fixed', the containing block is established by the
				//		viewport in the case of continuous media or the page area in the case of paged media.
				//
				// All browsers except for Firefox return a null offsetParent for fixed positioned elements.
				return ( vendorPrefix === "moz" ) ? document.body : null;
			},
			// verifyingColumnPositions == true => verify positions of items along the columns 
			// verifyingColumnPositions == false => verify positions of items along the rows 
			verifyGridItemTrackPositions: function (gridObject, verifyingColumnPositions)
			{
				var
				trackManager				= verifyingColumnPositions	? gridObject.columnTrackManager
																		: gridObject.rowTrackManager,
				verificationWord			= verifyingColumnPositions ? "column" : "row",
				curTrackStartPosition		= layoutMeasure.zero(),
				curTrackEndPosition			= layoutMeasure.zero(),
				inFirstTrack				= true,
				lastTrackWasContentSized	= false,
				trackIter					= trackManager.getIterator(),
				curTrack					= trackIter.next(),
				verifyingHorizontalOffsets	= this.usePhysicalWidths(gridObject.blockProgression, verifyingColumnPositions),
				gridUsedStyle				= window.getComputedStyle(gridObject.gridElement, null),
				i, len, curItem, curGridItemUsedStyle, alignType,
				actualMeasure, firstTrack, trackSpan, spannedTrackMeasure,
				itemOffset, itemId, trackNum, expectedPosition,
				expectedPositionRounded, itemOffsetRounded;

				while ( curTrack !== null )
				{
					// The start of this track is right after where the previous one ends.
					if ( ! inFirstTrack )
					{
						curTrackStartPosition = curTrackEndPosition.add(new LayoutMeasure(1));
					}
					else {
						inFirstTrack = false;
					}
					curTrackEndPosition = curTrackStartPosition
											.add( curTrack.measure )
											.subtract(new LayoutMeasure(1));

					for (i=0, len=curTrack.items.length; i < len; i++)
					{
						curItem = curTrack.items[i];
						curGridItemUsedStyle = window.getComputedStyle(curItem.itemElement, null);
						// For spanning elements, we can have a single cell occupying more than one track.
						// The first track that contains it will trigger its verification.
						if ( ( verifyingColumnPositions ? curItem.verified.columnPosition : curItem.verified.rowPosition ) !== true )
						{
							alignType			= verifyingColumnPositions ? curItem.columnAlign : curItem.rowAlign;
							actualMeasure		= verifyingHorizontalOffsets ?
												  GridTest.boxSizeCalculator.calcMarginBoxWidth(curGridItemUsedStyle) :
												  GridTest.boxSizeCalculator.calcMarginBoxHeight(curGridItemUsedStyle);
							firstTrack			= verifyingColumnPositions ? curItem.column : curItem.row;
							trackSpan			= verifyingColumnPositions ? curItem.columnSpan : curItem.rowSpan;
							spannedTrackMeasure	= this.getSumOfSpannedTrackMeasures(trackManager, firstTrack, trackSpan);

							switch (curItem.position)
							{
								case positionEnum['static']:
								case positionEnum.relative:
									itemOffset = verifyingHorizontalOffsets ?
												 this.getGridItemMarginBoxHorizontalOffset(curItem) :
												 this.getGridItemMarginBoxVerticalOffset(curItem);
									break;
								case positionEnum.absolute:
									itemOffset = verifyingHorizontalOffsets ?
												 this.getAbsolutePositionedGridItemMarginBoxOffsetLeft(curItem) :
												 this.getAbsolutePositionedGridItemMarginBoxOffsetTop(curItem);
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
										console.log("Fixed position grid item has wrong offsetParent");
									}
									itemOffset = verifyingHorizontalOffsets ?
												 layoutMeasure.measureFromPx(curItem.itemElement.offsetLeft) :
												 layoutMeasure.measureFromPx(curItem.itemElement.offsetTop);
									break;
								default:
									console.log("Unknown position type " + curItem.position.keyword);
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
										console.log("Unknown grid align type " + alignType.keyword);
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
										expectedPosition = layoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "left")
																.add( layoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "margin-left") );
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
										console.log("Not implemented: verification of absolute positioned items with 'right' specified and 'left' auto.");
									}
								}
								else
								{
									if ( curGridItemUsedStyle.getPropertyValue("top") !== "auto" )
									{
										expectedPosition = layoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "top")
															.add( layoutMeasure.measureFromStyleProperty(curGridItemUsedStyle, "margin-top") );
									}
									else if ( curGridItemUsedStyle.getPropertyValue("bottom") !== "auto" )
									{
										// See note above about why we didn't implement this (it's extra work).
										console.log("Not implemented: verification of absolute positioned items with 'bottom' specified and 'top' auto.");
									}
								}
							}
							
							// offsets don't include fractional pixels; always round
							expectedPositionRounded = expectedPosition.getMeasureRoundedToWholePixel();
							// also round the offset in case it is a logical offset
							// (i.e. a different writing mode) which may contain a fractional pixel
							itemOffsetRounded = itemOffset.getMeasureRoundedToWholePixel();

							if (expectedPositionRounded.equals(itemOffsetRounded) !== true)
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
									console.log( itemId + (verifyingColumnPositions ? "column" : "row") +
												 " " + trackNum + ": " + verificationWord +
												 " position check passed for center aligned item after adjustment (alignment: " +
												 alignType.keyword + "; expected (unrounded): " + expectedPosition.getPixelValueString() +
												 "; actual: " + itemOffset.getPixelValueString() + ")" );
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
									console.log( itemId + (verifyingColumnPositions ? "column" : "row") + " " + trackNum +
									 			 ": " + verificationWord +
												 " position check passed for non-stretch/non-end aligned reversed offset item after adjustment (alignment: " +
												 alignType.keyword + "; expected (unrounded): " + expectedPosition.getPixelValueString() + 
												 "; actual: " + itemOffset.getPixelValueString() + ")" );
								}
								else
								{
									this.error = true;
									console.log( itemId + (verifyingColumnPositions ? "column" : "row") + " " + trackNum + ": " +
									 			 verificationWord + " position check failed (alignment: " + alignType.keyword +
												 "; expected (unrounded): " + expectedPosition.getPixelValueString() + "; actual: " +
												 itemOffset.getPixelValueString() + ")" );
								}
							}
							else
							{
								console.log( itemId + (verifyingColumnPositions ? "column" : "row") + " " + trackNum + ": " + 
											 verificationWord + " position check passed (alignment: " + alignType.keyword + 
											 "; expected (unrounded): " + expectedPosition.getPixelValueString() + "; actual: " +
											 itemOffset.getPixelValueString() + ")" );
							}
							if ( verifyingColumnPositions )
							{
								curItem.verified.columnPosition = true;
							}
							else
							{
								curItem.verified.rowPosition = true;
							}
						}
					}
					if (curTrack.contentSizedTrack)
					{
						lastTrackWasContentSized = true;
					}
					else
					{
						lastTrackWasContentSized = false;
					}
					curTrack = trackIter.next();
				}
			},
			adjustLeftPositionForRelativePosition: function (usedStyle, expectedLeftPosition)
			{
				var adjusted = expectedLeftPosition;
				if ( usedStyle.left !== "auto" )
				{
					adjusted = adjusted.add( layoutMeasure.measureFromStyleProperty(usedStyle, "left") );
				}
				else if (usedStyle.right !== "auto")
				{
					adjusted = adjusted.subtract( layoutMeasure.measureFromStyleProperty(usedStyle, "right") );
				}
				return adjusted;
			},
			adjustTopPositionForRelativePosition: function ( usedStyle, expectedTopPosition )
			{
				var adjusted = expectedTopPosition;
				if ( usedStyle.top !== "auto" )
				{
					adjusted = adjusted.add( layoutMeasure.measureFromStyleProperty(usedStyle, "top") );
				}
				else if ( usedStyle.bottom !== "auto" )
				{
					adjusted = adjusted.subtract( layoutMeasure.measureFromStyleProperty(usedStyle, "bottom") );
				}
				return adjusted;
			},
			getTopPositionForFixedPosition: function (usedStyle)
			{
				var expectedTopPosition = 0;
				if ( usedStyle.top !== "auto" )
				{
					expectedTopPosition = layoutMeasure.measureFromStyleProperty(usedStyle, "top");
				}
				else if ( usedStyle.bottom !== "auto" )
				{
					expectedTopPosition = layoutMeasure.measureFromStyleProperty(usedStyle, "bottom");
				}
				return expectedTopPosition;
			},
			getLeftPositionForFixedPosition: function (usedStyle)
			{
				var expectedLeftPosition = 0;
				if ( usedStyle.left !== "auto" )
				{
					expectedLeftPosition = layoutMeasure.measureFromStyleProperty(usedStyle, "left");
				}
				else if ( usedStyle.right !== "auto" )
				{
					expectedLeftPosition = layoutMeasure.measureFromStyleProperty(usedStyle, "right");
				}
				return expectedLeftPosition;
			},
			getSumOfSpannedTrackMeasures: function (trackManager, firstTrackNum, numSpanned)
			{
				var
				sum		= layoutMeasure.zero(),
				tracks	= trackManager.getTracks(firstTrackNum, firstTrackNum + numSpanned - 1),
				i		= tracks.length;
				while ( i-- )
				{
					sum = sum.add( tracks[i].measure );
				}
				return sum;
			},
			mapGridItemsToTracks: function (gridElement, columnTrackManager, rowTrackManager)
			{
				var
				items	= [],
				i		= 0,
				len		= gridElement.childNodes.length,
				curItem, usedStyle, column, columnSpan, row, rowSpan,
				columnAlignString, columnAlign, rowAlignString, rowAlign,
				boxSizing, newItem, firstColumn, lastColumn, firstRow, lastRow;
				
				for ( ; i < len; i++ )
				{
					curItem = gridElement.childNodes[i];
					if (curItem instanceof Text)
					{
						// TODO: handle text nodes.
						// We will need to figure out how to save state about computed style from the parent.
						continue;
					}
					usedStyle	= window.getComputedStyle(curItem, null);
					
					column		= parseInt(usedStyle.getPropertyValue(GRIDCOLUMN),10);
					if ( isNaN(column) )
					{
						this.error = true;
						console.log("column is NaN");
						column = 1;
					}
					
					columnSpan = parseInt(usedStyle.getPropertyValue(GRIDCOLUMNSPAN),10);
					if ( isNaN(columnSpan) )
					{
						this.error = true;
						console.log("column-span is NaN");
						columnSpan = 1;
					}
					
					row = parseInt(usedStyle.getPropertyValue(GRIDROW),10);
					if ( isNaN(row) )
					{
						this.error = true;
						console.log("row is NaN");
						row = 1;
					}
					
					rowSpan = parseInt(usedStyle.getPropertyValue(GRIDROWSPAN),10);
					if ( isNaN(rowSpan) )
					{
						this.error = true;
						console.log("row-span is NaN");
						rowSpan = 1;
					}

					columnAlignString = usedStyle.getPropertyValue(GRIDCOLUMNALIGN);
					if ( columnAlignString.length === 0 )
					{
						this.error = true;
						console.log("getPropertyValue for " + GRIDCOLUMNALIGN + " is an empty string");
					}
					columnAlign = this.gridAlignStringToEnum(columnAlignString);

					rowAlignString = usedStyle.getPropertyValue(GRIDROWALIGN);
					if ( columnAlignString.length === 0 )
					{
						this.error = true;
						console.log("getPropertyValue for " + GRIDROWALIGN + " is an empty string");
					}
					rowAlign = this.gridAlignStringToEnum(rowAlignString);

					// TODO: handle directionality. These properties are physical; we probably need to map them to logical values.
					boxSizing = usedStyle.getPropertyValue(BOXSIZING);

					newItem				= new item();
					newItem.itemElement	= curItem;
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
					this.ensureTracksExist(columnTrackManager, firstColumn, lastColumn);
					this.ensureTracksExist(rowTrackManager, firstRow, lastRow);

					this.addItemToTracks(columnTrackManager, newItem, firstColumn, lastColumn);
					this.addItemToTracks(rowTrackManager, newItem, firstRow, lastRow);

					items.push(newItem);
				}
				return items;
			},
			gridAlignStringToEnum: function (alignString)
			{
				switch ( alignString )
				{
					case gridAlignEnum.start.keyword:
						return gridAlignEnum.start;
					case gridAlignEnum.end.keyword:
						return gridAlignEnum.end;
					case gridAlignEnum.center.keyword:
						return gridAlignEnum.center;
					case gridAlignEnum.stretch.keyword:
					case "": // default
						return gridAlignEnum.stretch;
					default:
						console.log("unknown grid align string: " + alignString);
				}
			},
			positionStringToEnum: function (positionString)
			{
				switch ( positionString )
				{
					case positionEnum.relative.keyword:
						return positionEnum.relative;
					case positionEnum.absolute.keyword:
						return positionEnum.absolute;
					case positionEnum.fixed.keyword:
						return positionEnum.fixed;
					case positionEnum['static'].keyword:
					case "": // default
						return positionEnum['static'];
					default:
						console.log("unknown position string: " + positionString);
				}
			},
			blockProgressionStringToEnum: function (positionString)
			{
				switch ( positionString )
				{
					case blockProgressionEnum.tb.keyword:
					case "": // default
						return blockProgressionEnum.tb;
					case blockProgressionEnum.bt.keyword:
						return blockProgressionEnum.bt;
					case blockProgressionEnum.lr.keyword:
						return blockProgressionEnum.lr;
					case blockProgressionEnum.rl.keyword:
						return blockProgressionEnum.rl;
					default:
						console.log("unknown block-progression string: " + positionString);
				}
			},
			gridTrackValueStringToEnum: function (trackValueString)
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
						console.log("unknown grid track string: " + trackValueString);
				}
			},
			// Creates track objects for implicit tracks if needed.
			ensureTracksExist: function (trackManager, firstTrackNumber, lastTrackNumber)
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
				trackManager.ensureTracksExist(firstTrackNumber, lastTrackNumber);
			},
			// Traverses all tracks that the item belongs to and adds a reference to it in each of the track objects.
			addItemToTracks: function (trackManager, itemToAdd, firstTrackNumber, lastTrackNumber)
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
			},
			/* Determines track sizes using the algorithm from sections 9.1 and 9.2 of the W3C spec.
			 * Rules:
			 *   1. If it's a defined length, that is the track size.
			 * 	 2. If it's a keyword, its sizing is based on its content. 
			 * 		Iterate over the items in the track to attempt to determine the size of the track.
			 * TODO: handle percentages
			 **/
			determineTrackSizes: function (gridElement, trackManager, availableSpace, lengthPropertyName, useAlternateFractionalSizing)
			{
				var
				computingColumns		= (lengthPropertyName.toLowerCase() === "width"),
				
				// Keep track of spans which could affect track sizing later.
				spans					= [],
				autoTracks				= [],
				fractionalTracks		= [],
				respectAvailableLength	= true,
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
					respectAvailableLength = false;
				}

				
				// 9.1.1/9.2.1: [Columns|Widths] are initialized to their minimum [widths|heights].
				while ( curTrack !== null )
				{
					if ( curTrack.sizingType !== sizingTypeEnum.keyword &&
						 curTrack.sizingType !== sizingTypeEnum.valueAndUnit)
					{
						 console.log("Unknown grid track sizing type");
					}

					// TODO: add support for minmax (M3)
					curTrack.measure		= layoutMeasure.zero();
					curTrack.minMeasure		= layoutMeasure.zero();
					curTrack.maxMeasure		= layoutMeasure.zero();
					sizingAlternateFraction	= ( useAlternateFractionalSizing && GridTest.trackIsFractionSized(curTrack) );
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
							console.log("Unknown grid track sizing value " + curSize.keyword);
						}
						if ( ! sizingAlternateFraction )
						{
							curTrack.contentSizedTrack = true;
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
								if ( curItem.maxWidthMeasure === null )
								{
									if ( computingColumns )
									{
										curItem.maxWidthMeasure = GridTest.intrinsicSizeCalculator.calcMaxWidth(curItem.itemElement);
									}
									else
									{
										curItem.maxHeightMeasure = GridTest.intrinsicSizeCalculator
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
										minItemMeasure = GridTest.intrinsicSizeCalculator
															.calcMinWidth(curItem.itemElement);
									}
									else
									{
										minItemMeasure = GridTest.intrinsicSizeCalculator
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
										maxCellMeasure = GridTest.intrinsicSizeCalculator.calcMaxWidth(curItem.itemElement);
									}
									else
									{
										maxCellMeasure = GridTest.intrinsicSizeCalculator.calcMaxHeight(curItem.itemElement, curItem.usedWidthMeasure);
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
						switch ( curSize )
						{
							case gridTrackValueEnum.maxContent:
								actualMeasure = this.getActualTrackMeasure(gridElement, trackNum, computingColumns);
								if ( actualMeasure.equals(curTrack.maxMeasure) !== true )
								{
									// Not an error; we will catch the problem later when we verify grid items.
									console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
												 ": " + "max-content length difference detected; expected = " +
												 curTrack.maxMeasure.getPixelValueString() + ", actual = " +
												 actualMeasure.getPixelValueString() );
								}
								curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure;
								break;
							case gridTrackValueEnum.minContent:
								actualMeasure = this.getActualTrackMeasure(gridElement, trackNum, computingColumns);
								if ( actualMeasure.equals(curTrack.minMeasure) !== true )
								{
									// Not an error; we will catch the problem later when we verify grid items.
									console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
									 			 ": " + "min-content length difference detected; expected = " +
									 			 curTrack.minMeasure.getPixelValueString() + ", actual = " +
									 			 actualMeasure.getPixelValueString() );
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
							curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure = layoutMeasure.measureFromPx(curTrack.size.value);
						}
						else if (curTrack.size.unit === "fr")
						{
							// 9.1.1.b/9.2.1.b: A column with a fraction-sized minimum length is assigned a 0px minimum.
							curTrack.measure = layoutMeasure.zero();
							fractionalTracks.push(curTrack);
							// TODO: fractional tracks should go through the max calculation for 
							// use with verifying a grid in infinite/unconstrained space.
						}
						else {
							// Track lengths are assumed to always be in pixels or fractions. Convert before going into this function.
							this.error = true;
							console.log("track size not converted into px!");
							// TODO: throw after we start doing conversions and don't want to ignore this anymore.
						}
					}
					curTrack = iter.next();
				}
				
				// 9.1.2/9.2.2: All [columns|rows] not having a fraction-sized maximum are grown from their minimum to
				//				their maximum specified size until available space is exhausted.
				remainingSpace = availableSpace.subtract( this.getSumOfTrackMeasures(trackManager) );
				if ( remainingSpace.getRawMeasure() > 0 )
				{
					autoTracks.sort(this.compareAutoTracksAvailableGrowth);

					for ( autoTrackIndex=0, autoTrackLength=autoTracks.length; autoTrackIndex < autoTrackLength; autoTrackIndex++ )
					{
						if ( remainingSpace.getRawMeasure() <= 0 )
						{
							break;
						}
						trackShareOfSpace = remainingSpace.divide(autoTracks.length - autoTrackIndex);

						trackShareOfSpace = layoutMeasure
												.min(trackShareOfSpace, autoTracks[autoTrackIndex].maxMeasure
																			.subtract(autoTracks[autoTrackIndex].measure) );
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
					measureSpanCanGrow	= (computingColumns === true ? curSpanningItem.maxWidthMeasure
																	 : curSpanningItem.maxHeightMeasure).subtract(sumOfTrackMeasures);

					if ( measureSpanCanGrow.getRawMeasure() > 0 )
					{
						// Redistribute among all content-sized tracks that this span is a member of.
						tracksToGrow	= this.getContentBasedTracksThatSpanCrosses(trackManager, firstTrack, numSpanned);
						remainingSpace	= this.redistributeSpace(tracksToGrow, remainingSpace, measureSpanCanGrow);
					}
				}

				remainingSpace = remainingSpace.subtract(this.adjustForTrackLengthDifferences(gridElement, autoTracks, computingColumns));

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
						console.log("remaining space for fractional sizing = " + remainingSpace.getPixelValueString());
					}
					fractionalTracks.sort(this.compareFractionTracksNormalMeasure);
					sumOfFractions = 0;
					for ( i=0, iLen=fractionalTracks.length; i < iLen; i++ )
					{
						sumOfFractions += fractionalTracks[i].size.value;
					}
					oneFractionMeasure = null;
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
							totalMeasureToAdd = layoutMeasure.zero();
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
							fractionalTracks[i].measure = fractionalTracks[i].measure
															.add(oneFractionMeasure.multiply(fractionalTracks[i].size.value));
						}
					}
					else if ( iLen > 0 )
					{
						lastNormalizedFractionalMeasure		= this.getNormalFractionMeasure(fractionalTracks[0]);
						accumulatedFactors					= 0;
						accumulatedFactorsInDistributionSet	= 0;
						for ( i=0; i < iLen; i++ )
						{
							if ( lastNormalizedFractionalMeasure.getRawMeasure() < this.getNormalFractionMeasure(fractionalTracks[i]).getRawMeasure() )
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
										spaceToDistribute = layoutMeasure
																.min(spaceToDistribute,
																	 normalizedDelta.multiply(fractionalTracks[j].size.value));
										spaceToDistribute = layoutMeasure.min(spaceToDistribute, fractionalTracks[j].maxMeasure);
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
														.multiply(fractionalTracks[i].size.value / accumulatedFactorsInDistributionSet);
								//	uncomment and scope to minmax functionality
								//spaceToDistribute = layoutMeasure.min(spaceToDistribute, fractionalTracks[i].maxMeasure);
							}
							fractionalTracks[i].measure			 = fractionalTracks[i].measure.add(spaceToDistribute);
							remainingSpace						 = remainingSpace.subtract(spaceToDistribute);
							accumulatedFactorsInDistributionSet -= fractionalTracks[i].size.value;
						}
					}
					remainingSpace = remainingSpace
										.subtract(this.adjustForTrackLengthDifferences(gridElement, fractionalTracks, computingColumns));
				}
				if (computingColumns)
				{
					// Save the used widths for each of the items so that it can be used during row size resolution.
					this.saveUsedCellWidths(trackManager);
				}
			},
			adjustForTrackLengthDifferences: function (gridElement, tracks, computingColumns)
			{
				var
				totalChange = layoutMeasure.zero(),
				i, iLen = tracks.length,
				actualMeasure;
				for ( i = 0; i < iLen; i++ )
				{
					actualMeasure = this.getActualTrackMeasure(gridElement, tracks[i].number, computingColumns);
					if ( actualMeasure.equals(tracks[i].measure) !== true )
					{
						// If we are one layout pixel off, just pick up what the actual value is and consider it close enough.
						if ( Math.abs(tracks[i].measure.subtract(actualMeasure).getRawMeasure()) <= 1 )
						{
							console.log( (computingColumns ? "Column" : "Row") + " " + tracks[i].number + ": " +
										 "adjusting for track length difference; expected = " + 
										 tracks[i].measure.getPixelValueString() + ", actual = " + 
										 actualMeasure.getPixelValueString() );
							totalChange.add(actualMeasure.subtract(tracks[i].measure));
							tracks[i].measure = actualMeasure;
						}
						else
						{
							// Not an error; we will catch the problem later when we verify grid items.
							console.log( (computingColumns ? "Column" : "Row") + " " + tracks[i].number + ": " +
										 "track length difference > 1 layout pixel; expected = " + 
										 tracks[i].measure.getPixelValueString() + ", actual = " +
										 actualMeasure.getPixelValueString() );
						}
					}
				}
				return totalChange;
			},
			compareAutoTracksAvailableGrowth: function (a, b)
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
			},
			getNormalFractionMeasure: function (track)
			{
				if ( ! GridTest.trackIsFractionSized(track) )
				{
					console.log("getNormalFractionMeasure called for non-fraction sized track");
				}
				var frValue = track.size.value;
				return frValue === 0 ? layoutMeasure.zero() : track.measure.divide(frValue);
			},
			compareFractionTracksNormalMeasure: function (a, b)
			{
				if ( ! GridTest.trackIsFractionSized(a) ||
					 ! GridTest.trackIsFractionSized(b) )
				{
					console.log("compareFractionTracksNormalMeasure called for non-fraction sized track");
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
					return true;
				}
				return false;
			},
			determineMeasureOfOneFractionUnconstrained: function (fractionalTracks)
			{
				// Iterate over all of the fractional tracks, 
				var
				maxOneFractionMeasure = layoutMeasure.zero(),
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
			saveUsedCellWidths: function (columnTrackManager)
			{
				var
				iter		= columnTrackManager.getIterator(),
				curTrack	= iter.next(),
				i, iLen, curItem;

				while ( curTrack !== null )
				{
					for ( i=0, iLen=curTrack.items.length; i < iLen; i++ )
					{
						curItem = curTrack.items[i];
						if ( curItem.usedWidthMeasure === null )
						{
							curItem.usedWidthMeasure	= this.getSumOfSpannedTrackMeasures(
															columnTrackManager, curItem.column, curItem.columnSpan
														  );
						}
					}
					curTrack = iter.next();
				}
			},
			getSumOfTrackMeasures: function (trackManager)
			{
				var
				sum			= layoutMeasure.zero(),
				trackIter	= trackManager.getIterator(),
				curTrack	= trackIter.next();
				while ( curTrack !== null )
				{
					sum = sum.add(curTrack.measure);
					curTrack = trackIter.next();
				}
				return sum;
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
				spaceToRedistribute	= layoutMeasure.min(remainingSpace, totalSpaceToRedistribute),
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
		};

		this.propertyParser = {
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
					   trackStrings[0].toLowerCase() === "none")
				   )
				{
					// Empty definition.
				}
				else
				{
					for ( i = 0; i < length; i++ )
					{
						trackStrings[i] = trackStrings[i].toLowerCase();

						newTrack = null;
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
							if ( valueAndUnit.value === null ||
								 valueAndUnit.unit === null )
							{
								console.log("Not a keyword or a valid CSS value; track " + (i + 1) + " = " + trackStrings[i]);
								console.log("Invalid track definition '" + trackStrings[i] + "'");
							}

							if ( ! this.isValidCssValueUnit(valueAndUnit.unit) )
							{
								console.log("Invalid track unit '" + valueAndUnit.unit + "'");
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
				var ret = false;
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
						ret = true;
				}
				return ret;
			},
			isKeywordTrackDefinition: function (definition)
			{
				var ret = false;
				switch (definition)
				{
					case gridTrackValueEnum.auto.keyword:
					case gridTrackValueEnum.minContent.keyword:
					case gridTrackValueEnum.maxContent.keyword:
					case gridTrackValueEnum.fitContent.keyword:
						ret = true;
				}
				return ret;
			}
		};
	}
	
	function LayoutMeasure()
	{
		if ( measure % 1 !== 0 )
		{
			console.log("layoutMeasures must be integers");
		}
		this.internalMeasure = measure;

		this.measureFromPx = function( measureInPx )
		{
			// Convert to accuracy of agent's layout engine.
			return new LayoutMeasure( Math.round( measureInPx * Math.pow(10, precision) ) );
		};
		
		this.measureFromPxString = function( measureInPxString )
		{
			var
			length			= measureInPxString.length,
			wholePart		= 0,
			fractionPart	= 0,
			decimalPosition = measureInPxString.indexOf('.');
			
			// Don't depend on a potentially lossy conversion to a float-- we'll parse it ourselves.
			if ( length < 3 )
			{
				console.log("layoutMeasure.measureFromPxString: string should contain a value followed by 'px'");
			}
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
	
		this.measureFromStyleProperty = function ( style, propertyName )
		{
			return this.measureFromPxString( style.getPropertyValue( propertyName ) );
		};
		
		this.zero = function()
		{
			return new LayoutMeasure(0);
		};

		this.min = function ( a, b )
		{
			return new LayoutMeasure(Math.min(a.internalMeasure, b.internalMeasure));
		};

		this.max = function ( a, b )
		{
			return new LayoutMeasure(Math.max(a.internalMeasure, b.internalMeasure));
		};
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
			internalMeasureString = this.internalMeasure + '';
			wholePixelString = internalMeasureString.substr(0, internalMeasureString.length - 2);
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
		if ( ! ( measure instanceof layoutMeasure ) )
		{
			console.log("layoutMeasure.add only accepts layout measures");
		}
		return new LayoutMeasure( this.internalMeasure + measure.internalMeasure );
	};
	LayoutMeasure.prototype.subtract = function( measure )
	{
		if ( ! ( measure instanceof layoutMeasure ) )
		{
			console.log("layoutMeasure.subtract only accepts layout measures");
		}
		return new LayoutMeasure( this.internalMeasure - measure.internalMeasure );
	};
	LayoutMeasure.prototype.multiply = function( number )
	{
		if ( typeof number !== "number" )
		{
			console.log("layoutMeasure.multiply only accepts numbers");
		}
		// Integer arithmetic; drop any remainder.
		return new LayoutMeasure( Math.floor(this.internalMeasure * number) );
	};
	LayoutMeasure.prototype.divide = function( number )
	{
		if (typeof number !== "number")
		{
			console.log("layoutMeasure.divide only accepts number");
		}
		// Integer arithmetic; drop any remainder.
		return new LayoutMeasure( Math.floor(this.internalMeasure / number) );
	};
	LayoutMeasure.prototype.equals = function( measure )
	{
		if ( ! ( measure instanceof layoutMeasure ) )
		{
			console.log("layoutMeasure.equals only accepts layout measures");
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
				nextRange = i < len - 1 ? null : this.implicitTrackRanges[i + 1];
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
		newTrack.implicit	= true;
		
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
				needToCreateRange			= true;
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
						needToCreateRange = false;
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
						needToCreateRange = false;
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
		console.log("getTrack: invalid track number " + trackNumber);
	};
	TrackManager.prototype.getTracks = function ( firstTrackNumber, lastTrackNumber )
	{
		var
		collection	= [],
		len			= this.tracks.length,
		i, curRangeLastNumber;
		while ( len-- )
		{
			if ( this.tracks[len].number < trackNumber )
			{
				break;
			}
			if ( trackNumber == this.tracks[len].number )
			{
				collection.push(this.tracks[i]);
			}
		}
		for ( i = 0, len = this.implicitTrackRanges.length; i < len; i++ )
		{
			curRangeLastNumber = this.implicitTrackRanges[i].firstNumber + this.implicitTrackRanges[i].span - 1;
			if ( firstTrackNumber >= this.implicitTrackRanges[i].firstNumber &&
				 lastTrackNumber <= curRangeLastNumber )
			{
				collection.push(this.implicitTrackRanges[i]);
			}
			if ( curRangeLastNumber >= lastTrackNumber )
			{
				break;
			}
		}
		if ( collection.length === 0 )
		{
			console.log("getTracks: a track in the range " + firstTrackNumber + " - " + lastTrackNumber + " doesn't exist");
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
				return true;
			}
		}
		return false;
	};
	
	function TrackIterator ( trackManager )
	{
		this.iteratingtracks				= true;
		this.currentTrackIndex				= 0;
		this.currentImplicitTrackRangeIndex = 0;
	}
	TrackIterator.prototype.reset = function()
	{
		iteratingtracks = true;
		currentTrackIndex = 0;
		currentImplicitTrackRangeIndex = 0;
	};
	TrackIterator.prototype.next = function()
	{
		var
		next = null,
		returnNextTrackRange = false;
		if ( currentTrackIndex >= trackManager.tracks.length )
		{
			returnNextTrackRange = true;
		}
		else if ( currentImplicitTrackRangeIndex < trackManager.implicitTrackRanges.length )
		{
			// We have both a non-range track and a range track-- check to see if we should return the track range first.
			if ( trackManager.implicitTrackRanges[currentImplicitTrackRangeIndex].firstNumber < trackManager.tracks[currentTrackIndex].number )
			{
				returnNextTrackRange = true;
			}
		}
		if ( returnNextTrackRange &&
			 currentImplicitTrackRangeIndex < trackManager.implicitTrackRanges.length )
		{
			next = trackManager.implicitTrackRanges[currentImplicitTrackRangeIndex];
			currentImplicitTrackRangeIndex++;
			return next;
		}
		else if ( currentTrackIndex < trackManager.tracks.length )
		{
			next = trackManager.tracks[currentTrackIndex];
			currentTrackIndex++;
			return next;
		}
		return next;
	};
	
	
	// for Mozilla/Safari/Opera
	if ( WINDOW.addEventListener )
	{
		WINDOW.addEventListener( ONRESIZE, GridManager.layout, FALSE );
	}
	// If IE event model is used
	else if ( WINDOW.attachEvent )
	{
		// ensure firing before onload, maybe late but safe also for iframes
		WINDOW.attachEvent( ONRESIZE, GridManager.layout );
	}
	
})(eCSStender);
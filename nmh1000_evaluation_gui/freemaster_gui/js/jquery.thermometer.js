/* global jQuery */
(function($) {

	var Thermometer = {

		/** 
		 *  Set the value to show in the thermometer. If the value
		 *  is outside the maxmimum or minimum range it shall be clipped.
		 */
		setValue: function( value ) {
			if( value >= this.options.maxValue ) {
				this.valueToAttain = this.options.maxValue;
			} else if( value <= this.options.minValue ) {
				this.valueToAttain = this.options.minValue;
			} else {
				this.valueToAttain = value;
			}

			this._update();
		},

		/**
		 * Set the text colour
		 */
		setTextColour: function( newColour ) {
			this._updateTextColour( newColour );
		},
		
		/**
		 * Set the tick colour
		 */
		setTickColour: function( newColour ) {
			this._updateTickColour( newColour );
		},
		
		/**
		 * Set the text at the top of the scale
		 */
		setTopText: function( newText ) {
			this.topText.find('tspan').text(newText);
		},

		/**
		 * Set the text at the bottom of the scale
		 */
		setBottomText: function( newText ) {
			this.bottomText.find('tspan').text(newText);
		},

		/**
		 * Set the colour of the liquid in the thermometer. This must
		 * be of the form #ffffff. The shortened form and the rgb() form
		 * are not supported.
		 */
		setLiquidColour: function( newColour ) {

			this.options.liquidColour = newColour;
			this._updateLiquidColour();
		},

		/**
		 * Returns the liquid colour. If this is controlled by a colour
		 * function, then it returns the colour for the current value.
		 */
		getLiquidColour: function() {
			if( $.isFunction( this.options.liquidColour ) ) {
				return this.options.liquidColour( this.currentValue );
			} else {
				return this.options.liquidColour;
			}
		},

		_updateLiquidColour: function() {
			var liquidColour = this.getLiquidColour();

			var variables = [];
			variables["colour"] = liquidColour;
			variables["darkColour"] = this._blendColors( liquidColour, "#000000", 0.1 );
			variables["veryDarkColour"] = this._blendColors( liquidColour, '#000000', 0.2 );
		
			this._formatDataAttribute( this.neckLiquid, "style", variables );
			this._formatDataAttribute( this.liquidTop, "style", variables );
			this._formatDataAttribute( this.bowlLiquid, "style", variables );
			this._formatDataAttribute( this.bowlGlass, "style", variables );
			this._formatDataAttribute( this.neckGlass, "style", variables );
		},

		_updateTextColour: function( newColour ) {
			this.options.textColour = newColour;
			var variables = { textColour: this.options.textColour };
			this._formatDataAttribute( this.topText, "style", variables );
			this._formatDataAttribute( this.bottomText, "style", variables );
		},
		
		_updateTickColour: function( newColour ) {
			this.options.tickColour = newColour;
			var variables = { tickColour: this.options.tickColour };
			var self = this;
			this.ticks.find('rect').each( function(indx,tick) {
				self._formatDataAttribute( tick, "style", variables );
			} );
		},
		
		_setupSVGLinks: function(svg) {
			// Replace all ids in the SVG with fixtureId_id
			var id = this.fixtureId;
			svg.find('g[id], g [id]').each( function(indx,obj) {
				$(obj).attr('id', id + "_" + $(obj).attr('id') );
			});
			
			// This is all a bit magic, but these numbers come
			// from the SVG itself and so this will only work with
			// a specific SVG file.
			this.liquidBottomY = 346;
			this.liquidTopY = 25;
			this.neckBottomY = 573;
			this.neckTopY = 250;
			this.neckMinSize = 30;
			this.svgHeight = 1052;
			this.leftOffset = 300;
			this.topOffset = 150;
			this.liquidTop = $('#'+id+'_LiquidTop path');
			this.neckLiquid = $('#'+id+'_NeckLiquid path');
			this.bowlLiquid = $('#'+id+'_BowlLiquid path');
			this.topText = $('#'+id+'_TopText');
			this.bottomText = $('#'+id+'_BottomText');
			this.bowlGlass = $('#'+id+'_BowlGlass');
			this.neckGlass = $('#'+id+'_NeckGlass');
			this.ticks = $('#'+id+'_Ticks');
		},

		_create: function() {
			var div = $('<div/>');
			this.div = div;
			this.element.append( div );
			this.fixtureId = this.element.attr('id');

         div.html(this.options.svg);
         // Scale the SVG to the options provided.
         var svg = div.find("svg");
         this._setupSVGLinks(svg);
         
         svg[0].setAttribute( "preserveAspectRatio", "xMinYMin meet" );
         svg[0].setAttribute( "viewBox", this.leftOffset+" "+this.topOffset+" 744 600" );

         svg.attr("width",  this.options.width );
         svg.attr("height", this.options.height );

         // Setup the SVG to the given options
         this.currentValue = this.options.startValue;
         this.setValue( this.options.startValue );
         this.setTopText( this.options.topText );
         this.setBottomText( this.options.bottomText );
         this.setLiquidColour( this.options.liquidColour );
         this.setTextColour( this.options.textColour );
         this.setTickColour( this.options.tickColour );
         
         if( this.options.onLoad ) {
            this.options.onLoad();
         }
		},

		_update: function() {
			var self = this;
			var valueProperty = {val: this.currentValue};
			$(valueProperty).animate( {val: this.valueToAttain}, {
				duration: this.options.animationSpeed,
				step: function() {
					self._updateViewToValue( this.val );
					self.currentValue = this.val;
				}
			} );
		},

		_updateViewToValue: function( value ) {

			// Allow the liquid colour to be controlled by a function based on value
			if( $.isFunction( this.options.liquidColour ) ) {
				this._updateLiquidColour();
			}


			var variables = [];
			variables["liquidY"] = this.liquidBottomY - (value - this.options.minValue) * (this.liquidBottomY - this.liquidTopY) / (this.options.maxValue - this.options.minValue);
			variables["neckPosition"] = (value - this.options.minValue) * (this.neckBottomY - this.neckTopY) / (this.options.maxValue - this.options.minValue) + this.neckMinSize;
			variables["boxPosition"] = this.neckBottomY - variables["neckPosition"];

			// Move the oval representing the top of the liquid
			this._formatDataAttribute( this.liquidTop, "transform", variables );

			// Stretch the box representing the liquid in the neck
			this._formatDataAttribute( this.neckLiquid, "d", variables );

			// Call the valueChanged callback.
			if( this.options.valueChanged ) {
				this.options.valueChanged( value );
			}
		},

		_formatDataAttribute: function( object, attribute, variables ) {
			var formatString = $(object).attr("data-"+attribute);
			for( var v in variables ) {
				formatString = formatString.replace( new RegExp("%%"+v+"%%", "g"), variables[v] );
			}
			$(object).attr(attribute,formatString);
		},

		// http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
		_blendColors: function(c0, c1, p) {
			var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
			return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
		},


		// Default options
		options: {
			height: 700,
			minValue: 0,
			maxValue: 8,
			startValue: 0,
			topText: 8,
			bottomText: 0,
			textColour: '#000000',
			tickColour: '#000000',
			liquidColour: "#ff0000",
			animationSpeed: 1000,
			svg: `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->

<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:xlink="http://www.w3.org/1999/xlink"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   width="744.09448819"
   height="1052.3622047"
   id="svg2"
   version="1.1"
   inkscape:version="0.48.4 r9939"
   sodipodi:docname="thermo.svg"
   enable-background="new">
  <defs
     id="defs4">
    <linearGradient
       id="linearGradient4265">
      <stop
         style="stop-color:#ffffff;stop-opacity:1;"
         offset="0"
         id="stop4267" />
      <stop
         style="stop-color:#ffffff;stop-opacity:0;"
         offset="1"
         id="stop4269" />
    </linearGradient>
    <linearGradient
       inkscape:collect="always"
       id="linearGradient4249">
      <stop
         style="stop-color:#ffffff;stop-opacity:1;"
         offset="0"
         id="stop4251" />
      <stop
         style="stop-color:#ffffff;stop-opacity:0;"
         offset="1"
         id="stop4253" />
    </linearGradient>
    <linearGradient
       inkscape:collect="always"
       id="linearGradient3896">
      <stop
         style="stop-color:#d80000;stop-opacity:1;"
         offset="0"
         id="stop3898" />
      <stop
         style="stop-color:#d80000;stop-opacity:0;"
         offset="1"
         id="stop3900" />
    </linearGradient>
    <linearGradient
       inkscape:collect="always"
       id="linearGradient3852">
      <stop
         style="stop-color:#ffffff;stop-opacity:1;"
         offset="0"
         id="stop3854" />
      <stop
         style="stop-color:#ffffff;stop-opacity:0;"
         offset="1"
         id="stop3856" />
    </linearGradient>
    <linearGradient
       inkscape:collect="always"
       id="linearGradient3792">
      <stop
         style="stop-color:#ffffff;stop-opacity:1;"
         offset="0"
         id="stop3794" />
      <stop
         style="stop-color:#ffffff;stop-opacity:0;"
         offset="1"
         id="stop3796" />
    </linearGradient>
    <linearGradient
       inkscape:collect="always"
       xlink:href="#linearGradient3852"
       id="linearGradient3858"
       x1="385.77887"
       y1="388.01213"
       x2="454.3503"
       y2="388.01213"
       gradientUnits="userSpaceOnUse" />
    <radialGradient
       inkscape:collect="always"
       xlink:href="#linearGradient3792"
       id="radialGradient3860"
       gradientUnits="userSpaceOnUse"
       gradientTransform="matrix(1,0,0,0.98701307,0,8.6217797)"
       cx="413.04016"
       cy="663.88116"
       fx="413.04016"
       fy="663.88116"
       r="85.957001" />
    <radialGradient
       inkscape:collect="always"
       xlink:href="#linearGradient3792-9"
       id="radialGradient3860-4"
       gradientUnits="userSpaceOnUse"
       gradientTransform="matrix(1,0,0,0.98701307,0,8.6217797)"
       cx="413.04016"
       cy="663.88116"
       fx="413.04016"
       fy="663.88116"
       r="85.957001" />
    <linearGradient
       inkscape:collect="always"
       id="linearGradient3792-9">
      <stop
         style="stop-color:#ffffff;stop-opacity:1;"
         offset="0"
         id="stop3794-9" />
      <stop
         style="stop-color:#ffffff;stop-opacity:0;"
         offset="1"
         id="stop3796-5" />
    </linearGradient>
    <radialGradient
       r="85.957001"
       fy="663.88116"
       fx="413.04016"
       cy="663.88116"
       cx="413.04016"
       gradientTransform="matrix(1,0,0,0.98701307,0,8.6217797)"
       gradientUnits="userSpaceOnUse"
       id="radialGradient3877"
       xlink:href="#linearGradient3792-9"
       inkscape:collect="always" />
    <linearGradient
       inkscape:collect="always"
       xlink:href="#linearGradient3896"
       id="linearGradient3906"
       x1="325.98471"
       y1="663.88116"
       x2="500.09561"
       y2="663.88116"
       gradientUnits="userSpaceOnUse" />
    <filter
       id="filter4005"
       inkscape:label="Fancy blur"
       inkscape:menu="Blurs"
       inkscape:menu-tooltip="Smooth colorized contour which allows desaturation and hue rotation"
       color-interpolation-filters="sRGB">
      <feColorMatrix
         id="feColorMatrix4007"
         values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0 "
         result="result7" />
      <feGaussianBlur
         id="feGaussianBlur4009"
         result="result6"
         stdDeviation="5" />
      <feComposite
         id="feComposite4011"
         in2="result7"
         operator="atop"
         in="result6"
         result="result91" />
      <feComposite
         id="feComposite4013"
         in2="result91"
         operator="in"
         result="fbSourceGraphic" />
      <feColorMatrix
         result="fbSourceGraphicAlpha"
         in="fbSourceGraphic"
         values="0 0 0 -1 0 0 0 0 -1 0 0 0 0 -1 0 0 0 0 1 0"
         id="feColorMatrix4015" />
      <feGaussianBlur
         id="feGaussianBlur4017"
         stdDeviation="5"
         result="result1"
         in="fbSourceGraphic" />
      <feComposite
         id="feComposite4019"
         in2="result1"
         operator="arithmetic"
         k2="2"
         in="result1" />
    </filter>
    <mask
       maskUnits="userSpaceOnUse"
       id="mask4032">
      <path
         sodipodi:type="arc"
         style="fill:#ff0000;fill-opacity:1;stroke:none"
         id="path4034"
         sodipodi:cx="228.70129"
         sodipodi:cy="343.38818"
         sodipodi:rx="51.457787"
         sodipodi:ry="51.457787"
         d="m 280.15908,343.38818 a 51.457787,51.457787 0 1 1 -102.91557,0 51.457787,51.457787 0 1 1 102.91557,0 z" />
    </mask>
    <linearGradient
       inkscape:collect="always"
       xlink:href="#linearGradient3852-3"
       id="linearGradient3858-8"
       x1="385.77887"
       y1="388.01212"
       x2="454.35031"
       y2="388.01212"
       gradientUnits="userSpaceOnUse" />
    <linearGradient
       inkscape:collect="always"
       id="linearGradient3852-3">
      <stop
         style="stop-color:#ffffff;stop-opacity:1;"
         offset="0"
         id="stop3854-5" />
      <stop
         style="stop-color:#ffffff;stop-opacity:0;"
         offset="1"
         id="stop3856-6" />
    </linearGradient>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4202">
      <path
         sodipodi:type="arc"
         style="fill:#ffff00;fill-opacity:0.29807691;stroke:none"
         id="path4204"
         sodipodi:cx="171.87434"
         sodipodi:cy="313.12714"
         sodipodi:rx="170.12051"
         sodipodi:ry="121.89048"
         d="m 341.99486,313.12714 a 170.12051,121.89048 0 1 1 -340.24103,0 170.12051,121.89048 0 1 1 340.24103,0 z"
         transform="matrix(0.77577319,0,0,1,38.100375,78.044982)" />
    </clipPath>
    <filter
       id="filter4206"
       inkscape:label="Fancy blur"
       inkscape:menu="Blurs"
       inkscape:menu-tooltip="Smooth colorized contour which allows desaturation and hue rotation"
       color-interpolation-filters="sRGB">
      <feGaussianBlur
         id="feGaussianBlur4208"
         stdDeviation="5"
         result="result1" />
      <feComposite
         id="feComposite4210"
         in2="result1"
         operator="arithmetic"
         k2="2"
         in="result1" />
    </filter>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4202-3">
      <path
         sodipodi:type="arc"
         style="fill:#ffff00;fill-opacity:0.29807691;stroke:none"
         id="path4204-2"
         sodipodi:cx="171.87434"
         sodipodi:cy="313.12714"
         sodipodi:rx="170.12051"
         sodipodi:ry="121.89048"
         d="m 341.99486,313.12714 a 170.12051,121.89048 0 1 1 -340.24103,0 170.12051,121.89048 0 1 1 340.24103,0 z"
         transform="matrix(0.77577319,0,0,1,38.100375,78.044982)" />
    </clipPath>
    <filter
       id="filter4206-2"
       inkscape:label="Fancy blur"
       inkscape:menu="Blurs"
       inkscape:menu-tooltip="Smooth colorized contour which allows desaturation and hue rotation"
       color-interpolation-filters="sRGB">
      <feGaussianBlur
         id="feGaussianBlur4208-6"
         stdDeviation="5"
         result="result1" />
      <feComposite
         k4="0"
         k3="0"
         k1="0"
         id="feComposite4210-8"
         in2="result1"
         operator="arithmetic"
         k2="2"
         in="result1" />
    </filter>
    <radialGradient
       inkscape:collect="always"
       xlink:href="#linearGradient4249"
       id="radialGradient4255"
       cx="403.37854"
       cy="616.97644"
       fx="403.37854"
       fy="616.97644"
       r="23.676567"
       gradientTransform="matrix(1,0,0,0.94444444,0,34.276469)"
       gradientUnits="userSpaceOnUse" />
    <linearGradient
       inkscape:collect="always"
       xlink:href="#linearGradient4265"
       id="linearGradient4271"
       x1="423.73965"
       y1="556.6026"
       x2="362.97485"
       y2="638.15527"
       gradientUnits="userSpaceOnUse"
       spreadMethod="pad"
       gradientTransform="matrix(0.92074582,0,0,1,28.579229,0)" />
    <linearGradient
       inkscape:collect="always"
       xlink:href="#linearGradient4265-6"
       id="linearGradient4271-9"
       x1="423.73965"
       y1="556.6026"
       x2="362.97485"
       y2="638.15527"
       gradientUnits="userSpaceOnUse"
       spreadMethod="pad"
       gradientTransform="matrix(0.92074582,0,0,1,28.579229,0)" />
    <linearGradient
       id="linearGradient4265-6">
      <stop
         style="stop-color:#ffffff;stop-opacity:1;"
         offset="0"
         id="stop4267-1" />
      <stop
         style="stop-color:#ffffff;stop-opacity:0;"
         offset="1"
         id="stop4269-8" />
    </linearGradient>
    <linearGradient
       y2="638.15527"
       x2="362.97485"
       y1="556.6026"
       x1="423.73965"
       spreadMethod="pad"
       gradientTransform="matrix(-0.92014874,0.03315356,-0.03600728,-0.99935153,841.65497,1288.6024)"
       gradientUnits="userSpaceOnUse"
       id="linearGradient4288"
       xlink:href="#linearGradient4265-6"
       inkscape:collect="always" />
  </defs>
  <sodipodi:namedview
     id="base"
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1.0"
     inkscape:pageopacity="0.0"
     inkscape:pageshadow="2"
     inkscape:zoom="0.63286197"
     inkscape:cx="380.73792"
     inkscape:cy="526.18109"
     inkscape:document-units="px"
     inkscape:current-layer="layer8"
     showgrid="false"
     inkscape:window-width="1598"
     inkscape:window-height="850"
     inkscape:window-x="0"
     inkscape:window-y="0"
     inkscape:window-maximized="1"
     showguides="true"
     inkscape:guide-bbox="true" />
  <metadata
     id="metadata7">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
        <dc:title></dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <g
     inkscape:label="Layer 1"
     inkscape:groupmode="layer"
     id="layer1"
     style="display:inline" />
  <g
     inkscape:groupmode="layer"
     id="NeckLiquid"
     inkscape:label="Neck"
     style="opacity:0.75;display:inline">
    <path
       data-style="fill:%%colour%%;fill-rule:evenodd;stroke:none;display:inline"
       data-d="m 393.28125,%%boxPosition%% c -4.19808,0 -7.5625,0.28522 -7.5625,0.64112 l 0,%%neckPosition%% c 10.74167,-0.41082 22.63806,-0.63847 35.1875,-0.63847 11.83467,0 23.12028,0.20453 33.375,0.57224 l 0,-%%neckPosition%% c 0,-0.3559 -3.36442,-0.64112 -7.5625,-0.64112 l -53.4375,0 z"
       id="rect2987"
       inkscape:connector-curvature="0" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="LiquidTop"
     inkscape:label="Liquid Top"
     style="display:inline">
    <path
       sodipodi:type="arc"
       data-style="fill:%%darkColour%%;fill-opacity:1;stroke:none"	
       data-transform="matrix(1.1419806,0,0,0.70069527,-56.601976,%%liquidY%%)" 
       id="path4041"
       sodipodi:cx="417.37985"
       sodipodi:cy="286.68933"
       sodipodi:rx="30.493505"
       sodipodi:ry="14.770291"
       d="m447.87336,286.68933 a 30.493505,14.770291 0 1 1 -60.98701,0 30.493505,14.770291 0 1 1 60.98701,0 z"
    />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer9"
     inkscape:label="Neck Glass"
     style="display:inline;filter:url(#filter4369)">
    <rect
       ry="33.942513"
       style="opacity:0.46835447;fill:#00b7f4;fill-opacity:0.21875;fill-rule:evenodd;stroke:#00cad8;stroke-width:1;stroke-miterlimit:4;stroke-opacity:0.54807691;stroke-dasharray:none;display:inline"
       id="rect2987-7-5"
       width="68.571426"
       height="452.85715"
       x="384.98163"
       y="160.79024" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer6"
     inkscape:label="Neck Wash Reflection"
     style="display:inline">
    <path
       data-style="opacity:0.35864982;fill:url(#linearGradient3858);fill-opacity:1;fill-rule:evenodd;stroke:%%veryDarkColour%%;stroke-width:6;stroke-miterlimit:4;stroke-opacity:0.54807691;stroke-dasharray:none;display:inline"
       d="m 419.71875,161.59375 c -18.80415,0 -33.9375,15.13335 -33.9375,33.9375 l 0,380.0625 c 10.62068,-4.71542 22.38072,-7.34375 34.75,-7.34375 12.00458,0 23.44036,2.48148 33.8125,6.9375 l 0,-379.65625 c 0,-18.80415 -15.13335,-33.9375 -33.9375,-33.9375 l -0.6875,0 z"
       id="NeckGlass"
       inkscape:connector-curvature="0" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer7"
     inkscape:label="Neck Specular Reflection"
     style="opacity:0.58518515;display:inline">
    <rect
       style="fill:#ffffff;fill-opacity:0.29807691;stroke:none"
       id="rect4187"
       width="18.415108"
       height="395.48636"
       x="403.37857"
       y="184.22137"
       ry="13.213254" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="BowlLiquid"
     inkscape:label="Bowl"
     style="opacity:0.75;display:inline">
    <path
       sodipodi:type="arc"
       data-style="fill:%%colour%%;fill-rule:evenodd;stroke:none"
       id="path2985"
       sodipodi:cx="420"
       sodipodi:cy="653.79077"
       sodipodi:rx="85.714287"
       sodipodi:ry="85.714287"
       d="m 505.71429,653.79077 a 85.714287,85.714287 0 1 1 -171.42858,0 85.714287,85.714287 0 1 1 171.42858,0 z" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer10"
     inkscape:label="Bowl Glass"
     style="opacity:0.6814814;display:inline">
    <path
       transform="translate(0.03984343,-0.0380411)"
       sodipodi:type="arc"
       style="fill:#00ffff;fill-opacity:0.0817308;fill-rule:evenodd;stroke:none"
       id="path2985-2"
       sodipodi:cx="420"
       sodipodi:cy="653.79077"
       sodipodi:rx="85.714287"
       sodipodi:ry="85.714287"
       d="m 505.71429,653.79077 a 85.714287,85.714287 0 1 1 -171.42858,0 85.714287,85.714287 0 1 1 171.42858,0 z" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer3"
     inkscape:label="Bowl Wash Reflection"
     style="opacity:0.83703703;display:inline">
    <path
       sodipodi:type="arc"
       style="opacity:0.17299577;fill:url(#radialGradient3877);fill-opacity:1;stroke:url(#linearGradient3906);stroke-width:2.19688559;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none"
       id="path3022-1"
       sodipodi:cx="413.04016"
       sodipodi:cy="663.88116"
       sodipodi:rx="85.957001"
       sodipodi:ry="84.840683"
       d="m 498.99716,663.88116 a 85.957001,84.840683 0 1 1 -171.914,0 85.957001,84.840683 0 1 1 171.914,0 z"
       transform="matrix(0.99993476,0,0,0.99199182,6.5694005,-4.0854828)" />
    <path
       sodipodi:type="arc"
       data-style="opacity:0.42194094;fill:url(#radialGradient3860);fill-opacity:1;stroke:%%colour%%;stroke-width:6;stroke-miterlimit:4;stroke-dasharray:none;display:inline"
       id="BowlGlass"
       sodipodi:cx="413.04016"
       sodipodi:cy="663.88116"
       sodipodi:rx="85.957001"
       sodipodi:ry="84.840683"
       d="m 498.99716,663.88116 a 85.957001,84.840683 0 1 1 -171.914,0 85.957001,84.840683 0 1 1 171.914,0 z"
       transform="matrix(0.99986637,0,0,1.0078068,6.2878426,-14.972904)" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer2"
     inkscape:label="Bowl Specular Reflections"
     style="display:inline">
    <path
       sodipodi:type="arc"
       style="opacity:0.1814346;fill:#ffffff;stroke:none;display:none"
       id="path3910"
       sodipodi:cx="383.07465"
       sodipodi:cy="614.97095"
       sodipodi:rx="38.116882"
       sodipodi:ry="44.787334"
       d="m 421.19153,614.97095 a 38.116882,44.787334 0 1 1 -76.23377,0 38.116882,44.787334 0 1 1 76.23377,0 z"
       transform="translate(31.446427,-4.7646102)" />
    <rect
       style="opacity:0.1814346;fill:#ffffff;stroke:none;display:none"
       id="rect3908"
       width="20.964285"
       height="386.88635"
       x="402.13309"
       y="198.54404"
       ry="10.482142" />
    <path
       style="opacity:0.50632911;fill:url(#linearGradient4271);fill-opacity:1;stroke:none"
       d="m 415.47548,566.30371 c -29.57832,0 -53.69665,28.76864 -54.87333,64.78125 13.8431,-33.36481 35.71743,-57.24313 61.12569,-64.34375 -2.05251,-0.28608 -4.13763,-0.4375 -6.25236,-0.4375 z"
       id="path4178"
       inkscape:connector-curvature="0" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer14"
     inkscape:label="Bowl Specular Lower"
     style="opacity:0.51111109;display:inline">
    <path
       style="opacity:0.50632911;fill:url(#linearGradient4288);fill-opacity:1;stroke:none;display:inline"
       d="m 434.61855,736.59702 c 29.55914,-1.06503 52.62595,-30.68345 52.50515,-66.71508 -12.63274,33.84163 -33.6331,58.4921 -58.76921,66.50299 2.06148,0.21199 4.1507,0.28824 6.26406,0.21209 z"
       id="path4178-0"
       inkscape:connector-curvature="0" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer11"
     inkscape:label="Bowl Specular 2"
     style="opacity:0.4;display:inline">
    <path
       sodipodi:type="arc"
       style="fill:#ffffff;fill-opacity:0.29807691;stroke:none;filter:url(#filter4206)"
       id="path4194"
       sodipodi:cx="171.43588"
       sodipodi:cy="473.60165"
       sodipodi:rx="60.94524"
       sodipodi:ry="53.491505"
       d="m 232.38112,473.60165 a 60.94524,53.491505 0 1 1 -121.89048,0 60.94524,53.491505 0 1 1 121.89048,0 z"
       transform="matrix(1.115108,0,0,1,229.3088,148.19777)"
       clip-path="url(#clipPath4202)" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer12"
     inkscape:label="Neck Top Specular"
     style="display:inline">
    <path
       sodipodi:type="arc"
       style="fill:#ffffff;fill-opacity:0.29807691;stroke:none;filter:url(#filter4206-2)"
       id="path4194-6"
       sodipodi:cx="171.43588"
       sodipodi:cy="473.60165"
       sodipodi:rx="60.94524"
       sodipodi:ry="53.491505"
       d="m 232.38112,473.60165 a 60.94524,53.491505 0 1 1 -121.89048,0 60.94524,53.491505 0 1 1 121.89048,0 z"
       transform="matrix(0.47067597,0,0,0.40390939,340.226,-0.4149504)"
       clip-path="url(#clipPath4202-3)" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer13"
     inkscape:label="Bowl Spot Specular"
     style="display:inline">
    <path
       sodipodi:type="arc"
       style="opacity:0.58649789;fill:url(#radialGradient4255);fill-opacity:1;stroke:none"
       id="path4247"
       sodipodi:cx="403.37854"
       sodipodi:cy="616.97644"
       sodipodi:rx="23.676567"
       sodipodi:ry="22.361202"
       d="m 427.05511,616.97644 a 23.676567,22.361202 0 1 1 -47.35314,0 23.676567,22.361202 0 1 1 47.35314,0 z"
       transform="translate(-3.5076396,-1.7538198)" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="Ticks"
     inkscape:label="Ticks"
     style="display:inline">
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376"
       width="102.59846"
       height="9.6460085"
       x="465.63916"
       y="543.75446"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-3"
       width="102.59846"
       height="9.6460085"
       x="465.63916"
       y="381.30688"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-4"
       width="102.59846"
       height="9.6460085"
       x="465.63916"
       y="218.85933"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-40"
       width="45.599316"
       height="9.6460085"
       x="465.63916"
       y="503.14258"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-40-3"
       width="45.599316"
       height="9.6460085"
       x="465.63916"
       y="462.53064"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-40-9"
       width="45.599316"
       height="9.6460085"
       x="465.63916"
       y="421.91876"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-40-2"
       width="45.599316"
       height="9.6460085"
       x="465.63916"
       y="340.69501"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-40-5"
       width="45.599316"
       height="9.6460085"
       x="465.63916"
       y="300.08313"
       ry="4.8230042" />
    <rect
       data-style="opacity:0.46835447;fill	:%%tickColour%%;fill-opacity:0.29807691;stroke:none"
       id="rect4376-40-7"
       width="45.599316"
       height="9.6460085"
       x="465.63916"
       y="259.47119"
       ry="4.8230042" />
  </g>
  <g
     inkscape:groupmode="layer"
     id="layer16"
     inkscape:label="Text"
     style="display:inline">
    <text
       xml:space="preserve"
       data-style="font-size:40px;font-style:normal;font-weight:normal;line-height:125%;letter-spacing:0px;word-spacing:0px;fill:%%textColour%%;fill-opacity:1;stroke:none;font-family:Sans"
       x="574.37592"
       y="562.16962"
       id="BottomText"
       sodipodi:linespacing="125%"><tspan
         sodipodi:role="line"
         id="tspan4406"
         x="574.37592"
         y="562.16962">Bottom</tspan></text>
    <text
       xml:space="preserve"
       data-style="font-size:40px;font-style:normal;font-weight:normal;line-height:125%;letter-spacing:0px;word-spacing:0px;fill:%%textColour%%;fill-opacity:1;stroke:none;font-family:Sans"
       x="578.41888"
       y="233.08215"
       id="TopText"
       sodipodi:linespacing="125%"><tspan
         sodipodi:role="line"
         id="tspan4410"
         x="578.41888"
         y="233.08215">Top</tspan></text>
  </g>
</svg>
			`,
			valueChanged: undefined,
			onLoad: undefined
		}
	};

	$.widget( "dd.thermometer", Thermometer );

})(jQuery);

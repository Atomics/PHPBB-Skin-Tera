/**
 * jQuery AppMenu v1.0 - http://www.josscrowcroft.com/jquery-appmenu/
 *
 * Copyright (c) 2010 Joss Crowcroft - joss[at]josscrowcroft[dot]com | http://josscrowcroft.com
 * Date: 10/10/2010
 * 
 * Dual licensed under MIT and GPL.
 *
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 *
 * Usage:
 * $('#containerDiv').appMenu();
 * 
 * see http://josscrowcroft.com/jquery-appmenu#instructions for how to install
 * see http://josscrowcroft.com/jquery-appmenu#documentation for docs and options
 * see http://josscrowcroft.com/demos/jquery-appmenu/ for demos
 *
 * Use minified jquery.appMenu.1.0-min.js for better performance.
**/

/** for v1.1:
 * @todo Add arrow key functions.
 * @todo Fix CSS cross browser.
 * @todo Add a method of manually defining selected item on page load.
 *       This would use the location hash to determine which item is displayed, and also
 *       which item comes first in the menu, if reorder == true.
 * @todo Add method to add/remove items from the menu
 * @todo Create a destroy() function to disable and remove the menu.
 * @todo Create a resize function that will calculate required size to fit all items on the screen, called
 *       on load, when items are added/removed and when the window is resized.
 */

;jQuery.fn.appMenu || (function($) {

	/**
	 * Main plugin function definition
	 */
	$.fn.appMenu = function(options) {
		
		// Build main options before element iteration:
		var opts = $.extend({}, $.fn.appMenu.defaults, options);
		
		// Set up variables
		var diff = 1,
		    selected = 0,
		    hasMouseFocus = 0,
		    menuOpen = false,
		    isAlt = false,
		    isShift = false,
		    isMouseOver = false;
		
		/**
		  * Where the magic happens - iterate and act upon matched elements, returning them for chaining:
		  */
		return this.each(function() {
			
			// Cache the appMenuDiv element:
			var appMenuDiv = $(this);
			
			/* @todo: if needed for callbacks
				// Extend main options to add appMenuDiv object
				var opts = $.extend({}, $.fn.appMenu.defaults, opts, { appMenuDiv: $(this) });
			*/
			
			// Store and count the menu items in the container:
			var items = $('ul li a', appMenuDiv),
			    itemsNum = items.length;
			
			// Support metadata plugin and manual settings override:
			var o = $.meta  ?  $.extend({}, opts, $this.data())  :  opts;
			
			// Bind window.resize() function to center appMenuDiv element horizontally, if set:
			// (default: false to avoid interference with custom CSS)
			if ( o.centerHoriz ) {
				$(window).resize( function() { centerHoriz(); });
			}
			
			// Disable text selection on element:
			appMenuDiv.css('MozUserSelect','none')
			          .bind({
			              selectstart: function() { return false; },
			              mousedown: function() { return false; } 
			           });
			
			// Cycle through items, add ID, title span and remove title attribute:
			items.each(function(i) {
				$(this).attr('id', 'item-'+i)
				       .append('<p><span>'+$(this).attr('title')+'</span></p>')
				       .removeAttr('title');
			});
			
			// Set up debugging message space, if needed:
			if ( o.debug ) {
				$('body').prepend('<div id="appMenuDebug" style="position:absolute;left:0;top:0;z-index:9999;font-family:monospace;font-size:12px;background:rgba(0,0,0,0.7);color:#ddd;padding:8px;"></div>')
				var msgDiv = $('#appMenuDebug');
			}
			
			// Add control info, if required:
			if ( o.showControl ) {
				appMenuDiv.find('ul').prepend( '<li id="appMenuControl">'+o.showControlText+'</li>' )
			}
			
			
			// Bind all actions to document:
			$(document).bind({
				keyup: function (e) {
					
					// Register shift and tab keys up:
					if ( e.which == 16 ) { isShift = false; }
					if ( e.which == 9 && menuOpen )  { isTab = false; }
					
					// If alt key goes up, close menu:
					if ( e.which == 18 && menuOpen ) {
						isAlt = false;
						closeMenu(selected);
					}
				},
				keydown: function (e) {
					
					// Register alt and shift keys down:
					if ( e.which == 18 ) { isAlt = true; }
					if ( e.which == 9 )  { isTab = true; }
					if ( e.which == 16 ) { isShift = true; }
					
					// If escape key goes down, close menu:
					if ( e.which == 27 ) {
						isMouseOver = false;
						closeMenu();
					}
					
					// If alt and tab are pressed together:
					if ( e.which == 9 && isAlt ) {
						e.preventDefault();
						
						// If shift key is down, cycle backwards:
						if ( isShift ) { diff = -1 } else { diff = 1; }
						
						// If menu is currently open:
						if ( menuOpen ) {
							
							// If mouse is already over, move on from hovered item and reset mouse focus:
							if ( isMouseOver ) { 
								selected = hasMouseFocus;
								isMouseOver = false;
							}
							
							// Change the selected item:
							selected += diff;
							
							// Keep the selected value in range:
							if ( selected >= itemsNum ) { selected = 0; }
							if ( selected < 0  ) { selected = itemsNum - 1; }
							
							// Switch the 'selected' class:
							items.removeClass('selected');
							$('a#item-'+selected).addClass('selected');
						
						// If menu is currently closed:
						} else {
							
							// If reordering items is on:
							if ( o.reorder ) {
								// Always select 2nd item:
								selected = 1;
							} else {
								// Otherwise, select from previous position:
								selected += diff;
								
								// Keep the selected value in range:
								if ( selected >= itemsNum ) { selected = 0; }
								if ( selected < 0  ) { selected = itemsNum - 1; }
							} // endif ( o.reorder )
							
							// Switch selected class:
							items.removeClass('selected');
							$('a#item-'+selected).addClass('selected');
							
							// Check menu is centered, if needed:
							if ( o.centerHoriz ) { centerHoriz(); }
							
							// Open the menu:
							appMenuDiv.fadeIn(o.menuFadeSpeed);
							menuOpen = true;
							debug('Menu opened, item-'+selected);
							
						} // endif ( menuOpen )
	
					} // endif ( e.which == 9 && isAlt )
				},
				click: function(e) {
					// Prevent accidental link downloads via alt+click:
					// Check menuOpen, as sometimes isAlt = true when menu is closed.
					if ( menuOpen && isAlt ) { e.preventDefault(); }
				}
			}); // $(document).bind

			// Bind mouse functions to items:
			items.bind({
				mouseenter: function() {
					
					// If menu is open:
					if ( menuOpen && !isTab ) {
						// Unselect other items:
						items.removeClass('selected');
						
						// Select mouseover item:
						$(this).addClass('selected');
						isMouseOver = true;
						
						// Grab the numeric value from the ID attribute:
						// @TODO: find a cleaner way to do this
						hasMouseFocus = ( $(this).attr("id").substring(5,6) ) * 1;
						debug('selected: ' +hasMouseFocus);
						selected = hasMouseFocus;
					}
				}, 
				mouseleave: function() {
					
					// If mouse leaves the item, reset mouse variables:
					isMouseOver = false;
					hasMouseFocus = null;
				},
				mousedown: function(e) {
					
					// If alt key is down when clicked:
					if ( isAlt && isMouseOver ) {
						
						// Prevent default link action:
						e.preventDefault();
						
						// Reset mouse variables
						isMouseOver = false;
						hasMouseFocus = false;
						
						// Close the menu, activating callback:
						closeMenu(selected);
						return false;
						
					} // endif ( isAlt && isMouseOver )
				},
			}); // items.bind
			
			// Close menu function:
			function closeMenu( selected ) {
				// Fade out the menu:
				appMenuDiv.fadeOut(o.menuFadeSpeed, function() {
					// If reordering is switched on:
					if ( o.reorder ) {
						// Physically move the selected item to the top of the list:
						appMenuDiv.find('ul').prepend( $('#item-'+selected).parent('li') );
						
						// Refresh the stored list items:
						var items = appMenuDiv.find('ul li a'),
						    itemsNum = items.length;
				    	
						// Cycle through items, updating the IDs:
						var i = 0;
						items.each(function() {
							$(this).attr('id', 'item-'+i);
							i++;
						});
					}
					debug( 'Menu closed with item '+selected);
					menuOpen = false;
				});
				
				// Get selected item:
				var itemSelected = $('#item-'+selected);
				
				// Update location hash, if needed:
				if ( o.updateHash && itemSelected.attr('href') == '#' )
					document.location.hash = itemSelected.attr('href');
				
				// Activate callback function, if it exists, passing selected item and plugin options:
				if ( typeof o.onSelect == 'function' ) {
					o.onSelect.call( this, itemSelected, o );
					debug('Callback fired');
					return true;
				}
				return false;
			} // function closeMenu()
			
			// Function to center menu horizontally in the window
			function centerHoriz() {
				appMenuDiv.css('top', ( $(window).height() - appMenuDiv.height() ) / 2);
			}
			
			// Debugging function:
			function debug( msg ) {
				if ( o.debug !== false ) { msgDiv.append( msg+'<br />' ); }
			}
			
		}); // this.each
		
	} // end main plugin function
	
	

	/**
	 * Default callback function 'onSelectDefault'
	 * 
	 * By default, when the menu is closed, this function finds out whether the 'href' attribute
	 * of the selected item is a #hash or a URL. If it's a hash, it attempts to fade out the
	 * current tab and fade in the new tab. If it's a URL, it visits that URL.
	 *
	 * This can be overridden in the plugin options by setting a callback function with 'onSelect'
	 *
	 * Callback function is passed the selected object, the appMenu options and its own options.
	 *
	 * http://josscrowcroft.com/jquery-appmenu#examples
	 */
	$.fn.appMenu.onSelectDefault = function( obj, appMenuOpts, options ) {
		// extend the callback function's options from pre-defined values:
		var o = $.extend({
			tabFadeSpeed: 360,
			tabClass: 'tab'
		}, options || {});
		
		// Item has been selected - do stuff with it:
		var itemTarget = obj.attr('href');
		
		// This is a messy, callback-specific way of finding the current tab, but it works..
		// We need the current tab in order to compare it to the selected object, so this finds
		// it by looking for a visible tab with the given tab class and grabbing the id.
		var currentTab = '#' + $('.'+o.tabClass+':visible').attr('id');
				
		// If no hashtag is present, load URL:
		if ( itemTarget.substr(0,1) != '#' ) {
			window.location.href = itemTarget;
		} else {
			// Check the selected tab is not visible:
			if ( currentTab != itemTarget ) {
					
				// Fade out visible tab and show selected tab:
				$(currentTab).fadeOut(o.tabFadeSpeed, function() {
					$(this).hide();
					$(itemTarget).fadeIn(o.tabFadeSpeed);
				});
				return true;
			}
			return false;
		}
	};
	
	
	/**
	 * Exposed default plugin settings, which can be overridden in plugin call.
	 */
	$.fn.appMenu.defaults = {
		menuFadeSpeed   : 120,      // Speed at which the menu fades in/out
		reorder         : false,    // Reorder the items when one is selected
		resize          : false,    // Resize the items when more are added (planned for 2.0)
		updateHash      : true,     // Update the location hash in the browser when item selected
		centerHoriz     : false,     // Center the menu horizontally in the window on load (deprecated)
		debug           : false,    // Enable debug mode (removed in .minified version)
		showControl     : true,     // Show navigation control in appMenu div
		showControlText : 'Alt + Tab (+ Shift) or mouse to navigate.', // Text for the navigation control
		// Callback function for selected item:
		onSelect: function( obj, appMenuOpts ) {
			// Callback function is passed the selected item (object), the plugin options and its own options:
			$.fn.appMenu.onSelectDefault( obj, appMenuOpts, {} );
		}
	};
	
})(jQuery); // Pass in jQuery object to self-executing function
/**
 * editor_plugin_src.js
 *
 * Copyright 2012, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

(function() {
	var $ = tinymce.$, defaults, getParam;

	defaults = {
		sproutcore_app_namespace: null,
		sproutcore_dialog_open: null,
		sproutcore_dialog_close: null
	};

	/**
	 * Gets the specified parameter, or the plugin defined default value.
	 *
	 * @param {tinymce.Editor} ed Editor instance.
	 * @param {String} name Parameter name.
	 */
	getParam = function(ed, name) {
		return ed.getParam(name, defaults[name]);
	};

	/**
	 * @class
	 *
	 * TinyMCE plugin for integration with SproutCore.
	 */
	tinymce.create('tinymce.plugins.SproutCorePlugin', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			// Override the editor's window manager with our own.
			ed.onBeforeRenderUI.add(function() {
				ed.windowManager = new tinymce.SproutCoreWindowManager(ed);
			});

			// Add expanded editor command.
			ed.addCommand('scOpenExpandedEditor', function(ui, value) {
				var view = TinySC.Utils.getOwnerView(ed), expandedView;

				if (view && !view.get('isExpanded')) {
					expandedView = TinySC.ExpandedEditorPane.create({ owner: view });
					if (expandedView) {
						expandedView.append();
						expandedView.load();
					}
				}
			});

			// Add expanded editor button.
			ed.addButton('expanded_editor', {
				title : 'sproutcore.expanded_editor_desc',
				cmd : 'scOpenExpandedEditor',
				ui : true
			});
		},

		/**
		 * Opens a dialog according to the app specified method.
		 * Falls back to doing view.append.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {SC.PanelPane} view Dialog instance.
		 */
		openDialog: function(ed, view) {
			var app, dialogOpen;

			app = getParam(ed, 'sproutcore_app_namespace');
			dialogOpen = getParam(ed, 'sproutcore_dialog_open');

			if (tinymce.is(app, 'string')) {
				app = window[app];
			}

			if (app && tinymce.is(dialogOpen, 'string')) {
				dialogOpen = app[dialogOpen];
			}

			ed.makeReadOnly(true);

			if (app && dialogOpen) {
				dialogOpen.call(app, view);
			} else {
				view.append();
			}
		},

		/**
		 * Closes a dialog according to the app specified method.
		 * Falls back to doing view.remove.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {SC.PanelPane} view Dialog instance.
		 */
		closeDialog: function(ed, view) {
			var app, dialogClose;

			app = getParam(ed, 'sproutcore_app_namespace');
			dialogClose = getParam(ed, 'sproutcore_dialog_close');

			if (tinymce.is(app, 'string')) {
				app = window[app];
			}

			if (app && tinymce.is(dialogClose, 'string')) {
				dialogClose = app[dialogClose];
			}

			ed.makeReadOnly(false);

			if (app && dialogClose) {
				dialogClose.call(app, view);
			} else {
				view.remove();
			}
		},

		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname : 'SproutCore integration plugin',
				author : 'Seapine Software Inc',
				authorurl : 'http://www.seapine.com',
				infourl : 'http://www.seapine.com',
				version : '0.1'
			};
		}
	});

	/**
	 * Override of the default window manager for opening SproutCore based dialogs.
	 *
	 * @class tinymce.SproutCoreWindowManager
	 */
	tinymce.create('tinymce.SproutCoreWindowManager:tinymce.WindowManager', {
		/**
		 * Constructs a new window manager instance.
		 *
		 * @constructor
		 * @method SproutCoreWindowManager
		 * @param {tinymce.Editor} ed Editor instance that the windows are bound to.
		 */
		SproutCoreWindowManager : function(ed) {
			var t = this;

			t.parent(ed);
		},

		/**
		 * Opens a new window. Overriden to open our SproutCore based dialogs instead.
		 *
		 * @param {Object} s See documentation of tinymce.WindowManager.
		 * @param {Object} p See documentation of tinymce.WindowManager.
		 */
		open : function(s, p) {
			var self = this, ed = self.editor, owner, url, o;

			owner = TinySC.Utils.getOwnerView(ed);

			url = s.url || s.file;
			if (url) {
				if (/tinymce\/plugins\/table\/table\.htm/.test(url)) {
					// Insert Table
					o = this._openTableProperties(ed);
				} else if (/tinymce\/plugins\/table\/row\.htm/.test(url)) {
					// Row Properties
					o = this._openRowCellProperties(ed, YES);
				} else if (/tinymce\/plugins\/table\/cell\.htm/.test(url)) {
					// Cell Properties
					o = this._openRowCellProperties(ed, NO);
				} else if (/themes\/advanced\/image.htm/.test(url)) {
					// Insert Image
					o = this._openImageProperties(ed);
				} else if (/themes\/advanced\/link.htm/.test(url)) {
					// Insert Link
					o = this._openLinkProperties(ed);
				}
			}

			if (o) {
				// We implemented this window, its been setup, now open it.
				this._openDialog(ed, o.viewClass, owner);
			} else {
				// We did not implement the requested window, pass through to the parent.
				self.parent(s, p);
			}
		},

		// TODO: is this needed?
		// May want this so dialogs can be forceably closed when states change.
		/*close : function(w) {
			var t = this;

			t.parent(w);
		},*/

		/**
		 * Opens a dialog according to the app specified method.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {SC.PanelPane} viewClass Dialog class to create and open.
		 * @param {SC.PanelPane} owner Dialog owner.
		 */
		_openDialog: function(ed, viewClass, owner) {
			var view = viewClass.create({ owner: owner });

			if (ed.plugins.sproutcore) {
				ed.plugins.sproutcore.openDialog(ed, view);
			}
		},

		/**
		 * Setup the table properties dialog.
		 *
		 * @method _openTableProperties
		 * @param {tinymce.Editor} ed Editor instance.
		 * @return {Object} View class and controller.
		 * @option {TinySC.TablePropertiesPane} viewClass View class to create.
		 * @option {TinySC.tablePropertiesController} controller Controller for view.
		 */
		_openTableProperties: function(ed) {
			var viewClass, controller, selectedNode, tableElement, $tableElement,
					cellPadding, cellSpacing, border, alignment, backgroundColor;

			viewClass = TinySC.TablePropertiesPane;
			controller = TinySC.tablePropertiesController;

			selectedNode = ed.selection.getNode();
			tableElement = ed.dom.getParent(selectedNode, 'table');

			if (tableElement) {
				$tableElement = ed.$(tableElement);

				cellPadding = parseInt(tableElement.cellPadding, 10);
				if (!isFinite(cellPadding)) {
					cellPadding = 0;
				}
				cellSpacing = parseInt(tableElement.cellSpacing, 10);
				if (!isFinite(cellSpacing)) {
					cellSpacing = 0;
				}
				border = parseInt(tableElement.border, 10);
				if (!isFinite(border)) {
					border = 0;
				}
				alignment = tableElement.align || 'left';
				backgroundColor = tableElement.bgColor || '#ffffff'; // TODO: RGBtoHex?

				controller.beginPropertyChanges()
					.set('insertMode', NO)
					.set('node', tableElement)
					.set('rows', TinySC.Utils.countTableRows($tableElement))
					.set('columns', TinySC.Utils.countTableColumns($tableElement))
					.set('width', tableElement.offsetWidth)
					.set('cellPadding', cellPadding)
					.set('cellSpacing', cellSpacing)
					.set('frame', border > 0 ? 'on' : 'off')
					.set('frameWidth', border)
					.set('alignment', alignment)
					.set('backgroundColor', backgroundColor)
				.endPropertyChanges();
			} else {
				controller.set('insertMode', YES);
			}

			return { viewClass: viewClass, controller: controller };
		},

		/**
		 * Setup the row/cell properties dialog.
		 *
		 * @method _openRowCellProperties
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {Boolean} rowMode Setup for row or cell mode.
		 * @return {Object} View class and controller.
		 * @option {TinySC.TableRowCellPropertiesPane} viewClass View class to create.
		 * @option {TinySC.tableRowCellPropertiesController} controller Controller for view.
		 */
		_openRowCellProperties: function(ed, rowMode) {
			var viewClass, controller, selectedNode, rowCellElement, horizontalAlignment, verticalAlignment, backgroundColor;

			viewClass = TinySC.TableRowCellPropertiesPane;
			controller = TinySC.tableRowCellPropertiesController;

			selectedNode = ed.selection.getNode();
			rowCellElement = ed.dom.getParent(selectedNode, rowMode ? 'tr' : 'td');

			if (rowCellElement) {
				horizontalAlignment = rowCellElement.align || 'left';
				verticalAlignment = rowCellElement.vAlign || 'middle';
				backgroundColor = rowCellElement.bgColor || '#ffffff'; // TODO: RGBtoHex?

				controller.beginPropertyChanges()
					.set('rowMode', rowMode)
					.set('node', rowCellElement)
					.set('horizontalAlignment', horizontalAlignment)
					.set('verticalAlignment', verticalAlignment)
					.set('backgroundColor', backgroundColor)
				.endPropertyChanges();
			}

			return { viewClass: viewClass, controller: controller };
		},

		/**
		 * Setup the image properties dialog.
		 *
		 * @method _openImageProperties
		 * @param {tinymce.Editor} ed Editor instance.
		 * @return {Object} View class and controller.
		 * @option {TinySC.InsertImagePane} viewClass View class to create.
		 * @option {TinySC.insertImageController} controller Controller for view.
		 */
		_openImageProperties: function(ed) {
			var viewClass, controller, selectedNode, percentWidth, percentHeight;

			// Insert image pane and controller.
			viewClass = TinySC.InsertImagePane;
			controller = TinySC.insertImageController;

			selectedNode = ed.selection.getNode();

			if (selectedNode.tagName === 'IMG') {
				// An image was selected, we are editing an existing image.

				// We must set this false to begin, so the controller does not update width/height properties while we are setting them.
				controller.set('maintainAspectRatio', false);

				// Get values from the selected image node.
				controller.beginPropertyChanges()
					.set('insertMode', false)
					.set('fileSelected', true)
					.set('node', selectedNode)
					.set('originalWidth', selectedNode.getAttribute('data-tinysc-original-width'))
					.set('originalHeight', selectedNode.getAttribute('data-tinysc-original-height'))
					.set('scaledPixelWidth', selectedNode.getAttribute('width'))
					.set('scaledPixelHeight', selectedNode.getAttribute('height'))
					.set('fileName', selectedNode.getAttribute('data-tinysc-file-name'))
					.set('serverFileID', selectedNode.getAttribute('data-tinysc-server-file-id'))
					.set('fileSize', selectedNode.getAttribute('data-tinysc-file-size'))
					.set('imageType', selectedNode.getAttribute('data-tinysc-image-type'))
				.endPropertyChanges();

				// Now that the controller has calculated the %width/%height (by setting the pixel width/height above),
				// we can check if we should maintain aspect ratio.
				percentWidth = controller.get('scaledPercentWidth');
				percentHeight = controller.get('scaledPercentHeight');
				controller.set('maintainAspectRatio', percentWidth === percentHeight);
			} else {
				// No image was selected, we are inserting a new image.
				controller.set('insertMode', true);
			}

			return { viewClass: viewClass, controller: controller };
		},

		/**
		 * Setup the link properties dialog.
		 *
		 * @method _openLinkProperties
		 * @param {tinymce.Editor} ed Editor instance.
		 * @return {Object} View class and controller.
		 * @option {TinySC.InsertLinkPane} viewClass View class to create.
		 * @option {TinySC.insertLinkController} controller Controller for view.
		 */
		_openLinkProperties: function(ed) {
			var viewClass, controller, selectedNode, anchorNode, tmpDiv;

			// Insert Link pane and controller.
			viewClass = TinySC.InsertLinkPane;
			controller = TinySC.insertLinkController;

			// Try to find the selected anchor node.
			selectedNode = ed.selection.getNode();
			anchorNode = TinySC.Utils.findClosestAnchorNode(ed.$(selectedNode));

			// Create a temporary div with the selected HTML so we can do some inspection.
			tmpDiv = document.createElement('div');
			tmpDiv.innerHTML = ed.selection.getContent({ format: 'html' });

			if (anchorNode) {
				// We found an anchor node, we are editing an existing link.
				controller.set('insertMode', false);
				// Select the anchor node, in case it was a parent of the actual selection.
				selectedNode = ed.selection.select(anchorNode);
			} else {
				// No anchor node found, we are inserting a new link.
				controller.set('insertMode', true);
				// Try to find a child anchor node, so we can populate the dialog with its href.
				anchorNode = TinySC.Utils.findChildAnchorNode($(tmpDiv));
			}

			if (anchorNode) {
				// Populate based on the anchor node we found.
				controller.set('selectedUrlType', controller.getUrlType(anchorNode.href));
				controller.set('url', anchorNode.href);
			}

			// Set the display text based on the selection.
			controller.set('displayText', ed.selection.getContent({ format: 'text' }));

			// This is a little complicated. We are trying to figure out if the display text should be editable.
			// So we are looking to see if the selection contains anything other than anchor and text nodes.
			$q = $(tmpDiv).find('*').andSelf().contents().filter(function() {
				return (this.nodeType !== Node.TEXT_NODE && this.tagName !== 'A');
			});
			if ($q.length) {
				// We found other nodes, display text is not editable.
				TinySC.insertLinkController.set('displayTextEditable', false);
			}

			return { viewClass: viewClass, controller: controller };
		}
	});

	// Register plugin
	tinymce.PluginManager.add('sproutcore', tinymce.plugins.SproutCorePlugin);
})();

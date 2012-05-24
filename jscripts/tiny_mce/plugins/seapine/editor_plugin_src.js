/**
 * editor_plugin_src.js
 *
 * Copyright 2012, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

(function() {
	var $ = tinymce.$;

	/**
	 * @class
	 *
	 * TinyMCE plugin for general Seapine modifications.
	 */
	tinymce.create('tinymce.plugins.SeapinePlugin', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			// Override some formats.
			ed.onInit.add(function(ed) {
				ed.formatter.register({
					alignleft : [
						{selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes : {'align' : 'left'}},
						{selector : 'img,table', collapsed : false, styles : {'float' : 'left'}}
					],

					aligncenter : [
						{selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes: {'align' : 'center'}},
						{selector : 'img', collapsed : false, styles : {display : 'block', marginLeft : 'auto', marginRight : 'auto'}},
						{selector : 'table', collapsed : false, styles : {marginLeft : 'auto', marginRight : 'auto'}}
					],

					alignright : [
						{selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes : {'align' : 'right'}},
						{selector : 'img,table', collapsed : false, styles : {'float' : 'right'}}
					],

					alignfull : [
						{selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes : {'align' : 'justify'}}
					]
				});
			});

			ed.addCommand('unlink', function(ui, value) {
				var doc = ed.getDoc(), selection = ed.selection, node = selection.getNode();
				while (node.tagName !== 'A' && node.parentNode) {
					node = node.parentNode;
				}

				if (node.tagName === 'A') {
					if (selection.isCollapsed()) {
						selection.select(node);
					}

					doc.execCommand('unlink', ui, value);
					// TODO: might not need this section?
					/*if (ed.queryCommandState('underline')) {
						doc.execCommand('underline', false, null);
					}
					ed.execCommand('ForeColor', false, 'black');*/
					selection.collapse(false);
				}
			});

			tinymce.extend(ed, {
				/**
				 * Makes the editor readonly. This turns off contentEditable on the editor body element,
				 * disables the toolbar buttons, and saves the selection so it can be restored when the
				 * editor becomes editable again.
				 *
				 * @param {Boolean} ro Whether to make the editor readonly or not.
				 */
				makeReadOnly: function(ro) {
					var body = ed.getBody(), $body = $(body), s = ed.settings, cm = ed.controlManager, buttons, i, l, c;
					ro = !!ro;

					if (!ed.plugins.seapine || (ro && ed.plugins.seapine.readonly) || (!ro && !ed.plugins.seapine.readonly)) {
						// If readonly value didn't change, do nothing.
						return;
					}

					ed.plugins.seapine.readonly = ro;

					if (ro) {
						// Save the selection before we make it read-only.
						ed.plugins.seapine.bookmark = ed.selection.getBookmark(1);
					}

					// Turn off contentEditable and make the content unselectable.
					body.contentEditable = !ro;
					$body.toggleClass('mceReadOnly', ro);

					// Disable all the toolbar buttons.
					buttons = s.theme_advanced_buttons1.split(',');
					buttons = buttons.concat(s.theme_advanced_buttons2.split(','));
					for (i = 0, l = buttons.length; i < l; ++i) {
						if (buttons[i] !== '|') {
							c = cm.get(buttons[i]);
							if (c) {
								c.setDisabled(ro);
							}
						}
					}

					if (!ro) {
						// Restore the selection after turning off read-only.
						if (ed.plugins.seapine.bookmark) {
							ed.selection.moveToBookmark(ed.plugins.seapine.bookmark);
							ed.plugins.seapine.bookmark = null;
						}
					}
				}
			});

			// Update strings with our own versions.
			tinymce.addI18n('en.table', {
				'desc' : 'Insert Table',
				'delete_col_desc' : 'Remove Column'
			});
			tinymce.addI18n('en.advanced', {
				'fontdefault' : 'Default Font',
				'font_size' : 'Default Size',
				'hr_desc' : 'Insert Horizontal Ruler',
				'link_desc' : 'Insert/Edit Hyperlink',
				'unlink_desc' : 'Remove Hyperlink',
				'numlist_desc' : 'Numbered List',
				'bullist_desc' : 'Bulleted List',
				'removeformat_desc' : 'Clear Formatting',
				'more_colors' : 'More Colors'
			});

			// TODO: Cut,Copy,Paste,PasteText
		},

		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname : 'Seapine plugin',
				author : 'Seapine Software Inc',
				authorurl : 'http://www.seapine.com',
				infourl : 'http://www.seapine.com',
				version : '0.1'
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('seapine', tinymce.plugins.SeapinePlugin);
})();

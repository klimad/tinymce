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
	 * TinyMCE plugin for Seapine specific SproutCore integration.
	 */
	tinymce.create('tinymce.plugins.SeapineSproutCorePlugin', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			// Add spellcheck command.
			ed.addCommand('spSpellCheck', function(ui, value) {
				alert('Not implemented yet');
			});

			// Add spellcheck button.
			ed.addButton('spellcheck', {
				title : 'seapine_sproutcore.spellcheck_desc',
				cmd : 'spSpellCheck',
				ui : true
			});

			// Add paste post processing.
			if (ed.plugins.paste) {
				ed.plugins.paste.onPostProcess.add(function(pl, o) {
					var view = TinySC.Utils.getOwnerView(ed);

					if (view) {
						view.onPaste(ed, o);
					}
				});
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
				longname : 'Seapine SproutCore integration plugin',
				author : 'Seapine Software Inc',
				authorurl : 'http://www.seapine.com',
				infourl : 'http://www.seapine.com',
				version : '0.1'
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('seapine_sproutcore', tinymce.plugins.SeapineSproutCorePlugin);
})();

#!/usr/bin/python

import sys
import os
import re
import shutil

DEBUG = True
DEST = None
THEME = 'advanced'
SKIN = 'default'
LANG = 'en'
PLUGINS = ('paste', 'table', 'autoresize', 'seapine', 'sproutcore')

BASEPATH = os.path.join('..', 'jscripts', 'tiny_mce')
TINYMCE_SRC_NAME = 'tiny_mce_jquery_src.js' if DEBUG else 'tiny_mce_jquery.js'
THEME_SRC_NAME = 'editor_template_src.js' if DEBUG else 'editor_template.js'
PLUGIN_SRC_NAME = 'editor_plugin_src.js' if DEBUG else 'editor_plugin.js'
LANG_SRC_NAME = '{0}.js'.format(LANG)
LANG_DLG_SRC_NAME = '{0}_dlg.js'.format(LANG)

FILES = [{'path': os.path.join(BASEPATH, TINYMCE_SRC_NAME),
          'url': TINYMCE_SRC_NAME,
          'type': 'js'},
         {'path': os.path.join(BASEPATH, 'langs', LANG_SRC_NAME),
          'url': 'langs/{0}'.format(LANG_SRC_NAME),
          'type': 'js'},
         {'path': os.path.join(BASEPATH, 'themes', THEME, THEME_SRC_NAME),
          'url': 'themes/{0}/{1}'.format(THEME, THEME_SRC_NAME),
          'type': 'js'},
         {'path': os.path.join(BASEPATH, 'themes', THEME, 'langs', LANG_SRC_NAME),
          'url': 'themes/{0}/langs/{1}'.format(THEME, LANG_SRC_NAME),
          'type': 'js'},
         {'path': os.path.join(BASEPATH, 'themes', THEME, 'skins', SKIN, 'ui.css'),
          'url': 'themes/{0}/skins/{1}/ui.css'.format(THEME, SKIN),
          'type': 'css'},
         {'path': os.path.join(BASEPATH, 'themes', THEME, 'skins', SKIN, 'content.css'),
          'url': None,
          'type': 'iframe-css'},
         {'path': os.path.join(BASEPATH, 'themes', THEME, 'img'),
          'url': None,
          'type': 'dir-img'},
         {'path': os.path.join(BASEPATH, 'themes', THEME, 'skins', SKIN, 'img'),
          'url': None,
          'type': 'dir-img'}]

for plugin in PLUGINS:
   FILES.append({'path': os.path.join(BASEPATH, 'plugins', plugin, PLUGIN_SRC_NAME),
                 'url': 'plugins/{0}/{1}'.format(plugin, PLUGIN_SRC_NAME),
                 'plugin': plugin,
                 'type': 'js'})
   FILES.append({'path': os.path.join(BASEPATH, 'plugins', plugin, 'langs', LANG_SRC_NAME),
                 'url': 'plugins/{0}/langs/{1}'.format(plugin, LANG_SRC_NAME),
                 'type': 'js'})
   FILES.append({'path': os.path.join(BASEPATH, 'plugins', plugin, 'langs', LANG_DLG_SRC_NAME),
                 'url': 'plugins/{0}/langs/{1}'.format(plugin, LANG_DLG_SRC_NAME),
                 'type': 'js'})
   if plugin in ('seapine', 'sproutcore'):
      FILES.append({'path': os.path.join(BASEPATH, 'plugins', plugin, 'css', '{0}.css'.format(plugin)),
                    'url': 'plugins/{0}/css/{0}.css'.format(plugin),
                    'type': 'css'})
      FILES.append({'path': os.path.join(BASEPATH, 'plugins', plugin, 'img'),
                    'url': None,
                    'type': 'dir-img'})
      if os.path.exists(os.path.join(BASEPATH, 'plugins', plugin, 'css', 'content.css')):
         FILES.append({'path': os.path.join(BASEPATH, 'plugins', plugin, 'css', 'content.css'.format(plugin)),
                       'url': 'plugins/{0}/css/content.css'.format(plugin),
                       'type': 'iframe-css'})

def main():
   if not os.path.isdir(os.path.join(DEST, 'lib')):
      os.mkdir(os.path.join(DEST, 'lib'))
   with open(os.path.join(DEST, 'lib', 'tiny_mce_combined.js'), 'w') as output:
      output.write('window.tinyMCEPreInit = { base: "/tinymce_sproutcore", suffix: "", query: "" };')
      output.write('window.tinyMCEIFrameStyles = window.tinyMCEIFrameStyles || [];')

      for f in FILES:
         if f['type'] == 'js':
            plugin = f['plugin'] if 'plugin' in f else None
            concatJS(f['path'], f['url'], plugin, output)
         elif f['type'] == 'css':
            patchCSSImages(f['path'], f['url'], output)
         elif f['type'] == 'iframe-css':
            concatCSS(f['path'], output)
         elif f['type'] == 'dir-img':
            copyImages(f['path'])

      output.write('tinymce.DOM.files[tinymce.baseURI.toAbsolute("{0}")] = true;'.format('themes/advanced/skins/default/ui.css'))

def concatJS(full_path, url_path, plugin, output):
   try:
      with open(full_path) as f:
         output.write(f.read())
      output.write('tinymce.ScriptLoader.markDone(tinymce.baseURI.toAbsolute("{0}"));'.format(url_path))
      if plugin is not None:
         output.write('tinymce.PluginManager.urls["{0}"] = "tinymce/plugins/{0}";'.format(plugin))
   except IOError:
      pass

def patchCSSImages(full_path, url_path, output):
   try:
      if not os.path.isdir(os.path.join(DEST, 'resources', 'stylesheet', 'tinymce')):
         os.mkdir(os.path.join(DEST, 'resources', 'stylesheet', 'tinymce'))
      with open(full_path) as f, open(os.path.join(DEST, 'resources', 'stylesheet', 'tinymce', os.path.basename(full_path)), 'w') as w:
         for line in f:
            w.write(re.sub(r'url\(.*/(.*)\)', r"sc_static('\1')", line))
      output.write('tinymce.DOM.files[tinymce.baseURI.toAbsolute("{0}")] = true;'.format(url_path))
   except IOError:
      pass

def concatCSS(full_path, output):
   try:
      with open(full_path) as f:
         output.write('window.tinyMCEIFrameStyles[window.tinyMCEIFrameStyles.length]="')
         for line in f:
            line = re.sub(r'url\(.*/(.*)\)', r"sc_static('\1')", line).rstrip()
            output.write(line)
         output.write('";')
   except IOError:
      pass

def copyImages(full_path):
   images_dir = os.path.join(DEST, 'resources', 'images')
   try:
      if not os.path.isdir(images_dir):
         os.mkdir(images_dir)
      files = os.listdir(full_path)
      for f in files:
         shutil.copy(os.path.join(full_path, f), os.path.join(DEST, 'resources', 'images'))
   except OSError:
      pass

if __name__ == '__main__':
   if len(sys.argv) > 1:
      DEST = sys.argv[1]
      main()
   else:
      print('failed')


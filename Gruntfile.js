module.exports = function( grunt ) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON( 'package.json' ),

    // hint all the things
    jshint: {
      options: {
        'globals': {
          'module': false
        },
        'bitwise': true,
        'browser': true,
        'curly': true,
        'eqeqeq': true,
        'freeze': true,
        'immed': true,
        'indent': 2,
        'latedef': true,
        'node': true,
        'newcap': true,
        'noempty': true,
        'quotmark': 'single',
        'trailing': true,
        'undef': true,
        'unused': 'vars',
        ignores: [
          '**/*.min.js'
        ],
      },
      files: [
        'Gruntfile.js',
        '*.js',
        'bin/**/*.js',
        'bin/**/get*',
        'lib/**/*.js',
        'public/core/js/**/*.js',
        'public/theme/js/**/*.js'
      ]
    },

    // compress + concat js
    uglify: {
      dev: {
        options: {
          sourceMap: true,
          sourceMapName: 'public/core/js/core.min.map',
          mangle: false,
          compress: false,
          beautify: true
        },
        files: {
          'public/core/js/core.min.js': [
            // setup scripts / custom libs
            'public/core/js/dataStore.js',
            'public/core/js/sync.js',
            'public/core/js/nunjucksEnv.js',
            // routes
            'public/core/js/routes/index.js',
            'public/core/js/routes/*',
            // session tracking
            'public/core/js/sessionTracking.js',
            // tying it all together
            'public/core/js/app.js'
          ],
          'public/theme/js/app.min.js': [
            'public/theme/js/*.js',
            '!public/theme/js/app.min.js'
          ]
        }
      },
      prod: {
        options: {
          sourceMap: true,
          compress: {
            drop_console: true
          },
          mangle: {
            except: [ 'nunjucks', 'dataStore' ]
          }
        },
        files: {
          'public/core/js/core.min.js': [
            // setup scripts / custom libs
            'public/core/js/dataStore.js',
            'public/core/js/sync.js',
            'public/core/js/nunjucksEnv.js',
            // routes
            'public/core/js/routes/index.js',
            'public/core/js/routes/*',
            // session tracking
            'public/core/js/sessionTracking.js',
            // tying it all together
            'public/core/js/app.js'
          ],
          'public/theme/js/app.min.js': [
            'public/theme/js/*.js',
            '!public/theme/js/app.min.js'
          ]
        }
      }
    },

    // compile less
    less: {
      dev: {
        files: {
          'public/core/css/core.min.css': 'public/core/less/core.less',
          'public/theme/css/main.min.css': 'public/theme/less/main.less'
        }
      },
      prod: {
        options: {
          cleancss: true,
          sourceMap: true
        },
        files: {
          'public/core/css/core.min.css': 'public/core/less/core.less',
          'public/theme/css/main.min.css': 'public/theme/less/main.less'
        }
      }
    },

    // precompile nunjucks partials
    nunjucks: {
      precompile: {
        baseDir: 'views/partials',
        src: 'views/partials/*',
        dest: 'public/theme/partials.js'
      }
    },

    // run server in dev enviroment
    express: {
      dev: {
        options: {
          script: './server.js',
          args: [ '--debug' ],
          node_env: 'development',
          port: 5000
        }
      }
    },

    // running `grunt watch` will watch for changes
    watch: {
      files: [
        '*.js',
        '*/**.js',
        'bin/**/get*',
        'local.json',
        'public/core/less/*.less',
        'public/core/js/**/*.js',
        'public/theme/less/*.less',
        'public/theme/js/**/*.js',
        'views/partials/*'
      ],
      tasks: [ 'jshint', 'less:dev', 'uglify:dev', 'nunjucks', 'express:dev' ],
      express: {
        files: [ '*.js', '*/**.js', 'local.json' ],
        tasks:  [ 'express:dev' ],
        options: {
          spawn: false
        }
      }
    },

    // bump version number
    bump: {
      options: {
        files: [ 'package.json', 'bower.json' ],
        commit: true,
        commitMessage: 'version bump to v%VERSION%',
        commitFiles: [ 'package.json', 'bower.json' ],
        createTag: true,
        tagName: 'v%VERSION%',
        push: false
      }
    }
  });

  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-contrib-less' );
  grunt.loadNpmTasks( 'grunt-nunjucks' );
  grunt.loadNpmTasks( 'grunt-express-server' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-bump' );

  grunt.registerTask( 'default', [ 'jshint', 'less:dev', 'uglify:dev', 'nunjucks', 'express:dev', 'watch' ] );
  grunt.registerTask( 'test', [ 'jshint' ] );
  grunt.registerTask( 'build', [  'less:prod', 'uglify:prod', 'nunjucks' ] );
};

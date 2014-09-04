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
        'unused': 'vars'
      },
      files: [
        'Gruntfile.js',
        '*.js',
        'bin/**/*.js',
        'bin/**/get*',
        'lib/**/*.js'
      ]
    },

    // compile less
    // compile styles
    less: {
      dev: {
        files: {
          'public/core/css/core.min.css': 'public/core/less/core.less'
        }
      },
      prod: {
        options: {
          cleancss: true,
          sourceMap: true
        },
        files: {
          'public/core/css/core.min.css': 'public/asset/less/core.less'
        }
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
        'public/core/less/**.less'
      ],
      tasks: [ 'jshint', 'less:dev', 'express:dev' ],
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
  grunt.loadNpmTasks( 'grunt-contrib-less' );
  grunt.loadNpmTasks( 'grunt-express-server' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-bump' );

  grunt.registerTask( 'default', [ 'jshint', 'less:dev', 'express:dev', 'watch' ] );
  grunt.registerTask( 'test', [ 'jshint' ] );
};

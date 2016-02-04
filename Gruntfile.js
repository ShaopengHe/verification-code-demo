module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsonlint: {
      src: ['*.json']
    },
    jscs: {
      src: ['*.js', '**/*.js'],
      options: {
        config: '.jscs.json',
        excludeFiles: ['node_modules/**']
      }
    },
    jshint: {
      options: {
        jshintrc: true,
        ignores: ['node_modules/**']
      },
      src: {
        files: {
          src: [
            '*.js', '**.js', '**/*.js'
          ]
        }
      }
    },
    mochaTest: {
      options: {
        reporter: 'spec',
        clearRequireCache: true
      },
      test: {
        src: ['test/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-jsonlint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', [
    'jsonlint',
    'jscs',
    'jshint:src',
    'mochaTest:test'
  ]);
};

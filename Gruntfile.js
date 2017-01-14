// Based on http://mattwatson.codes/compile-scss-javascript-grunt/

(function () {
   'use strict';
}());

var util = require('util');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['**/*.css'],
          dest: 'build/css',
          ext: '.min.css'
        }]
      }
    },

    concat: {
      options: {
        separator: '\n'
      },
      dist: {
        src: [
          'src/js/mod.js',
          'src/js/modules/*.js',
          'src/js/animate/*.js',
          'src/js/animate.js'
        ],
        dest: 'build/js/animate.js'
      }
    },

    uglify: {
      dist: {
        files: {
          'build/js/ext/html2canvas.min.js': ['src/js/ext/html2canvas.js']
        }
      }
    },

    replace: {
      dist: {
        files: [{
          expand: true,
          flatten: true,
          src: ['build/js/animate.js'],
          dest: 'build/js'
        }],
        options: {
          patterns: [{
            match: 'animateCSS',
            replacement: function() {
              return util.inspect(grunt.file.read('build/css/ext/animate.min.css'));
            }
          }, {
            match: 'html2canvasJS',
            replacement: function() {
              return util.inspect(grunt.file.read('build/js/ext/html2canvas.min.js'));
            }
          }, {
            match: 'elementsCSS',
            replacement: function() {
              return util.inspect(grunt.file.read('build/css/animate/elements.min.css'));
            }
          }, {
            match: 'pagesCSS',
            replacement: function() {
              return util.inspect(grunt.file.read('build/css/animate/pages.min.css'));
            }
          }]
        }
      }
    },

    watch: {
      files: ['Gruntfile.js', 'src/js/**/*.js', 'src/css/**/*.css'],
      tasks: ['cssmin', 'concat', 'uglify', 'replace']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['cssmin', 'concat', 'uglify', 'replace', 'watch']);

};

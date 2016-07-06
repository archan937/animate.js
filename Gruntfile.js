// Based on http://mattwatson.codes/compile-scss-javascript-grunt/

(function () {
   'use strict';
}());

var util = require('util');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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
        dest: 'src/animate.js'
      }
    },

    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['**/*.css'],
          dest: 'build',
          ext: '.min.css'
        }]
      }
    },

    uglify: {
      dist: {
        files: {
          'build/ext/html2canvas.min.js': ['src/js/ext/html2canvas.js']
        }
      }
    },

    replace: {
      dist: {
        options: {
          patterns: [{
            match: 'animateCSS',
            replacement: util.inspect(grunt.file.read('build/ext/animate.min.css'))
          }, {
            match: 'html2canvasJS',
            replacement: util.inspect(grunt.file.read('build/ext/html2canvas.min.js'))
          }, {
            match: 'elementsCSS',
            replacement: util.inspect(grunt.file.read('build/animate/elements.min.css'))
          }, {
            match: 'pagesCSS',
            replacement: util.inspect(grunt.file.read('build/animate/pages.min.css'))
          }]
        },
        files: [{
          expand: true,
          flatten: true,
          src: ['src/animate.js'],
          dest: 'src/'
        }]
      }
    },

    watch: {
      files: ['Gruntfile.js', 'src/js/**/*.js', 'src/css/**/*.css'],
      tasks: ['concat', 'cssmin', 'uglify', 'replace']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['concat', 'cssmin', 'uglify', 'replace', 'watch']);

};

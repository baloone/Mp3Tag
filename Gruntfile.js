module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      build: {
        src: 'FID3.js',
        dest: 'docs/FID3.min.js'
      }
    },
    watch: {
        files: ['FID3.js'],
        tasks: ['uglify']
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['uglify']);
};
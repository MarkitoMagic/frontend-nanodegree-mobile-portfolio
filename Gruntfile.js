module.exports = function(grunt) {
    /*
     * This is a technique to simplify the readability of the grunt file
     * by specifying the configuration in small segments and constructing
     * the config object and passing it to the initConfig function. In the long run
     * this is will make extending the configuration easier.
     */
    var config = {};

    // HTML minification
    config.htmlmin = {
        dist: {
            options: {
                removeComments: true,
                collapseWhitespace: true
          },
          files: {
            'dist/index.html': 'dist/index.html'
          }
        }
    };

    // JS minification
    config.uglify = {
        dist: {
            files: {
                'dist/js/loadfont.js': 'js/loadfont.js',
                'dist/js/perfmatters.js': 'js/perfmatters.js',
                'dist/js/sendanalytics.js': 'js/sendanalytics.js'
            }
        }
    };

    // Config copy (for non minified resources)
    config.copy = {
        dist: {
            files: [
                {
                    expand: true,
                    src: ['img/*'],
                    dest: 'dist/'
                },
                {
                    expand: true,
                    src: ['views/**'],
                    dest: 'dist/'
                },
                {
                    src: ['favicon.ico'],
                    dest: 'dist/'
                }
            ]
        }
    };

    // CSS minification
    config.cssmin = {
        dist: {
            files: [
                {
                    expand: true,
                    src: ['css/*.css'],
                    dest: 'dist/',
                    ext: '.css'
                }
            ]
        }
    };

    // Clean task
    config.clean = {
        dist: {
            src: ['dist']
        }
    };

    // Inlines the critical path css as marked by the annotation in the src file
    config.inline = {
        dist: {
            options:{
                cssmin: true
            },
            src: 'index.html',
            dest: 'dist/index.html'
        }
    };

    // Web server for development
    config.connect = {
        server: {
            options: {
                port: 8081,
                base: 'dist',
                keepalive: true
            }
        }
    };

    // Initialize the grunt configuration
    grunt.initConfig(config);

    // Load the grunt tasks
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-inline');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // Register the tasks for the grunt fule
    grunt.registerTask('default', []);
    grunt.registerTask('dist', ['clean:dist', 'inline:dist', 'htmlmin:dist', 'uglify:dist', 'copy:dist', 'cssmin:dist', 'connect']);
};

module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.loadNpmTasks('grunt-zip');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: [
                '/**',
                ' * <%= pkg.description %>',
                ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>' +
                ' * @link <%= pkg.homepage %>',
                ' * @author <%= pkg.author %>',
                ' * @license MIT License, http://www.opensource.org/licenses/MIT',
                ' */'
            ].join('\n')
        },
        dirs: {
            dest: 'dist'
        },
        concat: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                src: [
                    'src/js-hyphen.js',
                    'src/js-hyphen-api.js',
                    'src/js-hyphen-api-call-factory.js',
                    'src/js-hyphen-base-model.js',
                    'src/js-hyphen-cache.js',
                    'src/js-hyphen-data-provider.js',
                    'src/js-hyphen-http.js',
                    'src/es-6.js',
                ],
                dest: '<%= dirs.dest %>/<%= pkg.name %>.js'
            }
        },
        zip: {
            '<%= dirs.dest %>/hyphen-js.zip': [
                '<%= dirs.dest %>/<%= pkg.name %>.js',
                '<%= dirs.dest %>/<%= pkg.name %>.min.js'
            ]
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                src: ['<%= concat.dist.dest %>'],
                dest: '<%= dirs.dest %>/<%= pkg.name %>.min.js'
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'src/*.js'],
            options: {
                jshintrc: true
            }
        },
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            build: {
                singleRun: true,
                autoWatch: false
            },
            debug: {
                singleRun: false,
                autoWatch: true,
                browsers: ['Safari']
            },
            dev: {
                autoWatch: true
            }
        },
        changelog: {
            options: {
                dest: 'CHANGELOG.md'
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['bump', 'build']);

    // Build task.
    grunt.registerTask('build', ['karma:build', 'concat', 'zip']);

    // Provides the "bump" task.
    grunt.registerTask('bump', 'Increment version number', function () {
        var versionType = grunt.option('type');

        function bumpVersion(version, versionType) {
            var type = {patch: 2, minor: 1, major: 0},
                parts = version.split('.'),
                idx = type[versionType || 'patch'];
            parts[idx] = parseInt(parts[idx], 10) + 1;
            while (++idx < parts.length) {
                parts[idx] = 0;
            }
            return parts.join('.');
        }

        var version;

        function updateFile(file) {
            var json = grunt.file.readJSON(file);
            version = json.version = bumpVersion(json.version, versionType || 'patch');
            grunt.file.write(file, JSON.stringify(json, null, '  '));
        }

        updateFile('package.json');
        // updateFile('bower.json');
        grunt.log.write('Version bumped to ' + version);
    });

};
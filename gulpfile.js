'use strict';

var argv = require('yargs').argv,   // Pass agruments using the command line
    autoprefixer = require('gulp-autoprefixer'),    // Add vendor prefixes to CSS
    browserSync = require('browser-sync').create(),     // Automatically refresh the browser
    concat = require('gulp-concat'),    // Combine JavaScript simple JavasScript files
    del = require('del'),   // Delete unwanted files and folders (eg dist before production build)
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    gutil = require( 'gulp-util' ),
    imagemin = require('gulp-imagemin'),    // Optimise images
    jsList,   // List of JavaScripts to combine (deprecated)
    minifyCss = require('gulp-minify-css'),     // Minify CSS
    paths,  // Frequently used file paths
    pipe = require('multipipe'),    // Used in conjuction with gulp-if to perform multiple conditional transformations
    rev = require('gulp-rev'),      // Add a hash-based fingerprint to the output filename
    sass = require('gulp-sass'),    // Compile CSS from Sass/sass
    uglify = require('gulp-uglify');    // Mangle and compress JavaScript


// Set the commonly used folder paths

(function () {

    // Set the variables for the root folders

    var dest = argv.production ? "./dist/" : "./temp/",    // Use the dist folder for a "production" build or the temp folder for all other builds
        src = "./";


    // Set paths as an object

    paths = {};


    // Create the dest object

    paths.dest = {};
    
    paths.dest.root = dest;

    paths.dest.images = dest + "images/";

    paths.dest.js = dest + "js/";

    paths.dest.css = dest + "css/"


    // Create the source object

    paths.src = {};
    
    paths.src.root = src;

    paths.src.images = src + "images/";

    paths.src.includes = src + "includes/";

    paths.src.js = src + "js/";

    paths.src.sass = src + "sass/"
    
}());


// Define JavaScript bundles

/**
 * Note: this method is deprecated. User Browserify for all new script bundles.
 **/

jsList = [
    {
        source: [
            paths.src.includes + "fancybox/source/jquery.fancybox.js",
            paths.src.includes + "fancybox/source/helpers/jquery.fancybox-thumbs.js"
        ],
        destination: paths.dest.js,
        filename: "fancybox.custom.js"
    },
    {
        source: [
            paths.src.js + "alpha/alpha.prepare.js",
            paths.src.includes + "modernizr/modernizr.custom.45448.js"
        ],
        destination: paths.dest.js + "/alpha/",
        filename: "alpha.prepare.js"
    },
    {
        source: [
            paths.src.js + "beta/good-living/prepare.js",
            paths.src.includes + "modernizr/modernizr.custom.45448.js"
        ],
        destination: paths.dest.js + "/beta/good-living/",
        filename: "prepare.js"
    },
    {
        source: [
            paths.src.includes + "jquery/jquery.mobile.custom.1409290931.js",
            paths.src.js + "beta/good-living/enhance.js"
        ],
        destination: paths.dest.js + "/beta/good-living/",
        filename: "enhance.js"
    }
];





// Remove destination folder in production mode

gulp.task('clean', function () {
    
    if (argv.production) {

        del.sync([paths.dest.root]);

    }

});





// Optimise images

gulp.task('imagemin', function () {

    return gulp.src(paths.src.images + '*')
        .pipe(imagemin({
            multipass: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}]
        }))
        .pipe(gulp.dest(paths.dest.images))
        .pipe(browserSync.stream());
});

gulp.task('imagemin:watch', function () {
    gulp.watch(paths.src.images + '*', ['imagemin']);   // TODO consider changing to gulp-watch so only changed files are processed
});





// Concatenate JavaScript

/**
 * Note: this method is deprecated. User Browserify for all new script bundles.
 **/

gulp.task('js-concat', function () {

    // Loop through each bundle.

    jsList.forEach(function (bundle) {

        return gulp.src(bundle.source)
            .pipe(concat(bundle.filename))
            .pipe(gulpif(argv.production, pipe(uglify(), rev())))    // Uglify and fingerprint if in production mode
            .pipe(gulp.dest(bundle.destination))
            .pipe(browserSync.stream());

    });

});

gulp.task('js-concat:watch', function () {
    gulp.watch(paths.src.js + '**/*.js', ['js-bundle']);
});





// Compile CSS from Sass/sass

gulp.task('sass', function () {

    gulp.src(paths.src.sass + '**/*.scss')
        .pipe(sass({includePaths: ['./', './node_modules', '../']})
            .on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: [
                "Android 2.3",
                "Android >= 4",
                "Chrome >= 20",
                "Firefox >= 24",
                "Explorer >= 8",
                "iOS >= 6",
                "Opera >= 12",
                "Safari >= 6"
            ]
        }))
        .pipe(gulpif(argv.production, pipe(minifyCss({
            compatibility: 'ie7,' +
                '-units.ch,' +
                '-units.in,' +
                '-units.pc,' +
                '-units.pt,' +
                '-units.rem,' +
                '-units.vh,' +
                '-units.vm,' +
                '-units.vmax,' +
                '-units.vmin'
        }), rev())))  // Minify and fingerprint if in production mode
        .pipe(gulp.dest(paths.dest.css))
        .pipe(browserSync.stream());

});

gulp.task('sass:watch', function () {
    gulp.watch(paths.src.sass + '**/*.scss', ['sass']);     // TODO consider changing to gulp-watch so new files are detected
});





// Serve local files using browserSync

gulp.task('serve', function() {

    browserSync.init({
        server: paths.dest.root
    });

    gulp.watch('./*.html').on('change', browserSync.reload);
});


// Run all build tasks (once)

gulp.task('build', ['clean','imagemin','js-concat','sass']);


// Run all watch tasks

gulp.task('build:watch', ['imagemin:watch','js-concat:watch','sass:watch']);


// Build, serve and watch

gulp.task('default', ['build','serve','build:watch']);

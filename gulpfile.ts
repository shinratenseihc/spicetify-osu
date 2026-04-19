import gulp from "gulp"
import bro from "gulp-bro"
import rename from "gulp-rename"
import { BrowserifyObject } from "browserify"

const globals = {
	"react": "Spicetify.React",
	"react-dom": "Spicetify.ReactDOM",
}

function tsifyBabelify(b: BrowserifyObject, opts: { debug: boolean }) {
	b.plugin("tsify")
	b.transform("babelify", {
		presets: ["@babel/preset-typescript", "@babel/preset-react"],
		extensions: [".ts", ".tsx"],
		sourceMaps: opts.debug,
	})
}

const SPICETIFY_EXT = "C:/Users/badlx/AppData/Roaming/spicetify/Extensions"

function js(debug?: boolean) {
	return gulp
		.src("src/main.tsx")
		.pipe(bro({
			debug,
			plugin: [[tsifyBabelify, { debug }]],
			external: Object.keys(globals),
		}))
		.pipe(rename({ basename: "spicetify-osu", extname: ".js" }))
		.pipe(gulp.dest("dist/"))
		.pipe(gulp.dest(SPICETIFY_EXT))
}

gulp.task("js", () => js(false))
gulp.task("js:dev", () => js(true))
gulp.task("build", gulp.series("js"))
gulp.task("watch", () => gulp.watch(["src/**/*.ts", "src/**/*.tsx"], gulp.task("js:dev")))

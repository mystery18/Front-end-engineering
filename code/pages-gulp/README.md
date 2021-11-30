### Gulp 文件操作 API

相比于底层node的API，Gulp 的API更强大也更容易使用，至于负责文件加工的转换流，绝大多数情况我们都是**<u>通过独立的插件来提供</u>**。这样的话，我们在实际去通过 gulp 创建构建任务时的流程就是先通过 src 方法去创建一个读取流，然后再借助于插件提供的转换流来实现文件加工，最后再通过 gulp 提供的 dest 方法去创建一个写入流，从而写入到目标文件。

在默认任务中通过src方法去创建一个文件的读取流(文件路径)，通过pipe方式导出到dest所创建的写入流中，dest 方法只需要去指定一个写入目标目录就可以，这里是dist目录，最后需要return方式将这个创建的读取流return出去。这样gulp就可以控制我们任务完成，回到命令行去尝试运行。然后运行 `yarn gulp`。

```js
// 通过require的方式去载入gulp模块提供的src方法和dist方法
const { src, dest } = require('gulp')

exports.default = () => {
    return src('src/normalize.css') // 可以是*.css 意味着src目录下所有css文件也会被复制到dist目录
    	.pipe(dest('dist'))
}
```



那相比于原始的API，gulp模块所提供的API要更为强大些，因为我们可以在这使用通配符的方式去匹配批量文件。当然构建的过程最重要的是文件的转换，这里如果需要去完成文件的压缩转换，可以去安装一个叫做 gulp-clean-css 这样的插件，这个插件提供了压缩css代码的转换流 （`yarn add gulp-clean-css --dev`）。有了这个插件之后就可以在dest之前，先去pipe到我们cleanCss所提供的转换流中，这样他就会先经过转换，最后再被写入到写入流中，执行命令就是压缩过的css了。

```js
const { src, dest } = require('gulp')
const cleanCss = require('gulp-clean-css')

exports.default = () => {
    return src('src/*.css')
    	.pipe(cleanCss())
    	.pipe(dest('dist'))
}
```

如果还需要在这个过程执行多个转换的话可以继续在中间去添加额外的pipe操作，例如添加 gulp-rename 插件，在 cleanCss过后接着去 pipe 到 rename 的转换流当中，rename 可以指定一个 extname 的参数，用于指定我们重命名的扩展名为 .min.css。

```js
const { src, dest } = require('gulp')
const cleanCss = require('gulp-clean-css')
const rename = require('gulp-rename')

exports.default = () => {
    return src('src/*.css')
    	.pipe(cleanCss())
    	.pipe(rename({ extname: 'min.css' }))
    	.pipe(dest('dist'))
}
```



------

### Gulp 案例 - 样式编译

看看如何使用 gulp 去完成一个网页应用的自动化构建工作流。所有的构建需求都需要在 gulpfile.js 中完成。

```bash
yarn add gulp --dev 
# 安装完之后就可以在根目录下新建一个 gulpfile.js 作为我们gulp的入口，需要在里面定义一些构建任务
```

定义style任务，先定义成私有的任务即私有函数，后续再通过 module.export 去选择性导出哪些函数。过程中肯定需要用到 gulp 所提供的API，先把他们导入。这里的style是私有任务，并不能通过gulp去执行。要测试的话要把它导出出去。然后再 `yarn gulp style` 执行style任务。

```js
const { src, dest } = require('gulp')
const style = () => {
    return src('src/assets/styles/*.scss')
    	.pipe(dest('dist'))
}
// 导出一个对象，对象中所有的成员都可以在外界被使用，跟我们用export导出实际上是一样的。
module.exports = {
    style
}
```



但是这不是我们想要的，因为我们想输出的也是原来的src目录结构输出，此时只是弄完之后直接丢进 dist 而已。这个问题可以通过 src 去指定一个选项参数叫 base，就是我们在转换的基准路径是什么，那基准路径是 src，此时就会把 src 后面一系列目录结构都保留下来，保存一下再执行`yarn gulp style`。

```js
const { src, dest } = require('gulp')
const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(dest('dist'))
}

module.exports = {
    style
}
```

但还差一点，没有加上文件的转换（只是文件复制过去了个scss文件），按照之前转换需要插件提供的一些转换流来实现，所以要再安装一个插件（`yarn add gulp-sass --dev`）。安装这个的时候它内部会安装node-sass，而 node-sass 是一个C++的模块，会对C++程序集的依赖，这些二进制的包需要去通过国外站点下载有时候会下载不了，可以通过淘宝的镜像源单独为node-sass配置一个镜像，所以我不知道提这个事情对我们有什么影响  =。 =。

这里安装完成过后就可以使用插件了，引入后可以在 src 和 dest 之间需要去 pipe 到我们的 sass，**<u>基本上每一个插件提供的都是一个函数，这个函数的调用结果会返回一个文件的转换流</u>**，这样的话我们就可以去实现文件的转换过程，再去运行（`yarn gulp style`）。

```js
const { src, dest } = require('gulp')
const sass = require('gulp-sass') // 引入
const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(sass({ outputStyle: 'expanded' }))
    	.pipe(dest('dist'))
}

module.exports = {
    style
}
```

有个问题，原来那里有3个 scss 文件，最后在输出只有1个css文件，原因是我们在 sass 模块工作的时候<u>他会认为这种下划线开头的样式文件都是我们主文件中依赖的一些文件，他就不会被转换</u>，会被忽略掉，所以最终只有没有下划线开头的 scss 文件会被转换过去。

有个细节就是它输出的 css 文件里 结束的 } 会在最后一个属性后面，我们一般是放在空行里。可以通过给 sass 指定一个选项去完成，就是上面改成 `pipe(sass({ outputStyle: 'expanded' }))`的完全展开形式，再执行后就会按照完全展开的形式生成样式代码。（但是我觉得没必要，因为最后打包我是想把空格的去掉）。

------



### Gulp 案例 - 脚本编译

中间还是要一个转换流插件，需要单独安装（`yarn add gulp-babel --dev`），载入后在 dest 之前 pipe 到 babel 插件中，然后临时导出出去，为什么说临时呢，因为这些任务后面会通过 series 和 parallel 这两个方法去变成一些组合的任务，不会单独去执行，所以现在先把他们定义成私有的任务，临时导出只是为了测试而已。

oh no，因为这里用的是babel去转换，而babel这个插件它只是帮你去唤醒 babel/core 里面的转换过程，他没有像刚刚这个 gulp-sass 自动去帮你安装 node-sass 核心转换模块，这里的转换模块需要你手动去装才行（yarn add @babel/core @babel/preset-env --dev），env这个模块默认会把你全部的ES6或者所有新特性都会给你转换，此时就可以回到 babel 配置中去添加 preset 的配置。再去执行 script 任务就OK啦。

```js
const { src, dest } = require('gulp')
const sass = require('gulp-sass') 
const babel = require('gulp-babel') 

const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(sass())
    	.pipe(dest('dist'))
}

// babel记得传对象。babel默认只是ECMAScript的转换平台，提供一个环境给你，具体去做转换的实际上是babel里面它内部的插件。而preset就是一些插件的集合。
const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
    	.pipe(babel({ presets: ['@babel/preset-env'] }))
    	.pipe(dest('dist'))
}

module.exports = {
    style,
    script
}
```



------



### Gulp 案例 - 页面模板编译

`'src/**/*.html'`，代表src下面任意子目录下的html文件

```js
// yarn add gulp-swig --dev
const { src, dest } = require('gulp')
const sass = require('gulp-sass') 
const babel = require('gulp-babel')
const swig = require('gulp-swig')

const data = {
    menus: [],
    pkg: require('./package.json'),
    date: new.Date()
}

const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(sass())
    	.pipe(dest('dist'))
}
const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
    	.pipe(babel({ presets: ['@babel/preset-env'] }))
    	.pipe(dest('dist'))
}

const page = () => {
    return src('src/*.html', { base: 'src' })
    	.pipe(swig({ data })) // 本来是 data: data  用ES6语法简写
    	.pipe(dest('dist'))
}

module.exports = {
    style,
    script,
    page
}
```



创建一个组合任务把他们3者组合到一块，因为这三个任务他们可以 一旦要去运行的话不可能单独去运行某一个，一般都是同时运行。所以单独创建一个 compile 的编译任务组合任务。三个任务没有任何的牵连，所以说我们可以让这3个任务同时开始执行，这样可以提高我们构建的效率，那就应该使用 parallel。

```js
const { src, dest, parallel } = require('gulp')
const sass = require('gulp-sass') 
const babel = require('gulp-babel')
const swig = require('gulp-swig')

const data = {
    menus: [],
    pkg: require('./package.json'),
    date: new.Date()
}

const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(sass())
    	.pipe(dest('dist'))
}
const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
    	.pipe(babel({ presets: ['@babel/preset-env'] }))
    	.pipe(dest('dist'))
}

const page = () => {
    return src('src/*.html', { base: 'src' })
    	.pipe(swig({ data })) // 本来是 data: data  用ES6语法简写
    	.pipe(dest('dist'))
}

const compile = parallel(style, script, page) 
// 此时只需要导出一个compile任务 yarn gulp compile
module.exports = {
    compile
}
```

------



### Gulp 案例 - 图片和字体文件转换

图片转换：需要把图片全部读取出来然后借助插件（`yarn add gulp-imagemin --dev`）完成压缩，这个插件内部依赖的模块也是一些通过一些C++完成的模块，所以涉及到需要下载二进制的程序集，这些程序集大部分是在github下载，国内去下载github资源会相对容易出问题。字体文件：把它拷贝一下就行了。运行一下发现只压缩了1张图片，原因是其他格式是不支持压缩的。

全部放到 compile 中

```js
const { src, dest, parallel } = require('gulp')
const sass = require('gulp-sass') 
const babel = require('gulp-babel')
const swig = require('gulp-swig')
const imagemin = require('gulp-imagemin')

const data = {
    menus: [],
    pkg: require('./package.json'),
    date: new.Date()
}

const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(sass())
    	.pipe(dest('dist'))
}
const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
    	.pipe(babel({ presets: ['@babel/preset-env'] }))
    	.pipe(dest('dist'))
}

const page = () => {
    return src('src/*.html', { base: 'src' })
    	.pipe(swig({ data })) // 本来是 data: data  用ES6语法简写
    	.pipe(dest('dist'))
}
const font = () => {
    return src('src/assets/images/**', { base: 'src' }) // 两个星号通配下面所有文件
    	.pipe(imagemin())
    	.pipe(dest('dist'))
}
const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
    	.pipe(imagemin())
    	.pipe(dest('dist'))
}

const compile = parallel(style, script, page, image, font) 
// 此时只需要导出一个compile任务 yarn gulp compile
module.exports = {
    compile
}
```

------



### Gulp 案例 - 其他文件及清除

把public文件目录中的文件再去做一个拷贝，这个是额外拷贝的任务，个人觉得 compile 定义是编译 src 下面的文件，也放进去的话容易混淆，所以单独添加一个新的任务叫 build，它通过 parallel 去执行compile，就是组合的基础上又组合一次。

```js
// 这里先不写上面的那些。就是额外的一些文件 拷贝过去就可以了
const extra = () => {
    return src('public/**', { base: 'public' })
    	.pipe(dest('dist'))
}

const compile = parallel(style, script, page, image, font) 
const build = parallel(compile, extra)
module.exports = {
    compile, // 如果你想在外面单独使用compile，也可以把它单独导出去，也可以不用。
    build
}
```

此外再做一些开发体验的增强，如集成一个web服务器进来，让我们可以有一个开发测试的服务器。

做这个之前先做一个自动清除dist目录下的文件（`yarn add del --dev`），这个模块不是 gulp 的插件，只不过是在 gulp 中可以使用，因为之前使用 gulp 定义任务时，gulp 的任务并不一定说必须要通过 src 去找文件流最终 pipe 到 dist 中，不一定是这样的。这个 del 可以帮我们删除指定的文件，而且他是一个promise方法，那 gulp 任务支持 promise 模式的，所以可以定义一个 clean 任务。

这个 del 方法返回的是promise，意味着我们在 delete 完成过后可以去标记这个 clean 任务执行完成，放在build之前。给这个build任务再去包装一下，要引进series了因为这个任务就不能跟其他任务同时执行了。因为他需要先删除dist目录下的文件然后再生成，不然就会出现生成的文件被删除。

```js
const { src, dest, parallel, series } = require('gulp')
// 不是gulp的模块 可以在放前面导
const del = require('del')
const clean = () => {
    // 指定一个数组，这个数组可以放任意文件路径
    return del(['dist'])
}

const compile = parallel(style, script, page, image, font) 
const build = series(clean, parallel(compile, extra)) // 这样的话build先去clean
module.exports = {
    compile,
    build
}
```

------



### Gulp 案例 - 自动加载插件

随着构建任务越来越复杂，使用到的插件也越来越多，如果都用手动的方式去载入插件的话require操作会很多，可以通过一个插件解决这个问题（`yarn add gulp-load-plugins --dev`）。

pulgins是一个对象，你所有的插件都会成为这个对象下面的属性，那命名的方式就是把 gulp- 给它删除掉，如果说你的插件名字是 gulp- 后面是还有-（xxx-xxx），那就会用驼峰命名大写字母。然后把所有的都重命名过去 全部改成 plugin.xxx 。

如下：执行 `yarn gulp build`

```js
const { src, dest, parallel, series } = require('gulp')
const del = require('del')
// 自动加载所有plugins
const loadPlugins = require('gulp-load-plugins') //导出的是方法
const plugins = loadPlugins()

const data = {
    menus: [],
    pkg: require('./package.json'),
    date: new.Date()
}

const clean = () => {
    return del(['dist'])
}

const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(plugins.sass({ outputStyle: 'expanded' }))
    	.pipe(dest('dist'))
}
const script = () => {
    return src('src/assets/scripts/*.js', { base: 'src' })
    	.pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
    	.pipe(dest('dist'))
}

const page = () => {
    return src('src/*.html', { base: 'src' })
    	.pipe(plugins.swig({ data })) // 本来是 data: data  用ES6语法简写
    	.pipe(dest('dist'))
}
const font = () => {
    return src('src/assets/images/**', { base: 'src' }) // 两个星号通配下面所有文件
    	.pipe(plugins.imagemin())
    	.pipe(dest('dist'))
}
const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
    	.pipe(imagemin())
    	.pipe(dest('dist'))
}

const compile = parallel(style, script, page, image, font) 
const build = series(clean, parallel(compile, extra))
module.exports = {
    compile,
    build
}
```

------



### Gulp 案例 - 开发服务器

除了对文件的构建操作以外，还需要一个开发服务器，用于去开**<u>发阶段调试我们的应用</u>**，可以通过 gulp 启动并且管理这个开发服务器，这样的话就可以在后续去配合我们其他的一些构建任务，去实现在代码修改过后自动去编译并且自动去刷新浏览器页面，这样就会大大提高我们在开发阶段的效率，因为他会减少我们在开发阶段的重复操作。

（`yarn add browser-sync --dev`）这个模块会提供给我们一个开发服务器，相对于我们普通使用 express 创建的web服务器来说，这个有更强大的功能，它支持我们在代码修改过后自动热更新到浏览器中，可以及时看到最新的页面效果，在 gulp 中使用这个模块，他并不是gulp的插件，只是我们通过gulp去管理它而已，所以需要单独引入这个模块。

这个模块提供了一个 create 方法用于去创建一个服务器，我们这儿定义一个 bs 变量，它会自动创建一个开发服务器，将这个开发服务器单独定义到一个任务中去启动，定义一个serve任务，最核心的配置是server，server需要指定网站的根目录，也就是web服务器它需要把哪个目录作为网站根目录（肯定是dist目录啦），启动serve任务（yarn gulp serve），他会自动唤起浏览器。

这里要单独bs单独加一个特殊的路由，让他对于这种**<u>node_modules这种请求</u>**，我们都给它指到同一个目录下面去，通过routes去指定，它优先于 baseDir 的配置，就是一旦我们请求发生后会先去看在 routes 里面有没有对应的配置，如果有的话会先走 routes 里面的配置，否则的话就会找 baseDir 下面对应的文件。

bs.init 还可以指定一些其他的选项，比如 notify，作用是页面启动可以不弹出提示（会提示browser-sync是否连接上，可能会影响页面调试样式，可以false给它关掉）。port 端口默认是 3000，可以改。还有open，因为我们 browser-sync 启动会自动去帮你打开浏览器，那这个操作如果你觉得不好的话，可以设置为false，根据情况决定。

```js
// 这里省略很多
const browserSync = require('browser-sync')
const bs = browserSync.create()
const serve = () => {
    // 初始化这个web服务器的一些相关配置
    bs.init({
        notify: false,
        port: 2080,
        // open: false,
        files: 'dist/**' // dist下面所有文件
        server: {
            baseDir: 'dist',
            routes: {
                '/node_modules': 'node_modules' // 键就是我们请求的前缀
                // 这里是相对路径，相对于我们网站的根目录下面的node_modules
            }
        }
    })
}
module.exports = {
    compile,
    build,
    serve
}
```

一步一步来。我们首先**考虑在dist下面的文件发生变化后，怎么让浏览器及时更新过来**。再指定一个参数 files，可以指定一个字符串，就是用来去被 browser-sync 启动过后监听的一个路径通配符，你想要哪些文件发生改变过后这个 browser-sync 自动更新浏览器，在这里就可以通过通配符的方式指定。

------



### Gulp 案例 - 监视变化以及构建优化

重点考虑一下如何在 src 下面的源代码修改过后自动去编译，这个过程我们需要借助于 gulp 提供的另外一个 API叫 watch。watch API 会自动监视一个文件路径的通配符，然后根据这些文件的变化决定是否要重新去执行某一个任务，我们这**<u>要监视的是所有产生构建任务的路径</u>**。如 sass 文件修改过后我们要执行的是 style 任务，那这几个文件修改过后就会执行相应的任务，这些任务一旦触发过后就会把对应 dist 下面的文件被覆盖掉，那被覆盖掉的话 browserSync 就会监视到 dist 里的文件变化，那会自动去同步到浏览器，这样就实现我们一开始设想的<u>源代码修改过后自动编译到 dist 中再同步到浏览器</u>。

在启动WEB服务器时候，把 baseDir 指定两个目录分别是 dist 目录和 src 目录，其中 src 目录对于像图片/字体/public 这些我们把他们就直接放在原位置不然他们参与这次的构建，它只是在最终发布上线之前去做一下构建就可以了。**<u>baseDir 指定为数组后，他会先到数组中第一个目录去找，如果找不到这个文件就会依次往后去找</u>**。src 只是做了无损压缩，我们这是让他请求源文件，这样我们在开发阶段就减少了一次构建过程，public也一样，只是拷贝过去而已，咱们不需要在开发阶段构建他们，减少构建次数提高效率。

```js
const { src, dest, parallel, series, watch } = require('gulp')
const browserSync = require('browser-sync')
const bs = browserSync.create()
const serve = () => {
    watch('src/assets/styles/*.scss', style)
    watch('src/assets/scripts/*.js', script)
    watch('src/*.html', page)
    // watch('src/assets/images/**', image)
    // watch('src/assets/fonts/**', font)
    // watch('public/**', extra)
    // 当然还有个需求是希望src下面的图片字体以及public下文件变化过后也能更新一下浏览器。通过1个watch
    // 这3种文件变化过后只需要去调用一下bs模块提供的reload方法就可以了。可以理解为一个任务，因为在gulp中任务就是一个函数
    watch([
        'src/assets/images/**',
        'src/assets/fonts/**',
        'public/**'
    ], bs.reload)
    
    bs.init({
        notify: false,
        port: 2080,
        files: 'dist/**'
        server: {
            baseDir: ['dist', 'src', 'public'],
            routes: {
                '/node_modules': 'node_modules' 
            }
        }
    })
}
// 这里可能很因为swig模板引擎缓存机制导致页面不变化，需要在swig选项把cache设置为false，见源码72行
const compile = parallel(style, script, page) // 算是总的子任务，开发阶段运行compile就可以了
const build = series(clean, parallel(compile, image, font, extra)) // 上线前执行的任务

// dev阶段启动编译样式脚本页面，然后启动serve
const develop = series(compile, serve)

module.exports = {
    clean,
    compile,
    build,
    develop
}
```

你每次文件发生变化过后在watch都能监视到，在任务后面再 pipe 一下 bs.reload，执行完的结果就是一个 只是把内部文件 流里面的信息推到浏览器，以流的方式往浏览器推，这种方式会更常见。

```js
const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src' })
    	.pipe(plugins.sass({ outputStyle: 'expanded' }))
    	.pipe(dest('dist'))
    	.pipe(bs.reload({ stream: true }))
}
```



总结：使用了 browserSync 提供的web服务器去启动web服务，有利于在开发阶段实现所见即所得；2、介绍了一个 API 叫 watch，这个任务可以去监视一个文件路径的通配符，根据这个文件监视到的结果去决定是否要执行一个任务，这是 gulp 提供的 watch；3、在这个过程中可以重新思考哪些任务是在开发阶段需要执行，哪些任务不是必须要执行。

------



### Gulp 案例 - useref 文件引用处理

会自动处理我们HTML中的这些构建注释，就是自动将开始标签和结束标签中间引入的这些文件最终打包到一个文件当中，那这个文件的路径就是 assets/styles/ventor.css ，如果说你引入了多个css的话，它可以**<u>把这些文件都合并到一块</u>**，这个插件用起来也非常强大。此外可以在这个过程中自动对这些文件做压缩，相对其他方式要更为完善些，因为这个过程能把剩下的压缩、合并等所以事情统统都完成。`yarn add gulp-useref --dev`，useref的意思是引用关系。

此时我们要找的不是src下面的HTML，而是dist下面的HTML，因为在src下的HTML它是模板，模板里面做useref是没有意义的，只有当文件都生成过后再去做才有意义。创建的读取流 pipe 到useref这个插件，这个插件会被自动加载进来，创建一个转换流，会自动把我们刚刚的代码中的构建注释去做对应的转换，这个转换需要指定一个参数叫searchPath，因为你做这个文件合并，那肯定先得找到这些文件，找这个文件就涉及到哪个目录下找。如main.css就得去dist目录下找，那node_modules的就要去项目根目录下找，所以需要指定两个。

```js
// 这个任务名就叫useref
const useref = () => {
    return src('dist/*.html', {base: 'dist'}) // 指定一个base目录，因为它所在的目录就是dist目录，只不过为了统一都指定了
    	.pipe(plugins.useref({ searchPath: [ 'dist', '.' ] }))
    	.pipe(dest('dist'))
    // 它会自动把dist下面的html拿出来去做useref操作，操作完后放回dist
}
module.exports = {
    clean,
    compile,
    build,
    develop,
    useref
}
```

执行完后你去dist下的html会发现，他把全部构建注释都去掉了，把构建注释里面包含的内容最终合并到一个文件中，包括脚本文件合并到一个js里，把JQ、bootstrap和其他库都合并到一个文件中。

------



光这样使用还不行，这里useref在这个过程中自动修改了html，并且帮你把html里面的依赖的文件创建了一些新的文件生成到dist中，那这个过程它会去在读取流中去创建一些新的文件，我们可以对这些新的文件做一些操作。如新创建的js文件我们希望能对他做一些压缩，创建的css也希望能对他做一个压缩，可以单独加一些插件。

### Gulp 案例 - 文件压缩

有了useref后就自动帮我们把对应依赖的文件全部拿过来，但还是需要对生成的文件进行压缩操作过程。我们压缩的文件有3种：HTML、JS、CSS。那HTML是就是直接通过src读取流创建出来的，JS和CSS是 useref 在工作的过程中创建出来的，所以我们在这个管道接着往下去走的时候，此处会有3种文件类型。那这3种文件类型我们需要分别去做不同的压缩工作，我们需要去为他们**<u>安装不同的压缩插件</u>**（`yarn add gulp-htmlmin gulp-uglify gulp-clean-css --dev`），安装完还有问题，在之前的构建任务中每一次我们读取流当中都是同类型的文件，我们对他做相同的操作是合理的，但是我们这个时候读取流中有3种类型的文件，我们需要去分别对他们做不同的操作。

这个时候需要一个额外的操作，就是判断一下这个读取流当中是什么文件，就做什么操作，（`yarn add gulp-if --dev`），然后回来使用它了。pipe 到 plugins.if，这个if会自动创建转换流，只不过在这个转换流内部会根据 if 中给它指定的条件去决定是否要去执行具体的转换流，第一个参数就是自动匹配我们文件读取流当中的文件路径，就意味着路径一旦要是匹配 .js 结尾的话，他就会执行我们后面指定的转换流，那第二个参数就是指定我们需要工作的转换流。搞定后就执行useref任务。

```js
const useref = () => {
    return src('dist/*.html', {base: 'dist'})
    	.pipe(plugins.useref({ searchPath: [ 'dist', '.' ] }))
    	// html js css
    	.pipe(plugins.if(/\.js$/, plugins.uglify()))  // 是否以.js结尾。
    	.pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    	.pipe(plugins.if(/\.html/, plugins.htmlmin()))
    	.pipe(dest('dist'))
}
```

这里因为我们上一节第一次执行 useref 的时候已结把dist下面的html的构建注释清掉了，你再去构建的时候它里面没有那些构建注释，那useref 就不会产生 js文件，所以就没有压缩的转换。所以这里要先执行 compile 然后再去执行 useref，就OK了。



因为我们在这实际上读取流是dist然后我们又把文件写入到写入流中，此时会产生文件读写冲突，如果读写没有分离开可能会导致写不进去的情况。我们就把 dist 最终转换过后的结果不放在 dist 目录下咯，此时style、js就正常压缩完了。

完成之后发现，html文件还没有压缩需要单独处理，因为htmlmin默认只是去压缩你属性中的空白字符，但是针对其他如换行符等默认不帮你删除，要想删可以指定选项 `collapseWhitespace: true` 折叠掉我们的空白字符，就会压缩你的html里的空白字符和换行符。再执行useref，此时HTML的的代码就已经被压缩掉了。但是他html里写的CSS和JS默认没有压缩，也可以指定选项压缩 ，搞定就全部压完了。htmlmin 还有一些其他的参数如 remove 把全部注释删掉，还有空属性删除，那些可以看文档看看使用。

```js
const useref = () => {
    return src('dist/*.html', {base: 'dist'})
    	.pipe(plugins.useref({ searchPath: [ 'dist', '.' ] }))
    	// html js css
    	.pipe(plugins.if(/\.js$/, plugins.uglify()))  // 是否以.js结尾。
    	.pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    	.pipe(plugins.if(/\.html$/, plugins.htmlmin({
        	collapseWhitespace: true,
        	minifyCSS: true,
        	minifyJS: true
    	})))
    	.pipe(dest('release'))
}
```

------



### Gulp 案例 - 重新规划构建过程

useref 打破了我们构建目录结构，因为我们之前约定的是我们在开发阶段的代码是放在 src 目录下，在编译完打包上线的目录是 dist，但是刚刚在 dist 读出来再往 dist 中写产生了冲突，那我们不得已把它放到另外一个目录，其实这个时候我们真正上线的是 release 这个目录中的文件，而release中没有图片和字体文件，所以这个目录结构被他打破了，需要重新规整一下！！！

修改一下：clean可以再加一个需要清空的目录 `['dist', 'temp']`，然后让style、script、page都 `pipe(dest('temp'))`到临时目录，图片、字体和 extra 并不需要放在临时目录，因为这3个转换的过程只是在 build 的时候去做，意味着上线前构建的时候做，开发阶段不需要转换，不需要放到temp下，只有那些被 useref 影响的才需要修改。然后就是bs.init 里要改 baseDir 第一个参数 'dist' 改成 'temp' ，就不能从 dist 里拿文件了，就temp找不到去src找不到去public，dist 是最终构建需要上线打包的目录，所以这里改成 temp。然后就是 useref 里从 temp 去取文件（src方法、base里也改成temp、searchPath也一样），把最终结果放到 dist里(dest方法)，差不多就OK了。

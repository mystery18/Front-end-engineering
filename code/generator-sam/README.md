**<u>（已删除node_modules）</u>**

脚手架工作流程的主要目的就是让我们**<u>得到一个基础的项目结构以及一些基础的项目代码</u>**。

- 在全局范围安装yo

  ```bash
  npm install yo --global  # or yarn global add yo
  ```

- 安装对应的generator

  ```bash
  npm install generator-node --global # or yarn global add generator-node
  ```

- 通过yo运行generator

  ```bash
  cd path/to/project-dir
  mkdir my-module
  yo node
  ```



### 自定义 Generator

不同的generator可以生成不同的项目，那我们可以通过创造自己的generator去帮我们生成自定义的项目结构。



### 创建 Generator 模块

创建Generator实际上就是创建一个npm模块（Generator本质上就是一个npm模块），但是Generator他有特定结构，需要在根目录下有generators文件夹，然后在这个文件夹下面建app文件夹用于存生成器对应的代码，下面存 index.js。如果需要提供多个sub Generator，可以在app同级目录下添加一个新的生成器目录，如component及下index.js 此时我们模块就有一个叫component的子生成器。

除了特定的结构，还有一个与普通npm不同的是yeoman的Generator模块名称必须是 generator-<name> 的格式，如果说在具体开发的时候没有使用这种格式的名称，yeoman就会在后续工作的时候没有办法找到你所提供的这种生成器模块。

```bash
mkdir generator-sample
cd generator-sample
yarn init # 创建package.json

yarn add yeoman-generator # 安装一个yeoman-generator模块，提供了生成器的基类 提供了一些工具函数，让我们可以在创建生成器的时候更加便捷。安装完后通过VScode打开：code .
```

在目录下创建一个generators文件夹，再创建一个app目录 再在下面创index.js文件。

```js
// index.js

// 这个文件会作为generator的核心入口，它需要导出一个继承自yeoman generator 类型
// yeoman generator 在工作时会自动调用我们在此类型中定义的一些声明周期方法
// 可以在这些方法中通过调用父类提供的一些工具方法实现一些功能，例如文件写入

const Generator = require('yeoman-generator')

// 需要导出这个类型，让这个类型继承自Generator
module.exports = class extends Generator {
    // 在这个类型需要定义一个writing方法，这个方法在yeoman工作的时候 他会在生成文件阶段自动调用这个类型中的writing方法
	writing (){
        // 在这个方法可以通过文件读写的方式往我们生成的目录下去写入文件
        // 这里的fs模块与node的fs模块不一样的，这里的是高度封装的filesystem模块，相对于原生fs模块功能更强大些
        
        // write方法有两个参数。1、写入文件的绝对路径；2、写入文件的内容
        this.fs.write(
            // 借助父类的方法去自动获取生成项目目录下对应的文件路径
            this.destinationPath('temp.txt'),
            
            //文件的内容用生成随机数代替
            Math.random().toSrting()
        )
    }
}
```

回到命令行用`yarn link`链接到全局范围，使之成为全局模块包，这样yeoman在工作的时候就可以找到我们自己写的generator-sample了。

cd ..到上级，新建一个文件夹（`mkdir mypj`）然后 cd进去，通过`yo sample`后，提示我们创建了temp.txt文件。



### 根据模板创建文件

很多时候我们需要自动创建的文件有很多，而且文件内容也相对复杂，在这种情况下可以使用模板去创建文件，这样可以更加便捷一些。首先在生成器目录下添加templates目录（在app目录下），将我们需要去生成的文件都放入templates目录作为模板。模板中是完全遵循EJS模板引擎的模板语法，即我们可以通过 `<%= title %>` 动态输出一些数据，也可以做一些判断、循环之类的操作。

有了模板过后，我们在生成文件时就不用再去借助于 fs 的 write 方法去写入文件，而是借助 fs当中有一个专门使用模板引擎的方法，叫做 copy-template 的方式，具体使用他有3个参数：1、模板文件路径；2、输出文件路径；3、模板数据的上下文。

模板文件路径可以借助于 templatePath 方法自动获取当前生成器下 templates 下面的文件路径；输出路径我们还是使用 destination path；在模板数据上下文这只需要去定义一个对象就可以了。将这3个参数通过 copyTpl 方法传入，这个方法会自动去把我们模板文件映射到生成的输出文件上。然后回到命令行再次通过 yeoman 去运行我们这个 generator（`yo sample`），此时 yeoman的运行过程中就会自动使用模板引擎去渲染模板，将渲染过后的结果，放到我们的输出目录。

```js
const Generator = require('yeoman-generator')

module.exports = class extends Generator {

    writing() {
        // 有了模板过后，我们在生成文件时就不用再去借助于fs的write方法去写入文件。
        // 通过模板方式写入文件到目标目录

        // 模板文件路径
        const templ = this.templatePath('foo.txt')
        // 输出目标路径
        const output = this.destinationPath('foo.txt')
        // 模板数据上下文
        const context = { title: 'Hello yy~', success: false }
        this.fs.copyTpl(templ, output, context)
    }
}
```

那么相对于手动创建每一个文件，模板的方式大大提高了效率，特别是在文件比较多，比较复杂情况下。



### 接收用户输入

对于模板中的动态数据，如项目标题、项目名称，这样的数据我们一般通过命令行交互的方式去询问我们的使用者从而得到，那在generator 中想要发起一个命令行交互的询问，可以通过实现 generator 这个类型中的 prompting方法 （index.js里），这个方法中可以调用父类提供的 prompt() 发出对用户的命令行询问，这个方法返回一个promise，也就是说他是一个 promise 方法，即要在前面进行 return，这样的话 yeoman 在工作的时候就有更好的异步流程控制。

这个方法接收一个数组参数，数组的每一项都是一个问题对象，这个问题对象呢具体的可以去传入类型、name、还有 message 和 default，这里的 type 我们选用 input 也就是说使用用户输入的方式去接收用户提交信息，name 就是最终得到结果的一个键，然后 message 呢是在界面上给用户一个提示，也就是我们所谓的问题，那 default 呢我们这用的是一个叫 appname  的一个数据，这个属性实际上是父类当中自动帮我们拿到的当前生成项目的目录的文件夹名字，他会作为我们这个问题的默认值。

在这个 promise 执行完之后我们可以得到一个 answers ，这个answers 里面就是我们当前这个问题在接收完用户输入过后的一个结果，那他会以一个对象的形式出现，那对象里面的键就是我们刚刚 prompt 的 name，值就是用户输入的 value，将这个值挂载到 this 对象上面以便于我们后面在 writing 的时候去使用它。那有了 answers 数据过后就可以在 writing 的时候去传入我们的模板引擎，使用这个数据去作为模板数据的上下文。

回到 cmd 中再次运行`yo sample`，此时他会提示我们一个问题根据我们的需要输入，输入完的结果会作为数据出现在我们的数据上下文当中，最终在模板中被渲染出来。这个就是我们在 yeoman 中如何动态去接收用户输入数据的一种实现方式。

```js
const Generator = require('yeoman-generator')

module.exports = class extends Generator {
    prompting() {
        // Yeoman 在询问用户环节会自动调用此方法
        // 在此方法中可以调用父类的 prompt() 方法发出对用户的命令行询问
        return this.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Your project name',
                default: this.appname // appname 为项目生成目录名称
            }
        ])
            .then(answers => {
                // answers => { name: 'user input value' }
                this.answers = answers
            })
    }

    writing() {


        // 有了模板过后，我们在生成文件时就不用再去借助于fs的write方法去写入文件。
        // 通过模板方式写入文件到目标目录

        // 模板文件路径
        const templ = this.templatePath('foo.txt')
        // 输出目标路径
        const output = this.destinationPath('foo.txt')
        // 模板数据上下文
        const context = { title: 'Hello yy~', success: false }

        this.fs.copyTpl(templ, output, context)


    }
}
```

哎难呐。这仅仅是一个
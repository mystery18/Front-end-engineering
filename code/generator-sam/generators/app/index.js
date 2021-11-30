// 这个文件会作为generator的核心入口，它需要导出一个继承自yeoman generator 类型
// yeoman generator 在工作时会自动调用我们在此类型中定义的一些声明周期方法
// 可以在这些方法中通过调用父类提供的一些工具方法实现一些功能，例如文件写入

const Generator = require('yeoman-generator')

// 需要导出这个类型，让这个类型继承自Generator
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


    // 在这个类型需要定义一个writing方法，这个方法在yeoman工作的时候 他会在生成文件阶段自动调用这个类型中的writing方法
    writing() {
        // 在这个方法可以通过文件读写的方式往我们生成的目录下去写入文件
        // 这里的fs模块与node的fs模块不一样的，这里的是高度封装的filesystem模块，相对于原生fs模块功能更强大些

        // write方法有两个参数。1、写入文件的绝对路径；2、写入文件的内容

        // this.fs.write(
        //     // 借助父类的方法去自动获取生成项目目录下对应的文件路径
        //     this.destinationPath('temp.txt'),

        //     //文件的内容用生成随机数代替
        //     Math.random().toSrting()
        // )


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
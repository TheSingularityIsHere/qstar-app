// build.js
const esbuild = require('esbuild')
const fs = require('fs/promises')

async function build() {
  try {
    // Create dist directory if it doesn't exist
    await fs.mkdir('dist', { recursive: true })

    // Bundle and minify JS
    await esbuild.build({
      entryPoints: ['./app.js'],
      bundle: true,
      minify: true,
      outfile: 'dist/app.js',
      format: 'esm',
      target: ['es2020'],
      sourcemap: true,
    })

    // Read the bundled file
    let jsContent = await fs.readFile('dist/app.js', 'utf8')

    // Replace actual newlines in template literals with \n
    jsContent = jsContent.replace(/`[\s\S]*?`/g, match =>
      match.replace(/\n/g, '\\n')
    )

    await fs.writeFile('dist/app.js', jsContent)

    // Copy index.html to dist
    await fs.copyFile('index.html', 'dist/index.html')

    console.log('Build completed successfully!')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

build()
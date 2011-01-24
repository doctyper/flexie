require 'rake'
require 'rake/packagetask'

FLEXIE_VERSION  = "1.0"

FLEXIE_ROOT     = File.expand_path(File.dirname(__FILE__))
FLEXIE_SRC_DIR  = File.join(FLEXIE_ROOT, 'src')
FLEXIE_DIST_DIR = File.join(FLEXIE_ROOT, 'dist')
FLEXIE_PKG_DIR  = File.join(FLEXIE_ROOT, 'pkg')

FLEXIE_FILES    = [
  File.join(FLEXIE_SRC_DIR,'flexie.js')
]

task :default => [:clean, :concat, :dist]

desc "Clean the distribution directory."
task :clean do 
  rm_rf FLEXIE_DIST_DIR
  mkdir FLEXIE_DIST_DIR
end

desc "Concatenate Flexie core and plugins to build a distributable flexie.js file"
task :concat do
  File.open(File.join(FLEXIE_DIST_DIR,'flexie.js'),"w") do |f|
    f.puts FLEXIE_FILES.map{ |s| IO.read(s) } 
  end
end

def google_compiler(src, target)
  puts "Minifying #{src} with Google Closure Compiler..."
  `java -jar vendor/google-compiler/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js #{src} --summary_detail_level 3 --js_output_file #{target}`
end

def yui_compressor(src, target)
  puts "Minifying #{src} with YUI Compressor..."
  `java -jar vendor/yuicompressor/yuicompressor-2.4.2.jar #{src} -o #{target}`
end

def process_minified(src, target)
  cp target, File.join(FLEXIE_DIST_DIR,'temp.js')
  msize = File.size(File.join(FLEXIE_DIST_DIR,'temp.js'))
  `gzip -9 #{File.join(FLEXIE_DIST_DIR,'temp.js')}`
  
  osize = File.size(src)
  dsize = File.size(File.join(FLEXIE_DIST_DIR,'temp.js.gz'))
  rm_rf File.join(FLEXIE_DIST_DIR,'temp.js.gz')
  
  puts "Original version: %.3fk" % (osize/1024.0)
  puts "Minified: %.3fk" % (msize/1024.0)
  puts "Minified and gzipped: %.3fk, compression factor %.3f" % [dsize/1024.0, osize/dsize.to_f]  
end

desc "Generates a minified version for distribution."
task :dist do
  src, target = File.join(FLEXIE_DIST_DIR,'flexie.js'), File.join(FLEXIE_DIST_DIR,'flexie.min.js')
  google_compiler src, target
  process_minified src, target
end

desc "Generates a minified version for distribution using the YUI compressor."
task :yuidist do
  src, target = File.join(FLEXIE_DIST_DIR,'flexie.js'), File.join(FLEXIE_DIST_DIR,'flexie.min.js')
  yui_compressor src, target
  process_minified src, target
end

Rake::PackageTask.new('flexie', FLEXIE_VERSION) do |package|
  package.need_tar_gz = true
  package.need_zip = true
  package.package_dir = FLEXIE_PKG_DIR
  package.package_files.include(
    'README.md',
    'dist/**/*',
    'src/**/*',
    'test/**/*',
    'examples/**/*'
  )
end
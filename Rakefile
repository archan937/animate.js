desc "Roll out a new release"
task :release, :version do |task, args|

  if (args[:version] || "").strip.empty?
    puts "usage: rake release[version]"
    exit
  end

  timestamp  = Time.now
  javascript = File.open("build/js/animate.js").readlines.collect do |line|
    line = line.gsub(/\{(version|year|date)\}/) do |matched|
      case matched
      when "{version}"
        args[:version]
      when "{year}"
        timestamp.year.to_s
      when "{date}"
        timestamp.strftime("%Y-%m-%d %H:%M:%S +0100 (%a, %d %B %Y)")
      end
    end
  end.flatten

  # Define variables
  releases_dir = "releases"
  release_dir  = "#{releases_dir}/#{args[:version]}"
  latest_dir   = "#{releases_dir}/latest"

  # Create directories
  FileUtils.rm_r(release_dir) if File.exists?(release_dir)
  FileUtils.mkdir_p(release_dir)

  # Create files
  FileUtils.cp("README.md", "#{release_dir}/README.md")
  FileUtils.cp("CHANGELOG.md", "#{release_dir}/CHANGELOG.md")
  FileUtils.cp_r("demo", "#{release_dir}/")
  File.open("#{release_dir}/animate.js", "w") do |file|
    javascript.each do |line|
      file.write line
    end
  end
  File.open("VERSION", "w").puts(args[:version])

  # Correct demo pages
  `sed -i -- 's/src\\/animate/animate\\.min/g' #{release_dir}/demo/*.html`
  `rm #{release_dir}/demo/*.html--`

  # Compress release using YUI compressor
  `java -jar lib/yuicompressor-2.4.8.jar -v #{release_dir}/animate.js -o #{release_dir}/animate.min.js`
end

desc "Minify and gzip src/animate.js"
task :compress do |task, args|
  `java -jar lib/yuicompressor-2.4.8.jar -v src/animate.js -o src/animate.min.js`
  `gzip -9cf src/animate.min.js > src/animate.min.js.gz`
end

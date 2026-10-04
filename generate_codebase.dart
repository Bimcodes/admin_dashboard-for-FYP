import 'dart:io';

void main() async {
  final rootDir = Directory('.');
  final output = StringBuffer();

  // Folders to completely ignore
  final ignoredDirs = {
    '.git',
    'node_modules',
    '.next',
    'out',
    'public',
    'dist',
    'build',
    '.env.local'
  };

  // Files to ignore
  final ignoredFiles = {
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'tsconfig.tsbuildinfo',
    '.DS_Store',
    'generate_codebase.dart',
    'codebase.txt',
    'health_center.txt',
  };

  final ignoredExtensions = {
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
    '.woff', '.woff2', '.ttf', '.eot',
    '.mp4', '.mp3', '.wav', '.zip', '.tar', '.gz',
    '.exe', '.dll', '.so', '.dylib', '.class', '.jar',
  };

  // Helper to recursively collect files
  List<File> collectFiles(Directory dir) {
    final files = <File>[];
    for (var entity in dir.listSync(recursive: false)) {
      final name = entity.path.split(Platform.pathSeparator).last;
      
      if (entity is Directory) {
        if (!ignoredDirs.contains(name)) {
          files.addAll(collectFiles(entity));
        }
      } else if (entity is File) {
        if (ignoredFiles.contains(name)) continue;
        
        final ext = name.contains('.') ? name.substring(name.lastIndexOf('.')) : '';
        if (ignoredExtensions.contains(ext.toLowerCase())) continue;

        files.add(entity);
      }
    }
    return files;
  }

  print('🔍 Scanning codebase...');
  final allFiles = collectFiles(rootDir);
  int count = 0;

  for (var file in allFiles) {
    // Make path relative to root
    String relativePath = file.path;
    if (relativePath.startsWith('.\\') || relativePath.startsWith('./')) {
      relativePath = relativePath.substring(2);
    }
    
    try {
      final content = await file.readAsString();
      
      output.writeln('====================================================');
      output.writeln('FILE: $relativePath');
      output.writeln('====================================================\n');
      output.writeln(content);
      output.writeln('\n\n');
      
      print('✅ Added: $relativePath');
      count++;
    } catch (e) {
      print('⚠️ Skipped (unreadable/binary): $relativePath');
    }
  }

  final outputFile = File('codebase.txt');
  await outputFile.writeAsString(output.toString());

  print('🎉 $count files merged into codebase.txt');
}
